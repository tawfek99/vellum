"""Global search schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SearchHit(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    # note | document
    kind: str
    id: UUID
    title: str
    snippet: str
    updated_at: datetime


class SearchResults(BaseModel):
    query: str
    notes: list[SearchHit] = []
    documents: list[SearchHit] = []
