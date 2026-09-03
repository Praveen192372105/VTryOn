import math
import threading
import time
from collections import defaultdict
from typing import Dict, List, Optional, Tuple

# Standard Prometheus latency buckets in seconds
DEFAULT_BUCKETS = (0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0, 120.0)


class ThreadSafeHistogram:
    """Lightweight in-memory histogram for latency metrics."""
    def __init__(self, buckets: Tuple[float, ...] = DEFAULT_BUCKETS):
        self.buckets = sorted(buckets)
        self.counts: Dict[float, int] = {b: 0 for b in self.buckets}
        self.counts[float("inf")] = 0
        self.total_sum: float = 0.0
        self.total_count: int = 0
        self._lock = threading.Lock()

    def observe(self, value: float) -> None:
        with self._lock:
            self.total_sum += value
            self.total_count += 1
            for b in self.buckets:
                if value <= b:
                    self.counts[b] += 1
            self.counts[float("inf")] += 1


class MetricsRegistry:
    """
    In-memory metrics registry adhering strictly to low-cardinality rules.
    PROHIBITED in labels: user_id, job_id, request_id, file paths, email addresses.
    ALLOWED in labels: HTTP method, route template, status code, high-level error classification.
    """
    def __init__(self):
        self._lock = threading.Lock()

        # HTTP Metrics
        self.http_requests: Dict[Tuple[str, str, int], int] = defaultdict(int)
        self.http_latencies: Dict[Tuple[str, str, int], ThreadSafeHistogram] = {}

        # Job Metrics
        self.jobs_created_total: int = 0
        self.jobs_completed_total: int = 0
        self.jobs_failed_total: Dict[str, int] = defaultdict(int)
        self.job_queue_wait_histogram = ThreadSafeHistogram((0.1, 0.5, 1.0, 5.0, 15.0, 30.0, 60.0, 120.0, 300.0))
        self.job_processing_histogram = ThreadSafeHistogram((1.0, 3.0, 5.0, 10.0, 15.0, 25.0, 45.0, 60.0, 120.0))

        # CatVTON AI Metrics
        self.catvton_inference_histogram = ThreadSafeHistogram((1.0, 2.0, 5.0, 8.0, 12.0, 20.0, 30.0))
        self.catvton_oom_total: int = 0

        # System Metrics
        self.db_errors_total: int = 0

    def record_http_request(
        self,
        method: str,
        route_template: str,
        status_code: int,
        duration_seconds: float,
    ) -> None:
        key = (method.upper(), route_template, status_code)
        with self._lock:
            self.http_requests[key] += 1
            if key not in self.http_latencies:
                self.http_latencies[key] = ThreadSafeHistogram()
            hist = self.http_latencies[key]
        hist.observe(duration_seconds)

    def record_job_created(self) -> None:
        with self._lock:
            self.jobs_created_total += 1

    def record_job_completed(
        self,
        processing_seconds: float,
        queue_wait_seconds: Optional[float] = None,
    ) -> None:
        with self._lock:
            self.jobs_completed_total += 1
        self.job_processing_histogram.observe(processing_seconds)
        if queue_wait_seconds is not None and queue_wait_seconds >= 0:
            self.job_queue_wait_histogram.observe(queue_wait_seconds)

    def record_job_failed(self, failure_code: str) -> None:
        with self._lock:
            self.jobs_failed_total[failure_code] += 1

    def record_catvton_inference(self, duration_seconds: float) -> None:
        self.catvton_inference_histogram.observe(duration_seconds)

    def record_catvton_oom(self) -> None:
        with self._lock:
            self.catvton_oom_total += 1

    def record_db_error(self) -> None:
        with self._lock:
            self.db_errors_total += 1

    def generate_prometheus_metrics(self) -> str:
        """Export internal metrics in canonical Prometheus text exposition format (version 0.0.4)."""
        lines: List[str] = []

        # 1. HTTP Requests Total
        lines.append("# HELP vtryon_http_requests_total Total number of HTTP requests processed")
        lines.append("# TYPE vtryon_http_requests_total counter")
        with self._lock:
            for (method, route, code), count in sorted(self.http_requests.items()):
                lines.append(
                    f'vtryon_http_requests_total{{method="{method}",route="{route}",status="{code}"}} {count}'
                )

        # 2. HTTP Latencies Histogram
        lines.append("# HELP vtryon_http_request_duration_seconds HTTP request latency distributions")
        lines.append("# TYPE vtryon_http_request_duration_seconds histogram")
        with self._lock:
            latency_items = list(self.http_latencies.items())

        for (method, route, code), hist in sorted(latency_items, key=lambda x: x[0]):
            with hist._lock:
                for b in hist.buckets:
                    lines.append(
                        f'vtryon_http_request_duration_seconds_bucket{{method="{method}",route="{route}",status="{code}",le="{b}"}} {hist.counts[b]}'
                    )
                lines.append(
                    f'vtryon_http_request_duration_seconds_bucket{{method="{method}",route="{route}",status="{code}",le="+Inf"}} {hist.counts[float("inf")]}'
                )
                lines.append(
                    f'vtryon_http_request_duration_seconds_sum{{method="{method}",route="{route}",status="{code}"}} {hist.total_sum:.4f}'
                )
                lines.append(
                    f'vtryon_http_request_duration_seconds_count{{method="{method}",route="{route}",status="{code}"}} {hist.total_count}'
                )

        # 3. Virtual Try-On Jobs
        lines.append("# HELP vtryon_jobs_created_total Total try-on jobs queued")
        lines.append("# TYPE vtryon_jobs_created_total counter")
        lines.append(f"vtryon_jobs_created_total {self.jobs_created_total}")

        lines.append("# HELP vtryon_jobs_completed_total Total try-on jobs successfully succeeded")
        lines.append("# TYPE vtryon_jobs_completed_total counter")
        lines.append(f"vtryon_jobs_completed_total {self.jobs_completed_total}")

        lines.append("# HELP vtryon_jobs_failed_total Total try-on jobs failed by reason")
        lines.append("# TYPE vtryon_jobs_failed_total counter")
        with self._lock:
            for reason, count in sorted(self.jobs_failed_total.items()):
                lines.append(f'vtryon_jobs_failed_total{{reason="{reason}"}} {count}')

        # 4. Job Timings
        lines.append("# HELP vtryon_job_processing_seconds GPU worker processing duration")
        lines.append("# TYPE vtryon_job_processing_seconds histogram")
        with self.job_processing_histogram._lock:
            for b in self.job_processing_histogram.buckets:
                lines.append(f'vtryon_job_processing_seconds_bucket{{le="{b}"}} {self.job_processing_histogram.counts[b]}')
            lines.append(f'vtryon_job_processing_seconds_bucket{{le="+Inf"}} {self.job_processing_histogram.counts[float("inf")]}')
            lines.append(f"vtryon_job_processing_seconds_sum {self.job_processing_histogram.total_sum:.4f}")
            lines.append(f"vtryon_job_processing_seconds_count {self.job_processing_histogram.total_count}")

        lines.append("# HELP vtryon_job_queue_wait_seconds Time spent waiting in queue before processing")
        lines.append("# TYPE vtryon_job_queue_wait_seconds histogram")
        with self.job_queue_wait_histogram._lock:
            for b in self.job_queue_wait_histogram.buckets:
                lines.append(f'vtryon_job_queue_wait_seconds_bucket{{le="{b}"}} {self.job_queue_wait_histogram.counts[b]}')
            lines.append(f'vtryon_job_queue_wait_seconds_bucket{{le="+Inf"}} {self.job_queue_wait_histogram.counts[float("inf")]}')
            lines.append(f"vtryon_job_queue_wait_seconds_sum {self.job_queue_wait_histogram.total_sum:.4f}")
            lines.append(f"vtryon_job_queue_wait_seconds_count {self.job_queue_wait_histogram.total_count}")

        # 5. CatVTON Inference & OOM
        lines.append("# HELP vtryon_catvton_inference_seconds Raw CatVTON diffusion inference duration")
        lines.append("# TYPE vtryon_catvton_inference_seconds histogram")
        with self.catvton_inference_histogram._lock:
            for b in self.catvton_inference_histogram.buckets:
                lines.append(f'vtryon_catvton_inference_seconds_bucket{{le="{b}"}} {self.catvton_inference_histogram.counts[b]}')
            lines.append(f'vtryon_catvton_inference_seconds_bucket{{le="+Inf"}} {self.catvton_inference_histogram.counts[float("inf")]}')
            lines.append(f"vtryon_catvton_inference_seconds_sum {self.catvton_inference_histogram.total_sum:.4f}")
            lines.append(f"vtryon_catvton_inference_seconds_count {self.catvton_inference_histogram.total_count}")

        lines.append("# HELP vtryon_catvton_oom_total Total CatVTON CUDA out-of-memory errors")
        lines.append("# TYPE vtryon_catvton_oom_total counter")
        lines.append(f"vtryon_catvton_oom_total {self.catvton_oom_total}")

        # 6. Database errors
        lines.append("# HELP vtryon_db_errors_total Total database connection / query errors")
        lines.append("# TYPE vtryon_db_errors_total counter")
        lines.append(f"vtryon_db_errors_total {self.db_errors_total}")

        lines.append("")
        return "\n".join(lines)


# Global singleton metrics registry
metrics_registry = MetricsRegistry()

__all__ = ["MetricsRegistry", "metrics_registry"]
