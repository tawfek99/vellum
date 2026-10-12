import uuid

import httpx

from app.core.security import get_current_user
from app.main import app
from app.schemas.auth import CurrentUser

OTHER_USER_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")


async def test_folders_require_authentication(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/folders")
    assert response.status_code == 401


async def test_create_and_list_folders(
    client: httpx.AsyncClient, authenticated: None
) -> None:
    create = await client.post("/api/v1/folders", json={"name": "Research"})
    assert create.status_code == 201
    assert create.json()["name"] == "Research"
    assert create.json()["parent_id"] is None

    listing = await client.get("/api/v1/folders")
    assert listing.status_code == 200
    assert [folder["name"] for folder in listing.json()] == ["Research"]


async def test_duplicate_name_is_rejected(
    client: httpx.AsyncClient, authenticated: None
) -> None:
    await client.post("/api/v1/folders", json={"name": "Notes"})
    duplicate = await client.post("/api/v1/folders", json={"name": "Notes"})
    assert duplicate.status_code == 409


async def test_nested_folder_can_be_renamed(
    client: httpx.AsyncClient, authenticated: None
) -> None:
    parent = (await client.post("/api/v1/folders", json={"name": "Parent"})).json()
    child_response = await client.post(
        "/api/v1/folders", json={"name": "Child", "parent_id": parent["id"]}
    )
    assert child_response.status_code == 201
    child = child_response.json()
    assert child["parent_id"] == parent["id"]

    renamed = await client.patch(f"/api/v1/folders/{child['id']}", json={"name": "Renamed"})
    assert renamed.status_code == 200
    assert renamed.json()["name"] == "Renamed"


async def test_delete_moves_children_up(
    client: httpx.AsyncClient, authenticated: None
) -> None:
    parent = (await client.post("/api/v1/folders", json={"name": "Parent"})).json()
    child = (
        await client.post("/api/v1/folders", json={"name": "Child", "parent_id": parent["id"]})
    ).json()

    deleted = await client.delete(f"/api/v1/folders/{parent['id']}")
    assert deleted.status_code == 204

    child_after = await client.get(f"/api/v1/folders/{child['id']}")
    assert child_after.status_code == 200
    assert child_after.json()["parent_id"] is None


async def test_cannot_move_folder_into_its_own_descendant(
    client: httpx.AsyncClient, authenticated: None
) -> None:
    parent = (await client.post("/api/v1/folders", json={"name": "Parent"})).json()
    child = (
        await client.post("/api/v1/folders", json={"name": "Child", "parent_id": parent["id"]})
    ).json()

    response = await client.patch(
        f"/api/v1/folders/{parent['id']}", json={"parent_id": child["id"]}
    )
    assert response.status_code == 400


async def test_folders_are_scoped_per_user(
    client: httpx.AsyncClient, authenticated: None
) -> None:
    created = await client.post("/api/v1/folders", json={"name": "Private"})
    folder_id = created.json()["id"]

    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        id=str(OTHER_USER_ID), email="bob@example.com", role="authenticated"
    )
    response = await client.get(f"/api/v1/folders/{folder_id}")
    assert response.status_code == 404


async def test_folder_list_includes_note_count(
    client: httpx.AsyncClient, authenticated: None
) -> None:
    folder = (await client.post("/api/v1/folders", json={"name": "Work"})).json()
    await client.post("/api/v1/notes", json={"title": "A", "folder_id": folder["id"]})
    await client.post("/api/v1/notes", json={"title": "B", "folder_id": folder["id"]})
    await client.post("/api/v1/notes", json={"title": "Unfiled"})

    listing = (await client.get("/api/v1/folders")).json()
    assert listing[0]["name"] == "Work"
    assert listing[0]["note_count"] == 2
