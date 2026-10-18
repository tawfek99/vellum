"""Shared pytest fixtures.

Tests run against an in-memory SQLite database (via a `get_db` override) so the
suite needs no network or Supabase connection. JWT verification keeps its own
tests in `test_auth.py`; business-endpoint tests authenticate through the
`authenticated` override below.
"""

import uuid
from collections.abc import AsyncGenerator, Iterator

import httpx
import pytest
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401  (registers models on Base.metadata)
from app.core.security import get_current_user
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.schemas.auth import CurrentUser

TEST_USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")


@pytest.fixture
async def db_engine() -> AsyncGenerator[AsyncEngine, None]:
    engine = create_async_engine(
        "sqlite+aiosqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest.fixture
def session_factory(db_engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture
async def db_session(
    session_factory: async_sessionmaker[AsyncSession],
) -> AsyncGenerator[AsyncSession, None]:
    async with session_factory() as session:
        yield session


@pytest.fixture
async def client(db_engine: AsyncEngine) -> AsyncGenerator[httpx.AsyncClient, None]:
    session_factory = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as http_client:
        yield http_client
    app.dependency_overrides.clear()


@pytest.fixture
def authenticated() -> Iterator[None]:
    """Authenticate requests as `TEST_USER_ID` (bypasses JWT verification)."""
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        id=str(TEST_USER_ID), email="ada@example.com", role="authenticated"
    )
    yield
    app.dependency_overrides.pop(get_current_user, None)
