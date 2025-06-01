"""Tests for EmbeddingService."""
from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock, patch


class TestEmbeddingService:
    """Tests for EmbeddingService embedding generation."""

    def test_mock_embed_returns_correct_dimension(self):
        """Mock embedding must match EMBEDDING_DIM (1536)."""
        from app.services.embedding_service import EmbeddingService, EMBEDDING_DIM
        svc = EmbeddingService()
        result = svc._mock_embed("hello world")
        assert len(result) == EMBEDDING_DIM

    def test_mock_embed_is_normalized(self):
        """Mock embedding should be approximately unit-length."""
        from app.services.embedding_service import EmbeddingService
        svc = EmbeddingService()
        vec = svc._mock_embed("test text")
        norm = sum(x ** 2 for x in vec) ** 0.5
        assert abs(norm - 1.0) < 1e-6

    def test_mock_embed_deterministic_same_input(self):
        """Same text always produces the same embedding."""
        from app.services.embedding_service import EmbeddingService
        svc = EmbeddingService()
        v1 = svc._mock_embed("consistent text")
        v2 = svc._mock_embed("consistent text")
        assert v1 == v2

    def test_mock_embed_different_for_different_texts(self):
        """Different texts produce different embeddings."""
        from app.services.embedding_service import EmbeddingService
        svc = EmbeddingService()
        v1 = svc._mock_embed("text A")
        v2 = svc._mock_embed("text B")
        assert v1 != v2

    @pytest.mark.asyncio
    async def test_embed_uses_mock_when_no_api_key(self):
        """embed() falls back to mock when OPENAI_API_KEY is empty."""
        from app.services.embedding_service import EmbeddingService, EMBEDDING_DIM
        with patch("app.services.embedding_service.settings") as mock_settings:
            mock_settings.openai_api_key = ""
            svc = EmbeddingService()
            result = await svc.embed(["hello", "world"])
        assert len(result) == 2
        assert len(result[0]) == EMBEDDING_DIM
        assert len(result[1]) == EMBEDDING_DIM

    @pytest.mark.asyncio
    async def test_embed_single_returns_single_vector(self):
        """embed_single() wraps embed() and returns first result."""
        from app.services.embedding_service import EmbeddingService, EMBEDDING_DIM
        with patch("app.services.embedding_service.settings") as mock_settings:
            mock_settings.openai_api_key = ""
            svc = EmbeddingService()
            result = await svc.embed_single("single text")
        assert isinstance(result, list)
        assert len(result) == EMBEDDING_DIM

    @pytest.mark.asyncio
    async def test_embed_calls_openai_when_api_key_set(self, mock_openai_client):
        """embed() calls OpenAI API when key is configured."""
        from app.services.embedding_service import EmbeddingService
        with patch("app.services.embedding_service.settings") as mock_settings, \
             patch("app.services.embedding_service._get_client", return_value=mock_openai_client):
            mock_settings.openai_api_key = "sk-test-key"
            svc = EmbeddingService()
            result = await svc.embed(["test"])
        mock_openai_client.embeddings.create.assert_called_once()
        assert len(result) == 1

    @pytest.mark.asyncio
    async def test_embed_empty_list_returns_empty_list(self):
        """embed([]) should return [] without API calls."""
        from app.services.embedding_service import EmbeddingService
        with patch("app.services.embedding_service.settings") as mock_settings:
            mock_settings.openai_api_key = ""
            svc = EmbeddingService()
            result = await svc.embed([])
        assert result == []
