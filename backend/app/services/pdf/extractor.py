"""PDF text extraction via PyMuPDF."""

from dataclasses import dataclass

import pymupdf


@dataclass(frozen=True)
class ExtractionResult:
    page_count: int
    text: str


def extract_text(data: bytes) -> ExtractionResult:
    """Extract plain text + page count from PDF bytes.

    Returns empty text for scanned PDFs that have no text layer (the caller
    flags those for OCR rather than failing silently).
    """
    with pymupdf.open(stream=data, filetype="pdf") as document:
        pages = [page.get_text("text") for page in document]
        return ExtractionResult(page_count=document.page_count, text="\n".join(pages).strip())
