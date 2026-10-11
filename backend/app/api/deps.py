"""Shared FastAPI dependencies."""

import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.profile import Profile
from app.schemas.auth import CurrentUser


async def get_current_profile(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Profile:
    """Return the caller's persisted profile, creating it on first request.

    Identity comes from the verified token; the profile row stores app-level
    data (display name, avatar) that Supabase Auth does not own.
    """
    try:
        user_id = uuid.UUID(current_user.id)
    except (ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject"
        ) from exc

    profile = await db.get(Profile, user_id)
    if profile is not None:
        return profile

    profile = Profile(id=user_id, email=current_user.email)
    db.add(profile)
    try:
        await db.commit()
    except IntegrityError:
        # Concurrent first request created it; re-read.
        await db.rollback()
        profile = await db.get(Profile, user_id)
        if profile is None:  # pragma: no cover - defensive
            raise
        return profile
    await db.refresh(profile)
    return profile
