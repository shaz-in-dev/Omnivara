"""Copilot service — RAG-powered conversational AI with prompt caching."""
from __future__ import annotations

from typing import AsyncIterator

import anthropic
from app.config import settings
from app.models.schemas import (
    CopilotRequest,
    CopilotResponse,
    MessageRole,
)
from app.services.embedding_service import EmbeddingService
from app.services.vector_store import VectorStore

_client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

SYSTEM_PROMPT = """You are Omnivara Copilot, an AI assistant embedded in the Omnivara Business Operating System.
You help users understand their business data, take actions, and make decisions.

Guidelines:
- Be concise and action-oriented.
- When referencing data, cite the source (e.g., "Based on your CRM data...").
- Suggest next steps when relevant.
- Do not hallucinate data — only reference what is provided in context.
- Format responses with markdown when helpful (lists, bold key terms).
- If no relevant business context is found, say so honestly rather than making up data.
"""

DEFAULT_MODEL = "claude-haiku-4-5-20251001"


class CopilotService:
    def __init__(self) -> None:
        self.embedding_service = EmbeddingService()
        self.vector_store = VectorStore()

    async def chat(
        self,
        request: CopilotRequest,
        model: str = DEFAULT_MODEL,
    ) -> CopilotResponse:
        """Non-streaming chat completion with RAG context injection and prompt caching."""
        last_user_msg = next(
            (m.content for m in reversed(request.messages) if m.role == MessageRole.user),
            "",
        )
        rag_context = await self._get_rag_context(request.org_id, last_user_msg)

        system_blocks = self._build_system_blocks(rag_context, request.context)

        messages = [
            {"role": m.role.value, "content": m.content}
            for m in request.messages
            if m.role in (MessageRole.user, MessageRole.assistant)
        ]

        response = await _client.messages.create(
            model=model,
            max_tokens=2048,
            system=system_blocks,
            messages=messages,
        )

        content = response.content[0].text if response.content else ""
        return CopilotResponse(
            content=content,
            citations=self._extract_citations(content),
            suggested_actions=self._suggest_actions(content, request.context),
            tokens_used=response.usage.input_tokens + response.usage.output_tokens,
        )

    async def stream(
        self,
        request: CopilotRequest,
        model: str = DEFAULT_MODEL,
    ) -> AsyncIterator[str]:
        """Streaming chat for real-time display with prompt caching."""
        last_user_msg = next(
            (m.content for m in reversed(request.messages) if m.role == MessageRole.user),
            "",
        )
        rag_context = await self._get_rag_context(request.org_id, last_user_msg)
        system_blocks = self._build_system_blocks(rag_context, request.context)

        messages = [
            {"role": m.role.value, "content": m.content}
            for m in request.messages
            if m.role in (MessageRole.user, MessageRole.assistant)
        ]

        async with _client.messages.stream(
            model=model,
            max_tokens=2048,
            system=system_blocks,
            messages=messages,
        ) as stream:
            async for text in stream.text_stream:
                yield text

    # ── Private helpers ───────────────────────────────────────────────────────

    def _build_system_blocks(
        self,
        rag_context: str,
        page_context: dict | None,
    ) -> list[dict]:
        """
        Build system blocks with Anthropic prompt caching.
        The static system prompt gets cache_control=ephemeral (5-min TTL).
        Dynamic RAG context is NOT cached (changes per query).
        """
        blocks: list[dict] = [
            {
                "type": "text",
                "text": SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},  # Cache the static prompt
            }
        ]
        if rag_context:
            blocks.append({
                "type": "text",
                "text": f"## Relevant Business Context\n{rag_context}",
            })
        if page_context:
            blocks.append({
                "type": "text",
                "text": f"## Current Page Context\n{page_context}",
            })
        return blocks

    async def _get_rag_context(self, org_id: str, query: str, top_k: int = 8) -> str:
        """Retrieve relevant documents from vector store."""
        if not query.strip():
            return ""
        try:
            results = await self.vector_store.search(org_id, query, limit=top_k)
            if not results:
                return ""
            lines = []
            for r in results:
                score_pct = int(r['score'] * 100)
                lines.append(
                    f"[{r['type'].upper()} | relevance {score_pct}%] {r['title']}\n{r['content'][:400]}"
                )
            return "\n\n".join(lines)
        except Exception:
            return ""

    def _extract_citations(self, content: str) -> list[str]:
        import re
        pattern = r'\b(lead|contact|ticket|invoice|account|opportunity)\s+#?(\w+)'
        matches = re.findall(pattern, content, re.IGNORECASE)
        return [f"{t}:{i}" for t, i in matches]

    def _suggest_actions(self, content: str, context: dict | None) -> list[str]:
        suggestions = []
        lower = content.lower()
        if "follow up" in lower or "email" in lower:
            suggestions.append("Send follow-up email")
        if "schedule" in lower or "meeting" in lower:
            suggestions.append("Schedule meeting")
        if "proposal" in lower or "quote" in lower:
            suggestions.append("Create proposal")
        if "ticket" in lower or "issue" in lower:
            suggestions.append("Create support ticket")
        if "invoice" in lower or "overdue" in lower:
            suggestions.append("Open Finance module")
        return suggestions[:3]
