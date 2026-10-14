"""Document endpoints (upload, list, detail, status, content, delete)."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_profile
from app.core.exceptions import InvalidOperationError
from app.db.session import get_db
from app.models.profile import Profile
from app.schemas.document import (
    DocumentContent,
    DocumentList,
    DocumentRead,
    DocumentStatus,
    DocumentUpdate,
)
from app.services import documents as document_service
from app.services import storage

router = APIRouter(prefix="/documents")

MAX_UPLOAD_BYTES = 20 * 1024 * 1024  # 20 MB


@router.get("", response_model=DocumentList, summary="List documents")
async def list_documents(
    db: Annotated[AsyncSession, Depends(get_db)],
    profile: Annotated[Profile, Depends(get_current_profile)],
    folder_id: Annotated[uuid.UUID | None, Query()] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 50,
) -> DocumentList:
    items, total = await document_service.list_documents(
        db, profile.id, folder_id=folder_id, page=page, page_size=page_size
    )
    return DocumentList(
        items=[DocumentRead.model_validate(document) for document in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post(
    "",
    response_model=DocumentRead,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a PDF",
)
async def upload_document(
    db: Annotated[AsyncSession, Depends(get_db)],
    profile: Annotated[Profile, Depends(get_current_profile)],
    file: Annotated[UploadFile, File()],
    title: Annotated[str | None, Form()] = None,
    folder_id: Annotated[uuid.UUID | None, Form()] = None,
) -> DocumentRead:
    file_name = file.filename or "document.pdf"
    if not file_name.lower().endswith(".pdf"):
        raise InvalidOperationError("Only PDF files are supported")

    data = await file.read()
    if not data:
        raise InvalidOperationError("The uploaded file is empty")
    if len(data) > MAX_UPLOAD_BYTES:
        raise InvalidOperationError("File is larger than 20 MB")

    document = await document_service.create_document(
        db,
        profile.id,
        title=title,
        file_name=file_name,
        mime_type=file.content_type or "application/pdf",
        folder_id=folder_id,
        data=data,
    )
    return DocumentRead.model_validate(document)


@router.get("/{document_id}", response_model=DocumentRead, summary="Get a document")
async def get_document(
    document_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    profile: Annotated[Profile, Depends(get_current_profile)],
) -> DocumentRead:
    document = await document_service.get_document(db, profile.id, document_id)
    return DocumentRead.model_validate(document)


@router.patch("/{document_id}", response_model=DocumentRead, summary="Rename or move a document")
async def update_document(
    document_id: uuid.UUID,
    payload: DocumentUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    profile: Annotated[Profile, Depends(get_current_profile)],
) -> DocumentRead:
    fields = payload.model_dump(exclude_unset=True)
    document = await document_service.update_document(
        db,
        profile.id,
        document_id,
        title=fields.get("title"),
        folder_id=fields.get("folder_id"),
        folder_id_set="folder_id" in fields,
    )
    return DocumentRead.model_validate(document)


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a document",
)
async def delete_document(
    document_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    profile: Annotated[Profile, Depends(get_current_profile)],
) -> None:
    await document_service.delete_document(db, profile.id, document_id)


@router.get(
    "/{document_id}/status",
    response_model=DocumentStatus,
    summary="Get processing status",
)
async def get_document_status(
    document_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    profile: Annotated[Profile, Depends(get_current_profile)],
) -> DocumentStatus:
    document = await document_service.get_document(db, profile.id, document_id)
    return DocumentStatus(
        id=document.id,
        processing_status=document.processing_status,
        page_count=document.page_count,
        error_message=document.error_message,
    )


@router.get(
    "/{document_id}/content",
    response_model=DocumentContent,
    summary="Signed URL for the document file",
)
async def get_document_content(
    document_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    profile: Annotated[Profile, Depends(get_current_profile)],
) -> DocumentContent:
    document = await document_service.get_document(db, profile.id, document_id)
    expires_in = 3600
    url = await storage.create_signed_url(document.storage_path, expires_in)
    return DocumentContent(url=url, expires_in=expires_in)
