from __future__ import annotations

import asyncio
import base64
import json

import httpx

from backend.app import main

PNG = b"\x89PNG\r\n\x1a\n" + b"decode-ai-test"
EXPLANATION = {
    "title": "A clear idea",
    "summary": "The image shows a simple idea.",
    "key_concepts": ["Concept one", "Concept two"],
    "steps": ["First, observe.", "Then, connect the parts."],
    "example": "A classroom example.",
    "uncertainties": [],
}


def request(method: str, path: str, **kwargs):
    async def send():
        transport = httpx.ASGITransport(app=main.app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.request(method, path, **kwargs)

    return asyncio.run(send())


def test_health_reports_missing_secret(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    response = request("GET", "/api/health")
    assert response.status_code == 503
    assert "GEMINI_API_KEY" in response.json()["detail"]


def test_health_reports_configured_models(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    response = request("GET", "/api/health")
    assert response.status_code == 200
    assert response.json()["primary_model"] == "gemma-4-26b-a4b-it"
    assert response.json()["fallback_model"] == "gemma-4-31b-it"


def test_explain_uses_primary_then_fallback(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    tried = []

    async def fake_call_model(**kwargs):
        tried.append(kwargs["model"])
        if kwargs["model"] == main.PRIMARY_MODEL:
            raise main.UpstreamModelError("simulated primary failure")
        return EXPLANATION

    monkeypatch.setattr(main, "_call_model", fake_call_model)
    response = request(
        "POST",
        "/api/explain",
        data={"question": "What does this show?", "level": "Beginner"},
        files={"image": ("diagram.png", PNG, "image/png")},
    )
    assert response.status_code == 200
    assert response.json() == EXPLANATION
    assert tried == [main.PRIMARY_MODEL, main.FALLBACK_MODEL]


def test_google_request_has_expected_model_and_inline_image(monkeypatch):
    captured = {}
    original_async_client = httpx.AsyncClient

    def handler(request):
        captured["url"] = str(request.url)
        captured["api_key"] = request.headers.get("x-goog-api-key")
        captured["body"] = json.loads(request.content)
        return httpx.Response(
            200,
            json={"candidates": [{"content": {"parts": [{"text": json.dumps(EXPLANATION)}]}}]},
        )

    def mock_async_client(*, timeout):
        return original_async_client(transport=httpx.MockTransport(handler), timeout=timeout)

    monkeypatch.setattr(main.httpx, "AsyncClient", mock_async_client)

    async def call():
        return await main._call_model(
            model=main.PRIMARY_MODEL,
            api_key="test-key",
            image_bytes=PNG,
            mime_type="image/png",
            system_instruction="Return JSON.",
            prompt="Explain this.",
            max_output_tokens=500,
            kind="explanation",
        )

    result = asyncio.run(call())
    assert result == EXPLANATION
    assert captured["url"].endswith("/models/gemma-4-26b-a4b-it:generateContent")
    assert captured["api_key"] == "test-key"
    inline_image = captured["body"]["contents"][0]["parts"][1]["inlineData"]
    assert inline_image["mimeType"] == "image/png"
    assert inline_image["data"] == base64.b64encode(PNG).decode("ascii")


def test_rejects_image_with_mismatched_signature(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    response = request(
        "POST",
        "/api/explain",
        data={"question": "What is this?", "level": "Beginner"},
        files={"image": ("fake.png", b"not an image", "image/png")},
    )
    assert response.status_code == 415
    assert "contents" in response.json()["detail"]


def test_rejects_oversized_image(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(main, "MAX_IMAGE_BYTES", 8)
    response = request(
        "POST",
        "/api/explain",
        data={"question": "What is this?", "level": "Beginner"},
        files={"image": ("large.png", PNG, "image/png")},
    )
    assert response.status_code == 413


def test_quiz_output_contract():
    valid = {
        "questions": [
            {
                "question": f"Question {i}?",
                "options": ["A", "B", "C", "D"],
                "correct_index": 0,
                "explanation": "A is supported by the image.",
            }
            for i in range(1, 4)
        ]
    }
    assert main._validate_output(valid, "quiz") == valid
    invalid = {"questions": valid["questions"][:2]}
    try:
        main._validate_output(invalid, "quiz")
    except ValueError as error:
        assert "exactly three" in str(error)
    else:
        raise AssertionError("A two-question quiz should be rejected")
