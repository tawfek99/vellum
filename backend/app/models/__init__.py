"""ORM models.

Every model module must be imported here so that Alembic's `--autogenerate`
can discover it via `Base.metadata`. Models are added level by level.
"""

from app.models.ai import AIGeneration
from app.models.document import Document, DocumentChunk
from app.models.folder import Folder
from app.models.job import Job
from app.models.note import Note
from app.models.profile import Profile
from app.models.qa import QAMessage

__all__ = [
    "AIGeneration",
    "Document",
    "DocumentChunk",
    "Folder",
    "Job",
    "Note",
    "Profile",
    "QAMessage",
]
