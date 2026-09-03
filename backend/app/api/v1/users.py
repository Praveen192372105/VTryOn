from fastapi import APIRouter, Depends, status

from app.api.dependencies import get_auth_service, get_current_user
from app.core.responses import ApiResponse
from app.domain.ownership import CurrentUser
from app.schemas.user import UserProfileResponse
from app.services.auth_service import AuthService

router = APIRouter(tags=["Users"])


@router.get(
    "/me",
    response_model=ApiResponse[UserProfileResponse],
    status_code=status.HTTP_200_OK,
    summary="Retrieve authenticated user profile",
    operation_id="get_current_user",
)
def get_current_user_profile(
    current_user: CurrentUser = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
) -> ApiResponse[UserProfileResponse]:
    profile = service.get_current_profile(current_user)
    return ApiResponse(data=profile)


__all__ = ["router"]
