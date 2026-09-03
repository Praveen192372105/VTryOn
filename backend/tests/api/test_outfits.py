from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.models.outfit import Outfit
from app.db.models.user import User
from app.domain.enums import OutfitCategory
from app.core.security import create_access_token, get_password_hash


def create_test_user_and_token(db_session: Session, email="test_api_outfits@example.com") -> tuple[User, str]:
    user = User(
        public_id="usr_01m1houtfitapi0000000001",
        email=email,
        name="Outfit Test User",
        hashed_password=get_password_hash("Password123!"),
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    token, _ = create_access_token(user_public_id=user.public_id)
    return user, token


def test_api_list_outfits_pagination_and_active_filtering(client: TestClient, db_session: Session):
    user, token = create_test_user_and_token(db_session)
    headers = {"Authorization": f"Bearer {token}"}

    # Add 2 active, 1 inactive
    o1 = Outfit(
        public_id="out_01m1htestlist000000000001",
        name="Active Shirt",
        slug="active-shirt",
        category=OutfitCategory.UPPER_BODY.value,
        image_storage_key="outfits/samples/s1.jpg",
        is_active=True,
        sort_order=1,
    )
    o2 = Outfit(
        public_id="out_01m1htestlist000000000002",
        name="Active Skirt",
        slug="active-skirt",
        category=OutfitCategory.LOWER_BODY.value,
        image_storage_key="outfits/samples/s2.jpg",
        is_active=True,
        sort_order=2,
    )
    o3 = Outfit(
        public_id="out_01m1htestlist000000000003",
        name="Archived Coat",
        slug="archived-coat",
        category=OutfitCategory.UPPER_BODY.value,
        image_storage_key="outfits/samples/s3.jpg",
        is_active=False,
        sort_order=3,
    )
    db_session.add_all([o1, o2, o3])
    db_session.commit()

    # 1. Anonymous / Authenticated List
    res = client.get("/api/v1/outfits?page=1&page_size=10", headers=headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["pagination"]["total"] == 2
    assert len(data["items"]) == 2
    assert data["items"][0]["id"] == o1.public_id
    assert "storage_key" not in data["items"][0]
    assert "internal_id" not in data["items"][0]

    # 2. Category filtering
    res_cat = client.get("/api/v1/outfits?category=lower_body", headers=headers)
    assert res_cat.status_code == 200
    cat_items = res_cat.json()["data"]["items"]
    assert len(cat_items) == 1
    assert cat_items[0]["id"] == o2.public_id

    # 3. Invalid category returns 422
    res_invalid = client.get("/api/v1/outfits?category=spacesuit", headers=headers)
    assert res_invalid.status_code == 422


def test_api_get_outfit_detail(client: TestClient, db_session: Session):
    user, token = create_test_user_and_token(db_session, email="detail_user@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    active = Outfit(
        public_id="out_01m1hdetail0000000000001",
        name="Classic Blazer",
        slug="classic-blazer",
        category=OutfitCategory.UPPER_BODY.value,
        image_storage_key="outfits/blazer.jpg",
        is_active=True,
    )
    inactive = Outfit(
        public_id="out_01m1hdetail0000000000002",
        name="Hidden Blazer",
        slug="hidden-blazer",
        category=OutfitCategory.UPPER_BODY.value,
        image_storage_key="outfits/hidden.jpg",
        is_active=False,
    )
    db_session.add_all([active, inactive])
    db_session.commit()

    # Active returns 200
    res = client.get(f"/api/v1/outfits/{active.public_id}", headers=headers)
    assert res.status_code == 200
    item = res.json()["data"]
    assert item["id"] == active.public_id
    assert item["name"] == "Classic Blazer"
    assert "image_url" in item
    assert item["is_favorite"] is False

    # Inactive returns 404
    res_inact = client.get(f"/api/v1/outfits/{inactive.public_id}", headers=headers)
    assert res_inact.status_code == 404

    # Nonexistent returns 404
    res_missing = client.get("/api/v1/outfits/out_01m1hmissing0000000000000", headers=headers)
    assert res_missing.status_code == 404
