"""Folder endpoints (all scoped to the authenticated user)."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_profile
from app.db.session import get_db
from app.models.profile import Profile
from app.schemas.folder import FolderCreate, FolderRead, FolderUpdate
from app.services import folders as folder_service

router = APIRouter(prefix="/folders")


@router.get("", response_model=list[FolderRead], summary="List folders")
async def list_folders(
    db: Annotated[AsyncSession, Depends(get_db)],
    profile: Annotated[Profile, Depends(get_current_profile)],
) -> list[FolderRead]:
    folders = await folder_service.list_folders(db, profile.id)
    return [FolderRead.model_validate(folder) for folder in folders]


@router.post(
    "",
    response_model=FolderRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a folder",
)
async def create_folder(
    payload: FolderCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    profile: Annotated[Profile, Depends(get_current_profile)],
) -> FolderRead:
    folder = await folder_service.create_folder(db, profile.id, payload)
    return FolderRead.model_validate(folder)


@router.get("/{folder_id}", response_model=FolderRead, summary="Get a folder")
async def get_folder(
    folder_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    profile: Annotated[Profile, Depends(get_current_profile)],
) -> FolderRead:
    folder = await folder_service.get_folder(db, profile.id, folder_id)
    return FolderRead.model_validate(folder)


@router.patch("/{folder_id}", response_model=FolderRead, summary="Rename or move a folder")
async def update_folder(
    folder_id: uuid.UUID,
    payload: FolderUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    profile: Annotated[Profile, Depends(get_current_profile)],
) -> FolderRead:
    folder = await folder_service.update_folder(db, profile.id, folder_id, payload)
    return FolderRead.model_validate(folder)


@router.delete(
    "/{folder_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a folder (children move up)",
)
async def delete_folder(
    folder_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    profile: Annotated[Profile, Depends(get_current_profile)],
) -> None:
    await folder_service.delete_folder(db, profile.id, folder_id)
