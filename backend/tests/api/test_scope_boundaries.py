from fastapi.testclient import TestClient
from app.main import app


def test_registered_api_v1_scope_boundaries():
    """
    Scope Boundary Enforcement Test:
    Verifies that all registered endpoints conform to the canonical V1 product scope,
    and strictly forbids out-of-scope routes (payments, social, training, websockets, etc.).
    """
    openapi_schema = app.openapi()
    registered_paths = set(openapi_schema.get("paths", {}).keys())

    # 1. Verify Core Health & System Endpoints
    assert "/health" in registered_paths
    assert "/ready" in registered_paths
    assert "/api/v1/system/ai" in registered_paths

    # 2. Verify Canonical Product Routes
    expected_v1_routes = [
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
    ]

    for expected_route in expected_v1_routes:
        assert expected_route in registered_paths, f"Expected canonical route '{expected_route}' was not found in registered routes."

    # 3. Verify Deliberately Excluded Capabilities Are Absent
    forbidden_keywords = [
        "/payment",
        "/subscription",
        "/cart",
        "/order",
        "/billing",
        "/checkout",
        "/follow",
        "/comment",
        "/social",
        "/feed",
        "/like",
        "/training",
        "/finetune",
        "/lora",
        "/ws",
        "/socket.io",
        "/chat",
    ]

    for path in registered_paths:
        for keyword in forbidden_keywords:
            assert keyword not in path.lower(), f"Scope violation: Forbidden route keyword '{keyword}' found in registered path '{path}'"
