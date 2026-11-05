"""Flashcard and quiz schemas."""

from uuid import UUID

from pydantic import BaseModel


class FlashcardRead(BaseModel):
    front: str
    back: str


class FlashcardsRead(BaseModel):
    id: UUID | None = None
    # none | pending | running | succeeded | failed
    status: str
    cards: list[FlashcardRead] = []
    error: str | None = None


class QuizQuestionRead(BaseModel):
    question: str
    options: list[str]
    answer_index: int
    explanation: str | None = None


class QuizRead(BaseModel):
    id: UUID | None = None
    status: str
    questions: list[QuizQuestionRead] = []
    error: str | None = None
