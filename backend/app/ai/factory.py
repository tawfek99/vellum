"""Selects the configured AI provider. This is the only place that reads the
provider name from configuration — everything else uses the `AIService` protocol.
"""

from app.ai.base import AIService
from app.ai.providers.openai_compat import OpenAICompatibleProvider
from app.core.config import get_settings

settings = get_settings()

_OPENAI_COMPATIBLE_PROVIDERS = {"gemini", "openai", "deepseek", "openai-compatible"}


def build_ai_service() -> AIService:
    provider = settings.ai_provider.lower()
    if provider not in _OPENAI_COMPATIBLE_PROVIDERS:
        raise RuntimeError(f"Unknown AI provider configured: {settings.ai_provider}")
    if not settings.ai_api_key:
        raise RuntimeError("AI_API_KEY is not configured")
    return OpenAICompatibleProvider(
        base_url=settings.ai_base_url,
        api_key=settings.ai_api_key,
        model=settings.ai_model,
    )
