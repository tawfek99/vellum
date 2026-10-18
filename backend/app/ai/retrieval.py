"""Keyword retrieval over document chunks.

First retrieval strategy: score chunks by keyword overlap with the question.
It works on both SQLite (tests) and Postgres, and can later be replaced by
Postgres full-text search or pgvector embeddings without changing callers.
"""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import DocumentChunk

_WORD = re.compile(r"[a-z0-9]+")

# Common words that add no retrieval signal.
_STOPWORDS = frozenset(
    {
        "a",
        "about",
        "after",
        "all",
        "also",
        "am",
        "an",
        "and",
        "any",
        "are",
        "as",
        "at",
        "be",
        "because",
        "been",
        "before",
        "being",
        "between",
        "both",
        "but",
        "by",
        "can",
        "could",
        "did",
        "do",
        "does",
        "doing",
        "down",
        "during",
        "each",
        "few",
        "for",
        "from",
        "further",
        "had",
        "has",
        "have",
        "having",
        "he",
        "her",
        "here",
        "hers",
        "herself",
        "him",
        "himself",
        "his",
        "how",
        "i",
        "if",
        "in",
        "into",
        "is",
        "it",
        "its",
        "itself",
        "just",
        "me",
        "more",
        "most",
        "my",
        "myself",
        "no",
        "nor",
        "not",
        "now",
        "of",
        "off",
        "on",
        "once",
        "only",
        "or",
        "other",
        "our",
        "ours",
        "ourselves",
        "out",
        "over",
        "own",
        "same",
        "she",
        "should",
        "so",
        "some",
        "such",
        "than",
        "that",
        "the",
        "their",
        "theirs",
        "them",
        "themselves",
        "then",
        "there",
        "these",
        "they",
        "this",
        "those",
        "through",
        "to",
        "too",
        "under",
        "until",
        "up",
        "very",
        "was",
        "we",
        "were",
        "what",
        "when",
        "where",
        "which",
        "while",
        "who",
        "whom",
        "why",
        "will",
        "with",
        "would",
        "you",
        "your",
        "yours",
        "yourself",
        "yourselves",
    }
)

# Bound the work for very large documents; retrieval only needs a good sample.
MAX_CHUNKS = 200


@dataclass(frozen=True)
class RetrievedChunk:
    chunk_index: int
    content: str
    score: float


def keywords(text: str) -> list[str]:
    """Lowercase content words from `text`, dropping stopwords and 1-char words."""
    return [
        word
        for word in _WORD.findall(text.lower())
        if len(word) > 1 and word not in _STOPWORDS
    ]


def _score(content: str, terms: list[str]) -> float:
    lowered = content.lower()
    return float(sum(1 for term in terms if term in lowered))


async def retrieve_chunks(
    db: AsyncSession,
    document_id: uuid.UUID,
    question: str,
    *,
    limit: int = 5,
) -> list[RetrievedChunk]:
    """Return the chunks most relevant to `question`, in document order.

    The caller must verify that the document belongs to the requesting user.
    When nothing matches, the opening chunks are returned so the model still
    has some document context.
    """
    stmt = (
        select(DocumentChunk)
        .where(DocumentChunk.document_id == document_id)
        .order_by(DocumentChunk.chunk_index)
        .limit(MAX_CHUNKS)
    )
    chunks = list((await db.execute(stmt)).scalars().all())
    if not chunks:
        return []

    terms = keywords(question)
    scored = [(chunk, _score(chunk.content, terms)) for chunk in chunks]
    matches = [(chunk, score) for chunk, score in scored if score > 0]

    if matches:
        matches.sort(key=lambda pair: pair[1], reverse=True)
        selected = matches[:limit]
        # Re-order by position so the excerpts read naturally.
        selected.sort(key=lambda pair: pair[0].chunk_index)
    else:
        selected = [(chunk, 0.0) for chunk in chunks[:limit]]

    return [
        RetrievedChunk(chunk_index=chunk.chunk_index, content=chunk.content, score=score)
        for chunk, score in selected
    ]
