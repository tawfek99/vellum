"""Global search over notes and documents.

First pass: keyword pre-filtering with SQL `ILIKE` and in-Python ranking, so the
same code runs on SQLite tests and Postgres. Postgres FTS/trigram indexes can
replace the pre-filter later without changing the API.
"""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.retrieval import keywords
from app.models.document import Document
from app.models.note import Note

# Bound the candidates fetched before ranking; enough for a personal library.
MAX_CANDIDATES = 200
MAX_SNIPPET_CHARS = 180
TITLE_WEIGHT = 5

_PAGE_MARKER = re.compile(r"\[\[page\s+\d+\]\]", re.IGNORECASE)
_LINK = re.compile(r"!?\[([^\]]*)\]\([^)]*\)")
_MARKDOWN = re.compile(
    r"(?:\*\*|__|~~|`|\*|_|^#{1,6}\s+|^>\s?|^[ \t]*[-*+]\s+|^[ \t]*\d+\.\s+)",
    re.MULTILINE,
)


def _plain_text(body: str) -> str:
    """Strip page markers and common markdown so snippets read cleanly."""
    text = _PAGE_MARKER.sub(" ", body)
    text = _LINK.sub(r"\1", text)
    text = _MARKDOWN.sub("", text)
    return " ".join(text.split())


@dataclass(frozen=True)
class SearchHit:
    kind: str
    id: uuid.UUID
    title: str
    snippet: str
    updated_at: datetime


@dataclass(frozen=True)
class SearchResults:
    notes: list[SearchHit]
    documents: list[SearchHit]


def _matches(text: str, terms: list[str]) -> int:
    lowered = text.lower()
    return sum(lowered.count(term) for term in terms)


def _score(title: str, body: str, terms: list[str]) -> int:
    return TITLE_WEIGHT * _matches(title, terms) + _matches(body, terms)


def _snippet(body: str, terms: list[str], *, max_length: int = MAX_SNIPPET_CHARS) -> str:
    text = _plain_text(body)
    if not text:
        return ""

    lowered = text.lower()
    positions = [lowered.find(term) for term in terms if term in lowered]
    start = max(0, min(positions) - 50) if positions else 0
    end = min(len(text), start + max_length)

    snippet = text[start:end].strip()
    if start > 0:
        snippet = f"…{snippet}"
    if end < len(text):
        snippet = f"{snippet}…"
    return snippet


def _rank(
    items: list[Note] | list[Document],
    terms: list[str],
    *,
    kind: str,
    limit: int,
) -> list[SearchHit]:
    scored: list[tuple[int, datetime, SearchHit]] = []
    for item in items:
        body = item.content if isinstance(item, Note) else (item.text_content or "")
        scored.append(
            (
                _score(item.title, body, terms),
                item.updated_at,
                SearchHit(
                    kind=kind,
                    id=item.id,
                    title=item.title,
                    snippet=_snippet(body, terms),
                    updated_at=item.updated_at,
                ),
            )
        )

    scored.sort(key=lambda row: (row[0], row[1]), reverse=True)
    return [hit for _, _, hit in scored[:limit]]


async def search_all(
    db: AsyncSession,
    user_id: uuid.UUID,
    query: str,
    *,
    limit: int = 20,
) -> SearchResults:
    terms = keywords(query)
    if not terms:
        return SearchResults(notes=[], documents=[])

    patterns = [f"%{term}%" for term in terms]

    note_conditions = [Note.title.ilike(pattern) for pattern in patterns]
    note_conditions += [Note.content.ilike(pattern) for pattern in patterns]
    notes = list(
        (
            await db.execute(
                select(Note)
                .where(Note.user_id == user_id, or_(*note_conditions))
                .limit(MAX_CANDIDATES)
            )
        )
        .scalars()
        .all()
    )

    document_conditions = [Document.title.ilike(pattern) for pattern in patterns]
    document_conditions += [Document.text_content.ilike(pattern) for pattern in patterns]
    documents = list(
        (
            await db.execute(
                select(Document)
                .where(Document.user_id == user_id, or_(*document_conditions))
                .limit(MAX_CANDIDATES)
            )
        )
        .scalars()
        .all()
    )

    return SearchResults(
        notes=_rank(notes, terms, kind="note", limit=limit),
        documents=_rank(documents, terms, kind="document", limit=limit),
    )
