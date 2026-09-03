from sqlalchemy.orm import Session

from app.db.models.outfit import Outfit
from app.domain.enums import OutfitCategory
from app.repositories.outfit_repository import OutfitRepository
from app.schemas.pagination import PaginationParams


def test_outfit_repository_crud_and_ordering(db_session: Session):
    repo = OutfitRepository(db_session)

    # Create 3 outfits with distinct sort orders
    o1 = repo.create(
        name="Outfit C",
        slug="outfit-c",
        category=OutfitCategory.UPPER_BODY,
        storage_key="outfits/c.jpg",
        sort_order=3,
        public_id="out_01m1hrepo0000000000000001",
    )
    o2 = repo.create(
        name="Outfit A",
        slug="outfit-a",
        category=OutfitCategory.UPPER_BODY,
        storage_key="outfits/a.jpg",
        sort_order=1,
        public_id="out_01m1hrepo0000000000000002",
    )
    o3 = repo.create(
        name="Outfit B",
        slug="outfit-b",
        category=OutfitCategory.LOWER_BODY,
        storage_key="outfits/b.jpg",
        sort_order=2,
        public_id="out_01m1hrepo0000000000000003",
    )
    db_session.commit()

    # Verify listing is ordered by sort_order ASC
    items, total = repo.list_active(pagination=PaginationParams(page=1, page_size=10))
    assert total == 3
    assert items[0].id == o2.id  # sort_order 1
    assert items[1].id == o3.id  # sort_order 2
    assert items[2].id == o1.id  # sort_order 3


def test_outfit_repository_upsert_seed(db_session: Session):
    repo = OutfitRepository(db_session)

    # 1. Insert new
    outfit, created, updated = repo.upsert_seed_outfit(
        public_id="out_01m1hseed000000000000001",
        name="Initial Shirt",
        slug="seed-shirt",
        category=OutfitCategory.UPPER_BODY,
        storage_key="outfits/seed_s.jpg",
        sort_order=10,
    )
    db_session.commit()
    assert created is True
    assert updated is False
    assert outfit.name == "Initial Shirt"

    # 2. Re-run identical (unchanged)
    outfit2, created2, updated2 = repo.upsert_seed_outfit(
        public_id="out_01m1hseed000000000000001",
        name="Initial Shirt",
        slug="seed-shirt",
        category=OutfitCategory.UPPER_BODY,
        storage_key="outfits/seed_s.jpg",
        sort_order=10,
    )
    db_session.commit()
    assert created2 is False
    assert updated2 is False

    # 3. Re-run with mutated name and sort order (updated)
    outfit3, created3, updated3 = repo.upsert_seed_outfit(
        public_id="out_01m1hseed000000000000001",
        name="Updated Linen Shirt",
        slug="seed-shirt",
        category=OutfitCategory.UPPER_BODY,
        storage_key="outfits/seed_s.jpg",
        sort_order=5,
    )
    db_session.commit()
    assert created3 is False
    assert updated3 is True
    assert outfit3.name == "Updated Linen Shirt"
    assert outfit3.sort_order == 5
