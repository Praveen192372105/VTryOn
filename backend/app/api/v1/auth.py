from fastapi import APIRouter, Depends, Request, Response, status

from app.api.dependencies import get_auth_service
from app.core.config import settings
from app.core.middleware import resolve_client_ip
from app.core.rate_limit import (
    RateLimiter,
    enforce_rate_limit,
    fingerprint_credential,
    get_rate_limiter,
)
from app.core.responses import ApiResponse
from app.schemas.auth import (
    LoginRequest,
    LogoutRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
)
from app.services.auth_service import AuthService

router = APIRouter(tags=["Authentication"])


@router.post(
    "/register",
    response_model=ApiResponse[TokenResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account and receive session tokens",
    operation_id="register_user",
)
def register(
    payload: RegisterRequest,
    request: Request,
    service: AuthService = Depends(get_auth_service),
    limiter: RateLimiter = Depends(get_rate_limiter),
) -> ApiResponse[TokenResponse]:
    client_ip = resolve_client_ip(request)
    enforce_rate_limit(
        limiter,
        key=f"auth:register:ip:{client_ip}",
        limit=settings.RATE_LIMIT_REGISTER_PER_HOUR,
        window_seconds=3600,
        error_message="Too many account registration attempts. Please try again later.",
    )
    token_response = service.register(payload)
    return ApiResponse(data=token_response)


@router.post(
    "/login",
    response_model=ApiResponse[TokenResponse],
    status_code=status.HTTP_200_OK,
    summary="Authenticate credentials and receive session tokens",
    operation_id="login_user",
)
def login(
    payload: LoginRequest,
    request: Request,
    service: AuthService = Depends(get_auth_service),
    limiter: RateLimiter = Depends(get_rate_limiter),
) -> ApiResponse[TokenResponse]:
    client_ip = resolve_client_ip(request)
    email_fp = fingerprint_credential(payload.email)
    # Per-account rate limit
    enforce_rate_limit(
        limiter,
        key=f"auth:login:acc:{email_fp}",
        limit=settings.RATE_LIMIT_LOGIN_PER_MINUTE,
        window_seconds=60,
        error_message="Too many failed login attempts for this account. Please try again shortly.",
    )
    # Per-IP rate limit
    enforce_rate_limit(
        limiter,
        key=f"auth:login:ip:{client_ip}",
        limit=settings.RATE_LIMIT_LOGIN_PER_IP_PER_MINUTE,
        window_seconds=60,
        error_message="Too many login requests from your IP address. Please try again shortly.",
    )
    token_response = service.login(payload)
    return ApiResponse(data=token_response)


@router.post(
    "/refresh",
    response_model=ApiResponse[TokenResponse],
    status_code=status.HTTP_200_OK,
    summary="Rotate refresh token and issue fresh access token",
    operation_id="refresh_auth_session",
)
def refresh_token(
    payload: RefreshTokenRequest,
    service: AuthService = Depends(get_auth_service),
) -> ApiResponse[TokenResponse]:
    token_response = service.refresh(payload.refresh_token)
    return ApiResponse(data=token_response)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Revoke active refresh token session",
    operation_id="logout_user",
)
def logout(
    payload: LogoutRequest,
    service: AuthService = Depends(get_auth_service),
) -> Response:
    service.logout(payload.refresh_token)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


__all__ = ["router"]
