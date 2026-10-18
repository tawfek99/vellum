import uuid

import httpx
import pytest
from sqlalchemy import select

from app.ai.base import KeyPoint, SummaryResult
from app.ai.providers.openai_compat import OpenAICompatibleProvider, _extract_json
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
    async def summarize_document(self, _text: str) -> SummaryResult:
        return SummaryResult(
            summary="A clear summary.",
            key_points=[KeyPoint(text="Important point", page=2)],
        )


async def test_summary_flow(
    client: httpx.AsyncClient,
    authenticated: None,
    session_factory,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    document = make_document("[[page 1]] Hello world.\n[[page 2]] More detail.")
    document_id = await seed_document(session_factory, document)
    monkeypatch.setattr("app.services.summaries.build_ai_service", lambda: FakeAI())

    created = await client.post(f"/api/v1/documents/{document_id}/summary")
    assert created.status_code == 201
    assert created.json()["status"] == "pending"

    async with session_factory() as session:
        job = (
            (await session.execute(select(Job).where(Job.type == "summarize_document")))
            .scalars()
            .first()
        )
        assert job is not None
        await document_service.handle_job(session, job)

    fetched = await client.get(f"/api/v1/documents/{document_id}/summary")
    body = fetched.json()
    assert body["status"] == "succeeded"
    assert body["summary"] == "A clear summary."
    assert body["key_points"] == [{"text": "Important point", "page": 2}]


async def test_summary_is_none_before_request(
    client: httpx.AsyncClient, authenticated: None, session_factory
) -> None:
    document_id = await seed_document(session_factory, make_document("Some text"))

    response = await client.get(f"/api/v1/documents/{document_id}/summary")

    assert response.status_code == 200
    assert response.json()["status"] == "none"


async def test_summary_rejects_documents_without_text(
    client: httpx.AsyncClient, authenticated: None, session_factory
) -> None:
    document_id = await seed_document(
        session_factory, make_document(None, status="needs_ocr")
    )

    response = await client.post(f"/api/v1/documents/{document_id}/summary")

    assert response.status_code == 400


async def test_summary_requires_authentication(client: httpx.AsyncClient) -> None:
    response = await client.post(f"/api/v1/documents/{uuid.uuid4()}/summary")
    assert response.status_code == 401


def test_extract_json_handles_code_fences() -> None:
    assert _extract_json('```json\n{"summary":"x","key_points":[]}\n```') == {
        "summary": "x",
        "key_points": [],
    }


async def test_provider_parses_summary_json(monkeypatch: pytest.MonkeyPatch) -> None:
    provider = OpenAICompatibleProvider(base_url="http://x", api_key="k", model="m")

    async def fake_complete(**_kwargs: object) -> str:
        return '{"summary":"S","key_points":[{"text":"P","page":3}]}'

    monkeypatch.setattr(provider, "_complete", fake_complete)

    result = await provider.summarize_document("text")

    assert result.summary == "S"
    assert result.key_points[0].page == 3
