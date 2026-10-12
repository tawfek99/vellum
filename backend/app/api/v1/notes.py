"""Note endpoints (all scoped to the authenticated user)."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_profile
from app.db.session import get_db
from app.models.profile import Profile
from app.schemas.note import NoteCreate, NoteList, NoteRead, NoteUpdate
from app.services import notes as note_service

router = APIRouter(prefix="/notes")


@router.get("", response_model=NoteList, summary="List notes")
async def list_notes(
    db: Annotated[AsyncSession, Depends(get_db)],
    profile: Annotated[Profile, Depends(get_current_profile)],
    folder_id: Annotated[uuid.UUID | None, Query()] = None,
    search: Annotated[str | None, Query(max_length=200)] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 50,
) -> NoteList:
    items, total = await note_service.list_notes(
        db,
        profile.id,
        folder_id=folder_id,
        search=search,
        page=page,
        page_size=page_size,
    )
    return NoteList(
        items=[NoteRead.model_validate(note) for note in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post(
    "",
    response_model=NoteRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a note",
)
async def create_note(
    payload: NoteCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    profile: Annotated[Profile, Depends(get_current_profile)],
) -> NoteRead:
    note = await note_service.create_note(db, profile.id, payload)
    return NoteRead.model_validate(note)


@router.get("/{note_id}", response_model=NoteRead, summary="Get a note")
async def get_note(
    note_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    profile: Annotated[Profile, Depends(get_current_profile)],
) -> NoteRead:
    note = await note_service.get_note(db, profile.id, note_id)
    return NoteRead.model_validate(note)


@router.patch("/{note_id}", response_model=NoteRead, summary="Update a note")
async def update_note(
    note_id: uuid.UUID,
    payload: NoteUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    profile: Annotated[Profile, Depends(get_current_profile)],
) -> NoteRead:
    note = await note_service.update_note(db, profile.id, note_id, payload)
    return NoteRead.model_validate(note)


@router.delete(
    "/{note_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a note",
)
async def delete_note(
    note_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    profile: Annotated[Profile, Depends(get_current_profile)],
) -> None:
    await note_service.delete_note(db, profile.id, note_id)
