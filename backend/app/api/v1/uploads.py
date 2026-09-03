from fastapi import APIRouter, Depends, File, Response, UploadFile, status

from app.api.dependencies import get_current_user, get_upload_service
from app.core.config import settings
from app.core.rate_limit import RateLimiter, enforce_rate_limit, get_rate_limiter
from app.core.responses import ApiResponse
from app.domain.ownership import CurrentUser
from app.schemas.pagination import PaginatedData, PaginationParams
from app.schemas.upload import PersonUploadListItem, PersonUploadResponse
from app.services.upload_service import UploadService
from app.utils.files import read_upload_limited

router = APIRouter(tags=["Uploads"])


@router.post(
    "/person",
    response_model=ApiResponse[PersonUploadResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Upload and validate a person try-on image",
    operation_id="upload_person_image",
)
@router.post(
    "",
    response_model=ApiResponse[PersonUploadResponse],
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
async def upload_person_image(
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(get_current_user),
    service: UploadService = Depends(get_upload_service),
    limiter: RateLimiter = Depends(get_rate_limiter),
) -> ApiResponse[PersonUploadResponse]:
    enforce_rate_limit(
        limiter,
        key=f"upload:user:{current_user.public_id}",
        limit=settings.RATE_LIMIT_UPLOAD_PER_MINUTE,
        window_seconds=60,
        error_message="Too many upload requests. Please try again shortly.",
    )
    content = await read_upload_limited(file, max_bytes=settings.MAX_UPLOAD_BYTES)
    upload_dto = service.create_person_upload(
        user=current_user,
        filename=file.filename or "upload.jpg",
        content=content,
        mime_type=file.content_type or "image/jpeg",
    )
    return ApiResponse(data=upload_dto)


@router.get(
    "",
    response_model=ApiResponse[PaginatedData[PersonUploadListItem]],
    status_code=status.HTTP_200_OK,
    summary="List active uploaded images for authenticated user",
    operation_id="list_person_uploads",
)
@router.get(
    "/person",
    response_model=ApiResponse[PaginatedData[PersonUploadListItem]],
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
def list_person_uploads(
    pagination: PaginationParams = Depends(),
    current_user: CurrentUser = Depends(get_current_user),
    service: UploadService = Depends(get_upload_service),
) -> ApiResponse[PaginatedData[PersonUploadListItem]]:
    paginated = service.list_person_uploads(user=current_user, pagination=pagination)
    return ApiResponse(data=paginated)


@router.get(
    "/{upload_id}",
    response_model=ApiResponse[PersonUploadResponse],
    status_code=status.HTTP_200_OK,
    summary="Retrieve metadata of an owned uploaded image",
    operation_id="get_person_upload",
)
@router.get(
    "/person/{upload_id}",
    response_model=ApiResponse[PersonUploadResponse],
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
def get_person_upload(
    upload_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    service: UploadService = Depends(get_upload_service),
) -> ApiResponse[PersonUploadResponse]:
    upload_dto = service.get_owned_upload(user=current_user, upload_id=upload_id)
    return ApiResponse(data=upload_dto)


@router.delete(
    "/{upload_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Delete an owned uploaded image (if not in use)",
    operation_id="delete_person_upload",
)
@router.delete(
    "/person/{upload_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    include_in_schema=False,
)
def delete_person_upload(
    upload_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    service: UploadService = Depends(get_upload_service),
) -> Response:
    service.delete_owned_upload(user=current_user, upload_id=upload_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


__all__ = ["router"]
