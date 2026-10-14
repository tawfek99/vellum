"""Aggregates all v1 route modules behind a single router."""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.documents import router as documents_router
from app.api.v1.folders import router as folders_router
from app.api.v1.health import router as health_router
from app.api.v1.notes import router as notes_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(auth_router, tags=["auth"])
api_router.include_router(folders_router, tags=["folders"])
api_router.include_router(notes_router, tags=["notes"])
api_router.include_router(documents_router, tags=["documents"])
