import uuid

import httpx

from app.core.security import get_current_user
from app.main import app
from app.schemas.auth import CurrentUser

OTHER_USER_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")


def as_other_user() -> None:
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        id=str(OTHER_USER_ID), email="bob@example.com", role="authenticated"
    )


async def test_notes_require_authentication(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/notes")
    assert response.status_code == 401


async def test_create_and_list_notes(client: httpx.AsyncClient, authenticated: None) -> None:
    created = await client.post("/api/v1/notes", json={"title": "First", "content": "hello"})
    assert created.status_code == 201
    body = created.json()
    assert body["title"] == "First"
    assert body["content"] == "hello"
    assert body["folder_id"] is None
    assert body["is_pinned"] is False

    listing = await client.get("/api/v1/notes")
    assert listing.status_code == 200
    data = listing.json()
    assert data["total"] == 1
    assert data["page"] == 1
    assert data["page_size"] == 50
    assert [note["title"] for note in data["items"]] == ["First"]


async def test_blank_title_defaults_to_untitled(
    client: httpx.AsyncClient, authenticated: None
) -> None:
    created = await client.post("/api/v1/notes", json={"title": "   "})
    assert created.json()["title"] == "Untitled"


async def test_notes_can_be_filtered_by_folder(
    client: httpx.AsyncClient, authenticated: None
) -> None:
    folder = (await client.post("/api/v1/folders", json={"name": "Work"})).json()
    await client.post("/api/v1/notes", json={"title": "In folder", "folder_id": folder["id"]})
    await client.post("/api/v1/notes", json={"title": "Unfiled"})

    response = await client.get("/api/v1/notes", params={"folder_id": folder["id"]})
    assert [note["title"] for note in response.json()["items"]] == ["In folder"]


async def test_notes_are_paginated(client: httpx.AsyncClient, authenticated: None) -> None:
    for index in range(3):
        await client.post("/api/v1/notes", json={"title": f"Note {index}"})

    page1 = (await client.get("/api/v1/notes", params={"page": 1, "page_size": 2})).json()
    assert page1["total"] == 3
    assert len(page1["items"]) == 2

    page2 = (await client.get("/api/v1/notes", params={"page": 2, "page_size": 2})).json()
    assert len(page2["items"]) == 1


async def test_notes_search(client: httpx.AsyncClient, authenticated: None) -> None:
    await client.post("/api/v1/notes", json={"title": "Groceries", "content": "milk and eggs"})
    await client.post("/api/v1/notes", json={"title": "Ideas", "content": "build a note app"})

    response = await client.get("/api/v1/notes", params={"search": "eggs"})
    assert [note["title"] for note in response.json()["items"]] == ["Groceries"]


async def test_pinned_notes_sort_first(client: httpx.AsyncClient, authenticated: None) -> None:
    await client.post("/api/v1/notes", json={"title": "Normal"})
    pinned = (await client.post("/api/v1/notes", json={"title": "Important"})).json()
    await client.patch(f"/api/v1/notes/{pinned['id']}", json={"is_pinned": True})

    listing = (await client.get("/api/v1/notes")).json()
    assert [note["title"] for note in listing["items"]] == ["Important", "Normal"]


async def test_update_and_delete_note(client: httpx.AsyncClient, authenticated: None) -> None:
    note = (await client.post("/api/v1/notes", json={"title": "Draft"})).json()

    updated = await client.patch(
        f"/api/v1/notes/{note['id']}", json={"title": "Final", "is_pinned": True}
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Final"
    assert updated.json()["is_pinned"] is True

    deleted = await client.delete(f"/api/v1/notes/{note['id']}")
    assert deleted.status_code == 204

    missing = await client.get(f"/api/v1/notes/{note['id']}")
    assert missing.status_code == 404


async def test_notes_are_scoped_per_user(client: httpx.AsyncClient, authenticated: None) -> None:
    note = (await client.post("/api/v1/notes", json={"title": "Private"})).json()

    as_other_user()

    assert (await client.get(f"/api/v1/notes/{note['id']}")).status_code == 404
    assert (await client.get("/api/v1/notes")).json()["total"] == 0


async def test_cannot_file_note_into_another_users_folder(
    client: httpx.AsyncClient, authenticated: None
) -> None:
    folder = (await client.post("/api/v1/folders", json={"name": "Mine"})).json()

    as_other_user()

    response = await client.post(
        "/api/v1/notes", json={"title": "Sneaky", "folder_id": folder["id"]}
    )
    assert response.status_code == 404
