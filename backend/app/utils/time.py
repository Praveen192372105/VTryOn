from datetime import datetime, timezone
from typing import Optional


def utc_now() -> datetime:
    """Return the current timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)


def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """
    Ensure a datetime object is timezone-aware UTC.
    If naive, assume UTC and attach timezone.
    """
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


to_utc = ensure_utc


def format_iso_utc(dt: Optional[datetime]) -> Optional[str]:
    """Format a datetime to standard ISO 8601 string in UTC."""
    if dt is None:
        return None
    utc_dt = ensure_utc(dt)
    return utc_dt.isoformat()


format_iso = format_iso_utc


def parse_iso(iso_str: str) -> datetime:
    """Parse an ISO 8601 datetime string into timezone-aware UTC datetime."""
    dt = datetime.fromisoformat(iso_str)
    return ensure_utc(dt)


def is_expired(expires_at: Optional[datetime]) -> bool:
    """Check if a timestamp is in the past compared to current UTC time."""
    if expires_at is None:
        return False
    return ensure_utc(expires_at) < utc_now()
