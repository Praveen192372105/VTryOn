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


STATUS_COLORS = {
    "2": "\033[1;32m",  # 2xx: Bold Green (200, 201, 204)
    "3": "\033[1;36m",  # 3xx: Bold Cyan (301, 302, 304, 307)
    "4": "\033[1;33m",  # 4xx: Bold Yellow (400, 401, 403, 404, 422, 429)
    "5": "\033[1;31m",  # 5xx: Bold Red (500, 502, 503)
}
METHOD_COLORS = {
    "GET": "\033[1;34m",     # Bold Blue
    "POST": "\033[1;32m",    # Bold Green
    "PUT": "\033[1;35m",     # Bold Magenta
    "PATCH": "\033[1;35m",   # Bold Magenta
    "DELETE": "\033[1;31m",  # Bold Red
    "OPTIONS": "\033[1;36m", # Bold Cyan
    "HEAD": "\033[1;36m",    # Bold Cyan
}
COLOR_RESET = "\033[0m"


def format_colored_status(status_code: Any) -> str:
    """Returns ANSI colorized status code string."""
    code_str = str(status_code)
    prefix = code_str[:1]
    color = STATUS_COLORS.get(prefix, "\033[1;37m")
    return f"{color}{code_str}{COLOR_RESET}"


def format_colored_method(method: str) -> str:
    """Returns ANSI colorized HTTP method string."""
    m = method.upper()
    color = METHOD_COLORS.get(m, "\033[1;37m")
    return f"{color}{m}{COLOR_RESET}"


def _enable_windows_ansi() -> None:
    """Enable VT100 virtual terminal processing on Windows terminals."""
    if sys.platform == "win32":
        try:
            import ctypes
            kernel32 = ctypes.windll.kernel32
            handle = kernel32.GetStdHandle(-11)  # STD_OUTPUT_HANDLE
            mode = ctypes.c_ulong()
            if kernel32.GetConsoleMode(handle, ctypes.byref(mode)):
                kernel32.SetConsoleMode(handle, mode.value | 0x0004)  # ENABLE_VIRTUAL_TERMINAL_PROCESSING
        except Exception:
            pass


class JSONFormatter(logging.Formatter):
    """
    Format log records as structured JSON dictionaries for production observability.
    Applies automatic redaction of sensitive credentials, tokens, and authorization headers.
    Optionally colorizes HTTP status codes and methods for interactive console display.
    """
    def __init__(self, datefmt: Optional[str] = None, colorize: bool = True):
        super().__init__(datefmt=datefmt)
        self.colorize = colorize

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

        raw_json = json.dumps(log_obj)

        if self.colorize:
            status_code = getattr(record, "status_code", None)
            method = getattr(record, "method", None)

            if status_code is not None:
                code_str = str(status_code)
                colored_status = format_colored_status(status_code)
                raw_json = raw_json.replace(f" {code_str} ", f" {colored_status} ").replace(
                    f'"status_code": {code_str}', f'"status_code": {colored_status}'
                )

            if method and isinstance(method, str):
                colored_method = format_colored_method(method)
                raw_json = raw_json.replace(f"HTTP {method} ", f"HTTP {colored_method} ").replace(
                    f'"method": "{method}"', f'"method": "{colored_method}"'
                )

        return raw_json


def setup_logging(debug: bool = False, colorize: bool = True) -> logging.Logger:
    """
    Configure root application logger with centralized redaction and colorized console output.
    """
    _enable_windows_ansi()

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG if debug else logging.INFO)

    formatter = JSONFormatter(colorize=colorize)

    # Reconfigure handlers with redaction JSONFormatter
    if not root_logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(formatter)
        root_logger.addHandler(handler)
    else:
        for handler in root_logger.handlers:
            handler.setFormatter(formatter)

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
