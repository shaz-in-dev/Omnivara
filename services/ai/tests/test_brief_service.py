"""Tests for BriefService — daily AI brief generation from live org data."""
from __future__ import annotations

import json
import pytest
from datetime import date
from unittest.mock import AsyncMock, MagicMock, patch


def make_anthropic_response(json_text: str):
    msg = MagicMock()
    msg.content = [MagicMock(text=json_text)]
    return msg


class TestBriefService:

    @pytest.mark.asyncio
    async def test_generate_returns_brief_response(self, mock_db_pool, mock_anthropic_client):
        """generate() returns a BriefResponse with greeting and items."""
        from app.services.brief_service import BriefService
        from app.models.schemas import BriefRequest, BriefResponse

        pool, conn = mock_db_pool
        brief_json = json.dumps({
            "greeting": "Good morning!",
            "items": [
                {
                    "category": "Finance",
                    "title": "2 overdue invoices",
                    "summary": "Collect payment",
                    "priority": "high",
                    "action_url": "/finance",
                }
            ],
        })
        mock_anthropic_client.messages.create = AsyncMock(
            return_value=make_anthropic_response(brief_json)
        )

        with patch("app.services.brief_service.get_pool", AsyncMock(return_value=pool)), \
             patch("app.services.brief_service._client", mock_anthropic_client):
            svc = BriefService()
            result = await svc.generate(BriefRequest(org_id="org-1", user_id="user-1", role="ADMIN"))

        assert isinstance(result, BriefResponse)
        assert result.greeting == "Good morning!"
        assert len(result.items) == 1
        assert result.items[0].category == "Finance"

    @pytest.mark.asyncio
    async def test_generate_uses_today_as_default_date(self, mock_db_pool, mock_anthropic_client):
        """generated_at should be today's date."""
        from app.services.brief_service import BriefService
        from app.models.schemas import BriefRequest

        pool, _ = mock_db_pool
        mock_anthropic_client.messages.create = AsyncMock(
            return_value=make_anthropic_response('{"greeting": "Hi!", "items": []}')
        )

        with patch("app.services.brief_service.get_pool", AsyncMock(return_value=pool)), \
             patch("app.services.brief_service._client", mock_anthropic_client):
            svc = BriefService()
            result = await svc.generate(BriefRequest(org_id="org-1", user_id="u", role="SALES"))

        assert result.generated_at == date.today().isoformat()

    @pytest.mark.asyncio
    async def test_generate_falls_back_when_api_raises(self, mock_db_pool, mock_anthropic_client):
        """Falls back to fallback brief when Anthropic API raises."""
        from app.services.brief_service import BriefService
        from app.models.schemas import BriefRequest

        pool, _ = mock_db_pool
        mock_anthropic_client.messages.create = AsyncMock(side_effect=Exception("API timeout"))

        with patch("app.services.brief_service.get_pool", AsyncMock(return_value=pool)), \
             patch("app.services.brief_service._client", mock_anthropic_client):
            svc = BriefService()
            result = await svc.generate(BriefRequest(org_id="org-1", user_id="u", role="FINANCE"))

        assert result.items[0].category == "System"

    @pytest.mark.asyncio
    async def test_generate_falls_back_when_db_unavailable(self, mock_anthropic_client):
        """Falls back gracefully when DB is unavailable."""
        from app.services.brief_service import BriefService
        from app.models.schemas import BriefRequest

        mock_anthropic_client.messages.create = AsyncMock(
            return_value=make_anthropic_response('{"greeting": "Hi", "items": []}')
        )

        with patch("app.services.brief_service.get_pool", AsyncMock(side_effect=Exception("DB down"))), \
             patch("app.services.brief_service._client", mock_anthropic_client):
            svc = BriefService()
            result = await svc.generate(BriefRequest(org_id="org-1", user_id="u", role="ADMIN"))

        # Should still get a valid response (fallback context)
        assert result.greeting is not None

    @pytest.mark.asyncio
    async def test_generate_strips_markdown_fences(self, mock_db_pool, mock_anthropic_client):
        """Strips ```json ... ``` fences from API response before parsing."""
        from app.services.brief_service import BriefService
        from app.models.schemas import BriefRequest

        pool, _ = mock_db_pool
        wrapped = '```json\n{"greeting": "Hello!", "items": []}\n```'
        mock_anthropic_client.messages.create = AsyncMock(
            return_value=make_anthropic_response(wrapped)
        )

        with patch("app.services.brief_service.get_pool", AsyncMock(return_value=pool)), \
             patch("app.services.brief_service._client", mock_anthropic_client):
            svc = BriefService()
            result = await svc.generate(BriefRequest(org_id="org-1", user_id="u", role="ADMIN"))

        assert result.greeting == "Hello!"

    def test_role_prompt_returns_string_for_known_roles(self):
        """_role_prompt returns non-empty string for all known roles."""
        from app.services.brief_service import _role_prompt
        for role in ["ADMIN", "SALES", "SUPPORT", "FINANCE", "HR"]:
            prompt = _role_prompt(role)
            assert isinstance(prompt, str)
            assert len(prompt) > 5

    def test_role_prompt_case_insensitive(self):
        """_role_prompt handles lowercase role names."""
        from app.services.brief_service import _role_prompt
        result = _role_prompt("admin")
        assert isinstance(result, str)
        assert len(result) > 0

    def test_role_prompt_falls_back_for_unknown_role(self):
        """Unknown role returns generic fallback prompt."""
        from app.services.brief_service import _role_prompt
        result = _role_prompt("UNKNOWN_ROLE_XYZ")
        assert isinstance(result, str)

    def test_build_context_summary_includes_revenue(self):
        """_build_context_summary includes revenue when present."""
        from app.services.brief_service import _build_context_summary
        data = {
            "monthly_revenue": 15000,
            "pipeline_count": 5,
            "pipeline_value": 80000,
            "overdue_invoices": [],
            "stale_leads": [],
            "sla_tickets": [],
            "tasks_due_today": 0,
            "pending_leaves": 0,
        }
        summary = _build_context_summary(data)
        assert "15,000" in summary or "15000" in summary

    def test_build_context_summary_includes_overdue_invoices(self):
        """_build_context_summary lists overdue invoices."""
        from app.services.brief_service import _build_context_summary
        from datetime import datetime
        data = {
            "monthly_revenue": 0,
            "pipeline_count": 0,
            "pipeline_value": 0,
            "overdue_invoices": [
                {"number": "INV-001", "total": 500, "dueDate": datetime(2026, 4, 1)},
            ],
            "stale_leads": [],
            "sla_tickets": [],
            "tasks_due_today": 0,
            "pending_leaves": 0,
        }
        summary = _build_context_summary(data)
        assert "INV-001" in summary

    def test_fallback_brief_returns_valid_response(self):
        """_fallback_brief always returns a parseable BriefResponse."""
        from app.services.brief_service import _fallback_brief
        from app.models.schemas import BriefResponse
        result = _fallback_brief("ADMIN", "2026-05-28")
        assert isinstance(result, BriefResponse)
        assert result.greeting != ""
        assert len(result.items) > 0
