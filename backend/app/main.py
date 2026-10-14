"""FastAPI application factory.

Run locally with:
    uvicorn app.main:app --reload
"""

import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.exceptions import DomainError
from app.core.security import warm_jwks
from app.db.session import engine
from app.services.jobs import run_worker

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm the JWKS cache (best-effort) so the first auth request isn't a cold fetch.
    with suppress(Exception):
        await asyncio.to_thread(warm_jwks)

    # Startup: run the in-process background job worker.
    stop_event = asyncio.Event()
    worker = asyncio.create_task(run_worker(stop_event))

    yield

    # Shutdown: stop the worker and release pooled DB connections.
    stop_event.set()
    worker.cancel()
    with suppress(asyncio.CancelledError):
        await worker
    await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        lifespan=lifespan,
        docs_url=None if settings.is_production else "/docs",
        redoc_url=None if settings.is_production else "/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(DomainError)
    async def _domain_error_handler(_request: Request, exc: DomainError) -> JSONResponse:
        """Map expected business-rule errors to clean HTTP responses."""
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

    app.include_router(api_router, prefix=settings.api_v1_prefix)
    return app


app = create_app()
