"""Tests for FastAPI router endpoints."""
from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    from app.main import app
    return TestClient(app)


class TestHealthRouter:

    def test_health_returns_ok(self, client):
        """GET /health returns 200 with status ok."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"

    def test_health_includes_uptime(self, client):
        """Health response includes uptime_seconds."""
        response = client.get("/health")
        data = response.json()
        assert "uptime_seconds" in data
        assert isinstance(data["uptime_seconds"], (int, float))

    def test_health_includes_version(self, client):
        """Health response includes version string."""
        response = client.get("/health")
        data = response.json()
        assert "version" in data


class TestCopilotRouter:

    def test_ask_denies_starter_plan(self, client):
        """POST /copilot/ask returns 403 for starter plan."""
        with patch("app.routers.copilot._usage") as mock_usage:
            mock_usage.check_access = AsyncMock(return_value=(False, "Not available on starter"))
            response = client.post(
                "/copilot/ask",
                json={
                    "org_id": "org-1",
                    "user_id": "user-1",
                    "messages": [{"role": "user", "content": "hello"}],
                },
                headers={"X-Org-Plan": "starter"},
            )
        assert response.status_code == 403

    def test_ask_returns_200_for_growth_plan(self, client):
        """POST /copilot/ask returns 200 for growth plan with valid request."""
        from app.models.schemas import CopilotResponse
        mock_response = CopilotResponse(content="Here is your data.", tokens_used=100)

        with patch("app.routers.copilot._usage") as mock_usage, \
             patch("app.routers.copilot._copilot") as mock_copilot:
            mock_usage.check_access = AsyncMock(return_value=(True, "50/200 used"))
            mock_usage.get_model = MagicMock(return_value="claude-haiku-4-5-20251001")
            mock_usage.increment = AsyncMock()
            mock_copilot.chat = AsyncMock(return_value=mock_response)

            response = client.post(
                "/copilot/ask",
                json={
                    "org_id": "org-1",
                    "user_id": "user-1",
                    "messages": [{"role": "user", "content": "What is my pipeline?"}],
                },
                headers={"X-Org-Plan": "growth"},
            )
        assert response.status_code == 200
        assert response.json()["content"] == "Here is your data."

    def test_suggest_actions_returns_3_for_lead(self, client):
        """POST /copilot/suggest-actions returns 3 suggestions for lead entity."""
        response = client.post(
            "/copilot/suggest-actions",
            json={
                "org_id": "org-1",
                "user_id": "user-1",
                "entity_type": "lead",
                "entity_id": "l-1",
                "entity_data": {"name": "Alice"},
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "suggestions" in data
        assert len(data["suggestions"]) <= 3

    def test_suggest_actions_returns_for_ticket(self, client):
        """POST /copilot/suggest-actions returns suggestions for ticket entity."""
        response = client.post(
            "/copilot/suggest-actions",
            json={
                "org_id": "org-1",
                "user_id": "user-1",
                "entity_type": "ticket",
                "entity_id": "t-1",
                "entity_data": {},
            },
        )
        assert response.status_code == 200

    def test_suggest_actions_returns_for_invoice(self, client):
        response = client.post(
            "/copilot/suggest-actions",
            json={
                "org_id": "org-1",
                "user_id": "user-1",
                "entity_type": "invoice",
                "entity_id": "inv-1",
                "entity_data": {},
            },
        )
        assert response.status_code == 200


class TestBriefRouter:

    def test_generate_brief_returns_200(self, client):
        """POST /briefs/generate returns 200 with brief response."""
        from app.models.schemas import BriefResponse, BriefItem
        mock_brief = BriefResponse(
            greeting="Good morning!",
            items=[BriefItem(category="CRM", title="3 stale leads", summary="Follow up", priority="high")],
            generated_at="2026-05-28",
        )

        with patch("app.routers.briefs._brief_service") as mock_svc:
            mock_svc.generate = AsyncMock(return_value=mock_brief)
            response = client.post(
                "/briefs/generate",
                json={"org_id": "org-1", "user_id": "user-1", "role": "ADMIN"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["greeting"] == "Good morning!"
        assert len(data["items"]) == 1

    def test_generate_brief_returns_500_on_service_error(self, client):
        """POST /briefs/generate returns 500 when service raises."""
        with patch("app.routers.briefs._brief_service") as mock_svc:
            mock_svc.generate = AsyncMock(side_effect=Exception("service crashed"))
            response = client.post(
                "/briefs/generate",
                json={"org_id": "org-1", "user_id": "user-1", "role": "ADMIN"},
            )
        assert response.status_code == 500
