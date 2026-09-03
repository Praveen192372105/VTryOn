import io
from PIL import Image
import pytest
from fastapi.testclient import TestClient


def _create_test_image_bytes() -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGB", (768, 1024), color=(200, 200, 200))
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_idor_private_upload_not_found_for_other_user(client: TestClient):
    """
    IDOR Security Test:
    User B owns upload B.
    User A makes request for upload B.
    Response must strictly be 404 Not Found (never 403 or disclosure of existence).
    """
    # 1. Register User A
    res_a = client.post(
        "/api/v1/auth/register",
        json={"name": "User A", "email": "user_a@example.com", "password": "Password123!"},
    )
    token_a = res_a.json()["data"]["access_token"]

    # 2. Register User B
    res_b = client.post(
        "/api/v1/auth/register",
        json={"name": "User B", "email": "user_b@example.com", "password": "Password123!"},
    )
    token_b = res_b.json()["data"]["access_token"]

    # 3. User B uploads an image
    img_bytes = _create_test_image_bytes()
    upload_res = client.post(
        "/api/v1/uploads/person",
        headers={"Authorization": f"Bearer {token_b}"},
        files={"file": ("person_b.jpg", img_bytes, "image/jpeg")},
    )
    assert upload_res.status_code == 201
    upload_b_id = upload_res.json()["data"]["id"]

    # 4. User A attempts GET on User B's upload -> must return 404
    headers_a = {"Authorization": f"Bearer {token_a}"}
    get_res = client.get(f"/api/v1/uploads/{upload_b_id}", headers=headers_a)
    assert get_res.status_code == 404
    assert get_res.json()["success"] is False

    # 5. User A attempts DELETE on User B's upload -> must return 404
    del_res = client.delete(f"/api/v1/uploads/{upload_b_id}", headers=headers_a)
    assert del_res.status_code == 404
    assert del_res.json()["success"] is False


def test_favorites_user_isolation(client: TestClient):
    """
    Verify favorites operations are strictly scoped to the authenticated user.
    User A's favorites are invisible to User B.
    """
    # 1. Register User A and User B
    res_a = client.post(
        "/api/v1/auth/register",
        json={"name": "Fav User A", "email": "fav_a@example.com", "password": "Password123!"},
    )
    token_a = res_a.json()["data"]["access_token"]

    res_b = client.post(
        "/api/v1/auth/register",
        json={"name": "Fav User B", "email": "fav_b@example.com", "password": "Password123!"},
    )
    token_b = res_b.json()["data"]["access_token"]

    # 2. User A favorites an outfit
    client.post(
        "/api/v1/favorites/out_01m1h000000000000000000001",
        headers={"Authorization": f"Bearer {token_a}"},
    )

    # 3. User B lists favorites -> should be empty
    list_b = client.get("/api/v1/favorites", headers={"Authorization": f"Bearer {token_b}"})
    assert list_b.status_code == 200
    assert list_b.json()["data"]["pagination"]["total"] == 0
    assert len(list_b.json()["data"]["items"]) == 0
