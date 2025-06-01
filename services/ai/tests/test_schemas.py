"""Tests for Pydantic schemas — validation and serialization."""
from __future__ import annotations

import pytest
from pydantic import ValidationError


class TestCopilotSchemas:

    def test_copilot_request_requires_org_id_and_messages(self):
        """CopilotRequest is invalid without org_id or messages."""
        from app.models.schemas import CopilotRequest
        with pytest.raises(ValidationError):
            CopilotRequest(user_id="u", messages=[])  # type: ignore

    def test_copilot_request_requires_at_least_one_message(self):
        from app.models.schemas import CopilotRequest
        with pytest.raises(ValidationError):
            CopilotRequest(org_id="org-1", user_id="u", messages=[])

    def test_copilot_request_valid(self):
        from app.models.schemas import CopilotRequest, ChatMessage, MessageRole
        req = CopilotRequest(
            org_id="org-1",
            user_id="user-1",
            messages=[ChatMessage(role=MessageRole.user, content="hello")],
        )
        assert req.org_id == "org-1"
        assert req.stream is False  # default

    def test_copilot_response_defaults(self):
        from app.models.schemas import CopilotResponse
        resp = CopilotResponse(content="Hello!")
        assert resp.citations == []
        assert resp.suggested_actions == []
        assert resp.tokens_used == 0


class TestBriefSchemas:

    def test_brief_request_valid(self):
        from app.models.schemas import BriefRequest
        req = BriefRequest(org_id="org-1", user_id="u", role="ADMIN")
        assert req.date is None  # defaults to None

    def test_brief_item_defaults_priority_to_medium(self):
        from app.models.schemas import BriefItem
        item = BriefItem(category="Finance", title="Test", summary="Summary")
        assert item.priority == "medium"

    def test_brief_response_valid(self):
        from app.models.schemas import BriefResponse, BriefItem
        resp = BriefResponse(
            greeting="Good morning!",
            items=[BriefItem(category="CRM", title="2 leads", summary="Follow up")],
            generated_at="2026-05-28",
        )
        assert len(resp.items) == 1


class TestEmbeddingSchemas:

    def test_embedding_request_valid(self):
        from app.models.schemas import EmbeddingRequest
        req = EmbeddingRequest(org_id="org-1", texts=["hello", "world"])
        assert req.model == "text-embedding-3-small"

    def test_embedding_request_rejects_empty_texts(self):
        from app.models.schemas import EmbeddingRequest
        with pytest.raises(ValidationError):
            EmbeddingRequest(org_id="org-1", texts=[])

    def test_index_document_request_valid(self):
        from app.models.schemas import IndexDocumentRequest
        req = IndexDocumentRequest(
            org_id="org-1",
            document_id="lead:l-1",
            document_type="lead",
            content="Alice Smith at Acme Corp",
        )
        assert req.metadata == {}

    def test_search_request_min_query_length(self):
        from app.models.schemas import SearchRequest
        with pytest.raises(ValidationError):
            SearchRequest(org_id="org-1", query="a")  # too short

    def test_search_request_valid(self):
        from app.models.schemas import SearchRequest
        req = SearchRequest(org_id="org-1", query="pipeline value")
        assert req.limit == 10


class TestMessageRole:

    def test_message_role_values(self):
        from app.models.schemas import MessageRole
        assert MessageRole.user == "user"
        assert MessageRole.assistant == "assistant"
        assert MessageRole.system == "system"
