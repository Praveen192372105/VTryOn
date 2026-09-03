import pytest
from fastapi.testclient import TestClient


def test_api_register_success(client: TestClient):
    """Test user registration endpoint returns 201 Created and safe token envelope."""
    payload = {
        "name": "API User",
        "email": "api_user@example.com",
        "password": "Password123!",
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201

    data = res.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]
    assert data["data"]["token_type"] == "bearer"
    assert data["data"]["user"]["email"] == "api_user@example.com"
    assert "password" not in data["data"]["user"]
    assert "password_hash" not in data["data"]["user"]


def test_api_register_duplicate_email(client: TestClient):
    """Test duplicate registration returns 409 Conflict with EMAIL_ALREADY_REGISTERED."""
    payload = {
        "name": "User Duplicate",
        "email": "dup@example.com",
        "password": "Password123!",
    }
    res1 = client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 409
    data = res2.json()
    assert data["success"] is False
    assert data["error"]["code"] == "EMAIL_ALREADY_REGISTERED"


def test_api_login_success(client: TestClient):
    """Test login with valid credentials returns 200 OK."""
    reg_payload = {
        "name": "Login Test",
        "email": "login_test@example.com",
        "password": "Password123!",
    }
    client.post("/api/v1/auth/register", json=reg_payload)

    login_payload = {
        "email": "LOGIN_TEST@example.com",  # Case difference
        "password": "Password123!",
    }
    res = client.post("/api/v1/auth/login", json=login_payload)
    assert res.status_code == 200

    data = res.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]


def test_api_login_invalid_credentials(client: TestClient):
    """Test login with wrong password returns 401 with INVALID_CREDENTIALS and WWW-Authenticate."""
    reg_payload = {
        "name": "Login Wrong",
        "email": "login_wrong@example.com",
        "password": "Password123!",
    }
    client.post("/api/v1/auth/register", json=reg_payload)

    res = client.post(
        "/api/v1/auth/login",
        json={"email": "login_wrong@example.com", "password": "WrongPassword!"},
    )
    assert res.status_code == 401
    assert "WWW-Authenticate" in res.headers
    assert res.headers["WWW-Authenticate"] == "Bearer"

    data = res.json()
    assert data["success"] is False
    assert data["error"]["code"] == "INVALID_CREDENTIALS"


def test_api_refresh_token_rotation_and_replay(client: TestClient):
    """Test refresh token rotation and replay prevention via API."""
    reg_payload = {
        "name": "Refresh API",
        "email": "refresh_api@example.com",
        "password": "Password123!",
    }
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    token_a = reg_res.json()["data"]["refresh_token"]

    # 1. Rotate token A -> token B
    res_rot = client.post("/api/v1/auth/refresh", json={"refresh_token": token_a})
    assert res_rot.status_code == 200
    token_b = res_rot.json()["data"]["refresh_token"]
    assert token_b != token_a

    # 2. Replay with token A must fail with 401 SESSION_REVOKED
    res_replay = client.post("/api/v1/auth/refresh", json={"refresh_token": token_a})
    assert res_replay.status_code == 401
    assert res_replay.json()["error"]["code"] == "SESSION_REVOKED"


def test_api_logout_and_revocation(client: TestClient):
    """Test logout endpoint revokes session so it cannot be refreshed."""
    reg_payload = {
        "name": "Logout API",
        "email": "logout_api@example.com",
        "password": "Password123!",
    }
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    refresh_tok = reg_res.json()["data"]["refresh_token"]

    # Logout (Canonical 204 No Content)
    logout_res = client.post("/api/v1/auth/logout", json={"refresh_token": refresh_tok})
    assert logout_res.status_code == 204
    assert not logout_res.content

    # Refresh after logout should fail
    res_ref = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_tok})
    assert res_ref.status_code == 401
    assert res_ref.json()["error"]["code"] == "SESSION_REVOKED"
