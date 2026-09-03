import json
import logging
import re
import sys
from typing import Any, Dict, Optional

SENSITIVE_LOG_KEYS = {
    "authorization",
    "password",
    "password_hash",
    "access_token",
    "refresh_token",
    "refresh_token_hash",
    "jwt_secret",
    "secret",
    "secret_key",
    "cookie",
    "set-cookie",
    "database_url",
    "redis_url",
}

BEARER_TOKEN_REGEX = re.compile(r"(Bearer\s+)[A-Za-z0-9\-_.]+", re.IGNORECASE)
JWT_PATTERN_REGEX = re.compile(r"eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+")


def redact_sensitive_text(text: str) -> str:
    """Redact raw JWT and Bearer tokens from arbitrary text strings."""
    if not isinstance(text, str):
        return text
    text = BEARER_TOKEN_REGEX.sub(r"\1[REDACTED]", text)
    text = JWT_PATTERN_REGEX.sub("[REDACTED_JWT]", text)
    return text


def redact_sensitive_data(data: Any) -> Any:
    """Recursively traverse dictionaries and lists to redact known sensitive credentials."""
    if isinstance(data, dict):
        redacted = {}
        for k, v in data.items():
            if str(k).lower() in SENSITIVE_LOG_KEYS:
                redacted[k] = "[REDACTED]"
            else:
                redacted[k] = redact_sensitive_data(v)
        return redacted
    elif isinstance(data, list):
        return [redact_sensitive_data(item) for item in data]
    elif isinstance(data, tuple):
        return tuple(redact_sensitive_data(item) for item in data)
    elif isinstance(data, str):
        return redact_sensitive_text(data)
    return data


class JSONFormatter(logging.Formatter):
    """
    Format log records as structured JSON dictionaries for production observability.
    Applies automatic redaction of sensitive credentials, tokens, and authorization headers.
    """
    def format(self, record: logging.LogRecord) -> str:
        safe_message = redact_sensitive_text(record.getMessage())
        log_obj: Dict[str, Any] = {
            "timestamp": self.formatTime(record, self.datefmt or "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            "message": safe_message,
        }

        # Add contextual attributes if attached to record
        context_fields = [
            "request_id",
            "user_id",
            "method",
            "path",
            "status_code",
            "duration_ms",
            "event",
            "job_id",
            "task_id",
            "exception_type",
            "failure_code",
            "retry_count",
            "category",
        ]
        for field in context_fields:
            val = getattr(record, field, None)
            if val is not None:
                log_obj[field] = redact_sensitive_data(val)

        if record.exc_info:
            raw_exc = self.formatException(record.exc_info)
            log_obj["exception"] = redact_sensitive_text(raw_exc)

        return json.dumps(log_obj)


def setup_logging(debug: bool = False) -> logging.Logger:
    """
    Configure root application logger with centralized redaction.
    """
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG if debug else logging.INFO)

    # Reconfigure handlers with redaction JSONFormatter
    if not root_logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JSONFormatter())
        root_logger.addHandler(handler)
    else:
        for handler in root_logger.handlers:
            handler.setFormatter(JSONFormatter())

    # Suppress verbose 3rd party logs
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("passlib").setLevel(logging.ERROR)
    logging.getLogger("PIL").setLevel(logging.WARNING)

    return logging.getLogger("vtryon")


logger = setup_logging()

__all__ = [
    "logger",
    "setup_logging",
    "JSONFormatter",
    "redact_sensitive_text",
    "redact_sensitive_data",
    "SENSITIVE_LOG_KEYS",
]
