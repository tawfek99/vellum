import uuid

import httpx
import pytest
from sqlalchemy import select

from app.ai.base import Flashcard, FlashcardResult, QuizQuestion, QuizResult
from app.ai.providers.openai_compat import OpenAICompatibleProvider
from app.models.document import Document
from app.models.job import Job
from app.models.profile import Profile
from app.services import documents as document_service

USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")


def make_document(text: str | None, status: str = "ready") -> Document:
    return Document(
        id=uuid.uuid4(),
        user_id=USER_ID,
        title="Doc",
        file_name="doc.pdf",
        storage_path="p",
        mime_type="application/pdf",
        file_size_bytes=10,
        processing_status=status,
        text_content=text,
    )


async def seed_document(session_factory, document: Document) -> uuid.UUID:
    async with session_factory() as session:
        session.add(Profile(id=USER_ID, email="ada@example.com"))
        session.add(document)
        await session.commit()
    return document.id


class FakeAI:
    async def generate_flashcards(self, _text: str) -> FlashcardResult:
        return FlashcardResult(
            cards=[Flashcard(front="What is alpha?", back="The first letter.")]
        )

    async def generate_quiz(self, _text: str) -> QuizResult:
        return QuizResult(
            questions=[
                QuizQuestion(
                    question="Which is alpha?",
                    options=["alpha", "beta", "gamma", "delta"],
                    answer_index=0,
                    explanation="Alpha is first.",
                )
            ]
        )


class FailingAI:
    async def generate_flashcards(self, _text: str) -> FlashcardResult:
        raise RuntimeError("The AI returned invalid flashcards. Please try again.")

    async def generate_quiz(self, _text: str) -> QuizResult:
        raise RuntimeError("The AI returned an invalid quiz. Please try again.")


async def run_job(session_factory, job_type: str) -> bool:
    async with session_factory() as session:
        job = (
            (
                await session.execute(
                    select(Job).where(Job.type == job_type, Job.status == "queued")
                )
            )
            .scalars()
            .first()
        )
        assert job is not None
        ok = True
        try:
            await document_service.handle_job(session, job)
            job.status = "succeeded"
        except Exception:  # noqa: BLE001 - asserted by the caller
            ok = False
            job.status = "failed"
        await session.commit()
    return ok


async def test_flashcards_flow(
    client: httpx.AsyncClient,
    authenticated: None,
    session_factory,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    document_id = await seed_document(session_factory, make_document("Alpha beta gamma."))
    monkeypatch.setattr("app.services.study.build_ai_service", lambda: FakeAI())

    created = await client.post(f"/api/v1/documents/{document_id}/flashcards")
    assert created.status_code == 201
    assert created.json()["status"] == "pending"

    assert await run_job(session_factory, "generate_flashcards")

    fetched = await client.get(f"/api/v1/documents/{document_id}/flashcards")
    body = fetched.json()
    assert body["status"] == "succeeded"
    assert body["cards"] == [{"front": "What is alpha?", "back": "The first letter."}]


async def test_quiz_flow(
    client: httpx.AsyncClient,
    authenticated: None,
    session_factory,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    document_id = await seed_document(session_factory, make_document("Alpha beta gamma."))
    monkeypatch.setattr("app.services.study.build_ai_service", lambda: FakeAI())

    created = await client.post(f"/api/v1/documents/{document_id}/quiz")
    assert created.status_code == 201
    assert created.json()["status"] == "pending"

    assert await run_job(session_factory, "generate_quiz")

    fetched = await client.get(f"/api/v1/documents/{document_id}/quiz")
    body = fetched.json()
    assert body["status"] == "succeeded"
    assert body["questions"] == [
        {
            "question": "Which is alpha?",
            "options": ["alpha", "beta", "gamma", "delta"],
            "answer_index": 0,
            "explanation": "Alpha is first.",
        }
    ]


async def test_study_is_none_before_request(
    client: httpx.AsyncClient, authenticated: None, session_factory
) -> None:
    document_id = await seed_document(session_factory, make_document("Text"))

    flashcards = await client.get(f"/api/v1/documents/{document_id}/flashcards")
    quiz = await client.get(f"/api/v1/documents/{document_id}/quiz")

    assert flashcards.json()["status"] == "none"
    assert quiz.json()["status"] == "none"


async def test_study_rejects_documents_without_text(
    client: httpx.AsyncClient, authenticated: None, session_factory
) -> None:
    document_id = await seed_document(
        session_factory, make_document(None, status="needs_ocr")
    )

    response = await client.post(f"/api/v1/documents/{document_id}/flashcards")

    assert response.status_code == 400


async def test_study_requires_authentication(client: httpx.AsyncClient) -> None:
    response = await client.post(f"/api/v1/documents/{uuid.uuid4()}/quiz")
    assert response.status_code == 401


async def test_invalid_ai_output_is_not_stored_as_success(
    client: httpx.AsyncClient,
    authenticated: None,
    session_factory,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    document_id = await seed_document(session_factory, make_document("Text"))
    monkeypatch.setattr("app.services.study.build_ai_service", lambda: FailingAI())

    await client.post(f"/api/v1/documents/{document_id}/flashcards")
    assert not await run_job(session_factory, "generate_flashcards")

    fetched = (await client.get(f"/api/v1/documents/{document_id}/flashcards")).json()
    assert fetched["status"] == "failed"
    assert fetched["cards"] == []
    assert "invalid flashcards" in fetched["error"]


async def test_provider_retries_once_when_json_is_invalid(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    provider = OpenAICompatibleProvider(base_url="http://x", api_key="k", model="m")
    responses = iter(["not json", '{"cards":[{"front":"Q","back":"A"}]}'])

    async def fake_complete(**_kwargs: object) -> str:
        return next(responses)

    monkeypatch.setattr(provider, "_complete", fake_complete)

    result = await provider.generate_flashcards("text")

    assert [(card.front, card.back) for card in result.cards] == [("Q", "A")]


async def test_provider_raises_when_output_stays_invalid(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    provider = OpenAICompatibleProvider(base_url="http://x", api_key="k", model="m")

    async def fake_complete(**_kwargs: object) -> str:
        return "still not json"

    monkeypatch.setattr(provider, "_complete", fake_complete)

    with pytest.raises(RuntimeError):
        await provider.generate_flashcards("text")


async def test_provider_rejects_quiz_with_wrong_option_count(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    provider = OpenAICompatibleProvider(base_url="http://x", api_key="k", model="m")

    async def fake_complete(**_kwargs: object) -> str:
        return '{"questions":[{"question":"Q","options":["A","B"],"answer_index":0}]}'

    monkeypatch.setattr(provider, "_complete", fake_complete)

    with pytest.raises(RuntimeError):
        await provider.generate_quiz("text")
