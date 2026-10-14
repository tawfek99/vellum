import uuid

import httpx
import pymupdf
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.main import app
from app.models.document import Document, DocumentChunk
from app.models.job import Job
from app.models.profile import Profile
from app.schemas.auth import CurrentUser
from app.services import documents as document_service
from app.services import storage

OTHER_USER_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")


def make_pdf(text: str = "Hello") -> bytes:
    document = pymupdf.open()
    page = document.new_page()
    if text:
        page.insert_text((72, 72), text)
    data = document.tobytes()
    document.close()
    return data


@pytest.fixture(autouse=True)
def mock_storage(monkeypatch: pytest.MonkeyPatch) -> None:
    async def upload_object(*_args: object, **_kwargs: object) -> None:
        return None

    async def download_object(*_args: object, **_kwargs: object) -> bytes:
        return make_pdf("mock")

    async def delete_object(*_args: object, **_kwargs: object) -> None:
        return None

    async def create_signed_url(*_args: object, **_kwargs: object) -> str:
        return "https://example.test/signed"

    monkeypatch.setattr(storage, "upload_object", upload_object)
    monkeypatch.setattr(storage, "download_object", download_object)
    monkeypatch.setattr(storage, "delete_object", delete_object)
    monkeypatch.setattr(storage, "create_signed_url", create_signed_url)


async def test_documents_require_authentication(client: httpx.AsyncClient) -> None:
    assert (await client.get("/api/v1/documents")).status_code == 401


async def test_upload_list_get_update_delete(
    client: httpx.AsyncClient, authenticated: None
) -> None:
    upload = await client.post(
        "/api/v1/documents",
        files={"file": ("Report.pdf", make_pdf("Body"), "application/pdf")},
    )
    assert upload.status_code == 201
    body = upload.json()
    assert body["title"] == "Report"
    assert body["processing_status"] == "uploaded"
    document_id = body["id"]

    listing = await client.get("/api/v1/documents")
    assert listing.json()["total"] == 1

    assert (await client.get(f"/api/v1/documents/{document_id}")).status_code == 200

    renamed = await client.patch(
        f"/api/v1/documents/{document_id}", json={"title": "Renamed"}
    )
    assert renamed.json()["title"] == "Renamed"

    deleted = await client.delete(f"/api/v1/documents/{document_id}")
    assert deleted.status_code == 204
    assert (await client.get(f"/api/v1/documents/{document_id}")).status_code == 404


async def test_rejects_non_pdf(client: httpx.AsyncClient, authenticated: None) -> None:
    response = await client.post(
        "/api/v1/documents",
        files={"file": ("notes.txt", b"hello", "text/plain")},
    )
    assert response.status_code == 400


async def test_content_returns_signed_url(
    client: httpx.AsyncClient, authenticated: None
) -> None:
    upload = await client.post(
        "/api/v1/documents",
        files={"file": ("Doc.pdf", make_pdf(), "application/pdf")},
    )
    document_id = upload.json()["id"]

    response = await client.get(f"/api/v1/documents/{document_id}/content")
    assert response.status_code == 200
    assert response.json()["url"] == "https://example.test/signed"


async def test_documents_are_scoped_per_user(
    client: httpx.AsyncClient, authenticated: None
) -> None:
    upload = await client.post(
        "/api/v1/documents",
        files={"file": ("Private.pdf", make_pdf(), "application/pdf")},
    )
    document_id = upload.json()["id"]

    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        id=str(OTHER_USER_ID), email="bob@example.com", role="authenticated"
    )
    assert (await client.get(f"/api/v1/documents/{document_id}")).status_code == 404


async def test_extraction_pipeline_marks_ready(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    user_id = uuid.uuid4()
    db_session.add(Profile(id=user_id, email="a@b.com"))
    document = Document(
        id=uuid.uuid4(),
        user_id=user_id,
        title="T",
        file_name="t.pdf",
        storage_path="p",
        mime_type="application/pdf",
        file_size_bytes=10,
        processing_status="uploaded",
    )
    job = Job(
        user_id=user_id,
        type="extract_pdf",
        status="running",
        payload={"document_id": str(document.id)},
    )
    db_session.add_all([document, job])
    await db_session.commit()

    async def fake_download(*_args: object, **_kwargs: object) -> bytes:
        return make_pdf("Hello world " * 200)

    monkeypatch.setattr(storage, "download_object", fake_download)

    await document_service.handle_job(db_session, job)
    await db_session.refresh(document)

    assert document.processing_status == "ready"
    assert document.page_count == 1
    chunks = (
        (
            await db_session.execute(
                select(DocumentChunk).where(DocumentChunk.document_id == document.id)
            )
        )
        .scalars()
        .all()
    )
    assert len(chunks) >= 1


async def test_extraction_flags_scanned_pdf(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    user_id = uuid.uuid4()
    db_session.add(Profile(id=user_id, email="a@b.com"))
    document = Document(
        id=uuid.uuid4(),
        user_id=user_id,
        title="Scan",
        file_name="scan.pdf",
        storage_path="p",
        mime_type="application/pdf",
        file_size_bytes=10,
        processing_status="uploaded",
    )
    job = Job(
        user_id=user_id,
        type="extract_pdf",
        status="running",
        payload={"document_id": str(document.id)},
    )
    db_session.add_all([document, job])
    await db_session.commit()

    async def fake_download(*_args: object, **_kwargs: object) -> bytes:
        return make_pdf("")

    monkeypatch.setattr(storage, "download_object", fake_download)

    await document_service.handle_job(db_session, job)
    await db_session.refresh(document)

    assert document.processing_status == "needs_ocr"
    assert document.error_message is not None
