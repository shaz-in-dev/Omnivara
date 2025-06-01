"""Pydantic models for AI service request/response shapes."""
from __future__ import annotations

from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field


# ─── Copilot / Chat ──────────────────────────────────────────────────────────

class MessageRole(str, Enum):
    user = "user"
    assistant = "assistant"
    system = "system"


class ChatMessage(BaseModel):
    role: MessageRole
    content: str


class CopilotRequest(BaseModel):
    org_id: str = Field(..., description="Organization ID for tenant scoping")
    user_id: str = Field(..., description="User ID for personalization")
    messages: list[ChatMessage] = Field(..., min_length=1)
    context: Optional[dict[str, Any]] = Field(default=None, description="Additional context (current page, entity)")
    stream: bool = Field(default=False)


class CopilotResponse(BaseModel):
    content: str
    citations: list[str] = Field(default_factory=list)
    suggested_actions: list[str] = Field(default_factory=list)
    tokens_used: int = 0


# ─── Embeddings ──────────────────────────────────────────────────────────────

class EmbeddingRequest(BaseModel):
    org_id: str
    texts: list[str] = Field(..., min_length=1, max_length=100)
    model: str = Field(default="text-embedding-3-small")


class EmbeddingResponse(BaseModel):
    embeddings: list[list[float]]
    model: str
    tokens_used: int


class IndexDocumentRequest(BaseModel):
    org_id: str
    document_id: str
    document_type: str = Field(..., description="e.g. lead, contact, ticket, invoice")
    content: str
    metadata: dict[str, Any] = Field(default_factory=dict)


# ─── Daily Brief ─────────────────────────────────────────────────────────────

class BriefRequest(BaseModel):
    org_id: str
    user_id: str
    role: str = Field(..., description="User role for brief personalization")
    date: Optional[str] = Field(default=None, description="ISO date, defaults to today")


class BriefItem(BaseModel):
    category: str
    title: str
    summary: str
    action_url: Optional[str] = None
    priority: str = "medium"


class BriefResponse(BaseModel):
    greeting: str
    items: list[BriefItem]
    generated_at: str


# ─── Semantic Search ─────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    org_id: str
    query: str = Field(..., min_length=2)
    types: list[str] = Field(default_factory=list, description="Filter by entity types")
    limit: int = Field(default=10, ge=1, le=50)


class SearchResult(BaseModel):
    id: str
    type: str
    title: str
    snippet: str
    score: float
    url: Optional[str] = None


class SearchResponse(BaseModel):
    results: list[SearchResult]
    total: int
    query_time_ms: float


# ─── Action Suggestions ──────────────────────────────────────────────────────

class SuggestActionsRequest(BaseModel):
    org_id: str
    user_id: str
    entity_type: str
    entity_id: str
    entity_data: dict[str, Any]


class ActionSuggestion(BaseModel):
    action: str
    description: str
    confidence: float
    data: dict[str, Any] = Field(default_factory=dict)


class SuggestActionsResponse(BaseModel):
    suggestions: list[ActionSuggestion]
