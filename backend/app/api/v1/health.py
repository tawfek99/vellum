"""Liveness/health endpoint.

Kept dependency-free on purpose: it reports only that the process is up, so it
stays valid even when the database or external services are unavailable.
"""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class HealthResponse(BaseModel):
    status: str


@router.get("/health", response_model=HealthResponse, summary="Service health check")
async def health() -> HealthResponse:
    return HealthResponse(status="ok")
