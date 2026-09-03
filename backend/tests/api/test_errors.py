from fastapi.testclient import TestClient


def test_validation_error_canonical_envelope(client: TestClient):
    """Test 422 validation error returns canonical envelope with normalized field paths."""
    res = client.post("/api/v1/auth/register", json={"email": "invalid_email_format"})
    assert res.status_code == 422
    data = res.json()

    assert data["success"] is False
    assert "error" in data
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert "message" in data["error"]
    assert "request_id" in data
    assert "X-Request-ID" in res.headers

    # Check details formatting
    details = data["error"]["details"]
    assert isinstance(details, list)
    fields = [d["field"] for d in details]
    # Ensure neither body nor query is prepended raw
    for f in fields:
        assert not f.startswith("body.")


def test_404_not_found_canonical_envelope(client: TestClient):
    """Test 404 route returns canonical envelope with request_id."""
    res = client.get("/api/v1/non_existent_endpoint_path")
    assert res.status_code == 404
    data = res.json()

    assert data["success"] is False
    assert data["error"]["code"] in ("NOT_FOUND", "ROUTE_NOT_FOUND")
    assert "request_id" in data


def test_405_method_not_allowed_canonical_envelope(client: TestClient):
    """Test 405 Method Not Allowed returns canonical envelope and preserves Allow header."""
    res = client.post("/api/v1/users/me")  # GET only
    assert res.status_code == 405
    assert "Allow" in res.headers

    data = res.json()
    assert data["success"] is False
    assert "request_id" in data


def test_sensitive_field_not_reflected_in_validation_error(client: TestClient):
    """Ensure secret values (e.g. passwords) are not reflected into error details."""
    secret_pass = "SuperSecretPlainTextPassword123"
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "invalid", "password": secret_pass},
    )
    assert res.status_code == 422
    # Verify the secret password itself does not appear in the response payload
    assert secret_pass not in res.text
