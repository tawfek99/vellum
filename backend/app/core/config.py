"""Application configuration loaded from environment variables.

All settings are read once (and cached) so the rest of the app can depend on a
single, validated `Settings` object. Secrets live only in the environment
(see `.env.example`); nothing here is ever shipped to the frontend.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_name: str = "Vellum API"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"

    # Stored as a plain string so `.env` files don't need JSON syntax.
    cors_origins: str = "http://localhost:5173"

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/note_taker"

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""
    storage_bucket: str = "documents"

    # AI provider (provider is abstracted; only the factory reads these)
    ai_provider: str = "deepseek"
    ai_api_key: str = ""
    ai_model: str = "deepseek-chat"
    ai_base_url: str = "https://api.deepseek.com"

    # Demo account (public credentials used by the "Try the demo" button on the
    # login page). Seeded by `python -m scripts.seed_demo`.
    demo_email: str = "demo@notetaker.app"
    demo_password: str = "DemoNotes2026!"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def supabase_issuer(self) -> str:
        """Expected `iss` claim for Supabase access tokens."""
        return f"{self.supabase_url.rstrip('/')}/auth/v1"

    @property
    def supabase_jwks_url(self) -> str:
        """Public JWKS endpoint for verifying asymmetric (ES256/RS256) tokens."""
        return f"{self.supabase_issuer}/.well-known/jwks.json"

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (safe to use as a FastAPI dependency)."""
    return Settings()
