"""Global search endpoint (notes + documents, scoped to the user)."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_profile
from app.db.session import get_db
from app.models.profile import Profile
from app.schemas.search import SearchHit, SearchResults
from app.services import search as search_service

router = APIRouter(prefix="/search")


@router.get("", response_model=SearchResults, summary="Search notes and documents")
async def search(
    q: Annotated[str, Query(min_length=1, max_length=200)],
    db: Annotated[AsyncSession, Depends(get_db)],
    profile: Annotated[Profile, Depends(get_current_profile)],
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
) -> SearchResults:
    results = await search_service.search_all(db, profile.id, q, limit=limit)
    return SearchResults(
        query=q,
        notes=[SearchHit.model_validate(hit) for hit in results.notes],
        documents=[SearchHit.model_validate(hit) for hit in results.documents],
    )
