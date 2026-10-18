"""AI service abstraction.

The rest of the app depends only on this protocol, never on a concrete
provider. Providers live in `app/ai/providers/` and are chosen by the factory.
"""

from dataclasses import dataclass, field
from typing import Protocol


@dataclass(frozen=True)
class KeyPoint:
    text: str
    page: int | None = None


@dataclass(frozen=True)
class SummaryResult:
    summary: str
    key_points: list[KeyPoint] = field(default_factory=list)


class AIService(Protocol):
    async def summarize_document(self, text: str) -> SummaryResult:
        """Return a concise summary plus page-referenced key points."""
        ...
