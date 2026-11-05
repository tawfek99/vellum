"""Provider for any OpenAI-compatible chat-completions API.

DeepSeek, OpenAI, and Google Gemini (via its OpenAI-compatible endpoint) all
work through this one adapter — only base URL / model / key differ.
"""

import asyncio
import json
import re
from collections.abc import Callable
from typing import TypeVar

import httpx
from pydantic import BaseModel, ValidationError

from app.ai.base import (
    AnswerResult,
    Flashcard,
    FlashcardResult,
    KeyPoint,
    QuizQuestion,
    QuizResult,
    SummaryResult,
)
from app.ai.prompts import (
    FLASHCARDS_SYSTEM,
    QA_SYSTEM,
    QUIZ_SYSTEM,
    SUMMARY_SYSTEM,
    flashcards_user_prompt,
    qa_user_prompt,
    quiz_user_prompt,
    summary_user_prompt,
)

_FENCE = re.compile(r"^```[a-zA-Z]*\s*|\s*```$", re.MULTILINE)
_T = TypeVar("_T")


class _KeyPointPayload(BaseModel):
    text: str
    page: int | None = None


class _SummaryPayload(BaseModel):
    summary: str
    key_points: list[_KeyPointPayload] = []


class _AnswerPayload(BaseModel):
    answer: str
    pages: list[int] = []


class _FlashcardPayload(BaseModel):
    front: str
    back: str


class _FlashcardsPayload(BaseModel):
    cards: list[_FlashcardPayload] = []


class _QuizQuestionPayload(BaseModel):
    question: str
    options: list[str]
    answer_index: int
    explanation: str | None = None


class _QuizPayload(BaseModel):
    questions: list[_QuizQuestionPayload] = []


def _extract_json(raw: str) -> dict[str, object] | None:
    cleaned = _FENCE.sub("", raw.strip())
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end > start:
        try:
            return json.loads(cleaned[start : end + 1])
        except json.JSONDecodeError:
            return None
    return None


class OpenAICompatibleProvider:
    def __init__(self, *, base_url: str, api_key: str, model: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.model = model

    async def _complete(self, *, system: str, user: str) -> str:
        last_error: Exception | None = None
        for attempt in range(2):
            try:
                async with httpx.AsyncClient(timeout=120) as client:
                    response = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers={
                            "Authorization": f"Bearer {self.api_key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": self.model,
                            "temperature": 0.3,
                            "messages": [
                                {"role": "system", "content": system},
                                {"role": "user", "content": user},
                            ],
                        },
                    )
                if response.status_code in (429, 503) and attempt == 0:
                    await asyncio.sleep(1.5)
                    continue
                response.raise_for_status()
                data = response.json()
                return str(data["choices"][0]["message"]["content"])
            except httpx.TimeoutException as exc:
                # A slow provider is unlikely to be fast on an immediate retry;
                # fail now with a clear message instead of waiting twice.
                raise RuntimeError(
                    "The AI provider took too long to respond. Please try again."
                ) from exc
            except httpx.HTTPError as exc:
                last_error = exc
                if attempt == 0:
                    await asyncio.sleep(1.0)
                    continue
                raise
        raise last_error or RuntimeError("AI request failed")

    async def summarize_document(self, text: str) -> SummaryResult:
        raw = await self._complete(system=SUMMARY_SYSTEM, user=summary_user_prompt(text))
        payload = _extract_json(raw)
        if payload is not None:
            try:
                parsed = _SummaryPayload.model_validate(payload)
                return SummaryResult(
                    summary=parsed.summary.strip(),
                    key_points=[
                        KeyPoint(text=point.text.strip(), page=point.page)
                        for point in parsed.key_points
                        if point.text.strip()
                    ],
                )
            except ValidationError:
                pass
        # Fall back to a plain-text summary if the model didn't return JSON.
        return SummaryResult(summary=raw.strip())

    async def answer_question(
        self,
        question: str,
        context: str,
        history: list[dict[str, str]],
    ) -> AnswerResult:
        raw = await self._complete(
            system=QA_SYSTEM,
            user=qa_user_prompt(question, context, history),
        )
        payload = _extract_json(raw)
        if payload is not None:
            try:
                parsed = _AnswerPayload.model_validate(payload)
                pages = sorted({page for page in parsed.pages if page > 0})
                return AnswerResult(answer=parsed.answer.strip(), pages=pages)
            except ValidationError:
                pass
        # Fall back to a plain-text answer if the model didn't return JSON.
        return AnswerResult(answer=raw.strip())

    async def _complete_structured(
        self,
        *,
        system: str,
        user: str,
        parse: Callable[[dict[str, object]], _T],
        invalid_message: str,
    ) -> _T:
        """Ask for JSON, validate it, and retry once if the model got it wrong."""
        for attempt in range(2):
            prompt = user
            if attempt == 1:
                prompt = (
                    f"{user}\n\nYour previous response was invalid. "
                    "Return ONLY valid JSON matching the exact shape requested, "
                    "with no markdown fences or commentary."
                )
            raw = await self._complete(system=system, user=prompt)
            payload = _extract_json(raw)
            if payload is not None:
                try:
                    return parse(payload)
                except (ValidationError, ValueError):
                    pass
        raise RuntimeError(invalid_message)

    async def generate_flashcards(self, text: str) -> FlashcardResult:
        def parse(payload: dict[str, object]) -> FlashcardResult:
            parsed = _FlashcardsPayload.model_validate(payload)
            cards = [
                Flashcard(front=card.front.strip(), back=card.back.strip())
                for card in parsed.cards
                if card.front.strip() and card.back.strip()
            ]
            if not cards:
                raise ValueError("No usable flashcards")
            return FlashcardResult(cards=cards)

        return await self._complete_structured(
            system=FLASHCARDS_SYSTEM,
            user=flashcards_user_prompt(text),
            parse=parse,
            invalid_message="The AI returned invalid flashcards. Please try again.",
        )

    async def generate_quiz(self, text: str) -> QuizResult:
        def parse(payload: dict[str, object]) -> QuizResult:
            parsed = _QuizPayload.model_validate(payload)
            questions: list[QuizQuestion] = []
            for item in parsed.questions:
                options = [option.strip() for option in item.options if option.strip()]
                if len(options) != 4:
                    raise ValueError("Every question needs four options")
                if not 0 <= item.answer_index < len(options):
                    raise ValueError("Invalid answer index")
                questions.append(
                    QuizQuestion(
                        question=item.question.strip(),
                        options=options,
                        answer_index=item.answer_index,
                        explanation=(item.explanation or "").strip() or None,
                    )
                )
            if not questions:
                raise ValueError("No usable questions")
            return QuizResult(questions=questions)

        return await self._complete_structured(
            system=QUIZ_SYSTEM,
            user=quiz_user_prompt(text),
            parse=parse,
            invalid_message="The AI returned an invalid quiz. Please try again.",
        )
