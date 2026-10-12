"""Note business logic.

All operations are scoped to the owning user. Listing supports a folder filter,
case-insensitive text search, and pagination; pinned notes sort first.
"""

import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.note import Note
from app.schemas.note import NoteCreate, NoteUpdate
from app.services.folders import get_folder

DEFAULT_TITLE = "Untitled"


async def list_notes(
    db: AsyncSession,
    user_id: uuid.UUID,
    *,
    folder_id: uuid.UUID | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 50,
) -> tuple[list[Note], int]:
    conditions = [Note.user_id == user_id]
    if folder_id is not None:
        conditions.append(Note.folder_id == folder_id)
    if search:
        pattern = f"%{search}%"
        conditions.append(or_(Note.title.ilike(pattern), Note.content.ilike(pattern)))

    total = await db.scalar(select(func.count()).select_from(Note).where(*conditions))

    stmt = (
        select(Note)
        .where(*conditions)
        .order_by(Note.is_pinned.desc(), Note.updated_at.desc())
        .limit(page_size)
        .offset((page - 1) * page_size)
    )
    notes = (await db.execute(stmt)).scalars().all()
    return list(notes), int(total or 0)


async def get_note(db: AsyncSession, user_id: uuid.UUID, note_id: uuid.UUID) -> Note:
    note = await db.get(Note, note_id)
    if note is None or note.user_id != user_id:
        raise NotFoundError("Note not found")
    return note


def _clean_title(title: str | None) -> str:
    if title is None:
        return DEFAULT_TITLE
    cleaned = title.strip()
    return cleaned or DEFAULT_TITLE


async def create_note(db: AsyncSession, user_id: uuid.UUID, data: NoteCreate) -> Note:
    if data.folder_id is not None:
        # Validates that the folder exists and belongs to this user.
        await get_folder(db, user_id, data.folder_id)

    note = Note(
        user_id=user_id,
        folder_id=data.folder_id,
        title=_clean_title(data.title),
        content=data.content,
        is_pinned=data.is_pinned,
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note


async def update_note(
    db: AsyncSession, user_id: uuid.UUID, note_id: uuid.UUID, data: NoteUpdate
) -> Note:
    note = await get_note(db, user_id, note_id)
    changes = data.model_dump(exclude_unset=True)

    if "folder_id" in changes and changes["folder_id"] is not None:
        await get_folder(db, user_id, changes["folder_id"])
    if "title" in changes:
        changes["title"] = _clean_title(changes["title"])

    for field, value in changes.items():
        setattr(note, field, value)

    await db.commit()
    await db.refresh(note)
    return note


async def delete_note(db: AsyncSession, user_id: uuid.UUID, note_id: uuid.UUID) -> None:
    note = await get_note(db, user_id, note_id)
    await db.delete(note)
    await db.commit()
