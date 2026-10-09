"""Authentication endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.schemas.auth import CurrentUser

router = APIRouter()


@router.get(
    "/auth/me",
    response_model=CurrentUser,
    summary="Get the authenticated user",
)
async def read_current_user(user: Annotated[CurrentUser, Depends(get_current_user)]) -> CurrentUser:
    """Return the identity encoded in the caller's verified Supabase access token.

    The persisted profile (and `PATCH /auth/me`) arrives with the database in
    Level 6; here we only echo verified token claims.
    """
    return user
