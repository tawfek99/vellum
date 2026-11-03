import uuid

import httpx

from app.models.document import Document
from app.models.note import Note
from app.models.profile import Profile

USER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
OTHER_USER_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")


def make_document(title: str, text: str) -> Document:
    return Document(
        id=uuid.uuid4(),
        user_id=USER_ID,
        title=title,
        file_name="doc.pdf",
        storage_path="p",
        mime_type="application/pdf",
        file_size_bytes=10,
        processing_status="ready",
        text_content=text,
    )


async def seed(
    session_factory,
    *,
    notes: list[tuple[str, str]] | None = None,
    documents: list[Document] | None = None,
) -> None:
    async with session_factory() as session:
        session.add(Profile(id=USER_ID, email="ada@example.com"))
        for title, content in notes or []:
            session.add(Note(user_id=USER_ID, title=title, content=content))
        for document in documents or []:
            session.add(document)
        await session.commit()


async def test_search_requires_authentication(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/search", params={"q": "alpha"})
    assert response.status_code == 401


async def test_search_returns_matching_notes_and_documents(
    client: httpx.AsyncClient, authenticated: None, session_factory
) -> None:
    await seed(
        session_factory,
        notes=[
            ("Alpha plan", "The alpha launch includes beta testing."),
            ("Groceries", "milk and eggs"),
        ],
        documents=[make_document("Alpha report", "The alpha report covers beta metrics.")],
    )

    response = await client.get("/api/v1/search", params={"q": "alpha"})

    assert response.status_code == 200
    body = response.json()
    assert body["query"] == "alpha"
    assert [hit["title"] for hit in body["notes"]] == ["Alpha plan"]
    assert [hit["title"] for hit in body["documents"]] == ["Alpha report"]
    assert body["notes"][0]["kind"] == "note"
    assert body["documents"][0]["kind"] == "document"
    assert "alpha" in body["notes"][0]["snippet"].lower()
    assert "alpha" in body["documents"][0]["snippet"].lower()


async def test_search_matches_note_body(
    client: httpx.AsyncClient, authenticated: None, session_factory
) -> None:
    await seed(
        session_factory,
        notes=[
            ("Groceries", "milk and eggs"),
            ("Ideas", "build a note app"),
        ],
    )

    response = await client.get("/api/v1/search", params={"q": "eggs"})

    body = response.json()
    assert [hit["title"] for hit in body["notes"]] == ["Groceries"]
    assert body["documents"] == []


async def test_search_ranks_title_matches_first(
    client: httpx.AsyncClient, authenticated: None, session_factory
) -> None:
    await seed(
        session_factory,
        notes=[
            ("Other", "alpha appears only in the body"),
            ("Alpha plan", "nothing relevant here"),
        ],
    )

    response = await client.get("/api/v1/search", params={"q": "alpha"})

    assert [hit["title"] for hit in response.json()["notes"]] == ["Alpha plan", "Other"]


async def test_search_is_scoped_to_the_user(
    client: httpx.AsyncClient, authenticated: None, session_factory
) -> None:
    async with session_factory() as session:
        session.add(Profile(id=USER_ID, email="ada@example.com"))
        session.add(Profile(id=OTHER_USER_ID, email="bob@example.com"))
        session.add(Note(user_id=OTHER_USER_ID, title="Alpha secret", content="alpha"))
        await session.commit()

    response = await client.get("/api/v1/search", params={"q": "alpha"})

    assert response.json()["notes"] == []
    assert response.json()["documents"] == []


async def test_search_returns_empty_lists_for_no_matches(
    client: httpx.AsyncClient, authenticated: None, session_factory
) -> None:
    await seed(session_factory, notes=[("Groceries", "milk and eggs")])

    response = await client.get("/api/v1/search", params={"q": "zebra"})

    assert response.json() == {"query": "zebra", "notes": [], "documents": []}


async def test_search_rejects_blank_queries(
    client: httpx.AsyncClient, authenticated: None
) -> None:
    response = await client.get("/api/v1/search", params={"q": ""})
    assert response.status_code == 422
