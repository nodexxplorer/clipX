import httpx
import os
import urllib.parse
import ipaddress
from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import StreamingResponse
from app.core.config import settings
from app.core.auth import get_current_user

router = APIRouter()

# Exact headers used by moviebox_api for download/stream requests
STREAM_HEADERS = {
    "Accept": "*/*",
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:137.0) Gecko/20100101 Firefox/137.0",
    "Origin": "h5.aoneroom.com",
    "Referer": "https://fmoviesunblocked.net/",
}

# ═══════════════════════════════════════════════
# URL Allowlist — prevent SSRF attacks
# ═══════════════════════════════════════════════

ALLOWED_DOMAINS = {
    "vod.aoneroom.com",
    "aoneroom.com",
    "h5.aoneroom.com",
    "fmoviesunblocked.net",
    "image.tmdb.org",
    "i.ibb.co",
    "hakunaymatata.com",
    "cloudfront.net",
}

BLOCKED_IP_RANGES = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
]


def _validate_url(url: str) -> str:
    """
    Validate the URL against the allowlist and block internal IPs.
    Returns the validated URL or raises HTTPException.
    """
    try:
        parsed = urllib.parse.urlparse(url)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid URL format")

    # Must be HTTP(S)
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(status_code=400, detail="Only HTTP/HTTPS URLs are allowed")

    hostname = parsed.hostname
    if not hostname:
        raise HTTPException(status_code=400, detail="URL must have a hostname")

    # Check against allowed domains
    domain_allowed = any(
        hostname == d or hostname.endswith(f".{d}")
        for d in ALLOWED_DOMAINS
    )
    if not domain_allowed:
        raise HTTPException(
            status_code=403,
            detail=f"Domain '{hostname}' is not in the allowed proxy list"
        )

    # Block internal/private IPs (SSRF protection)
    try:
        ip = ipaddress.ip_address(hostname)
        for blocked in BLOCKED_IP_RANGES:
            if ip in blocked:
                raise HTTPException(
                    status_code=403,
                    detail="Proxying to private/internal IPs is not allowed"
                )
    except ValueError:
        # hostname is not an IP — that's fine, it's a domain name
        pass

    return url


def _get_moviebox_client() -> httpx.AsyncClient:
    """
    Return the shared httpx AsyncClient from the moviebox_api session.
    This client already has:
      - The correct headers (User-Agent, Origin, Referer)
      - The session cookies (including 'account') set by the CDN
    Using the same client instance is the only way to pass the CDN's
    IP + cookie based hotlink-protection check.
    """
    try:
        from app.services.movie_service import movie_service
        return movie_service.provider.session._client
    except Exception:
        return None


@router.get("/stream")
async def proxy_stream(request: Request, url: str = None, token: str = None):
    # Resolve token-based URL or use direct URL
    actual_url = url
    if token:
        from app.core.stream_token import resolve_stream_token
        result = resolve_stream_token(token)
        if not result:
            raise HTTPException(status_code=403, detail="Invalid or expired stream token")
        actual_url, token_user_id = result
        # Token is HMAC-signed and time-limited — it IS authentication.
        # Browser <video> elements don't send httpOnly cookies on cross-origin
        # requests, so we rely on the cryptographic token instead.
    else:
        # Raw URL mode — require cookie-based auth
        user = await get_current_user(request)
        # user is guaranteed non-None (get_current_user raises 401 on failure)
    if not actual_url:
        raise HTTPException(status_code=400, detail="Missing url or token parameter")

    # Validate URL against allowlist (SSRF protection)
    actual_url = _validate_url(actual_url)

    # Build request headers — merge stream defaults with any Range header from browser
    headers = dict(STREAM_HEADERS)
    if "range" in request.headers:
        headers["Range"] = request.headers["range"]

    # Try to use the shared moviebox session client (has CDN cookies + auth)
    moviebox_client = _get_moviebox_client()

    if moviebox_client:
        try:
            req = moviebox_client.build_request("GET", actual_url, headers=headers)
            r = await moviebox_client.send(req, stream=True)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Upstream fetch failed: {e}")
        _cleanup_client = None
    else:
        # Fallback: plain httpx client (SSL verification enabled)
        fallback_client = httpx.AsyncClient(
            timeout=None,
            follow_redirects=True,
            verify=True,
        )
        _cleanup_client = fallback_client
        try:
            req = fallback_client.build_request("GET", actual_url, headers=headers)
            r = await fallback_client.send(req, stream=True)
        except Exception as e:
            await fallback_client.aclose()
            raise HTTPException(status_code=500, detail=str(e))

    status_code = r.status_code

    response_headers = {
        "Content-Type": r.headers.get("Content-Type", "video/mp4"),
        "Accept-Ranges": "bytes",
        "Access-Control-Allow-Origin": os.getenv("FRONTEND_URL", "http://localhost:3000"),
        "Access-Control-Allow-Credentials": "true",
    }
    if "Content-Length" in r.headers:
        response_headers["Content-Length"] = r.headers["Content-Length"]
    if "Content-Range" in r.headers:
        response_headers["Content-Range"] = r.headers["Content-Range"]

    async def stream_content():
        try:
            async for chunk in r.aiter_bytes(chunk_size=65536):
                yield chunk
        finally:
            await r.aclose()
            if _cleanup_client:
                await _cleanup_client.aclose()

    return StreamingResponse(
        stream_content(),
        status_code=status_code,
        headers=response_headers,
    )


@router.get("/download")
async def proxy_download(url: str, request: Request, user=Depends(get_current_user), filename: str = None):
    # Validate URL first (SSRF protection)
    _validate_url(url)

    response = await proxy_stream(request, url=url)

    if response.status_code in [200, 206]:
        if not filename:
            from urllib.parse import urlparse
            import os
            path = urlparse(url).path
            filename = os.path.basename(path) or "download.mp4"

        response.headers["Content-Disposition"] = f'attachment; filename="{filename}"'

    return response

