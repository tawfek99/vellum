import pymupdf

from app.services.pdf.chunker import chunk_text
from app.services.pdf.extractor import extract_text


def make_pdf(text: str = "Hello") -> bytes:
    document = pymupdf.open()
    page = document.new_page()
    if text:
        page.insert_text((72, 72), text)
    data = document.tobytes()
    document.close()
    return data


def test_extract_text_reads_page() -> None:
    result = extract_text(make_pdf("Hello extraction"))
    assert result.page_count == 1
    assert "Hello extraction" in result.text


def test_extract_text_blank_pdf_has_no_text() -> None:
    result = extract_text(make_pdf(""))
    assert result.page_count == 1
    assert result.text.strip() == ""


def test_chunk_text_empty() -> None:
    assert chunk_text("   \n  ") == []


def test_chunk_text_short_is_single_chunk() -> None:
    assert len(chunk_text("A short paragraph about Moby Dick.")) == 1


def test_chunk_text_splits_long_text() -> None:
    text = "\n\n".join(f"Paragraph {index} " + "word " * 60 for index in range(20))
    chunks = chunk_text(text, chunk_size=600, overlap=100)
    assert len(chunks) > 1
    assert all(chunk.strip() for chunk in chunks)
