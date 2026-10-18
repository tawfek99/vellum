"""Document Q&A: request creation, async answering, and history."""

import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.factory import build_ai_service
from app.ai.retrieval import retrieve_chunks
from app.core.config import get_settings
from app.core.exceptions import InvalidOperationError
from app.models.ai import AIGeneration
from app.models.document import Document
from app.models.job import Job
from app.models.qa import QAMessage
from app.services import jobs as job_service
from app.services.documents import get_document

settings = get_settings()

# Keep prompts inside a comfortable context budget.
MAX_CONTEXT_CHARS = 12_000
MAX_HISTORY_MESSAGES = 6
MAX_QUESTION_CHARS = 2_000


@dataclass(frozen=True)
class QaExchange:
    id: uuid.UUID
    question: str
    answer: str | None
    status: str
    error: str | None
    pages: list[int]
    created_at: datetime


async def create_question(
    db: AsyncSession,
    user_id: uuid.UUID,
    document_id: uuid.UUID,
    question: str,
) -> QaExchange:
    document = await get_document(db, user_id, document_id)
    if document.processing_status != "ready" or not document.text_content:
        raise InvalidOperationError(
            "This document has no extractable text to answer questions about."
        )

    cleaned = question.strip()[:MAX_QUESTION_CHARS]
    if not cleaned:
        raise InvalidOperationError("Please enter a question.")

    generation = AIGeneration(
        user_id=user_id,
        document_id=document.id,
        kind="qa",
        status="pending",
        provider=settings.ai_provider,
        model=settings.ai_model,
    )
    db.add(generation)
    await db.flush()
    db.add(QAMessage(generation_id=generation.id, role="user", content=cleaned))
    await db.commit()
    await db.refresh(generation)

    await job_service.enqueue(
        db,
        user_id,
        "answer_document_question",
        {
            "generation_id": str(generation.id),
            "document_id": str(document.id),
            "question": cleaned,
        },
    )
    return QaExchange(
        id=generation.id,
        question=cleaned,
        answer=None,
        status=generation.status,
        error=None,
        pages=[],
        created_at=generation.created_at,
    )


async def get_history(
    db: AsyncSession, user_id: uuid.UUID, document_id: uuid.UUID
) -> list[QaExchange]:
    await get_document(db, user_id, document_id)

    generations = list(
        (
            await db.execute(
                select(AIGeneration)
                .where(
                    AIGeneration.user_id == user_id,
                    AIGeneration.document_id == document_id,
                    AIGeneration.kind == "qa",
                )
                .order_by(AIGeneration.created_at.asc())
            )
        )
        .scalars()
        .all()
    )
    if not generations:
        return []

    generation_ids = [generation.id for generation in generations]
    messages = list(
        (
            await db.execute(
                select(QAMessage)
                .where(QAMessage.generation_id.in_(generation_ids))
                .order_by(QAMessage.created_at.asc())
            )
        )
        .scalars()
        .all()
    )

    by_generation: dict[uuid.UUID, list[QAMessage]] = {}
    for message in messages:
        by_generation.setdefault(message.generation_id, []).append(message)

    return [
        _to_exchange(generation, by_generation.get(generation.id, []))
        for generation in generations
    ]


async def handle_answer_job(db: AsyncSession, job: Job) -> dict[str, Any]:
    generation = await db.get(AIGeneration, uuid.UUID(str(job.payload["generation_id"])))
    if generation is None:
        raise ValueError("Q&A generation not found")

    document = (
        await db.get(Document, generation.document_id) if generation.document_id else None
    )
    if document is None or not document.text_content:
        generation.status = "failed"
        generation.error = "Document has no extractable text."
        await db.commit()
        return {"status": "failed"}

    question = str(job.payload.get("question", "")).strip()[:MAX_QUESTION_CHARS]

    generation.status = "running"
    await db.commit()

    chunks = await retrieve_chunks(db, document.id, question)
    context = "\n\n".join(chunk.content for chunk in chunks)[:MAX_CONTEXT_CHARS]
    history = await _recent_history(db, document.id, exclude_generation_id=generation.id)

    service = build_ai_service()
    try:
        result = await service.answer_question(question, context, history)
    except Exception as exc:  # noqa: BLE001 - record provider failures
        generation.status = "failed"
        generation.error = str(exc)[:1000]
        await db.commit()
        raise

    generation.result = {"answer": result.answer, "pages": result.pages}
    generation.status = "succeeded"
    generation.error = None
    db.add(QAMessage(generation_id=generation.id, role="assistant", content=result.answer))
    await db.commit()
    return {"status": "succeeded", "pages": len(result.pages)}


async def _recent_history(
    db: AsyncSession,
    document_id: uuid.UUID,
    *,
    exclude_generation_id: uuid.UUID,
) -> list[dict[str, str]]:
    rows = (
        await db.execute(
            select(QAMessage)
            .join(AIGeneration, QAMessage.generation_id == AIGeneration.id)
            .where(
                AIGeneration.document_id == document_id,
                AIGeneration.kind == "qa",
                AIGeneration.id != exclude_generation_id,
            )
            .order_by(QAMessage.created_at.asc())
        )
    )
    messages = list(rows.scalars().all())
    return [
        {"role": message.role, "content": message.content}
        for message in messages[-MAX_HISTORY_MESSAGES:]
    ]


def _to_exchange(generation: AIGeneration, messages: list[QAMessage]) -> QaExchange:
    result = generation.result or {}
    answer = next(
        (message.content for message in messages if message.role == "assistant"), None
    )
    question = next((message.content for message in messages if message.role == "user"), "")
    return QaExchange(
        id=generation.id,
        question=question,
        answer=answer,
        status=generation.status,
        error=generation.error,
        pages=[int(page) for page in result.get("pages", [])],
        created_at=generation.created_at,
    )
