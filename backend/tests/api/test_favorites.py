from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_access_token, get_password_hash
from app.db.models.outfit import Outfit
from app.db.models.user import User
from app.domain.enums import OutfitCategory


def create_user_and_token(db_session: Session, user_idx: int) -> tuple[User, str]:
    user = User(
        public_id=f"usr_01m1hfavuser000000000{user_idx}",
        email=f"fav_user_{user_idx}@example.com",
        name=f"Fav User {user_idx}",
        hashed_password=get_password_hash("Password123!"),
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    token, _ = create_access_token(user_public_id=user.public_id)
    return user, token


def test_api_favorite_lifecycle_and_idempotency(client: TestClient, db_session: Session):
    user_a, token_a = create_user_and_token(db_session, 1)
    headers_a = {"Authorization": f"Bearer {token_a}"}

    outfit = Outfit(
        public_id="out_01m1hfavlife000000000001",
        name="Silk Blouse",
        slug="silk-blouse",
        category=OutfitCategory.UPPER_BODY.value,
        image_storage_key="outfits/silk.jpg",
        is_active=True,
    )
    db_session.add(outfit)
    db_session.commit()

    # 1. Unauthenticated PUT -> 401
    res_unauth = client.put(f"/api/v1/outfits/{outfit.public_id}/favorite")
    assert res_unauth.status_code == 401

    # 2. First PUT -> 204 No Content
    res_put1 = client.put(f"/api/v1/outfits/{outfit.public_id}/favorite", headers=headers_a)
    assert res_put1.status_code == 204
    assert not res_put1.content

    # 3. Repeated PUT (idempotent desired state) -> 204 No Content
    res_put2 = client.put(f"/api/v1/outfits/{outfit.public_id}/favorite", headers=headers_a)
    assert res_put2.status_code == 204
    assert not res_put2.content

    # 4. Detail endpoint reflects is_favorite=True
    res_detail = client.get(f"/api/v1/outfits/{outfit.public_id}", headers=headers_a)
    assert res_detail.status_code == 200
    assert res_detail.json()["data"]["is_favorite"] is True

    # 5. GET /favorites contains the item
    res_favs = client.get("/api/v1/favorites", headers=headers_a)
    assert res_favs.status_code == 200
    fav_items = res_favs.json()["data"]["items"]
    assert len(fav_items) == 1
    assert fav_items[0]["outfit"]["id"] == outfit.public_id
    assert fav_items[0]["outfit"]["is_favorite"] is True

    # 6. DELETE favorite -> 204 No Content
    res_del1 = client.delete(f"/api/v1/outfits/{outfit.public_id}/favorite", headers=headers_a)
    assert res_del1.status_code == 204
    assert not res_del1.content

    # 7. Repeated DELETE (idempotent removal) -> 204 No Content
    res_del2 = client.delete(f"/api/v1/outfits/{outfit.public_id}/favorite", headers=headers_a)
    assert res_del2.status_code == 204
    assert not res_del2.content

    # 8. GET /favorites is now empty
    res_favs_empty = client.get("/api/v1/favorites", headers=headers_a)
    assert res_favs_empty.status_code == 200
    assert res_favs_empty.json()["data"]["pagination"]["total"] == 0


def test_api_favorite_user_isolation(client: TestClient, db_session: Session):
    user_a, token_a = create_user_and_token(db_session, 2)
    user_b, token_b = create_user_and_token(db_session, 3)
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    outfit = Outfit(
        public_id="out_01m1hfaviso0000000000001",
        name="Cashmere Sweater",
        slug="cashmere-sweater",
        category=OutfitCategory.UPPER_BODY.value,
        image_storage_key="outfits/cashmere.jpg",
        is_active=True,
    )
    db_session.add(outfit)
    db_session.commit()

    # User A favorites the outfit
    client.put(f"/api/v1/outfits/{outfit.public_id}/favorite", headers=headers_a)

    # For User A: is_favorite = True in catalogue and detail
    detail_a = client.get(f"/api/v1/outfits/{outfit.public_id}", headers=headers_a).json()["data"]
    assert detail_a["is_favorite"] is True

    favs_a = client.get("/api/v1/favorites", headers=headers_a).json()["data"]
    assert favs_a["pagination"]["total"] == 1

    # For User B: is_favorite = False in catalogue and detail
    detail_b = client.get(f"/api/v1/outfits/{outfit.public_id}", headers=headers_b).json()["data"]
    assert detail_b["is_favorite"] is False

    favs_b = client.get("/api/v1/favorites", headers=headers_b).json()["data"]
    assert favs_b["pagination"]["total"] == 0
