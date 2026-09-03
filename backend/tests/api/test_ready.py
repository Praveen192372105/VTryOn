from unittest.mock import patch
from fastapi.testclient import TestClient


def test_ready_endpoint_healthy(client: TestClient):
    """
    Test GET /ready when database, redis, and storage are healthy.
    """
    with patch("app.api.v1.endpoints.health.check_redis_connectivity", return_value=True):
        response = client.get("/ready")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["status"] == "ready"
        assert data["data"]["checks"]["database"] == "healthy"
        assert data["data"]["checks"]["redis"] == "healthy"
        assert data["data"]["checks"]["storage"] == "healthy"
        assert "X-Request-ID" in response.headers


def test_ready_endpoint_redis_failure(client: TestClient):
    """
    Test GET /ready returns 503 Service Unavailable when Redis is unreachable.
    """
    with patch("app.api.v1.endpoints.health.check_redis_connectivity", return_value=False):
        response = client.get("/ready")
        assert response.status_code == 503
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "REDIS_UNAVAILABLE"
