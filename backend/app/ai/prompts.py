"""Prompt templates. Kept separate so they can be tuned/tested independently."""

SUMMARY_SYSTEM = (
    "You are a careful study assistant. You summarize documents accurately and "
    "concisely, and you cite page numbers when the source includes page markers."
)

QA_SYSTEM = (
    "You are a careful study assistant. You answer questions using only the "
    "document excerpts you are given, and you cite page numbers when the source "
    "includes page markers. If the excerpts do not contain the answer, say so "
    "plainly instead of guessing."
)

FLASHCARDS_SYSTEM = (
    "You are a careful study assistant. You turn documents into accurate, "
    "concise flashcards grounded strictly in the source material."
)

QUIZ_SYSTEM = (
    "You are a careful study assistant. You write accurate multiple-choice quiz "
    "questions that are grounded strictly in the source material."
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


def qa_user_prompt(question: str, context: str, history: list[dict[str, str]]) -> str:
    if history:
        turns = "\n".join(f"{turn['role'].upper()}: {turn['content']}" for turn in history)
    else:
        turns = "(no earlier messages)"

    return f"""Answer the user's question using only the document excerpts below.

Return ONLY valid JSON (no markdown fences) with exactly this shape:
{{
  "answer": "a clear, concise answer (a short paragraph at most)",
  "pages": [1, 2]
}}

Rules:
- Base the answer only on the excerpts; do not use outside knowledge.
- If the answer is not in the excerpts, say you couldn't find it in the document.
- Use the page markers like [[page 3]] to choose the page numbers for "pages".
- If no page can be determined, return an empty list.
- Keep the answer focused and do not repeat the question.

CONVERSATION SO FAR:
{turns}

DOCUMENT EXCERPTS:
{context}

QUESTION:
{question}
"""


def flashcards_user_prompt(text: str) -> str:
    return f"""Create study flashcards from the document below.

Return ONLY valid JSON (no markdown fences) with exactly this shape:
{{
  "cards": [
    {{"front": "a question or term", "back": "a concise answer or definition"}}
  ]
}}

Rules:
- Create 8 to 12 cards.
- One idea per card; keep fronts short and backs to one or two sentences.
- Cover the most important concepts, terms, and facts.
- Do not invent facts that are not in the document.

DOCUMENT:
{text}
"""


def quiz_user_prompt(text: str) -> str:
    return f"""Create a multiple-choice quiz from the document below.

Return ONLY valid JSON (no markdown fences) with exactly this shape:
{{
  "questions": [
    {{
      "question": "the question",
      "options": ["option 1", "option 2", "option 3", "option 4"],
      "answer_index": 0,
      "explanation": "why the answer is correct"
    }}
  ]
}}

Rules:
- Create 5 to 8 questions.
- Exactly 4 options per question.
- "answer_index" is the 0-based index of the correct option (0-3).
- Only one option is correct; the others should be plausible.
- Base every question on the document; do not invent facts.

DOCUMENT:
{text}
"""
