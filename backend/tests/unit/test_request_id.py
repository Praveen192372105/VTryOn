from fastapi.testclient import TestClient


def test_request_id_auto_generated(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    req_id = response.headers.get("X-Request-ID")
    assert req_id is not None
    assert req_id.startswith("req_")


def test_request_id_passed_through(client: TestClient):
    custom_id = "req_custom_test_trace_12345"
    response = client.get("/health", headers={"X-Request-ID": custom_id})
    assert response.status_code == 200
    assert response.headers.get("X-Request-ID") == custom_id
