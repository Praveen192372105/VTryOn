from sqlalchemy.orm import Session

from app.db.models.outfit import Outfit
from app.domain.enums import OutfitCategory
from app.repositories.favorite_repository import FavoriteRepository
from app.schemas.pagination import PaginationParams


def test_favorite_repository_batch_check_and_inactive_filtering(db_session: Session):
    fav_repo = FavoriteRepository(db_session)

    # Setup 2 outfits: 1 active, 1 inactive
    active_outfit = Outfit(
        public_id="out_01m1hfavrep00000000000001",
        name="Active Garment",
        slug="active-garment",
        category=OutfitCategory.UPPER_BODY.value,
        image_storage_key="outfits/act.jpg",
        is_active=True,
    )
    inactive_outfit = Outfit(
        public_id="out_01m1hfavrep00000000000002",
        name="Inactive Garment",
        slug="inactive-garment",
        category=OutfitCategory.LOWER_BODY.value,
        image_storage_key="outfits/inact.jpg",
        is_active=False,
    )
    db_session.add_all([active_outfit, inactive_outfit])
    from app.db.models.user import User
    user = User(
        public_id="usr_01m1hfavrepuser0000000001",
        email="favrep@example.com",
        name="Fav Rep User",
        hashed_password="hash",
    )
    db_session.add(user)
    db_session.flush()
    user_id = user.id

    # Add favorites for both
    fav_repo.add(user_id=user_id, outfit_id=active_outfit.id)
    fav_repo.add(user_id=user_id, outfit_id=inactive_outfit.id)
    db_session.commit()

    # Verify batch check returns both IDs
    fav_ids = fav_repo.get_favorited_outfit_ids(user_id, [active_outfit.id, inactive_outfit.id])
    assert fav_ids == {active_outfit.id, inactive_outfit.id}

    # Verify list_by_user_id filters out the inactive outfit!
    items, total = fav_repo.list_by_user_id(user_id=user_id, pagination=PaginationParams(page=1, page_size=10))
    assert total == 1
    assert len(items) == 1
    assert items[0].outfit_id == active_outfit.id
