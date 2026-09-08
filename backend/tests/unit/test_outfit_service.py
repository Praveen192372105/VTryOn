from unittest.mock import MagicMock
import pytest
from sqlalchemy.orm import Session

from app.core.exceptions import OutfitNotFoundError
from app.db.models.outfit import Outfit
from app.domain.enums import OutfitCategory
from app.domain.ownership import CurrentUser
from app.schemas.outfit import OutfitQueryFilter
from app.schemas.pagination import PaginationParams
from app.services.outfit_service import OutfitService


@pytest.fixture
def current_user():
    return CurrentUser(id=1, public_id="usr_01m1h000000000000000000001", email="user@example.com")


def test_outfit_service_list_active_and_enrich_favorite(db_session: Session, current_user):
    outfit1 = Outfit(
        public_id="out_01m1h000000000000000000001",
        name="Shirt",
        slug="shirt-test",
        category=OutfitCategory.UPPER_BODY.value,
        image_storage_key="outfits/samples/shirt.jpg",
        is_active=True,
        sort_order=1,
    )
    outfit2 = Outfit(
        public_id="out_01m1h000000000000000000002",
        name="Jeans",
        slug="jeans-test",
        category=OutfitCategory.LOWER_BODY.value,
        image_storage_key="outfits/samples/jeans.jpg",
        is_active=True,
        sort_order=2,
    )
    inactive_outfit = Outfit(
        public_id="out_01m1h000000000000000000003",
        name="Hidden",
        slug="hidden-test",
        category=OutfitCategory.DRESS.value,
        image_storage_key="outfits/samples/dress.jpg",
        is_active=False,
        sort_order=3,
    )
    db_session.add_all([outfit1, outfit2, inactive_outfit])
    db_session.commit()

    service = OutfitService(db=db_session)
    # Mock fav_repo batch call
    service.fav_repo.get_favorited_outfit_ids = MagicMock(return_value={outfit1.id})

    res = service.list_active_outfits(
        filters=OutfitQueryFilter(),
        pagination=PaginationParams(page=1, page_size=20),
        current_user=current_user,
    )

    assert res.pagination.total == 2
    assert len(res.items) == 2
    # Verify N+1 was eliminated: get_favorited_outfit_ids called exactly once
    service.fav_repo.get_favorited_outfit_ids.assert_called_once_with(current_user.id, [outfit1.id, outfit2.id])
    assert res.items[0].is_favorite is True
    assert res.items[1].is_favorite is False


def test_outfit_service_category_filtering(db_session: Session):
    outfit1 = Outfit(
        public_id="out_01m1h000000000000000000010",
        name="Shirt 1",
        slug="shirt-1",
        category=OutfitCategory.UPPER_BODY.value,
        image_storage_key="outfits/samples/s1.jpg",
        is_active=True,
    )
    outfit2 = Outfit(
        public_id="out_01m1h000000000000000000020",
        name="Dress 1",
        slug="dress-1",
        category=OutfitCategory.DRESS.value,
        image_storage_key="outfits/samples/d1.jpg",
        is_active=True,
    )
    db_session.add_all([outfit1, outfit2])
    db_session.commit()

    service = OutfitService(db=db_session)
    res = service.list_active_outfits(
        filters=OutfitQueryFilter(category=OutfitCategory.DRESS),
        pagination=PaginationParams(page=1, page_size=20),
    )
    assert res.pagination.total == 1
    assert res.items[0].category == OutfitCategory.DRESS


def test_outfit_service_get_active_and_inactive(db_session: Session):
    active = Outfit(
        public_id="out_01m1h000000000000000000030",
        name="Active Outfit",
        slug="active-outfit",
        category=OutfitCategory.UPPER_BODY.value,
        image_storage_key="outfits/samples/active.jpg",
        is_active=True,
    )
    inactive = Outfit(
        public_id="out_01m1h000000000000000000040",
        name="Inactive Outfit",
        slug="inactive-outfit",
        category=OutfitCategory.UPPER_BODY.value,
        image_storage_key="outfits/samples/inactive.jpg",
        is_active=False,
    )
    db_session.add_all([active, inactive])
    db_session.commit()

    service = OutfitService(db=db_session)
    # Active returns valid DTO
    dto = service.get_active_outfit(active.public_id)
    assert dto.id == active.public_id
    assert dto.name == "Active Outfit"

    # Inactive raises 404
    with pytest.raises(OutfitNotFoundError):
        service.get_active_outfit(inactive.public_id)

    # Missing raises 404
    with pytest.raises(OutfitNotFoundError):
        service.get_active_outfit("out_01m1hnonexistent00000000000")


def test_outfit_service_create_custom_outfit(db_session: Session, current_user):
    import io
    from PIL import Image
    from app.core.exceptions import InvalidImageError

    # 1. Valid custom outfit upload
    img = Image.new("RGB", (300, 400), color=(100, 150, 200))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    jpeg_bytes = buf.getvalue()

    service = OutfitService(db=db_session)
    res = service.create_custom_outfit(
        user=current_user,
        filename="my_custom_jacket.jpg",
        content=jpeg_bytes,
        name="My Custom Jacket",
        category="upper_body",
    )

    assert res.id.startswith("out_")
    assert res.name == "My Custom Jacket"
    assert res.category == OutfitCategory.UPPER_BODY
    assert res.is_active is True
    assert "outfits/custom/" in res.image_url

    # Check persistence in database
    retrieved = service.get_active_outfit(res.id)
    assert retrieved.name == "My Custom Jacket"
    assert retrieved.category == OutfitCategory.UPPER_BODY

    # 2. Corrupted bytes raises InvalidImageError
    with pytest.raises(InvalidImageError):
        service.create_custom_outfit(
            user=current_user,
            filename="corrupt.jpg",
            content=b"not_an_image_corrupted_data",
            name="Corrupt",
        )
