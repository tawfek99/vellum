"""User profile model (one row per Supabase auth user)."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.folder import Folder


class Profile(TimestampMixin, Base):
    __tablename__ = "profiles"

    # Primary key is the Supabase auth user's UUID (no separate local id).
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    full_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    folders: Mapped[list[Folder]] = relationship(back_populates="user")
