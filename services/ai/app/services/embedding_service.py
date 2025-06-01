"""Embedding service — real OpenAI text-embedding-3-small embeddings."""
from __future__ import annotations

import asyncio
from functools import lru_cache
from typing import Any

from app.config import settings

# Lazy import so tests don't require the package installed
try:
    from openai import AsyncOpenAI
    _openai_available = True
except ImportError:
    _openai_available = False

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIM = 1536


@lru_cache(maxsize=1)
def _get_client():
    if not _openai_available:
        raise RuntimeError("openai package not installed. Run: pip install openai")
    return AsyncOpenAI(api_key=settings.openai_api_key)


class EmbeddingService:
    """Generates text embeddings using OpenAI text-embedding-3-small.

    Falls back to a deterministic mock when OPENAI_API_KEY is not configured,
    so the rest of the pipeline can be developed/tested without an API key.
    """

    async def embed(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for a batch of texts (max 2048 texts per call)."""
        if not settings.openai_api_key:
            return [self._mock_embed(t) for t in texts]
        client = _get_client()
        response = await client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=texts,
            dimensions=EMBEDDING_DIM,
        )
        return [item.embedding for item in response.data]

    async def embed_single(self, text: str) -> list[float]:
        results = await self.embed([text])
        return results[0]

    # ── Deterministic mock ────────────────────────────────────────────────────

    def _mock_embed(self, text: str) -> list[float]:
        """SHA-256-derived mock embedding for dev without an API key."""
        import hashlib
        hash_bytes = hashlib.sha256(text.encode()).digest()
        base = [b / 255.0 - 0.5 for b in hash_bytes]
        full = (base * (EMBEDDING_DIM // len(base) + 1))[:EMBEDDING_DIM]
        norm = sum(x ** 2 for x in full) ** 0.5 or 1.0
        return [x / norm for x in full]
