"""Async database engine and session management.

The engine is created lazily — SQLAlchemy does not open a connection until the
first query is issued — so the app can boot and serve `/health` even when no
database is reachable (useful in early development and on free-tier hosts).
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True,
    # Supabase's transaction pooler (pgbouncer) doesn't support server-side
    # prepared statements, so disable both asyncpg's and SQLAlchemy's caches.
    connect_args={"statement_cache_size": 0, "prepared_statement_cache_size": 0},
)

SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields a database session per request."""
    async with SessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
