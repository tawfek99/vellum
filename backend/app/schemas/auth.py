"""Auth-related schemas."""

from pydantic import BaseModel


class CurrentUser(BaseModel):
    """The authenticated caller, derived from a verified Supabase access token.

    At this level it is built purely from token claims; the persisted profile
    (name, avatar) is added with the database in Level 6.
    """

    id: str
    email: str | None = None
    role: str | None = None
