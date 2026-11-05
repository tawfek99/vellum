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


@dataclass(frozen=True)
class AnswerResult:
    answer: str
    pages: list[int] = field(default_factory=list)


@dataclass(frozen=True)
class Flashcard:
    front: str
    back: str


@dataclass(frozen=True)
class FlashcardResult:
    cards: list[Flashcard] = field(default_factory=list)


@dataclass(frozen=True)
class QuizQuestion:
    question: str
    options: list[str]
    answer_index: int
    explanation: str | None = None


@dataclass(frozen=True)
class QuizResult:
    questions: list[QuizQuestion] = field(default_factory=list)


class AIService(Protocol):
    async def summarize_document(self, text: str) -> SummaryResult:
        """Return a concise summary plus page-referenced key points."""
        ...

    async def answer_question(
        self,
        question: str,
        context: str,
        history: list[dict[str, str]],
    ) -> AnswerResult:
        """Answer a question grounded in the supplied document excerpts."""
        ...

    async def generate_flashcards(self, text: str) -> FlashcardResult:
        """Return study flashcards grounded in the document."""
        ...

    async def generate_quiz(self, text: str) -> QuizResult:
        """Return multiple-choice quiz questions grounded in the document."""
        ...
