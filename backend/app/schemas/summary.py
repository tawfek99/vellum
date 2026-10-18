"""Summary schemas."""

from uuid import UUID

from pydantic import BaseModel


class SummaryKeyPoint(BaseModel):
    text: str
    page: int | None = None


class SummaryRead(BaseModel):
    id: UUID | None = None
    # none | pending | running | succeeded | failed
    status: str
    summary: str | None = None
    key_points: list[SummaryKeyPoint] = []
    error: str | None = None
