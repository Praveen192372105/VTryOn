import io
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy.orm import Session

from app.core.security import create_access_token, get_password_hash
from app.db.models.user import User


def create_user(db_session: Session, idx: int) -> tuple[User, str]:
    user = User(
        public_id=f"usr_01m1hupapi00000000000{idx}",
        email=f"upload_user_{idx}@example.com",
        name=f"Upload User {idx}",
        hashed_password=get_password_hash("Password123!"),
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    token, _ = create_access_token(user_public_id=user.public_id)
    return user, token


def make_test_jpg() -> bytes:
    img = Image.new("RGB", (300, 400), color=(100, 150, 200))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_api_upload_person_lifecycle(client: TestClient, db_session: Session):
    user_a, token_a = create_user(db_session, 1)
    user_b, token_b = create_user(db_session, 2)
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 1. Unauthenticated -> 401
    res_unauth = client.post("/api/v1/uploads/person", files={"file": ("test.jpg", make_test_jpg(), "image/jpeg")})
    assert res_unauth.status_code == 401

    # 2. Valid upload -> 201
    res_upload = client.post(
        "/api/v1/uploads/person",
        headers=headers_a,
        files={"file": ("my_portrait.jpg", make_test_jpg(), "image/jpeg")},
    )
    assert res_upload.status_code == 201
    upload_data = res_upload.json()["data"]
    upload_id = upload_data["id"]
    assert upload_id.startswith("upl_")
    assert upload_data["width"] == 300
    assert upload_data["height"] == 400
    assert "storage_key" not in upload_data

    # 3. GET /uploads lists it for User A
    res_list_a = client.get("/api/v1/uploads", headers=headers_a)
    assert res_list_a.status_code == 200
    items_a = res_list_a.json()["data"]["items"]
    assert len(items_a) == 1
    assert items_a[0]["id"] == upload_id

    # 4. GET /uploads is empty for User B (isolation)
    res_list_b = client.get("/api/v1/uploads", headers=headers_b)
    assert res_list_b.status_code == 200
    assert len(res_list_b.json()["data"]["items"]) == 0

    # 5. User B cannot GET User A's upload (IDOR defense -> 404)
    res_idor = client.get(f"/api/v1/uploads/{upload_id}", headers=headers_b)
    assert res_idor.status_code == 404

    # 6. User B cannot DELETE User A's upload (IDOR defense -> 404)
    res_del_idor = client.delete(f"/api/v1/uploads/{upload_id}", headers=headers_b)
    assert res_del_idor.status_code == 404

    # 7. User A deletes own upload -> 204 No Content
    res_del = client.delete(f"/api/v1/uploads/{upload_id}", headers=headers_a)
    assert res_del.status_code == 204
    assert not res_del.content

    # 8. User A GET /uploads/{id} now returns 404
    assert client.get(f"/api/v1/uploads/{upload_id}", headers=headers_a).status_code == 404


def test_api_upload_corrupt_file_rejected(client: TestClient, db_session: Session):
    user, token = create_user(db_session, 3)
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post(
        "/api/v1/uploads/person",
        headers=headers,
        files={"file": ("bad.jpg", b"not_an_image_corrupt_data", "image/jpeg")},
    )
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "INVALID_IMAGE"
