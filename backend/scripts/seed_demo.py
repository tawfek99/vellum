"""Create (or refresh) the demo account and seed it with sample content.

Run from `backend/`:

    .\\.venv\\Scripts\\python.exe -m scripts.seed_demo

It is idempotent: the demo user's folders, notes and documents are wiped and
rebuilt on every run, so the demo always looks the same.
"""

import asyncio
import uuid

import httpx
import pymupdf
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.document import Document, DocumentChunk
from app.models.folder import Folder
from app.models.note import Note
from app.models.profile import Profile
from app.services import storage
from app.services.pdf.chunker import chunk_text

settings = get_settings()

PYTHON_PAGES = [
    "Python Basics\n\n"
    "Python is a high-level, interpreted programming language known for its "
    "readability. It uses indentation to define code blocks instead of braces. "
    "Variables are dynamically typed, and the standard library is extensive.",
    "Data Structures\n\n"
    "Lists are ordered and mutable. Tuples are ordered and immutable. "
    "Dictionaries map keys to values with average O(1) lookup. Sets store unique "
    "elements. Functions are defined with def and can accept default and keyword "
    "arguments.",
    "OOP and Modules\n\n"
    "Classes bundle state and behavior. Inheritance lets a class reuse another "
    "class's methods. Modules group related code, and pip installs third-party "
    "packages. Virtual environments isolate dependencies per project.",
]

BIOLOGY_PAGES = [
    "Cell Basics\n\n"
    "Cells are the basic unit of life. Prokaryotic cells lack a nucleus; "
    "eukaryotic cells have membrane-bound organelles. The plasma membrane "
    "controls what enters and leaves the cell.",
    "Organelles\n\n"
    "Mitochondria produce ATP through cellular respiration. Ribosomes synthesize "
    "proteins. The nucleus stores DNA. The endoplasmic reticulum folds and "
    "transports proteins, and the Golgi apparatus packages them.",
    "Cell Division\n\n"
    "Mitosis produces two genetically identical daughter cells and supports "
    "growth and repair. Meiosis produces gametes with half the chromosome number "
    "and introduces genetic variation.",
]


def make_pdf(pages: list[str]) -> bytes:
    pdf = pymupdf.open()
    for text in pages:
        page = pdf.new_page()
        page.insert_textbox(
            pymupdf.Rect(60, 60, 535, 782), text, fontsize=11, lineheight=1.4
        )
    data = pdf.tobytes()
    pdf.close()
    return data


async def ensure_demo_user() -> uuid.UUID:
    key = settings.supabase_service_role_key
    if not key:
        raise SystemExit("SUPABASE_SERVICE_ROLE_KEY is not set in backend/.env")

    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    base = f"{settings.supabase_url}/auth/v1/admin/users"
    payload = {
        "email": settings.demo_email,
        "password": settings.demo_password,
        "email_confirm": True,
        "user_metadata": {"full_name": "Demo Student"},
    }

    async with httpx.AsyncClient(timeout=30) as client:
        created = await client.post(base, headers=headers, json=payload)
        if created.status_code in (200, 201):
            return uuid.UUID(created.json()["id"])

        # Already exists: find the user and refresh its password.
        listing = await client.get(base, headers=headers, params={"per_page": 1000})
        listing.raise_for_status()
        body = listing.json()
        users = body.get("users", body) if isinstance(body, dict) else body
        match = next((user for user in users if user.get("email") == settings.demo_email), None)
        if match is None:
            created.raise_for_status()
            raise SystemExit("Could not create or find the demo user")

        user_id = uuid.UUID(match["id"])
        updated = await client.put(f"{base}/{user_id}", headers=headers, json=payload)
        updated.raise_for_status()
        return user_id


async def _add_document(
    db: AsyncSession,
    user_id: uuid.UUID,
    folder_id: uuid.UUID,
    title: str,
    file_name: str,
    pages: list[str],
) -> None:
    document_id = uuid.uuid4()
    storage_path = f"{user_id}/{document_id}.pdf"
    pdf_bytes = make_pdf(pages)
    await storage.upload_object(storage_path, pdf_bytes, "application/pdf")

    marked_text = "\n\n".join(
        f"[[page {index + 1}]]\n{text.strip()}" for index, text in enumerate(pages)
    )
    db.add(
        Document(
            id=document_id,
            user_id=user_id,
            folder_id=folder_id,
            title=title,
            file_name=file_name,
            storage_path=storage_path,
            mime_type="application/pdf",
            file_size_bytes=len(pdf_bytes),
            page_count=len(pages),
            processing_status="ready",
            text_content=marked_text,
        )
    )
    for index, chunk in enumerate(chunk_text(marked_text)):
        db.add(
            DocumentChunk(
                document_id=document_id,
                chunk_index=index,
                content=chunk,
                token_count=len(chunk) // 4,
            )
        )


CONTENT = [
    # (folder name, title, content, pinned)
    (
        "Computer Science",
        "Big-O cheatsheet",
        "**O(1)** constant\n\n**O(log n)** binary search\n\n**O(n)** linear scan\n\n"
        "**O(n log n)** sorting\n\n**O(n²)** nested loops",
        True,
    ),
    (
        "Computer Science",
        "Graph algorithms",
        "BFS uses a queue and finds shortest paths in unweighted graphs.\n\n"
        "DFS uses a stack/recursion and is useful for cycle detection and topological sort.",
        False,
    ),
    (
        "Biology",
        "Cell structures",
        "Mitochondria → ATP\n\nRibosomes → protein synthesis\n\n"
        "Nucleus → DNA storage\n\nGolgi apparatus → packaging",
        False,
    ),
    (
        "Reading List",
        "Books to read",
        "- Designing Data-Intensive Applications\n- The Pragmatic Programmer\n- Clean Code",
        False,
    ),
    (
        None,
        "Project ideas",
        "Build a spaced-repetition app.\n\nAdd OCR to scanned PDFs.\n\nExport notes to Markdown.",
        False,
    ),
]


async def seed(user_id: uuid.UUID) -> None:
    async with SessionLocal() as db:
        profile = await db.get(Profile, user_id)
        if profile is None:
            db.add(
                Profile(
                    id=user_id, email=settings.demo_email, full_name="Demo Student"
                )
            )
        else:
            profile.email = settings.demo_email
            profile.full_name = "Demo Student"

        old_documents = (
            (await db.execute(select(Document).where(Document.user_id == user_id)))
            .scalars()
            .all()
        )
        for document in old_documents:
            try:
                await storage.delete_object(document.storage_path)
            except Exception:  # noqa: BLE001 - best effort cleanup
                pass

        await db.execute(delete(Document).where(Document.user_id == user_id))
        await db.execute(delete(Note).where(Note.user_id == user_id))
        await db.execute(delete(Folder).where(Folder.user_id == user_id))
        await db.commit()

        folders = {
            name: Folder(user_id=user_id, name=name)
            for name in ("Computer Science", "Biology", "Reading List")
        }
        db.add_all(list(folders.values()))
        await db.flush()

        for folder_name, title, content, pinned in CONTENT:
            db.add(
                Note(
                    user_id=user_id,
                    folder_id=folders[folder_name].id if folder_name else None,
                    title=title,
                    content=content,
                    is_pinned=pinned,
                )
            )

        await _add_document(
            db,
            user_id,
            folders["Computer Science"].id,
            "Python Crash Course",
            "python-crash-course.pdf",
            PYTHON_PAGES,
        )
        await _add_document(
            db,
            user_id,
            folders["Biology"].id,
            "Cell Biology Review",
            "cell-biology-review.pdf",
            BIOLOGY_PAGES,
        )

        await db.commit()

        folders_total = len(
            (await db.execute(select(Folder).where(Folder.user_id == user_id)))
            .scalars()
            .all()
        )
        notes_total = len(
            (await db.execute(select(Note).where(Note.user_id == user_id))).scalars().all()
        )
        documents_total = len(
            (await db.execute(select(Document).where(Document.user_id == user_id)))
            .scalars()
            .all()
        )

    print(
        f"Demo seeded: {folders_total} folders · {notes_total} notes · "
        f"{documents_total} documents"
    )


async def main() -> None:
    if not settings.supabase_url:
        raise SystemExit("SUPABASE_URL is not set in backend/.env")
    user_id = await ensure_demo_user()
    await seed(user_id)
    print(f"Demo login: {settings.demo_email} / {settings.demo_password}")


if __name__ == "__main__":
    asyncio.run(main())
