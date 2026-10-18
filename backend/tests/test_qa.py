import uuid

import httpx
import pytest
from sqlalchemy import select

from app.ai.base import AnswerResult
from app.ai.providers.openai_compat import OpenAICompatibleProvider
from app.ai.retrieval import keywords, retrieve_chunks
from app.models.document import Document, DocumentChunk
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


async def seed_document(
    session_factory,
    document: Document,
    chunks: list[str] | None = None,
) -> uuid.UUID:
    async with session_factory() as session:
        session.add(Profile(id=USER_ID, email="ada@example.com"))
        session.add(document)
        await session.flush()
        for index, content in enumerate(chunks or []):
            session.add(
                DocumentChunk(
                    document_id=document.id,
                    chunk_index=index,
                    content=content,
                    token_count=len(content) // 4,
                )
            )
        await session.commit()
    return document.id


class FakeAI:
    def __init__(self) -> None:
        self.calls: list[dict[str, object]] = []

    async def answer_question(
        self,
        question: str,
        context: str,
        history: list[dict[str, str]],
    ) -> AnswerResult:
        self.calls.append({"question": question, "context": context, "history": history})
        return AnswerResult(answer=f"Answer: {question}", pages=[1])


async def run_pending_job(session_factory, job_type: str) -> None:
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
        await document_service.handle_job(session, job)
        job.status = "succeeded"
        await session.commit()


async def test_qa_flow(
    client: httpx.AsyncClient,
    authenticated: None,
    session_factory,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    document = make_document("[[page 1]] Alpha beta.\n[[page 2]] Gamma delta.")
    document_id = await seed_document(
        session_factory,
        document,
        ["[[page 1]] Alpha beta.", "[[page 2]] Gamma delta."],
    )
    fake = FakeAI()
    monkeypatch.setattr("app.services.qa.build_ai_service", lambda: fake)

    created = await client.post(
        f"/api/v1/documents/{document_id}/ask", json={"question": "What is alpha?"}
    )
    assert created.status_code == 201
    body = created.json()
    assert body["status"] == "pending"
    assert body["question"] == "What is alpha?"
    assert body["answer"] is None

    await run_pending_job(session_factory, "answer_document_question")

    fetched = await client.get(f"/api/v1/documents/{document_id}/qa")
    assert fetched.status_code == 200
    items = fetched.json()["items"]
    assert len(items) == 1
    assert items[0]["status"] == "succeeded"
    assert items[0]["answer"] == "Answer: What is alpha?"
    assert items[0]["pages"] == [1]
    assert "Alpha beta" in fake.calls[0]["context"]


async def test_qa_history_is_passed_to_follow_up_questions(
    client: httpx.AsyncClient,
    authenticated: None,
    session_factory,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    document = make_document("Alpha.")
    document_id = await seed_document(session_factory, document, ["Alpha."])
    fake = FakeAI()
    monkeypatch.setattr("app.services.qa.build_ai_service", lambda: fake)

    await client.post(f"/api/v1/documents/{document_id}/ask", json={"question": "First?"})
    await run_pending_job(session_factory, "answer_document_question")
    await client.post(f"/api/v1/documents/{document_id}/ask", json={"question": "Second?"})
    await run_pending_job(session_factory, "answer_document_question")

    assert fake.calls[0]["history"] == []
    assert fake.calls[1]["history"] == [
        {"role": "user", "content": "First?"},
        {"role": "assistant", "content": "Answer: First?"},
    ]

    history = (await client.get(f"/api/v1/documents/{document_id}/qa")).json()["items"]
    assert [item["question"] for item in history] == ["First?", "Second?"]
    assert [item["answer"] for item in history] == ["Answer: First?", "Answer: Second?"]


async def test_qa_rejects_documents_without_text(
    client: httpx.AsyncClient, authenticated: None, session_factory
) -> None:
    document_id = await seed_document(
        session_factory, make_document(None, status="needs_ocr")
    )

    response = await client.post(
        f"/api/v1/documents/{document_id}/ask", json={"question": "Anything?"}
    )

    assert response.status_code == 400


async def test_qa_requires_authentication(client: httpx.AsyncClient) -> None:
    response = await client.post(
        f"/api/v1/documents/{uuid.uuid4()}/ask", json={"question": "Hi?"}
    )
    assert response.status_code == 401


async def test_qa_rejects_blank_questions(
    client: httpx.AsyncClient, authenticated: None, session_factory
) -> None:
    document_id = await seed_document(session_factory, make_document("Text"))

    response = await client.post(
        f"/api/v1/documents/{document_id}/ask", json={"question": "   "}
    )

    assert response.status_code == 400


async def test_history_is_empty_for_new_document(
    client: httpx.AsyncClient, authenticated: None, session_factory
) -> None:
    document_id = await seed_document(session_factory, make_document("Text"))

    response = await client.get(f"/api/v1/documents/{document_id}/qa")

    assert response.status_code == 200
    assert response.json() == {"items": []}


def test_keywords_drop_stopwords_and_short_words() -> None:
    assert keywords("What is the powerhouse of the cell?") == ["powerhouse", "cell"]


async def test_retrieval_prefers_matching_chunks(
    session_factory,
) -> None:
    document = make_document("text")
    await seed_document(
        session_factory,
        document,
        [
            "Numbers and dates only.",
            "The mitochondria is the powerhouse of the cell.",
            "Unrelated appendix material.",
        ],
    )

    async with session_factory() as session:
        chunks = await retrieve_chunks(session, document.id, "Where is the mitochondria?")

    assert [chunk.chunk_index for chunk in chunks] == [1]


async def test_retrieval_falls_back_to_opening_chunks(
    session_factory,
) -> None:
    document = make_document("text")
    await seed_document(
        session_factory,
        document,
        ["First chunk.", "Second chunk.", "Third chunk."],
    )

    async with session_factory() as session:
        chunks = await retrieve_chunks(
            session, document.id, "something entirely unrelated", limit=2
        )

    assert [chunk.chunk_index for chunk in chunks] == [0, 1]


async def test_provider_parses_answer_json(monkeypatch: pytest.MonkeyPatch) -> None:
    provider = OpenAICompatibleProvider(base_url="http://x", api_key="k", model="m")

    async def fake_complete(**_kwargs: object) -> str:
        return '{"answer":"Grounded answer","pages":[3,3,0]}'

    monkeypatch.setattr(provider, "_complete", fake_complete)

    result = await provider.answer_question("q", "context", [])

    assert result.answer == "Grounded answer"
    assert result.pages == [3]
