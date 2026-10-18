"""Provider for any OpenAI-compatible chat-completions API.

DeepSeek, OpenAI, and Google Gemini (via its OpenAI-compatible endpoint) all
work through this one adapter — only base URL / model / key differ.
"""

import asyncio
import json
import re

import httpx
from pydantic import BaseModel, ValidationError

from app.ai.base import KeyPoint, SummaryResult
from app.ai.prompts import SUMMARY_SYSTEM, summary_user_prompt

_FENCE = re.compile(r"^```[a-zA-Z]*\s*|\s*```$", re.MULTILINE)


class _KeyPointPayload(BaseModel):
    text: str
    page: int | None = None


class _SummaryPayload(BaseModel):
    summary: str
    key_points: list[_KeyPointPayload] = []


def _extract_json(raw: str) -> dict[str, object] | None:
    cleaned = _FENCE.sub("", raw.strip())
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end > start:
        try:
            return json.loads(cleaned[start : end + 1])
        except json.JSONDecodeError:
            return None
    return None


class OpenAICompatibleProvider:
    def __init__(self, *, base_url: str, api_key: str, model: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.model = model

    async def _complete(self, *, system: str, user: str) -> str:
        last_error: Exception | None = None
        for attempt in range(2):
            try:
                async with httpx.AsyncClient(timeout=90) as client:
                    response = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers={
                            "Authorization": f"Bearer {self.api_key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": self.model,
                            "temperature": 0.3,
                            "messages": [
                                {"role": "system", "content": system},
                                {"role": "user", "content": user},
                            ],
                        },
                    )
                if response.status_code in (429, 503) and attempt == 0:
                    await asyncio.sleep(1.5)
                    continue
                response.raise_for_status()
                data = response.json()
                return str(data["choices"][0]["message"]["content"])
            except httpx.HTTPError as exc:
                last_error = exc
                if attempt == 0:
                    await asyncio.sleep(1.0)
                    continue
                raise
        raise last_error or RuntimeError("AI request failed")

    async def summarize_document(self, text: str) -> SummaryResult:
        raw = await self._complete(system=SUMMARY_SYSTEM, user=summary_user_prompt(text))
        payload = _extract_json(raw)
        if payload is not None:
            try:
                parsed = _SummaryPayload.model_validate(payload)
                return SummaryResult(
                    summary=parsed.summary.strip(),
                    key_points=[
                        KeyPoint(text=point.text.strip(), page=point.page)
                        for point in parsed.key_points
                        if point.text.strip()
                    ],
                )
            except ValidationError:
                pass
        # Fall back to a plain-text summary if the model didn't return JSON.
        return SummaryResult(summary=raw.strip())
