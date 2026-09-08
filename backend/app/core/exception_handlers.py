import logging
from typing import Any, Dict, List
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.constants import ErrorCode
from app.core.exceptions import AppError
from app.core.middleware import get_current_request_id

logger = logging.getLogger("vtryon.errors")


def register_exception_handlers(app: FastAPI) -> None:
    """
    Register centralized exception handlers for FastAPI.
    Enforces the uniform error JSON contract across the application.
    """

    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None) or get_current_request_id()
        
        logger.warning(
            f"AppError: [{exc.code}] {exc.message}",
            extra={
                "request_id": request_id,
                "path": request.url.path,
                "method": request.method,
                "status_code": exc.status_code,
                "exception_type": exc.__class__.__name__,
            },
        )

        headers = {"X-Request-ID": request_id}
        if exc.status_code == status.HTTP_401_UNAUTHORIZED:
            headers["WWW-Authenticate"] = "Bearer"
        if getattr(exc, "retry_after", None) is not None:
            headers["Retry-After"] = str(exc.retry_after)

        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                },
                "request_id": request_id,
            },
            headers=headers,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None) or get_current_request_id()
        
        sensitive_fields = {"password", "token", "secret", "authorization", "credential"}
        details: List[Dict[str, Any]] = []
        for err in exc.errors():
            loc = err.get("loc", [])
            field = ".".join(str(item) for item in loc if item not in ("body", "query", "path")) or "body"
            msg = err.get("msg", "Invalid value")
            # If sensitive field, normalize message to avoid reflection of input
            if any(s in field.lower() for s in sensitive_fields):
                msg = "Invalid value provided."
            details.append({
                "field": field,
                "message": msg,
            })

        http_422 = getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422)
        logger.info(
            f"RequestValidationError: {details}",
            extra={
                "request_id": request_id,
                "path": request.url.path,
                "method": request.method,
                "status_code": http_422,
            },
        )

        return JSONResponse(
            status_code=http_422,
            content={
                "success": False,
                "error": {
                    "code": ErrorCode.VALIDATION_ERROR,
                    "message": "One or more request fields are invalid.",
                    "details": details,
                },
                "request_id": request_id,
            },
            headers={"X-Request-ID": request_id},
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None) or get_current_request_id()
        
        code = ErrorCode.APP_ERROR
        if exc.status_code == status.HTTP_404_NOT_FOUND:
            code = ErrorCode.NOT_FOUND
        elif exc.status_code == status.HTTP_401_UNAUTHORIZED:
            code = ErrorCode.UNAUTHORIZED
        elif exc.status_code == status.HTTP_403_FORBIDDEN:
            code = ErrorCode.FORBIDDEN
        elif exc.status_code == status.HTTP_503_SERVICE_UNAVAILABLE:
            code = ErrorCode.SERVICE_UNAVAILABLE

        response_headers = {"X-Request-ID": request_id}
        if exc.headers:
            response_headers.update(exc.headers)

        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "code": code,
                    "message": str(exc.detail) if exc.detail else "An HTTP error occurred.",
                    "details": None,
                },
                "request_id": request_id,
            },
            headers=response_headers,
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None) or get_current_request_id()
        
        logger.error(
            f"Unhandled exception during request processing: {str(exc)}",
            exc_info=True,
            extra={
                "request_id": request_id,
                "path": request.url.path,
                "method": request.method,
                "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
                "exception_type": exc.__class__.__name__,
            },
        )

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {
                    "code": ErrorCode.INTERNAL_SERVER_ERROR,
                    "message": "An unexpected internal server error occurred. Please contact support.",
                    "details": None,
                },
                "request_id": request_id,
            },
            headers={"X-Request-ID": request_id},
        )
