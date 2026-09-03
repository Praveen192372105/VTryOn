from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class ApiErrorDetail(BaseModel):
    field: Optional[str] = None
    message: str


class ApiError(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None


class ApiErrorResponse(BaseModel):
    success: bool = False
    error: ApiError
    request_id: Optional[str] = None


class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T


class HealthData(BaseModel):
    status: str = "healthy"
    service: str
    version: str


class DependencyChecks(BaseModel):
    database: str
    redis: str
    storage: str


class ReadinessData(BaseModel):
    status: str
    checks: DependencyChecks
