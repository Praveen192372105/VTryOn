from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

from app.domain.ids import ResourcePrefix, validate_public_id

T = TypeVar("T")


class BaseSchema(BaseModel):
    """Base schema with standard serialization configurations."""
    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
    }


class IdResponse(BaseSchema):
    id: str = Field(..., description="Canonical public resource identifier")


class MessageResponse(BaseSchema):
    message: str


class SuccessResponse(BaseSchema, Generic[T]):
    """Standard success API response envelope."""
    success: bool = Field(default=True, description="Indicates successful request completion")
    message: Optional[str] = Field(default=None, description="Optional informational message")
    data: Optional[T] = Field(default=None, description="Payload data")


class ErrorResponse(BaseSchema):
    """Standard error API response envelope."""
    success: bool = Field(default=False, description="Indicates request failure")
    error_code: str = Field(..., description="Machine-readable error classification code")
    message: str = Field(..., description="Human-readable description of error")
    details: Optional[Any] = Field(default=None, description="Optional validation details")


class PublicIdField(str):
    """Custom type helper for validating resource public IDs."""
    @classmethod
    def validate(cls, v: Any, prefix: Optional[ResourcePrefix] = None) -> str:
        if not isinstance(v, str) or not validate_public_id(v, expected_prefix=prefix):
            expected = f" with prefix '{prefix.value}'" if prefix else ""
            raise ValueError(f"Invalid public identifier format{expected}: '{v}'")
        return v
