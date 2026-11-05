"""Flashcards & quizzes: request creation, async generation, latest lookup."""

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.factory import build_ai_service
from app.core.config import get_settings
from app.core.exceptions import InvalidOperationError
from app.models.ai import AIGeneration
from app.models.document import Document
from app.models.job import Job
from app.services import jobs as job_service
from app.services.documents import get_document

settings = get_settings()

MAX_STUDY_CHARS = 30_000

STUDY_KINDS = {"flashcards", "quiz"}


async def create_study_request(
    db: AsyncSession,
    user_id: uuid.UUID,
    document_id: uuid.UUID,
    kind: str,
) -> AIGeneration:
    if kind not in STUDY_KINDS:
        raise ValueError(f"Unknown study kind: {kind}")

    document = await get_document(db, user_id, document_id)
    if document.processing_status != "ready" or not document.text_content:
        raise InvalidOperationError("This document has no extractable text to study.")

    generation = AIGeneration(
        user_id=user_id,
        document_id=document.id,
        kind=kind,
        status="pending",
        provider=settings.ai_provider,
        model=settings.ai_model,
    )
    db.add(generation)
    await db.commit()
    await db.refresh(generation)

    job_type = "generate_flashcards" if kind == "flashcards" else "generate_quiz"
    await job_service.enqueue(db, user_id, job_type, {"generation_id": str(generation.id)})
    return generation


async def get_latest_study(
    db: AsyncSession,
    user_id: uuid.UUID,
    document_id: uuid.UUID,
    kind: str,
) -> AIGeneration | None:
    stmt = (
        select(AIGeneration)
        .where(
            AIGeneration.user_id == user_id,
            AIGeneration.document_id == document_id,
            AIGeneration.kind == kind,
        )
        .order_by(AIGeneration.created_at.desc())
        .limit(1)
    )
    return (await db.execute(stmt)).scalars().first()


async def handle_study_job(db: AsyncSession, job: Job) -> dict[str, Any]:
    generation = await db.get(AIGeneration, uuid.UUID(str(job.payload["generation_id"])))
    if generation is None:
        raise ValueError("Study generation not found")

    document = (
        await db.get(Document, generation.document_id) if generation.document_id else None
    )
    if document is None or not document.text_content:
        generation.status = "failed"
        generation.error = "Document has no extractable text."
        await db.commit()
        return {"status": "failed"}

    generation.status = "running"
    await db.commit()

    service = build_ai_service()
    text = document.text_content[:MAX_STUDY_CHARS]

    try:
        if generation.kind == "flashcards":
            cards = await service.generate_flashcards(text)
            generation.result = {
                "cards": [{"front": card.front, "back": card.back} for card in cards.cards]
            }
            count = len(cards.cards)
        else:
            quiz = await service.generate_quiz(text)
            generation.result = {
                "questions": [
                    {
                        "question": item.question,
                        "options": item.options,
                        "answer_index": item.answer_index,
                        "explanation": item.explanation,
                    }
                    for item in quiz.questions
                ]
            }
            count = len(quiz.questions)
    except Exception as exc:  # noqa: BLE001 - record provider failures
        generation.status = "failed"
        generation.error = (str(exc) or type(exc).__name__)[:1000]
        await db.commit()
        raise

    generation.status = "succeeded"
    generation.error = None
    await db.commit()
    return {"status": "succeeded", "items": count}
