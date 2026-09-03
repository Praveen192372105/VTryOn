import logging
from typing import Optional
import redis

from app.core.config import Settings, get_settings
from app.core.exceptions import RedisUnavailableError

logger = logging.getLogger("vtryon.redis")

_redis_client: Optional[redis.Redis] = None


def create_redis_client(cfg: Optional[Settings] = None) -> redis.Redis:
    """Instantiates a new Redis client using centralized Settings."""
    active_settings = cfg or get_settings()
    return redis.Redis.from_url(
        active_settings.REDIS_URL,
        socket_timeout=2.0,
        socket_connect_timeout=2.0,
        decode_responses=True,
    )


def get_redis_client() -> redis.Redis:
    """Get or create a cached singleton Redis client instance."""
    global _redis_client
    if _redis_client is None:
        _redis_client = create_redis_client()
    return _redis_client


def check_redis_connectivity() -> bool:
    """
    Check if Redis server is reachable via PING.
    Returns True if reachable, False otherwise.
    """
    try:
        client = get_redis_client()
        return bool(client.ping())
    except Exception as exc:
        logger.warning(f"Redis connectivity check failed: {str(exc)}")
        return False


_UNLOCK_LUA_SCRIPT = """
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
"""


from contextlib import contextmanager
import time
import uuid


@contextmanager
def redis_admission_lock(lock_key: str, ttl_seconds: int = 10, timeout_seconds: float = 2.0):
    """
    Context manager acquiring a short-lived distributed lock with safe token release.
    Guarantees concurrency safety during try-on capacity validation and initial job persistence.
    If Redis is unavailable, logs a warning and yields True so durable database checks proceed.
    """
    client = None
    token = uuid.uuid4().hex
    acquired = False
    deadline = time.time() + timeout_seconds

    try:
        client = get_redis_client()
        while time.time() < deadline:
            if client.set(lock_key, token, nx=True, px=int(ttl_seconds * 1000)):
                acquired = True
                break
            time.sleep(0.05)
    except Exception as exc:
        logger.warning(
            f"Redis admission lock acquisition bypassed due to connection error ({str(exc)}). Continuing to database validation.",
            extra={"event": "admission_lock.bypassed", "lock_key": lock_key},
        )
        acquired = True

    try:
        yield acquired
    finally:
        if acquired and client is not None:
            try:
                client.eval(_UNLOCK_LUA_SCRIPT, 1, lock_key, token)
            except Exception as exc:
                logger.warning(f"Redis admission lock release failed: {str(exc)}")


__all__ = [
    "create_redis_client",
    "get_redis_client",
    "check_redis_connectivity",
    "close_redis",
    "redis_admission_lock",
]
