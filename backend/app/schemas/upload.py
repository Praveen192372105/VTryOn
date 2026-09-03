from datetime import datetime
from typing import Optional
from pydantic import Field

from app.domain.enums import UploadStatus
from app.schemas.common import BaseSchema


class PersonUploadResponse(BaseSchema):
    """
    Representation of an uploaded person image metadata and client URL.
    """
    id: str = Field(..., description="Public identifier of upload (upl_...)")
    original_filename: str = Field(..., description="Original client-supplied file name")
    mime_type: str = Field(..., description="MIME content type (e.g. image/jpeg)")
    width: Optional[int] = Field(default=None, description="Image pixel width")
    height: Optional[int] = Field(default=None, description="Image pixel height")
    size_bytes: int = Field(..., description="File size in bytes")
    status: UploadStatus = Field(default=UploadStatus.ACTIVE, description="Lifecycle status")
    image_url: str = Field(..., description="Web-accessible URL for viewing the image")
    created_at: datetime
    updated_at: Optional[datetime] = None


class PersonUploadListItem(BaseSchema):
    """
    Summary view of a person upload for paginated collections.
    """
    id: str = Field(..., description="Public identifier of upload (upl_...)")
    mime_type: str
    width: Optional[int] = None
    height: Optional[int] = None
    size_bytes: int
    status: UploadStatus
    image_url: str
    created_at: datetime
