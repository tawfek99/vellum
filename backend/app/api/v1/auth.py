"""Authentication / current-user endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_profile
from app.db.session import get_db
from app.models.profile import Profile
from app.schemas.profile import ProfileRead, ProfileUpdate

router = APIRouter()


@router.get("/auth/me", response_model=ProfileRead, summary="Get the current user's profile")
async def read_current_user(
    profile: Annotated[Profile, Depends(get_current_profile)],
) -> ProfileRead:
    """Return the caller's profile, creating it on first request."""
    return ProfileRead.model_validate(profile)


@router.patch("/auth/me", response_model=ProfileRead, summary="Update the current user's profile")
async def update_current_user(
    payload: ProfileUpdate,
    profile: Annotated[Profile, Depends(get_current_profile)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProfileRead:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    await db.commit()
    await db.refresh(profile)
    return ProfileRead.model_validate(profile)
