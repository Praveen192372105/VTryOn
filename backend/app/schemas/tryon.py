from datetime import datetime
from typing import Optional
from pydantic import Field, field_validator, computed_field

from app.domain.enums import FailureCode, TryOnJobStatus
from app.domain.ids import ResourcePrefix, validate_public_id
from app.schemas.common import BaseSchema


class CreateTryOnRequest(BaseSchema):
    """
    Request payload for queuing a new Virtual Try-On job.
    References owned person upload and active catalogue outfit.
    """
    person_upload_id: str = Field(..., description="Public identifier of owned person upload (upl_...)")
    outfit_id: str = Field(..., description="Public identifier of catalogue outfit (out_...)")

    @field_validator("person_upload_id")
    @classmethod
    def validate_person_upload_id(cls, v: str) -> str:
        if not validate_public_id(v, expected_prefix=ResourcePrefix.UPLOAD):
            raise ValueError(f"Invalid person_upload_id format: '{v}'. Expected 'upl_<id>'")
        return v

    @field_validator("outfit_id")
    @classmethod
    def validate_outfit_id(cls, v: str) -> str:
        if not validate_public_id(v, expected_prefix=ResourcePrefix.OUTFIT):
            raise ValueError(f"Invalid outfit_id format: '{v}'. Expected 'out_<id>'")
        return v


class TryOnErrorResponse(BaseSchema):
    """
    Sanitized, client-actionable error payload for failed try-on jobs.
    """
    code: str = Field(..., description="Machine-readable failure classification code")
    message: str = Field(..., description="Client-friendly failure explanation")


class TryOnResultResponse(BaseSchema):
    """
    Generated virtual try-on result metadata and web image URL.
    """
    id: str = Field(..., description="Public identifier of the result (res_...)")
    image_url: str = Field(..., description="Private authenticated image URL for result delivery")
    width: int = Field(..., description="Generated image pixel width")
    height: int = Field(..., description="Generated image pixel height")
    mime_type: str = Field(default="image/jpeg", description="MIME type of result image")
    model_version: Optional[str] = Field(default=None, description="Semantic model version used for generative inference")
    inference_config_version: Optional[str] = Field(default=None, description="Inference configuration version applied")
    created_at: datetime


class TryOnResponse(BaseSchema):
    """
    Authoritative virtual try-on job state and result payload.
    Deliberately excludes any fine-grained numeric 'progress' field.
    """
    id: str = Field(..., description="Public identifier of try-on job (job_...)")
    status: str = Field(..., description="Authoritative job state: queued | processing | succeeded | failed")
    person_upload_id: str = Field(..., description="Person upload reference ID")
    outfit_id: str = Field(..., description="Outfit reference ID")
    result: Optional[TryOnResultResponse] = Field(default=None, description="Result metadata when status is succeeded")
    error: Optional[TryOnErrorResponse] = Field(default=None, description="Sanitized error details when status is failed")
    idempotency_key: Optional[str] = Field(default=None, description="Client idempotency key if provided upon submission")
    created_at: datetime = Field(..., description="Job submission timestamp")
    started_at: Optional[datetime] = Field(default=None, description="Inference start timestamp")
    finished_at: Optional[datetime] = Field(default=None, description="Job completion timestamp")

    # Backward compatibility properties
    @computed_field
    def job_id(self) -> str:
        return self.id

    @computed_field
    def processing_started_at(self) -> Optional[datetime]:
        return self.started_at

    @computed_field
    def completed_at(self) -> Optional[datetime]:
        return self.finished_at

    @computed_field
    def failure_code(self) -> Optional[str]:
        return self.error.code if self.error else None

    @computed_field
    def failure_reason(self) -> Optional[str]:
        return self.error.message if self.error else None


# Backward-compatible alias
TryOnJobResponse = TryOnResponse
TryOnJobCreatedResponse = TryOnResponse


class TryOnOutfitSummary(BaseSchema):
    """Summary of the outfit item associated with a historical try-on job."""
    id: str = Field(..., description="Outfit public ID (out_...)")
    name: str = Field(..., description="Outfit display name")
    category: str = Field(..., description="Garment category")
    thumbnail_url: Optional[str] = Field(default=None, description="Outfit image URL")


class TryOnResultSummary(BaseSchema):
    """Summary of result metadata in historical try-on listings."""
    id: str = Field(..., description="Result public ID (res_...)")
    image_url: str = Field(..., description="Authenticated result content URL")
    width: int
    height: int
    model_version: Optional[str] = None


class TryOnListItem(BaseSchema):
    """
    Summary view of a try-on job for paginated user history.
    """
    id: str = Field(..., description="Public identifier of try-on job (job_...)")
    status: str = Field(..., description="Job status: queued | processing | succeeded | failed")
    person_upload_id: str
    outfit: Optional[TryOnOutfitSummary] = None
    result: Optional[TryOnResultSummary] = None
    error: Optional[TryOnErrorResponse] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None

    # Backward compatibility properties
    @computed_field
    def job_id(self) -> str:
        return self.id

    @computed_field
    def outfit_id(self) -> str:
        return self.outfit.id if self.outfit else ""

    @computed_field
    def completed_at(self) -> Optional[datetime]:
        return self.finished_at

    @computed_field
    def result_image_url(self) -> Optional[str]:
        return self.result.image_url if self.result else None


# Backward-compatible alias
TryOnJobListItem = TryOnListItem


class TryOnQueryFilter(BaseSchema):
    """
    Query parameters for filtering try-on job history.
    """
    status: Optional[str] = Field(default=None, description="Filter by job execution status")
    created_after: Optional[datetime] = Field(default=None, description="Filter jobs created after timestamp")
    created_before: Optional[datetime] = Field(default=None, description="Filter jobs created before timestamp")


__all__ = [
    "CreateTryOnRequest",
    "TryOnErrorResponse",
    "TryOnResultResponse",
    "TryOnResponse",
    "TryOnJobResponse",
    "TryOnJobCreatedResponse",
    "TryOnOutfitSummary",
    "TryOnResultSummary",
    "TryOnListItem",
    "TryOnJobListItem",
    "TryOnQueryFilter",
]
