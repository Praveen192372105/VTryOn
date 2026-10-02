import contextvars
import logging
import re
import time
import uuid
from typing import Callable, Optional
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.core.config import AppEnvironment, settings
from app.core.constants import ErrorCode

logger = logging.getLogger("vtryon.http")

SAFE_REQUEST_ID_REGEX = re.compile(r"^[A-Za-z0-9_\-\.:]{1,128}$")

# Context variable for holding request_id across the request execution context
request_id_ctx_var: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "request_id", default=None
)


def get_current_request_id() -> str:
    """Retrieve the current request ID from contextvars, or generate a fallback."""
    return request_id_ctx_var.get() or f"req_{uuid.uuid4().hex[:16]}"


def resolve_client_ip(request: Request) -> str:
    """
    Resolve client IP address safely.
    Only inspects X-Forwarded-For if TRUSTED_PROXY_HEADERS is explicitly enabled.
    """
    if settings.TRUSTED_PROXY_HEADERS and "x-forwarded-for" in request.headers:
        forwarded = request.headers["x-forwarded-for"].split(",")[0].strip()
        if forwarded:
            return forwarded
    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"


from app.core.metrics import metrics_registry


def get_route_template(request: Request) -> str:
    """
    Extract low-cardinality route template for Prometheus metrics and structured logging.
    Replaces dynamic public IDs with {id} placeholder if route template is not available in scope.
    """
    route = request.scope.get("route")
    if route and hasattr(route, "path") and route.path:
        return route.path
    path = request.url.path
    return re.sub(r"\b(usr|job|upl|out|res|fav)_[0-9A-Za-z]{10,40}\b", "{id}", path)


class RequestTracingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that captures or generates a bounded X-Request-ID,
    stores it in contextvars, measures request duration, and attaches it to response headers.
    """
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        incoming_request_id = request.headers.get("X-Request-ID")
        if incoming_request_id and SAFE_REQUEST_ID_REGEX.match(incoming_request_id):
            request_id = incoming_request_id
        else:
            request_id = f"req_{uuid.uuid4().hex[:16]}"

        token = request_id_ctx_var.set(request_id)
        request.state.request_id = request_id
        start_time = time.perf_counter()

        response: Response
        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(
                f"HTTP {request.method} {request.url.path} failed in {duration_ms}ms: {str(exc)}",
                exc_info=True,
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": duration_ms,
                    "status_code": 500,
                    "exception_type": exc.__class__.__name__,
                },
            )
            request_id_ctx_var.reset(token)
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "error": {
                        "code": ErrorCode.INTERNAL_SERVER_ERROR,
                        "message": "An unexpected internal server error occurred. Please contact support.",
                        "details": None,
                    },
                    "request_id": request_id,
                },
                headers={
                    "X-Request-ID": request_id,
                    "X-Content-Type-Options": "nosniff",
                    "Referrer-Policy": "no-referrer",
                },
            )

        duration_s = time.perf_counter() - start_time
        duration_ms = round(duration_s * 1000, 2)
        response.headers["X-Request-ID"] = request_id

        # Prometheus metrics & structured access logging with low-cardinality route template
        route_tmpl = get_route_template(request)
        if settings.METRICS_ENABLED:
            metrics_registry.record_http_request(
                method=request.method,
                route_template=route_tmpl,
                status_code=response.status_code,
                duration_seconds=duration_s,
            )

        if request.url.path not in ("/health", "/ready", "/api/v1/health/live", "/api/v1/health/ready", "/metrics"):
            logger.info(
                f"HTTP {request.method} {request.url.path} {response.status_code} ({duration_ms}ms)",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "route": route_tmpl,
                    "status_code": response.status_code,
                    "duration_ms": duration_ms,
                },
            )

        request_id_ctx_var.reset(token)
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Applies security headers to HTTP responses:
    - X-Content-Type-Options: nosniff
    - Referrer-Policy: no-referrer
    - Cache-Control: no-store, private on sensitive endpoints
    - Strict-Transport-Security in production when served over HTTPS
    """
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response: Response = await call_next(request)

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"

        # Apply private/no-store caching to sensitive API surfaces if not already defined
        path = request.url.path
        if any(path.startswith(p) for p in ("/api/v1/auth", "/api/v1/users", "/api/v1/uploads", "/api/v1/try-ons")):
            if "Cache-Control" not in response.headers:
                response.headers["Cache-Control"] = "no-store, private"

        # HSTS enforcement only in production with HTTPS
        if settings.APP_ENV == AppEnvironment.PRODUCTION and request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response


def setup_cors(app: FastAPI) -> None:
    """
    Configure strict CORS origins, methods, and headers based on typed environment settings.
    In development environments, also allows dynamic local ports and LAN origins via origin regex.
    """
    cors_origins = (
        list(settings.CORS_ORIGINS)
        if isinstance(settings.CORS_ORIGINS, (list, tuple))
        else [settings.CORS_ORIGINS]
    )
    origin_regex = None
    if settings.APP_ENV != AppEnvironment.PRODUCTION:
        origin_regex = r"^https?://(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.\d+\.\d+)(:\d+)?$"

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_origin_regex=origin_regex,
        allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
        allow_methods=settings.CORS_ALLOWED_METHODS,
        allow_headers=settings.CORS_ALLOWED_HEADERS,
        expose_headers=["X-Request-ID", "Location", "Retry-After"],
    )


__all__ = [
    "RequestTracingMiddleware",
    "SecurityHeadersMiddleware",
    "get_current_request_id",
    "resolve_client_ip",
    "setup_cors",
]
