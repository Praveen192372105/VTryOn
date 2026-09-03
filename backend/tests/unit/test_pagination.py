import pytest
from pydantic import ValidationError

from app.schemas.pagination import PaginationParams, calculate_pagination


def test_pagination_params_defaults():
    params = PaginationParams()
    assert params.page == 1
    assert params.page_size == 20
    assert params.offset == 0
    assert params.limit == 20


def test_pagination_params_offset_calculation():
    params = PaginationParams(page=3, page_size=15)
    assert params.page == 3
    assert params.page_size == 15
    assert params.offset == 30
    assert params.limit == 15


def test_pagination_params_bounds():
    # Negative or zero page must be rejected
    with pytest.raises(ValidationError):
        PaginationParams(page=0, page_size=20)

    # Page size > 100 must be rejected
    with pytest.raises(ValidationError):
        PaginationParams(page=1, page_size=101)


def test_calculate_pagination_zero_total():
    meta = calculate_pagination(total=0, page=1, page_size=20)
    assert meta.total == 0
    assert meta.total_pages == 0
    assert meta.page == 1
    assert meta.page_size == 20


def test_calculate_pagination_multiple_pages():
    meta = calculate_pagination(total=45, page=2, page_size=20)
    assert meta.total == 45
    assert meta.total_pages == 3
    assert meta.page == 2
    assert meta.page_size == 20


def test_calculate_pagination_exact_multiple():
    meta = calculate_pagination(total=40, page=1, page_size=20)
    assert meta.total == 40
    assert meta.total_pages == 2
