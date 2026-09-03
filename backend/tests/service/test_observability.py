import pytest
from fastapi.testclient import TestClient

from app.core.metrics import MetricsRegistry, metrics_registry
from app.core.middleware import get_route_template


@pytest.mark.service
def test_metrics_registry_recording():
    reg = MetricsRegistry()

    # Record HTTP request
    reg.record_http_request("GET", "/api/v1/outfits", 200, 0.045)
    reg.record_http_request("GET", "/api/v1/outfits", 200, 0.055)
    reg.record_http_request("POST", "/api/v1/try-ons", 202, 0.120)

    # Record job metrics
    reg.record_job_created()
    reg.record_job_completed(processing_seconds=4.2, queue_wait_seconds=0.8)
    reg.record_job_failed("GPU_OUT_OF_MEMORY")
    reg.record_catvton_oom()

    # Generate Prometheus output
    prom_output = reg.generate_prometheus_metrics()

    assert 'vtryon_http_requests_total{method="GET",route="/api/v1/outfits",status="200"} 2' in prom_output
    assert 'vtryon_http_requests_total{method="POST",route="/api/v1/try-ons",status="202"} 1' in prom_output
    assert "vtryon_jobs_created_total 1" in prom_output
    assert "vtryon_jobs_completed_total 1" in prom_output
    assert 'vtryon_jobs_failed_total{reason="GPU_OUT_OF_MEMORY"} 1' in prom_output
    assert "vtryon_catvton_oom_total 1" in prom_output
    assert "vtryon_job_processing_seconds_count 1" in prom_output
    assert "vtryon_job_queue_wait_seconds_count 1" in prom_output


@pytest.mark.service
def test_metrics_endpoint_response(client: TestClient):
    # Perform a request to generate metrics
    client.get("/api/v1/health/live")

    # Fetch Prometheus metrics
    resp = client.get("/metrics")
    assert resp.status_code == 200
    assert "text/plain" in resp.headers["content-type"]
    assert "vtryon_http_requests_total" in resp.text
    assert "vtryon_jobs_created_total" in resp.text


@pytest.mark.service
def test_low_cardinality_route_template_sanitization():
    class DummyRequest:
        def __init__(self, path: str, route_path: str = None):
            self.url = type("URL", (), {"path": path})()
            self.scope = {"route": type("Route", (), {"path": route_path})()} if route_path else {}

    # Case 1: Route template exists in scope
    req1 = DummyRequest(path="/api/v1/try-ons/job_01JC8XYZ", route_path="/api/v1/try-ons/{job_id}")
    assert get_route_template(req1) == "/api/v1/try-ons/{job_id}"

    # Case 2: Route template missing, regex sanitizes dynamic ULID
    req2 = DummyRequest(path="/api/v1/try-ons/job_01HXYZ1234567890ABCDEF")
    sanitized = get_route_template(req2)
    assert sanitized == "/api/v1/try-ons/{id}"
    assert "job_01H" not in sanitized
