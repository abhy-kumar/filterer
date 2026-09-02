"""
Shared HTTP client for the ingestion pipeline.

The previous pipeline issued roughly seven sequential yfinance calls per
company with a fixed 0.8s gap and three linear retries. Over a 500-name
universe that is ~3,500 requests, and Yahoo throttled almost all of it: the
last full run captured 67 companies out of 500, scattered across the whole
list, and every failure was discarded silently.

This module fixes the transport layer:

  * one browser-impersonating session (curl_cffi) shared by every source, so
    NSE's edge does not reject us outright
  * a per-host token bucket, because Yahoo and NSE want very different paces
  * retries that understand 429 and Retry-After, with exponential backoff and
    jitter rather than a flat 2s
  * an on-disk response cache, so re-running an ingest costs almost nothing
    and a partial run can be resumed without re-fetching what already worked
"""

from __future__ import annotations

import hashlib
import logging
import random
import threading
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

CACHE_DIR = Path(__file__).resolve().parent.parent / ".cache" / "http"

BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Connection": "keep-alive",
}

# Requests per second, per host. NSE tolerates very little; the archive host
# serving static CSVs tolerates more.
HOST_RATE_LIMITS: dict[str, float] = {
    "www.nseindia.com": 0.5,
    "nsearchives.nseindia.com": 3.0,
    "api.bseindia.com": 1.0,
    "www.bseindia.com": 1.0,
    "query1.finance.yahoo.com": 1.5,
    "query2.finance.yahoo.com": 1.5,
}
DEFAULT_RATE_LIMIT = 2.0

RETRYABLE_STATUS = {408, 425, 429, 500, 502, 503, 504}


class RateLimitError(RuntimeError):
    """Raised when a host keeps refusing after every retry."""


@dataclass
class _TokenBucket:
    """Minimum spacing between requests to one host."""

    min_interval: float
    _last: float = 0.0
    _lock: threading.Lock = field(default_factory=threading.Lock)

    def acquire(self) -> None:
        with self._lock:
            wait = self.min_interval - (time.monotonic() - self._last)
            if wait > 0:
                time.sleep(wait)
            self._last = time.monotonic()


class HttpClient:
    """Rate-limited, retrying, optionally caching HTTP client."""

    def __init__(
        self,
        cache_dir: Path | None = None,
        use_cache: bool = True,
        cache_ttl_seconds: int = 24 * 3600,
        max_retries: int = 5,
        impersonate: str = "chrome120",
    ) -> None:
        self.cache_dir = cache_dir or CACHE_DIR
        self.use_cache = use_cache
        self.cache_ttl = cache_ttl_seconds
        self.max_retries = max_retries
        self._buckets: dict[str, _TokenBucket] = {}
        self._buckets_lock = threading.Lock()
        self._primed: set[str] = set()

        if self.use_cache:
            self.cache_dir.mkdir(parents=True, exist_ok=True)

        try:
            from curl_cffi import requests as curl_requests

            self._session = curl_requests.Session(impersonate=impersonate)
            self._impersonating = True
        except Exception:  # pragma: no cover - depends on the environment
            import requests

            self._session = requests.Session()
            self._impersonating = False
            logger.warning(
                "curl_cffi unavailable; falling back to requests. NSE endpoints "
                "are likely to return 403 without browser impersonation."
            )
        self._session.headers.update(BROWSER_HEADERS)

    # ── Rate limiting ──────────────────────────────────────────

    def _bucket(self, host: str) -> _TokenBucket:
        with self._buckets_lock:
            if host not in self._buckets:
                rps = HOST_RATE_LIMITS.get(host, DEFAULT_RATE_LIMIT)
                self._buckets[host] = _TokenBucket(min_interval=1.0 / rps)
            return self._buckets[host]

    # ── Caching ────────────────────────────────────────────────

    def _cache_path(self, url: str, params: Optional[dict]) -> Path:
        key = hashlib.sha256(f"{url}|{sorted((params or {}).items())}".encode()).hexdigest()
        return self.cache_dir / key[:2] / f"{key}.bin"

    def _read_cache(self, path: Path) -> Optional[bytes]:
        if not self.use_cache or not path.exists():
            return None
        if time.time() - path.stat().st_mtime > self.cache_ttl:
            return None
        try:
            return path.read_bytes()
        except OSError:
            return None

    def _write_cache(self, path: Path, body: bytes) -> None:
        if not self.use_cache:
            return
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(body)
        except OSError as exc:
            logger.debug("Could not cache %s: %s", path, exc)

    # ── Session priming ────────────────────────────────────────

    def prime(self, url: str) -> None:
        """
        Visit a page to collect cookies before hitting its JSON API.

        NSE's API endpoints return 401/403 to a cookie-less client; loading any
        page on www.nseindia.com first sets what they look for.
        """
        host = urlparse(url).netloc
        if host in self._primed:
            return
        try:
            self._bucket(host).acquire()
            self._session.get(url, timeout=30)
            self._primed.add(host)
            logger.debug("Primed session for %s", host)
        except Exception as exc:
            logger.debug("Priming %s failed: %s", host, exc)

    # ── Requests ───────────────────────────────────────────────

    def get(
        self,
        url: str,
        params: Optional[dict] = None,
        headers: Optional[dict] = None,
        timeout: int = 30,
        allow_cache: bool = True,
    ) -> bytes:
        """Fetch a URL, honouring the cache, rate limits and retry policy."""
        cache_path = self._cache_path(url, params)
        if allow_cache:
            cached = self._read_cache(cache_path)
            if cached is not None:
                logger.debug("cache hit %s", url)
                return cached

        host = urlparse(url).netloc
        bucket = self._bucket(host)
        last_error: Exception | None = None

        for attempt in range(self.max_retries):
            bucket.acquire()
            try:
                response = self._session.get(
                    url, params=params, headers=headers, timeout=timeout
                )
                status = response.status_code

                if status == 200:
                    body = response.content
                    if allow_cache:
                        self._write_cache(cache_path, body)
                    return body

                if status in RETRYABLE_STATUS:
                    delay = self._backoff(attempt, response)
                    logger.warning(
                        "%s -> %s, retrying in %.1fs (attempt %d/%d)",
                        url, status, delay, attempt + 1, self.max_retries,
                    )
                    time.sleep(delay)
                    last_error = RateLimitError(f"HTTP {status} for {url}")
                    continue

                raise RuntimeError(f"HTTP {status} for {url}")

            except RateLimitError:
                raise
            except Exception as exc:
                last_error = exc
                delay = self._backoff(attempt, None)
                logger.warning(
                    "%s -> %s: %s, retrying in %.1fs",
                    url, type(exc).__name__, str(exc)[:120], delay,
                )
                time.sleep(delay)

        raise RateLimitError(f"Gave up on {url} after {self.max_retries} attempts: {last_error}")

    def get_json(self, url: str, **kwargs: Any) -> Any:
        import json

        return json.loads(self.get(url, **kwargs))

    @staticmethod
    def _backoff(attempt: int, response: Any) -> float:
        """Exponential backoff with jitter, deferring to Retry-After."""
        if response is not None:
            retry_after = None
            try:
                retry_after = response.headers.get("Retry-After")
            except Exception:
                retry_after = None
            if retry_after:
                try:
                    return min(float(retry_after), 120.0)
                except ValueError:
                    pass
        return min(2.0 ** attempt + random.uniform(0, 1.5), 60.0)


_shared: HttpClient | None = None


def shared_client(**kwargs: Any) -> HttpClient:
    """Process-wide client, so rate limits are actually shared."""
    global _shared
    if _shared is None:
        _shared = HttpClient(**kwargs)
    return _shared
