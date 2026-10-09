"""Supabase access-token verification.

Supabase can sign user access tokens in one of two ways:

* **Legacy symmetric (HS256)** — signed with the project's JWT secret.
* **Asymmetric (ES256/RS256)** — signed with a private key and verifiable via the
  project's public JWKS endpoint (Supabase's newer, recommended setup).

Rather than assume one, we read the token header's `alg` and verify accordingly.
That keeps the backend correct regardless of how the project is configured.
"""

from __future__ import annotations

from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

from app.core.config import get_settings
from app.schemas.auth import CurrentUser

settings = get_settings()

_bearer_scheme = HTTPBearer(auto_error=False)

_HMAC_ALGORITHMS = {"HS256", "HS384", "HS512"}
_ASYMMETRIC_ALGORITHMS = {"ES256", "ES384", "ES512", "RS256", "RS384", "RS512"}

# Lazily created so importing this module never performs network I/O.
_jwks_client: PyJWKClient | None = None


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = PyJWKClient(settings.supabase_jwks_url, cache_keys=True, lifespan=3600)
    return _jwks_client


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
) -> CurrentUser:
    """FastAPI dependency: verify the Bearer token and return the caller.

    Raises 401 for a missing, malformed, expired, or unverifiable token.
    """
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise _unauthorized("Missing bearer token")

    token = credentials.credentials

    try:
        alg = jwt.get_unverified_header(token).get("alg")

        if alg in _HMAC_ALGORITHMS:
            if not settings.supabase_jwt_secret:
                raise _unauthorized("Server is not configured for symmetric token verification")
            key: object = settings.supabase_jwt_secret
        elif alg in _ASYMMETRIC_ALGORITHMS:
            signing_key = await run_in_threadpool(
                _get_jwks_client().get_signing_key_from_jwt, token
            )
            key = signing_key.key
        else:
            raise _unauthorized("Unsupported token algorithm")

        payload = jwt.decode(
            token,
            key,
            algorithms=[alg],
            audience="authenticated",
            issuer=settings.supabase_issuer,
            options={"require": ["exp", "sub"]},
        )
    except jwt.PyJWTError as exc:
        raise _unauthorized("Invalid or expired token") from exc

    return CurrentUser(id=payload["sub"], email=payload.get("email"), role=payload.get("role"))
