import logging
from typing import List, Optional
from app.core.redis import get_redis_client
from app.utils.time import utc_now

logger = logging.getLogger("vtryon.workers.heartbeat")

HEARTBEAT_PREFIX = "vtryon:worker:gpu:"


def record_worker_heartbeat(worker_name: str, ttl_seconds: int = 60) -> bool:
    """Record a worker heartbeat in Redis with auto-expiry TTL."""
    try:
        redis_client = get_redis_client()
        key = f"{HEARTBEAT_PREFIX}{worker_name}:heartbeat"
        redis_client.set(key, utc_now().isoformat(), ex=ttl_seconds)
        return True
    except Exception as exc:
        logger.warning(f"Failed to record worker heartbeat for '{worker_name}': {str(exc)}")
        return False


def is_worker_alive(worker_name: str) -> bool:
    """Check if worker heartbeat key exists and is non-expired in Redis."""
    try:
        redis_client = get_redis_client()
        key = f"{HEARTBEAT_PREFIX}{worker_name}:heartbeat"
        return bool(redis_client.exists(key))
    except Exception:
        return False


def get_active_workers() -> List[str]:
    """Scan and return list of currently active worker names."""
    try:
        redis_client = get_redis_client()
        keys = redis_client.keys(f"{HEARTBEAT_PREFIX}*:heartbeat")
        workers = []
        for k in keys:
            k_str = k.decode("utf-8") if isinstance(k, bytes) else str(k)
            # Extract worker name between prefix and ':heartbeat'
            worker_id = k_str[len(HEARTBEAT_PREFIX):-len(":heartbeat")]
            workers.append(worker_id)
        return sorted(workers)
    except Exception as exc:
        logger.warning(f"Failed to list active workers: {str(exc)}")
        return []


__all__ = ["record_worker_heartbeat", "is_worker_alive", "get_active_workers"]
