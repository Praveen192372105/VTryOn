from fastapi.testclient import TestClient


def test_health_endpoint(client: TestClient):
    """
    Test GET /health liveness probe.
    Must return 200, status healthy, service name, version, and X-Request-ID.
    """
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "healthy"
    assert "version" in data["data"]
    assert "service" in data["data"]
    assert "X-Request-ID" in response.headers
