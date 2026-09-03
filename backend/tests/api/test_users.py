import pytest
from fastapi.testclient import TestClient


def test_api_users_me_authenticated(client: TestClient):
    """Test /users/me returns safe profile for authenticated caller."""
    reg_payload = {
        "name": "Profile Tester",
        "email": "tester@example.com",
        "password": "Password123!",
    }
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    token = reg_res.json()["data"]["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/api/v1/users/me", headers=headers)
    assert res.status_code == 200

    data = res.json()
    assert data["success"] is True
    profile = data["data"]
    assert profile["name"] == "Profile Tester"
    assert profile["email"] == "tester@example.com"
    assert profile["id"].startswith("usr_")

    # Verify no sensitive data leakage
    assert "password" not in profile
    assert "password_hash" not in profile
    assert "refresh_token" not in profile
    assert "internal_id" not in profile


def test_api_users_me_unauthenticated(client: TestClient):
    """Test /users/me without Authorization header returns 401 AUTHENTICATION_REQUIRED."""
    res = client.get("/api/v1/users/me")
    assert res.status_code == 401
    assert "WWW-Authenticate" in res.headers

    data = res.json()
    assert data["success"] is False
    assert data["error"]["code"] == "AUTHENTICATION_REQUIRED"


def test_api_users_me_invalid_token(client: TestClient):
    """Test /users/me with malformed token returns 401 INVALID_ACCESS_TOKEN."""
    headers = {"Authorization": "Bearer malformed.invalid.token.123"}
    res = client.get("/api/v1/users/me", headers=headers)
    assert res.status_code == 401

    data = res.json()
    assert data["success"] is False
    assert data["error"]["code"] == "INVALID_ACCESS_TOKEN"
