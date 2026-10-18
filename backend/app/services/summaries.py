"""Document summarization: request, polling, and the async job handler."""

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

# Keep the first version within a comfortable context budget.
MAX_SUMMARY_CHARS = 30_000


async def create_summary_request(
    db: AsyncSession, user_id: uuid.UUID, document_id: uuid.UUID
) -> AIGeneration:
    document = await get_document(db, user_id, document_id)
    if document.processing_status != "ready" or not document.text_content:
        raise InvalidOperationError("This document has no extractable text to summarize.")

    generation = AIGeneration(
        user_id=user_id,
        document_id=document.id,
        kind="summary",
        status="pending",
        provider=settings.ai_provider,
        model=settings.ai_model,
    )
    db.add(generation)
    await db.commit()
    await db.refresh(generation)

    await job_service.enqueue(
        db, user_id, "summarize_document", {"generation_id": str(generation.id)}
    )
    return generation


async def get_latest_summary(
    db: AsyncSession, user_id: uuid.UUID, document_id: uuid.UUID
) -> AIGeneration | None:
    stmt = (
        select(AIGeneration)
        .where(
            AIGeneration.user_id == user_id,
            AIGeneration.document_id == document_id,
            AIGeneration.kind == "summary",
        )
        .order_by(AIGeneration.created_at.desc())
        .limit(1)
    )
    return (await db.execute(stmt)).scalars().first()


async def handle_summarize_job(db: AsyncSession, job: Job) -> dict[str, Any]:
    generation = await db.get(AIGeneration, uuid.UUID(str(job.payload["generation_id"])))
    if generation is None:
        raise ValueError("Summary generation not found")

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
    text = document.text_content[:MAX_SUMMARY_CHARS]

    try:
        result = await service.summarize_document(text)
    except Exception as exc:  # noqa: BLE001 - record provider failures
        generation.status = "failed"
        generation.error = str(exc)[:1000]
        await db.commit()
        raise

    generation.result = {
        "summary": result.summary,
        "key_points": [{"text": point.text, "page": point.page} for point in result.key_points],
    }
    generation.status = "succeeded"
    generation.error = None
    await db.commit()
    return {"status": "succeeded", "key_points": len(result.key_points)}
