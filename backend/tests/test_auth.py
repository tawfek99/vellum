import time

import httpx
import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec

from app.core import security
from app.core.config import Settings

ISSUER = "https://project.supabase.co/auth/v1"
# >= 32 bytes so PyJWT doesn't warn about short HMAC keys.
HMAC_SECRET = "test-secret-value-that-is-long-enough-for-hs256"


class _FakeSigningKey:
    def __init__(self, key: object) -> None:
        self.key = key


class _FakeJWKClient:
    def __init__(self, key: object) -> None:
        self._key = key

    def get_signing_key_from_jwt(self, _token: str) -> _FakeSigningKey:
        return _FakeSigningKey(self._key)


@pytest.fixture
def settings_override(monkeypatch: pytest.MonkeyPatch) -> Settings:
    """Deterministic settings so issuer/secret match the test tokens."""
    test_settings = Settings(
        supabase_url="https://project.supabase.co",
        supabase_jwt_secret=HMAC_SECRET,
    )
    monkeypatch.setattr(security, "settings", test_settings)
    return test_settings


@pytest.fixture
def ec_private_key(monkeypatch: pytest.MonkeyPatch) -> ec.EllipticCurvePrivateKey:
    """An ES256 key pair whose public half is returned by the fake JWKS client."""
    private_key = ec.generate_private_key(ec.SECP256R1())
    monkeypatch.setattr(
        security, "_get_jwks_client", lambda: _FakeJWKClient(private_key.public_key())
    )
    return private_key


def _make_token(
    key: object,
    *,
    algorithm: str,
    iss: str = ISSUER,
    sub: str = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    email: str = "ada@example.com",
    expires_in: int = 3600,
) -> str:
    now = int(time.time())
    payload = {
        "sub": sub,
        "email": email,
        "role": "authenticated",
        "aud": "authenticated",
        "iss": iss,
        "iat": now,
        "exp": now + expires_in,
    }
    return jwt.encode(payload, key, algorithm=algorithm)


async def test_me_returns_identity_for_es256_token(
    client: httpx.AsyncClient,
    settings_override: Settings,
    ec_private_key: ec.EllipticCurvePrivateKey,
) -> None:
    token = _make_token(ec_private_key, algorithm="ES256")

    response = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
    assert body["email"] == "ada@example.com"


async def test_me_returns_identity_for_hs256_token(
    client: httpx.AsyncClient, settings_override: Settings
) -> None:
    token = _make_token(HMAC_SECRET, algorithm="HS256")

    response = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["id"] == "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"


async def test_me_requires_authentication(
    client: httpx.AsyncClient, settings_override: Settings
) -> None:
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401


async def test_me_rejects_tampered_token(
    client: httpx.AsyncClient,
    settings_override: Settings,
    ec_private_key: ec.EllipticCurvePrivateKey,
) -> None:
    token = _make_token(ec_private_key, algorithm="ES256")

    response = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}tampered"}
    )
    assert response.status_code == 401


async def test_me_rejects_expired_token(
    client: httpx.AsyncClient,
    settings_override: Settings,
    ec_private_key: ec.EllipticCurvePrivateKey,
) -> None:
    token = _make_token(ec_private_key, algorithm="ES256", expires_in=-60)

    response = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


async def test_me_rejects_wrong_issuer(
    client: httpx.AsyncClient,
    settings_override: Settings,
    ec_private_key: ec.EllipticCurvePrivateKey,
) -> None:
    token = _make_token(
        ec_private_key, algorithm="ES256", iss="https://evil.example/auth/v1"
    )

    response = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
