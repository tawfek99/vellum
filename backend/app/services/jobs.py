"""Lightweight DB-backed job queue + in-process worker.

Kept deliberately simple (no Redis/Celery) so it works on free-tier hosting:
upload enqueues a row, the worker polls and processes it, and clients poll
their document's status.
"""

import asyncio
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import SessionLocal
from app.models.job import Job


async def enqueue(
    db: AsyncSession, user_id: uuid.UUID, job_type: str, payload: dict[str, Any]
) -> Job:
    job = Job(user_id=user_id, type=job_type, payload=payload, status="queued")
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job


async def _claim_next(db: AsyncSession) -> Job | None:
    job = (
        (
            await db.execute(
                select(Job).where(Job.status == "queued").order_by(Job.created_at).limit(1)
            )
        )
        .scalars()
        .first()
    )
    if job is None:
        return None
    job.status = "running"
    await db.commit()
    await db.refresh(job)
    return job


async def process_pending_once() -> bool:
    """Process at most one queued job; returns True if one was handled."""
    from app.services.documents import handle_job  # local import avoids a cycle

    async with SessionLocal() as db:
        job = await _claim_next(db)
        if job is None:
            return False
        try:
            result = await handle_job(db, job)
            job.status = "succeeded"
            job.result = result
        except Exception as exc:  # noqa: BLE001 - record any handler failure
            job.status = "failed"
            job.error = str(exc)[:1000]
        await db.commit()
        return True


async def run_worker(stop_event: asyncio.Event) -> None:
    """Poll for queued jobs until `stop_event` is set."""
    while not stop_event.is_set():
        try:
            handled = await process_pending_once()
        except Exception:  # pragma: no cover - keep the worker alive
            handled = False
        if not handled:
            try:
                await asyncio.wait_for(stop_event.wait(), timeout=1.5)
            except TimeoutError:
                pass
