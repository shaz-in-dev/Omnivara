"""AI usage tracking — Redis-backed per-org monthly counters."""
from __future__ import annotations

import logging
from datetime import datetime

try:
    import redis.asyncio as aioredis
    _redis_available = True
except ImportError:
    _redis_available = False

from app.config import settings

logger = logging.getLogger(__name__)

# Plan limits (messages per month; 0 = no access; None = unlimited)
PLAN_LIMITS: dict[str, int | None] = {
    "starter":  0,     # No AI access
    "free":     0,     # No AI access
    "growth":   200,   # 200 messages/month with Haiku
    "pro":      200,   # alias
    "business": None,  # Unlimited with Sonnet
    "enterprise": None,
}

# Model per plan
PLAN_MODELS: dict[str, str] = {
    "starter":    "claude-haiku-4-5-20251001",
    "free":       "claude-haiku-4-5-20251001",
    "growth":     "claude-haiku-4-5-20251001",
    "pro":        "claude-haiku-4-5-20251001",
    "business":   "claude-sonnet-4-6",
    "enterprise": "claude-sonnet-4-6",
}

_redis_client: "aioredis.Redis | None" = None


async def _get_redis() -> "aioredis.Redis | None":
    global _redis_client
    if _redis_client is None and _redis_available and settings.redis_url:
        try:
            _redis_client = await aioredis.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_connect_timeout=3,
                socket_timeout=3,
                retry_on_timeout=True,
            )
            # Verify the connection is live
            await _redis_client.ping()
        except Exception as exc:
            logger.warning("Redis unavailable (%s) — usage tracking degraded to no-op", exc)
            _redis_client = None
    return _redis_client


def _usage_key(org_id: str, month: str) -> str:
    return f"ai:usage:{org_id}:{month}"


def _current_month() -> str:
    return datetime.utcnow().strftime("%Y-%m")


class UsageService:
    async def get_usage(self, org_id: str, month: str | None = None) -> int:
        """Return the number of AI messages used this month.

        Returns 0 when Redis is unavailable — the caller treats this as
        'usage unknown' rather than 'no usage', so check_access still
        applies plan limits conservatively.
        """
        month = month or _current_month()
        r = await _get_redis()
        if r is None:
            logger.warning("Redis unavailable — get_usage('%s') returning 0 (degraded mode)", org_id)
            return 0
        try:
            val = await r.get(_usage_key(org_id, month))
            return int(val or 0)
        except Exception as exc:
            logger.error("Redis get_usage error for org '%s': %s", org_id, exc)
            return 0

    async def increment(self, org_id: str) -> int:
        """Increment usage counter and return new value. TTL = 35 days.

        Returns 0 when Redis is unavailable — does NOT silently allow
        unlimited usage; check_access is the enforcement gate.
        """
        month = _current_month()
        r = await _get_redis()
        if r is None:
            logger.warning("Redis unavailable — increment('%s') skipped (degraded mode)", org_id)
            return 0
        try:
            key = _usage_key(org_id, month)
            new_val = await r.incr(key)
            if new_val == 1:
                await r.expire(key, 35 * 24 * 3600)
            return int(new_val)
        except Exception as exc:
            logger.error("Redis increment error for org '%s': %s", org_id, exc)
            return 0

    async def check_access(self, org_id: str, plan: str) -> tuple[bool, str]:
        """
        Returns (allowed: bool, reason: str).
        allowed=True means the org can make an AI request.
        """
        plan = plan.lower()
        limit = PLAN_LIMITS.get(plan, 0)

        if limit == 0:
            return False, f"AI is not available on the {plan} plan. Upgrade to Growth or Business."

        if limit is None:
            return True, "unlimited"

        usage = await self.get_usage(org_id)
        if usage >= limit:
            return False, f"Monthly AI limit reached ({usage}/{limit} messages). Upgrade to Business for unlimited access."

        return True, f"{usage}/{limit} messages used"

    def get_model(self, plan: str) -> str:
        return PLAN_MODELS.get(plan.lower(), "claude-haiku-4-5-20251001")
