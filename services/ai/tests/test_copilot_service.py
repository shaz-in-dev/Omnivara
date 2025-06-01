"""Tests for CopilotService — RAG-powered chat with prompt caching."""
from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock, patch


def make_request(messages=None, org_id="org-1"):
    from app.models.schemas import CopilotRequest, ChatMessage, MessageRole
    if messages is None:
        messages = [ChatMessage(role=MessageRole.user, content="What is my pipeline value?")]
    return CopilotRequest(org_id=org_id, user_id="user-1", messages=messages)


class TestCopilotService:

    @pytest.mark.asyncio
    async def test_chat_returns_copilot_response(self, mock_anthropic_client):
        """chat() returns a CopilotResponse with content."""
        from app.services.copilot_service import CopilotService
        from app.models.schemas import CopilotResponse

        svc = CopilotService()
        with patch.object(svc, "_get_rag_context", AsyncMock(return_value="")), \
             patch("app.services.copilot_service._client", mock_anthropic_client):
            result = await svc.chat(make_request())

        assert isinstance(result, CopilotResponse)
        assert result.content == "Test response from Claude"

    @pytest.mark.asyncio
    async def test_chat_includes_rag_context_in_system_blocks(self, mock_anthropic_client):
        """When RAG context exists, it appears in the system blocks."""
        from app.services.copilot_service import CopilotService

        svc = CopilotService()
        rag_ctx = "LEAD | relevance 95%] Big Deal\nAlice Smith at Acme Corp"
        with patch.object(svc, "_get_rag_context", AsyncMock(return_value=rag_ctx)), \
             patch("app.services.copilot_service._client", mock_anthropic_client):
            await svc.chat(make_request())

        call_kwargs = mock_anthropic_client.messages.create.call_args[1]
        system_blocks = call_kwargs.get("system", [])
        system_text = " ".join(b.get("text", "") if isinstance(b, dict) else b.text for b in system_blocks)
        assert "Big Deal" in system_text

    @pytest.mark.asyncio
    async def test_chat_uses_prompt_caching_on_static_block(self, mock_anthropic_client):
        """The first system block (static prompt) has cache_control=ephemeral."""
        from app.services.copilot_service import CopilotService

        svc = CopilotService()
        with patch.object(svc, "_get_rag_context", AsyncMock(return_value="")), \
             patch("app.services.copilot_service._client", mock_anthropic_client):
            await svc.chat(make_request())

        call_kwargs = mock_anthropic_client.messages.create.call_args[1]
        first_block = call_kwargs["system"][0]
        assert first_block.get("cache_control") == {"type": "ephemeral"}

    @pytest.mark.asyncio
    async def test_chat_counts_tokens_used(self, mock_anthropic_client):
        """tokens_used = input_tokens + output_tokens from usage."""
        from app.services.copilot_service import CopilotService

        svc = CopilotService()
        with patch.object(svc, "_get_rag_context", AsyncMock(return_value="")), \
             patch("app.services.copilot_service._client", mock_anthropic_client):
            result = await svc.chat(make_request())

        assert result.tokens_used == 150  # 100 input + 50 output

    @pytest.mark.asyncio
    async def test_chat_returns_empty_content_when_no_response(self, mock_anthropic_client):
        """Handles empty content list from API gracefully."""
        from app.services.copilot_service import CopilotService

        mock_msg = MagicMock()
        mock_msg.content = []
        mock_msg.usage.input_tokens = 0
        mock_msg.usage.output_tokens = 0
        mock_anthropic_client.messages.create = AsyncMock(return_value=mock_msg)

        svc = CopilotService()
        with patch.object(svc, "_get_rag_context", AsyncMock(return_value="")), \
             patch("app.services.copilot_service._client", mock_anthropic_client):
            result = await svc.chat(make_request())

        assert result.content == ""

    def test_build_system_blocks_has_static_block_first(self):
        """_build_system_blocks always starts with the static system prompt."""
        from app.services.copilot_service import CopilotService, SYSTEM_PROMPT
        svc = CopilotService()
        blocks = svc._build_system_blocks("", None)
        assert len(blocks) >= 1
        assert blocks[0]["text"] == SYSTEM_PROMPT

    def test_build_system_blocks_appends_rag_context(self):
        """RAG context is added as a second block when non-empty."""
        from app.services.copilot_service import CopilotService
        svc = CopilotService()
        blocks = svc._build_system_blocks("some rag data", None)
        assert len(blocks) == 2
        assert "some rag data" in blocks[1]["text"]

    def test_build_system_blocks_appends_page_context(self):
        """Page context dict is added as a third block."""
        from app.services.copilot_service import CopilotService
        svc = CopilotService()
        blocks = svc._build_system_blocks("rag", {"page": "crm/leads"})
        assert len(blocks) == 3

    def test_build_system_blocks_no_rag_no_context(self):
        """Only one block when both rag and page context are empty."""
        from app.services.copilot_service import CopilotService
        svc = CopilotService()
        blocks = svc._build_system_blocks("", None)
        assert len(blocks) == 1

    def test_extract_citations_finds_entity_references(self):
        """_extract_citations extracts lead/ticket/invoice references from text."""
        from app.services.copilot_service import CopilotService
        svc = CopilotService()
        content = "You have lead #L-123 and invoice #INV-456 outstanding."
        citations = svc._extract_citations(content)
        assert any("lead" in c.lower() for c in citations)

    def test_extract_citations_returns_empty_for_no_matches(self):
        """Returns [] when no entity references found."""
        from app.services.copilot_service import CopilotService
        svc = CopilotService()
        assert svc._extract_citations("No specific references here.") == []

    def test_suggest_actions_detects_follow_up(self):
        """Detects follow-up email suggestion from response text."""
        from app.services.copilot_service import CopilotService
        svc = CopilotService()
        actions = svc._suggest_actions("You should follow up via email with the prospect.", None)
        assert any("email" in a.lower() or "follow" in a.lower() for a in actions)

    def test_suggest_actions_detects_meeting(self):
        """Detects meeting scheduling suggestion."""
        from app.services.copilot_service import CopilotService
        svc = CopilotService()
        actions = svc._suggest_actions("Schedule a meeting with the client.", None)
        assert any("meeting" in a.lower() or "schedule" in a.lower() for a in actions)

    def test_suggest_actions_caps_at_three(self):
        """Never returns more than 3 suggested actions."""
        from app.services.copilot_service import CopilotService
        svc = CopilotService()
        content = "Follow up email. Schedule meeting. Create proposal. Open ticket. Invoice overdue."
        actions = svc._suggest_actions(content, None)
        assert len(actions) <= 3

    @pytest.mark.asyncio
    async def test_get_rag_context_returns_empty_for_blank_query(self):
        """_get_rag_context returns '' without querying vector store for blank input."""
        from app.services.copilot_service import CopilotService
        svc = CopilotService()
        result = await svc._get_rag_context("org-1", "   ")
        assert result == ""

    @pytest.mark.asyncio
    async def test_get_rag_context_returns_empty_on_error(self):
        """_get_rag_context swallows vector store errors and returns ''."""
        from app.services.copilot_service import CopilotService
        svc = CopilotService()
        with patch.object(svc.vector_store, "search", AsyncMock(side_effect=Exception("DB down"))):
            result = await svc._get_rag_context("org-1", "pipeline value")
        assert result == ""
