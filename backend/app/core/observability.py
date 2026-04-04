"""
Structured logging & observability middleware for ClipX backend.

Logs every request with:
  - method, path, status code, latency
  - client IP (for abuse detection)
  - user ID (if authenticated)

Also exposes a /metrics endpoint for Prometheus-style scraping.
"""

import time
import logging
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, Response

logger = logging.getLogger("clipx.access")
logger.setLevel(logging.INFO)

# Ensure at least one handler exists
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter(
        "%(asctime)s | %(levelname)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    ))
    logger.addHandler(handler)


# ── In-memory metrics (replace with Prometheus client in production) ──
class Metrics:
    """Simple in-memory metrics collector."""
    def __init__(self):
        self.request_count: int = 0
        self.error_count: int = 0
        self.status_codes: dict[int, int] = defaultdict(int)
        self.latency_sum: float = 0.0
        self.latency_max: float = 0.0
        self.endpoint_hits: dict[str, int] = defaultdict(int)

    def record(self, path: str, status: int, latency: float):
        self.request_count += 1
        self.status_codes[status] += 1
        self.latency_sum += latency
        if latency > self.latency_max:
            self.latency_max = latency
        if status >= 400:
            self.error_count += 1
        # Normalize dynamic paths for aggregation
        normalized = path.split("?")[0]
        self.endpoint_hits[normalized] += 1

    @property
    def avg_latency(self) -> float:
        return self.latency_sum / max(self.request_count, 1)

    def to_dict(self) -> dict:
        top_endpoints = sorted(
            self.endpoint_hits.items(), key=lambda x: x[1], reverse=True
        )[:20]
        return {
            "total_requests": self.request_count,
            "total_errors": self.error_count,
            "error_rate": f"{(self.error_count / max(self.request_count, 1)) * 100:.1f}%",
            "avg_latency_ms": round(self.avg_latency * 1000, 2),
            "max_latency_ms": round(self.latency_max * 1000, 2),
            "status_codes": dict(self.status_codes),
            "top_endpoints": dict(top_endpoints),
        }

metrics = Metrics()


class ObservabilityMiddleware(BaseHTTPMiddleware):
    """Logs structured access logs and records metrics for every request."""

    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path
        method = request.method

        response: Response = await call_next(request)

        latency = time.perf_counter() - start
        status = response.status_code

        # Record metrics
        metrics.record(path, status, latency)

        # Structured log line
        log_parts = [
            f"{method} {path}",
            f"status={status}",
            f"latency={latency * 1000:.1f}ms",
            f"ip={client_ip}",
        ]

        # Extract user ID from auth header if present (non-blocking)
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            log_parts.append("auth=bearer")

        log_line = " | ".join(log_parts)

        if status >= 500:
            logger.error(log_line)
        elif status >= 400:
            logger.warning(log_line)
        else:
            logger.info(log_line)

        # Add response timing header
        response.headers["X-Response-Time"] = f"{latency * 1000:.1f}ms"
        return response
