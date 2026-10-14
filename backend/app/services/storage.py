"""Supabase Storage access (service-role, server-side only).

Storage is abstracted here so the provider could be swapped later without
touching the documents service.
"""

import httpx

from app.core.config import get_settings

settings = get_settings()


def _auth_headers() -> dict[str, str]:
    key = settings.supabase_service_role_key
    return {"apikey": key, "Authorization": f"Bearer {key}"}


def _object_url(path: str) -> str:
    return f"{settings.supabase_url}/storage/v1/object/{settings.storage_bucket}/{path}"


async def upload_object(path: str, data: bytes, content_type: str) -> None:
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            _object_url(path),
            headers={**_auth_headers(), "Content-Type": content_type, "x-upsert": "true"},
            content=data,
        )
        response.raise_for_status()


async def download_object(path: str) -> bytes:
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.get(_object_url(path), headers=_auth_headers())
        response.raise_for_status()
        return response.content


async def delete_object(path: str) -> None:
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.delete(_object_url(path), headers=_auth_headers())
        if response.status_code not in (200, 204, 404):
            response.raise_for_status()


async def create_signed_url(path: str, expires_in: int = 3600) -> str:
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{settings.supabase_url}/storage/v1/object/sign/"
            f"{settings.storage_bucket}/{path}",
            headers={**_auth_headers(), "Content-Type": "application/json"},
            json={"expiresIn": expires_in},
        )
        response.raise_for_status()
        signed = response.json()["signedURL"]
        return f"{settings.supabase_url}/storage/v1{signed}"
