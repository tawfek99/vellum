"""Document business logic: upload, extraction, chunking, listing."""

import uuid
from typing import Any

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.document import Document, DocumentChunk
from app.models.job import Job
from app.services import jobs as job_service
from app.services import storage
from app.services.folders import get_folder
from app.services.pdf.chunker import chunk_text
from app.services.pdf.extractor import extract_text


def _title_from_filename(file_name: str) -> str:
    base = file_name.rsplit("/", 1)[-1]
    if base.lower().endswith(".pdf"):
        base = base[:-4]
    return base.strip() or "Untitled document"


async def list_documents(
    db: AsyncSession,
    user_id: uuid.UUID,
    *,
    folder_id: uuid.UUID | None = None,
    page: int = 1,
    page_size: int = 50,
) -> tuple[list[Document], int]:
    conditions = [Document.user_id == user_id]
    if folder_id is not None:
        conditions.append(Document.folder_id == folder_id)

    total = await db.scalar(select(func.count()).select_from(Document).where(*conditions))
    stmt = (
        select(Document)
        .where(*conditions)
        .order_by(Document.created_at.desc())
        .limit(page_size)
        .offset((page - 1) * page_size)
    )
    documents = (await db.execute(stmt)).scalars().all()
    return list(documents), int(total or 0)


async def get_document(
    db: AsyncSession, user_id: uuid.UUID, document_id: uuid.UUID
) -> Document:
    document = await db.get(Document, document_id)
    if document is None or document.user_id != user_id:
        raise NotFoundError("Document not found")
    return document


async def create_document(
    db: AsyncSession,
    user_id: uuid.UUID,
    *,
    title: str | None,
    file_name: str,
    mime_type: str,
    folder_id: uuid.UUID | None,
    data: bytes,
) -> Document:
    if folder_id is not None:
        await get_folder(db, user_id, folder_id)

    document_id = uuid.uuid4()
    storage_path = f"{user_id}/{document_id}.pdf"
    await storage.upload_object(storage_path, data, mime_type)

    document = Document(
        id=document_id,
        user_id=user_id,
        folder_id=folder_id,
        title=(title or "").strip() or _title_from_filename(file_name),
        file_name=file_name,
        storage_path=storage_path,
        mime_type=mime_type,
        file_size_bytes=len(data),
        processing_status="uploaded",
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    await job_service.enqueue(db, user_id, "extract_pdf", {"document_id": str(document.id)})
    return document


async def update_document(
    db: AsyncSession,
    user_id: uuid.UUID,
    document_id: uuid.UUID,
    *,
    title: str | None = None,
    folder_id: uuid.UUID | None = None,
    folder_id_set: bool = False,
) -> Document:
    document = await get_document(db, user_id, document_id)

    if title is not None:
        cleaned = title.strip()
        if cleaned:
            document.title = cleaned
    if folder_id_set:
        if folder_id is not None:
            await get_folder(db, user_id, folder_id)
        document.folder_id = folder_id

    await db.commit()
    await db.refresh(document)
    return document


async def delete_document(
    db: AsyncSession, user_id: uuid.UUID, document_id: uuid.UUID
) -> None:
    document = await get_document(db, user_id, document_id)
    storage_path = document.storage_path
    await db.delete(document)
    await db.commit()
    try:
        await storage.delete_object(storage_path)
    except Exception:  # noqa: BLE001 - storage cleanup is best-effort
        pass


async def _handle_extract_pdf(db: AsyncSession, job: Job) -> dict[str, Any]:
    document_id = uuid.UUID(str(job.payload["document_id"]))
    document = await db.get(Document, document_id)
    if document is None:
        raise ValueError("Document not found")

    document.processing_status = "extracting"
    await db.commit()

    data = await storage.download_object(document.storage_path)
    result = extract_text(data)
    document.page_count = result.page_count

    if not result.text.strip():
        document.processing_status = "needs_ocr"
        document.error_message = "No extractable text (scanned PDF?)."
        await db.commit()
        return {"status": "needs_ocr", "pages": result.page_count}

    await db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == document.id))

    # Include page markers so AI features can cite pages.
    marked_text = "\n\n".join(
        f"[[page {index + 1}]]\n{page_text.strip()}"
        for index, page_text in enumerate(result.pages)
        if page_text.strip()
    )

    for index, chunk in enumerate(chunk_text(marked_text)):
        db.add(
            DocumentChunk(
                document_id=document.id,
                chunk_index=index,
                content=chunk,
                token_count=len(chunk) // 4,
            )
        )

    document.text_content = marked_text
    document.processing_status = "ready"
    document.error_message = None
    await db.commit()
    return {
        "status": "ready",
        "pages": result.page_count,
        "chunks": len(chunk_text(marked_text)),
    }


async def handle_job(db: AsyncSession, job: Job) -> dict[str, Any]:
    if job.type == "extract_pdf":
        return await _handle_extract_pdf(db, job)
    if job.type == "summarize_document":
        # Local import avoids a circular dependency (summaries uses documents).
        from app.services.summaries import handle_summarize_job

        return await handle_summarize_job(db, job)
    if job.type == "answer_document_question":
        # Local import avoids a circular dependency (qa uses documents).
        from app.services.qa import handle_answer_job

        return await handle_answer_job(db, job)
    raise ValueError(f"Unknown job type: {job.type}")
