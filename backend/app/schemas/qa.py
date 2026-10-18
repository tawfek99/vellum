"""Q&A schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class AskQuestion(BaseModel):
    question: str = Field(min_length=1, max_length=2000)


class QaExchangeRead(BaseModel):
    id: UUID
    question: str
    answer: str | None = None
    # pending | running | succeeded | failed
    status: str
    error: str | None = None
    pages: list[int] = []
    created_at: datetime


class QaHistory(BaseModel):
    items: list[QaExchangeRead] = []
