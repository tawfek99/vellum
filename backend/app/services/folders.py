"""Folder business logic.

All operations are scoped to the owning user. Deletion moves a folder's
children up to the folder's parent (or to the root), so nothing is lost.
"""

import uuid
from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, InvalidOperationError, NotFoundError
from app.models.folder import Folder
from app.models.note import Note
from app.schemas.folder import FolderCreate, FolderUpdate

# Re-exported for callers that want to catch a single base type.
__all__ = [
    "list_folders",
    "get_folder",
    "create_folder",
    "update_folder",
    "delete_folder",
    "count_notes_by_folder",
]


async def list_folders(db: AsyncSession, user_id: uuid.UUID) -> Sequence[Folder]:
    result = await db.execute(
        select(Folder).where(Folder.user_id == user_id).order_by(Folder.name)
    )
    return result.scalars().all()


async def count_notes_by_folder(
    db: AsyncSession, user_id: uuid.UUID
) -> dict[uuid.UUID, int]:
    """Number of notes in each of the user's folders (unfiled notes excluded)."""
    rows = await db.execute(
        select(Note.folder_id, func.count())
        .where(Note.user_id == user_id, Note.folder_id.is_not(None))
        .group_by(Note.folder_id)
    )
    return {folder_id: count for folder_id, count in rows.all() if folder_id is not None}


async def get_folder(db: AsyncSession, user_id: uuid.UUID, folder_id: uuid.UUID) -> Folder:
    folder = await db.get(Folder, folder_id)
    if folder is None or folder.user_id != user_id:
        raise NotFoundError("Folder not found")
    return folder


async def _assert_name_available(
    db: AsyncSession,
    user_id: uuid.UUID,
    name: str,
    parent_id: uuid.UUID | None,
    *,
    exclude_id: uuid.UUID | None = None,
) -> None:
    stmt = select(Folder.id).where(
        Folder.user_id == user_id,
        Folder.name == name,
        Folder.parent_id == parent_id,
    )
    if exclude_id is not None:
        stmt = stmt.where(Folder.id != exclude_id)
    if (await db.execute(stmt)).first() is not None:
        raise ConflictError("A folder with that name already exists here")


async def _is_descendant(
    db: AsyncSession, node_id: uuid.UUID, ancestor_id: uuid.UUID
) -> bool:
    """True if `node_id` is `ancestor_id` or lives beneath it."""
    seen: set[uuid.UUID] = set()
    current_id: uuid.UUID | None = node_id
    while current_id is not None and current_id not in seen:
        if current_id == ancestor_id:
            return True
        seen.add(current_id)
        current = await db.get(Folder, current_id)
        current_id = current.parent_id if current is not None else None
    return False


def _clean_name(name: str) -> str:
    cleaned = name.strip()
    if not cleaned:
        raise InvalidOperationError("Folder name cannot be empty")
    return cleaned


async def create_folder(
    db: AsyncSession, user_id: uuid.UUID, data: FolderCreate
) -> Folder:
    name = _clean_name(data.name)
    if data.parent_id is not None:
        await get_folder(db, user_id, data.parent_id)
    await _assert_name_available(db, user_id, name, data.parent_id)

    folder = Folder(user_id=user_id, name=name, parent_id=data.parent_id)
    db.add(folder)
    await db.commit()
    await db.refresh(folder)
    return folder


async def update_folder(
    db: AsyncSession, user_id: uuid.UUID, folder_id: uuid.UUID, data: FolderUpdate
) -> Folder:
    folder = await get_folder(db, user_id, folder_id)
    changes = data.model_dump(exclude_unset=True)

    new_name = changes.get("name", folder.name)
    if isinstance(new_name, str):
        new_name = _clean_name(new_name)

    new_parent_id = changes["parent_id"] if "parent_id" in changes else folder.parent_id

    if "parent_id" in changes and new_parent_id is not None:
        if new_parent_id == folder.id:
            raise InvalidOperationError("A folder cannot be its own parent")
        await get_folder(db, user_id, new_parent_id)
        if await _is_descendant(db, new_parent_id, folder.id):
            raise InvalidOperationError("Cannot move a folder into its own descendant")

    if new_name != folder.name or new_parent_id != folder.parent_id:
        await _assert_name_available(
            db, user_id, new_name, new_parent_id, exclude_id=folder.id
        )

    folder.name = new_name
    folder.parent_id = new_parent_id
    await db.commit()
    await db.refresh(folder)
    return folder


async def delete_folder(db: AsyncSession, user_id: uuid.UUID, folder_id: uuid.UUID) -> None:
    folder = await get_folder(db, user_id, folder_id)

    children = (
        (await db.execute(select(Folder).where(Folder.parent_id == folder.id)))
        .scalars()
        .all()
    )
    for child in children:
        child.parent_id = folder.parent_id

    await db.delete(folder)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise ConflictError(
            "Cannot delete: a folder with the same name already exists at the destination"
        ) from exc
