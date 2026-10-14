"""Document schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    folder_id: UUID | None = None
    title: str
    file_name: str
    mime_type: str
    file_size_bytes: int
    page_count: int
    processing_status: str
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime


class DocumentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    folder_id: UUID | None = None


class DocumentList(BaseModel):
    items: list[DocumentRead]
    total: int
    page: int
    page_size: int


class DocumentStatus(BaseModel):
    id: UUID
    processing_status: str
    page_count: int
    error_message: str | None = None


class DocumentContent(BaseModel):
    url: str
    expires_in: int
