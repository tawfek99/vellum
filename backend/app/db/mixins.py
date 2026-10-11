"""Shared model mixins."""

from datetime import UTC, datetime

from sqlalchemy import DateTime
from sqlalchemy.orm import Mapped, mapped_column


def utcnow() -> datetime:
    """Timezone-aware 'now' used as the Python-side timestamp default."""
    return datetime.now(UTC)


class TimestampMixin:
    """Adds `created_at` / `updated_at` columns (set in Python, DB-agnostic)."""

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )
