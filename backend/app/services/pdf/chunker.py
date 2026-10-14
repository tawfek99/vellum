"""Text chunking for retrieval (Q&A / flashcards at later levels)."""

DEFAULT_CHUNK_SIZE = 1200
DEFAULT_OVERLAP = 200


def chunk_text(
    text: str,
    *,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_OVERLAP,
) -> list[str]:
    """Split text into overlapping chunks, preferring paragraph/sentence breaks.

    Sizes are in characters (a rough proxy for tokens, ~4 chars/token).
    """
    cleaned = "\n".join(line.rstrip() for line in text.splitlines()).strip()
    if not cleaned:
        return []

    chunks: list[str] = []
    start = 0
    length = len(cleaned)

    while start < length:
        end = min(start + chunk_size, length)
        if end < length:
            floor = start + chunk_size // 2
            boundary = cleaned.rfind("\n", floor, end)
            if boundary == -1:
                boundary = cleaned.rfind(". ", floor, end)
            if boundary != -1:
                end = boundary + 1

        chunk = cleaned[start:end].strip()
        if chunk:
            chunks.append(chunk)

        if end >= length:
            break
        start = max(end - overlap, start + 1)

    return chunks
