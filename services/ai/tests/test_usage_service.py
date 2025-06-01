"""Tests for UsageService — Redis-backed per-org AI usage tracking."""
from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, patch


class TestUsageService:

    @pytest.mark.asyncio
    async def test_get_usage_returns_zero_when_no_redis(self):
        """Returns 0 when Redis is unavailable."""
        from app.services.usage_service import UsageService
        svc = UsageService()
        with patch("app.services.usage_service._get_redis", return_value=AsyncMock(return_value=None)):
            result = await svc.get_usage("org-1")
        assert result == 0

    @pytest.mark.asyncio
    async def test_get_usage_returns_stored_value(self, mock_redis):
        """Returns the stored counter value from Redis."""
        from app.services.usage_service import UsageService
        mock_redis.get = AsyncMock(return_value="42")
        svc = UsageService()
        with patch("app.services.usage_service._get_redis", AsyncMock(return_value=mock_redis)):
            result = await svc.get_usage("org-1")
        assert result == 42

    @pytest.mark.asyncio
    async def test_get_usage_returns_zero_for_null_key(self, mock_redis):
        """Returns 0 when Redis key does not exist (None)."""
        from app.services.usage_service import UsageService
        mock_redis.get = AsyncMock(return_value=None)
        svc = UsageService()
        with patch("app.services.usage_service._get_redis", AsyncMock(return_value=mock_redis)):
            result = await svc.get_usage("org-1")
        assert result == 0

    @pytest.mark.asyncio
    async def test_increment_increases_counter(self, mock_redis):
        """increment() calls Redis INCR and returns new value."""
        from app.services.usage_service import UsageService
        mock_redis.incr = AsyncMock(return_value=5)
        svc = UsageService()
        with patch("app.services.usage_service._get_redis", AsyncMock(return_value=mock_redis)):
            result = await svc.increment("org-1")
        assert result == 5
        mock_redis.incr.assert_called_once()

    @pytest.mark.asyncio
    async def test_increment_sets_ttl_on_first_use(self, mock_redis):
        """Sets 35-day TTL when counter goes from 0 to 1."""
        from app.services.usage_service import UsageService
        mock_redis.incr = AsyncMock(return_value=1)  # first use
        svc = UsageService()
        with patch("app.services.usage_service._get_redis", AsyncMock(return_value=mock_redis)):
            await svc.increment("org-1")
        mock_redis.expire.assert_called_once()
        # TTL should be 35 days in seconds
        expire_call = mock_redis.expire.call_args[0]
        assert expire_call[1] == 35 * 24 * 3600

    @pytest.mark.asyncio
    async def test_increment_skips_ttl_when_not_first_use(self, mock_redis):
        """Does NOT reset TTL when counter is already > 1."""
        from app.services.usage_service import UsageService
        mock_redis.incr = AsyncMock(return_value=10)  # not first use
        svc = UsageService()
        with patch("app.services.usage_service._get_redis", AsyncMock(return_value=mock_redis)):
            await svc.increment("org-1")
        mock_redis.expire.assert_not_called()

    @pytest.mark.asyncio
    async def test_increment_returns_zero_when_no_redis(self):
        """increment() returns 0 gracefully when Redis unavailable."""
        from app.services.usage_service import UsageService
        svc = UsageService()
        with patch("app.services.usage_service._get_redis", AsyncMock(return_value=None)):
            result = await svc.increment("org-1")
        assert result == 0

    @pytest.mark.asyncio
    async def test_check_access_denies_starter_plan(self, mock_redis):
        """starter plan has limit=0 — always denied."""
        from app.services.usage_service import UsageService
        svc = UsageService()
        with patch("app.services.usage_service._get_redis", AsyncMock(return_value=mock_redis)):
            allowed, reason = await svc.check_access("org-1", "starter")
        assert allowed is False
        assert "not available" in reason.lower() or "starter" in reason.lower()

    @pytest.mark.asyncio
    async def test_check_access_denies_free_plan(self, mock_redis):
        """free plan has limit=0 — always denied."""
        from app.services.usage_service import UsageService
        svc = UsageService()
        with patch("app.services.usage_service._get_redis", AsyncMock(return_value=mock_redis)):
            allowed, _ = await svc.check_access("org-1", "free")
        assert allowed is False

    @pytest.mark.asyncio
    async def test_check_access_allows_business_plan_unlimited(self, mock_redis):
        """business plan has limit=None (unlimited) — always allowed."""
        from app.services.usage_service import UsageService
        mock_redis.get = AsyncMock(return_value="9999")  # high usage, still unlimited
        svc = UsageService()
        with patch("app.services.usage_service._get_redis", AsyncMock(return_value=mock_redis)):
            allowed, reason = await svc.check_access("org-1", "business")
        assert allowed is True
        assert reason == "unlimited"

    @pytest.mark.asyncio
    async def test_check_access_allows_growth_below_limit(self, mock_redis):
        """growth plan (200 msgs/mo) — allowed when below limit."""
        from app.services.usage_service import UsageService
        mock_redis.get = AsyncMock(return_value="100")
        svc = UsageService()
        with patch("app.services.usage_service._get_redis", AsyncMock(return_value=mock_redis)):
            allowed, _ = await svc.check_access("org-1", "growth")
        assert allowed is True

    @pytest.mark.asyncio
    async def test_check_access_denies_growth_at_limit(self, mock_redis):
        """growth plan — denied when usage >= 200."""
        from app.services.usage_service import UsageService
        mock_redis.get = AsyncMock(return_value="200")
        svc = UsageService()
        with patch("app.services.usage_service._get_redis", AsyncMock(return_value=mock_redis)):
            allowed, reason = await svc.check_access("org-1", "growth")
        assert allowed is False
        assert "limit" in reason.lower()

    def test_get_model_returns_haiku_for_growth(self):
        """growth plan → Haiku model."""
        from app.services.usage_service import UsageService
        svc = UsageService()
        model = svc.get_model("growth")
        assert "haiku" in model

    def test_get_model_returns_sonnet_for_business(self):
        """business plan → Sonnet model."""
        from app.services.usage_service import UsageService
        svc = UsageService()
        model = svc.get_model("business")
        assert "sonnet" in model

    def test_get_model_case_insensitive(self):
        """get_model handles uppercase plan names."""
        from app.services.usage_service import UsageService
        svc = UsageService()
        assert "sonnet" in svc.get_model("BUSINESS")
        assert "haiku" in svc.get_model("GROWTH")

    def test_get_model_falls_back_to_haiku_for_unknown_plan(self):
        """Unknown plan falls back to Haiku (safe default)."""
        from app.services.usage_service import UsageService
        svc = UsageService()
        model = svc.get_model("unknown_plan_xyz")
        assert "haiku" in model
