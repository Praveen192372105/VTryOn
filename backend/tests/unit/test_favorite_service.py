import pytest
from sqlalchemy.orm import Session

from app.core.exceptions import OutfitNotFoundError
from app.db.models.outfit import Outfit
from app.domain.enums import OutfitCategory
from app.domain.ownership import CurrentUser
from app.schemas.pagination import PaginationParams
from app.services.favorite_service import FavoriteService


from app.db.models.user import User


@pytest.fixture
def user(db_session: Session):
    db_user = User(
        public_id="usr_01m1hfavtest0000000000001",
        email="fav@example.com",
        name="Fav Test",
        hashed_password="hash",
    )
    db_session.add(db_user)
    db_session.commit()
    return CurrentUser(id=db_user.id, public_id=db_user.public_id, email=db_user.email)


def test_favorite_service_idempotent_add_and_remove(db_session: Session, user):
    outfit = Outfit(
        public_id="out_01m1hfav000000000000000001",
        name="Linen Shirt",
        slug="linen-shirt-fav",
        category=OutfitCategory.UPPER_BODY.value,
        image_storage_key="outfits/samples/linen.jpg",
        is_active=True,
    )
    db_session.add(outfit)
    db_session.commit()

    service = FavoriteService(db=db_session)

    # 1. First favorite call
    res1 = service.favorite_outfit(user=user, outfit_id=outfit.public_id)
    assert res1.is_favorite is True
    assert res1.outfit_id == outfit.public_id

    # 2. Second favorite call (idempotent desired state)
    res2 = service.favorite_outfit(user=user, outfit_id=outfit.public_id)
    assert res2.is_favorite is True

    # 3. List favorites
    fav_list = service.list_favorites(user=user, pagination=PaginationParams(page=1, page_size=20))
    assert fav_list.pagination.total == 1
    assert fav_list.items[0].outfit.id == outfit.public_id

    # 4. First unfavorite call
    unfav1 = service.unfavorite_outfit(user=user, outfit_id=outfit.public_id)
    assert unfav1.is_favorite is False

    # 5. Second unfavorite call (idempotent removal)
    unfav2 = service.unfavorite_outfit(user=user, outfit_id=outfit.public_id)
    assert unfav2.is_favorite is False

    # 6. List favorites now empty
    fav_list_empty = service.list_favorites(user=user, pagination=PaginationParams(page=1, page_size=20))
    assert fav_list_empty.pagination.total == 0


def test_favorite_service_rejects_inactive_outfit(db_session: Session, user):
    inactive = Outfit(
        public_id="out_01m1hfav000000000000000002",
        name="Deactivated Dress",
        slug="deactivated-dress",
        category=OutfitCategory.DRESS.value,
        image_storage_key="outfits/samples/dress.jpg",
        is_active=False,
    )
    db_session.add(inactive)
    db_session.commit()

    service = FavoriteService(db=db_session)
    with pytest.raises(OutfitNotFoundError):
        service.favorite_outfit(user=user, outfit_id=inactive.public_id)
