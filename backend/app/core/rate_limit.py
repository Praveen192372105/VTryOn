import hashlib
import logging
import threading
import time
from dataclasses import dataclass
from typing import Optional, Protocol, Tuple
import redis

from app.core.config import settings
from app.core.exceptions import RateLimitExceededError
from app.core.redis import get_redis_client

logger = logging.getLogger("vtryon.security")

# Atomic Lua script for Redis fixed-window counter with automatic expiration
_RATE_LIMIT_LUA_SCRIPT = """
local current = redis.call('INCR', KEYS[1])
if current == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('TTL', KEYS[1])
if ttl == -1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
    ttl = tonumber(ARGV[1])
end
return {current, ttl}
"""


@dataclass(frozen=True)
class RateLimitDecision:
    allowed: bool
    limit: int
    remaining: int
    reset_seconds: int
    retry_after: int = 0


class RateLimiter(Protocol):
    def check(
        self,
        *,
        key: str,
        limit: int,
        window_seconds: int,
    ) -> RateLimitDecision:
        """Evaluate whether an operation is allowed under rate limits."""
        ...


class RedisRateLimiter:
    """
    Production-grade atomic Redis rate limiter.
    Uses Lua script execution for single-roundtrip atomic counter increments and TTL bounds.
    Implements deliberate fail-open policy for auth abuse when Redis is unreachable.
    """
    def __init__(self, client: Optional[redis.Redis] = None, key_prefix: Optional[str] = None):
        self._client = client
        self.key_prefix = key_prefix or settings.RATE_LIMIT_REDIS_PREFIX
        self._script = None

    @property
    def client(self) -> redis.Redis:
        if self._client is None:
            self._client = get_redis_client()
        return self._client

    def _get_script(self):
        if self._script is None:
            self._script = self.client.register_script(_RATE_LIMIT_LUA_SCRIPT)
        return self._script

    def check(
        self,
        *,
        key: str,
        limit: int,
        window_seconds: int,
    ) -> RateLimitDecision:
        if not settings.RATE_LIMIT_ENABLED:
            return RateLimitDecision(allowed=True, limit=limit, remaining=limit, reset_seconds=0, retry_after=0)

        redis_key = f"{self.key_prefix}:{key}"
        try:
            script = self._get_script()
            result = script(keys=[redis_key], args=[window_seconds])
            current_count = int(result[0])
            ttl = max(1, int(result[1]))

            if current_count > limit:
                logger.warning(
                    f"Rate limit exceeded on key '{key}': {current_count}/{limit} (retry in {ttl}s)",
                    extra={"event": "rate_limit.exceeded", "key": key, "limit": limit, "count": current_count},
                )
                return RateLimitDecision(
                    allowed=False,
                    limit=limit,
                    remaining=0,
                    reset_seconds=ttl,
                    retry_after=ttl,
                )

            remaining = max(0, limit - current_count)
            return RateLimitDecision(
                allowed=True,
                limit=limit,
                remaining=remaining,
                reset_seconds=ttl,
                retry_after=0,
            )

        except Exception as exc:
            # Deliberate Fail-Open Policy for rate limiting when Redis is unavailable
            logger.warning(
                f"Rate limiter Redis check failed ({str(exc)}). Failing open per resilience policy.",
                extra={"event": "rate_limit.fail_open", "key": key, "error": str(exc)},
            )
            return RateLimitDecision(
                allowed=True,
                limit=limit,
                remaining=limit,
                reset_seconds=0,
                retry_after=0,
            )


class InMemoryRateLimiter:
    """
    Thread-safe in-memory rate limiter with sliding window expiration.
    Ideal for isolated unit tests, offline operation, and test dependency overrides.
    """
    def __init__(self):
        self._lock = threading.Lock()
        self._records: dict[str, list[float]] = {}

    def check(
        self,
        *,
        key: str,
        limit: int,
        window_seconds: int,
    ) -> RateLimitDecision:
        if not settings.RATE_LIMIT_ENABLED:
            return RateLimitDecision(allowed=True, limit=limit, remaining=limit, reset_seconds=0, retry_after=0)

        now = time.time()
        window_start = now - window_seconds

        with self._lock:
            # Clean expired timestamps
            timestamps = [ts for ts in self._records.get(key, []) if ts > window_start]
            
            if len(timestamps) >= limit:
                earliest = timestamps[0]
                retry_after = max(1, int(earliest + window_seconds - now))
                self._records[key] = timestamps
                return RateLimitDecision(
                    allowed=False,
                    limit=limit,
                    remaining=0,
                    reset_seconds=retry_after,
                    retry_after=retry_after,
                )

            timestamps.append(now)
            self._records[key] = timestamps
            remaining = limit - len(timestamps)
            return RateLimitDecision(
                allowed=True,
                limit=limit,
                remaining=remaining,
                reset_seconds=window_seconds,
                retry_after=0,
            )

    def reset(self):
        with self._lock:
            self._records.clear()


# Default singleton instance
_default_rate_limiter: Optional[RateLimiter] = None


def get_rate_limiter() -> RateLimiter:
    """FastAPI dependency for accessing the active RateLimiter implementation."""
    global _default_rate_limiter
    if _default_rate_limiter is None:
        _default_rate_limiter = RedisRateLimiter()
    return _default_rate_limiter


def enforce_rate_limit(
    limiter: RateLimiter,
    key: str,
    limit: int,
    window_seconds: int,
    error_message: str = "Too many requests. Please try again shortly.",
) -> None:
    """Helper that evaluates a rate limit and raises RateLimitExceededError on violation."""
    decision = limiter.check(key=key, limit=limit, window_seconds=window_seconds)
    if not decision.allowed:
        raise RateLimitExceededError(
            message=error_message,
            retry_after=decision.retry_after,
        )


def fingerprint_credential(value: str) -> str:
    """Derives a safe SHA-256 fingerprint from credentials to prevent raw credential storage in Redis keys."""
    return hashlib.sha256(value.strip().lower().encode("utf-8")).hexdigest()[:32]


__all__ = [
    "RateLimiter",
    "RateLimitDecision",
    "RedisRateLimiter",
    "InMemoryRateLimiter",
    "get_rate_limiter",
    "enforce_rate_limit",
    "fingerprint_credential",
]
