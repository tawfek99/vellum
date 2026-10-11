"""Folder model (nested via a self-referential parent)."""

from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin
from app.models.profile import Profile


class Folder(TimestampMixin, Base):
    __tablename__ = "folders"
    __table_args__ = (
        # Names are unique per user within the same parent.
        UniqueConstraint("user_id", "parent_id", "name", name="uq_folders_user_parent_name"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("profiles.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(120))
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("folders.id", ondelete="SET NULL"), nullable=True, index=True
    )

    user: Mapped[Profile] = relationship(back_populates="folders")
    parent: Mapped[Folder | None] = relationship(remote_side=[id], back_populates="children")
    children: Mapped[list[Folder]] = relationship(back_populates="parent")
