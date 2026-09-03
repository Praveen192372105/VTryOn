from fastapi import APIRouter, Depends, Response, status

from app.api.dependencies import get_current_user, get_favorite_service
from app.core.responses import ApiResponse
from app.domain.ownership import CurrentUser
from app.schemas.favorite import FavoriteItemResponse
from app.schemas.pagination import PaginatedData, PaginationParams
from app.services.favorite_service import FavoriteService

router = APIRouter(tags=["Favorites"])


@router.get(
    "",
    response_model=ApiResponse[PaginatedData[FavoriteItemResponse]],
    status_code=status.HTTP_200_OK,
    summary="List all outfits favorited by authenticated user",
    operation_id="list_favorites",
)
def list_favorites(
    pagination: PaginationParams = Depends(),
    current_user: CurrentUser = Depends(get_current_user),
    service: FavoriteService = Depends(get_favorite_service),
) -> ApiResponse[PaginatedData[FavoriteItemResponse]]:
    paginated = service.list_favorites(user=current_user, pagination=pagination)
    return ApiResponse(data=paginated)


# Legacy compatibility endpoints (Excluded from OpenAPI schema)
@router.put(
    "/{outfit_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    include_in_schema=False,
)
def legacy_favorite_outfit(
    outfit_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    service: FavoriteService = Depends(get_favorite_service),
) -> Response:
    service.favorite_outfit(user=current_user, outfit_id=outfit_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete(
    "/{outfit_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    include_in_schema=False,
)
def legacy_unfavorite_outfit(
    outfit_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    service: FavoriteService = Depends(get_favorite_service),
) -> Response:
    service.unfavorite_outfit(user=current_user, outfit_id=outfit_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


__all__ = ["router"]
