from app.main import app


def test_canonical_openapi_paths_present():
    """Verify all 17 canonical V1 endpoint paths exist in generated OpenAPI schema."""
    schema = app.openapi()
    paths = schema["paths"]

    expected_paths = [
        "/api/v1/auth/register",
        "/api/v1/auth/login",
        "/api/v1/auth/refresh",
        "/api/v1/auth/logout",
        "/api/v1/users/me",
        "/api/v1/uploads/person",
        "/api/v1/uploads",
        "/api/v1/uploads/{upload_id}",
        "/api/v1/outfits",
        "/api/v1/outfits/{outfit_id}",
        "/api/v1/outfits/{outfit_id}/favorite",
        "/api/v1/favorites",
        "/api/v1/try-ons",
        "/api/v1/try-ons/{job_id}",
        "/api/v1/try-ons/{job_id}/content",
        "/api/v1/health/live",
        "/api/v1/health/ready",
    ]

    for p in expected_paths:
        assert p in paths, f"Canonical path '{p}' missing from OpenAPI schema"


def test_stale_and_legacy_paths_absent():
    """Verify deprecated or stale endpoint paths do NOT appear in the OpenAPI schema."""
    schema = app.openapi()
    paths = schema["paths"]

    forbidden_paths = [
        "/api/v1/favorites/{outfit_id}",
        "/api/v1/tryons",
        "/api/v1/try-ons/{job_id}/result",
        "/login",
        "/token",
        "/api/v1/login",
    ]

    for p in forbidden_paths:
        assert p not in paths, f"Stale/unapproved path '{p}' leaked into OpenAPI schema"


def test_openapi_security_requirements():
    """Verify security schemes and that protected endpoints declare authentication."""
    schema = app.openapi()
    paths = schema["paths"]

    # Public endpoints must NOT require auth
    public_endpoints = [
        ("/api/v1/auth/register", "post"),
        ("/api/v1/auth/login", "post"),
        ("/api/v1/auth/refresh", "post"),
        ("/api/v1/health/live", "get"),
    ]
    for path, method in public_endpoints:
        op = paths[path][method]
        assert not op.get("security"), f"Public endpoint '{method.upper()} {path}' unexpectedly requires security"

    # Protected endpoints MUST require auth
    protected_endpoints = [
        ("/api/v1/users/me", "get"),
        ("/api/v1/uploads/person", "post"),
        ("/api/v1/uploads", "get"),
        ("/api/v1/try-ons", "post"),
        ("/api/v1/try-ons/{job_id}", "get"),
        ("/api/v1/try-ons/{job_id}", "delete"),
    ]
    for path, method in protected_endpoints:
        op = paths[path][method]
        assert op.get("security"), f"Protected endpoint '{method.upper()} {path}' lacks security requirement in OpenAPI"


def test_openapi_status_codes_and_204_semantics():
    """Verify correct status code definitions in OpenAPI schema."""
    schema = app.openapi()
    paths = schema["paths"]

    # POST /try-ons declares 202
    assert "202" in paths["api/v1/try-ons".replace("api/v1/try-ons", "/api/v1/try-ons")]["post"]["responses"]

    # DELETE /try-ons/{job_id} declares 204
    delete_tryon = paths["/api/v1/try-ons/{job_id}"]["delete"]
    assert "204" in delete_tryon["responses"]

    # PUT /outfits/{outfit_id}/favorite declares 204
    fav_put = paths["/api/v1/outfits/{outfit_id}/favorite"]["put"]
    assert "204" in fav_put["responses"]

    # POST /auth/logout declares 204
    logout = paths["/api/v1/auth/logout"]["post"]
    assert "204" in logout["responses"]
