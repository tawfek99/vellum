"""Prompt templates. Kept separate so they can be tuned/tested independently."""

SUMMARY_SYSTEM = (
    "You are a careful study assistant. You summarize documents accurately and "
    "concisely, and you cite page numbers when the source includes page markers."
)


def summary_user_prompt(text: str) -> str:
    return f"""Summarize the document below for a student.

Return ONLY valid JSON (no markdown fences) with exactly this shape:
{{
  "summary": "a clear, concise paragraph (about 120-180 words)",
  "key_points": [
    {{"text": "one important takeaway", "page": 3}}
  ]
}}

Rules:
- Give 4 to 7 key points, each a single sentence.
- Use the page markers like [[page 3]] in the document to set each point's "page" number.
- If a page cannot be determined, use null.
- Do not invent facts that are not in the document.

DOCUMENT:
{text}
"""
