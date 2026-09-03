import math
from typing import Generic, List, TypeVar
from pydantic import BaseModel, Field, field_validator

from app.core.constants import DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE

T = TypeVar("T")


class PaginationParams(BaseModel):
    page: int = Field(default=DEFAULT_PAGE, ge=1, description="1-indexed page number")
    page_size: int = Field(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE, description="Number of items per page (max 100)")

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size


class PaginationMetadata(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int


class PaginatedData(BaseModel, Generic[T]):
    items: List[T]
    pagination: PaginationMetadata


def calculate_pagination(total: int, page: int, page_size: int) -> PaginationMetadata:
    """
    Calculate pagination metadata safely, ensuring total=0 results in total_pages=0.
    """
    if total <= 0:
        total_pages = 0
    else:
        total_pages = math.ceil(total / page_size)

    return PaginationMetadata(
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages,
    )
