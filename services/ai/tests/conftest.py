"""Shared fixtures for AI service tests."""
from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock, patch


@pytest.fixture
def mock_anthropic_client():
    """Returns a mock Anthropic async client."""
    client = AsyncMock()
    message = MagicMock()
    message.content = [MagicMock(text="Test response from Claude")]
    message.usage.input_tokens = 100
    message.usage.output_tokens = 50
    client.messages.create = AsyncMock(return_value=message)
    return client


@pytest.fixture
def mock_openai_client():
    """Returns a mock OpenAI async client for embeddings."""
    client = AsyncMock()
    embedding_item = MagicMock()
    embedding_item.embedding = [0.1] * 1536
    response = MagicMock()
    response.data = [embedding_item]
    client.embeddings.create = AsyncMock(return_value=response)
    return client


@pytest.fixture
def mock_db_pool():
    """Returns a mock asyncpg connection pool."""
    pool = AsyncMock()
    conn = AsyncMock()
    pool.acquire.return_value.__aenter__ = AsyncMock(return_value=conn)
    pool.acquire.return_value.__aexit__ = AsyncMock(return_value=None)
    conn.fetch = AsyncMock(return_value=[])
    conn.fetchrow = AsyncMock(return_value={"total": 0, "cnt": 0})
    conn.fetchval = AsyncMock(return_value=0)
    conn.execute = AsyncMock(return_value=None)
    return pool, conn


@pytest.fixture
def mock_redis():
    """Returns a mock async Redis client."""
    r = AsyncMock()
    r.get = AsyncMock(return_value=None)
    r.incr = AsyncMock(return_value=1)
    r.expire = AsyncMock(return_value=True)
    return r
