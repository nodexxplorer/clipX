import httpx
import urllib.parse
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from app.core.config import settings

router = APIRouter()

# Exact headers used by moviebox_api for download/stream requests
STREAM_HEADERS = {
    "Accept": "*/*",
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:137.0) Gecko/20100101 Firefox/137.0",
    "Origin": "h5.aoneroom.com",
    "Referer": "https://fmoviesunblocked.net/",
}


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
async def proxy_stream(url: str, request: Request):
    if not url:
        raise HTTPException(status_code=400, detail="Missing url parameter")

    # Build request headers — merge stream defaults with any Range header from browser
    headers = dict(STREAM_HEADERS)
    if "range" in request.headers:
        headers["Range"] = request.headers["range"]

    # Try to use the shared moviebox session client (has CDN cookies + auth)
    moviebox_client = _get_moviebox_client()

    if moviebox_client:
        try:
            req = moviebox_client.build_request("GET", url, headers=headers)
            r = await moviebox_client.send(req, stream=True)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Upstream fetch failed: {e}")
    else:
        # Fallback: plain httpx client (may get 403 from CDN)
        fallback_client = httpx.AsyncClient(
            timeout=None,
            follow_redirects=True,
            verify=False,
        )
        try:
            req = fallback_client.build_request("GET", url, headers=headers)
            r = await fallback_client.send(req, stream=True)
        except Exception as e:
            await fallback_client.aclose()
            raise HTTPException(status_code=500, detail=str(e))

    status_code = r.status_code

    response_headers = {
        "Content-Type": r.headers.get("Content-Type", "video/mp4"),
        "Accept-Ranges": "bytes",
        "Access-Control-Allow-Origin": "*",
    }
    if "Content-Length" in r.headers:
        response_headers["Content-Length"] = r.headers["Content-Length"]
    if "Content-Range" in r.headers:
        response_headers["Content-Range"] = r.headers["Content-Range"]

    async def stream_content():
        async for chunk in r.aiter_bytes(chunk_size=65536):
            yield chunk
        await r.aclose()

    return StreamingResponse(
        stream_content(),
        status_code=status_code,
        headers=response_headers,
    )


@router.get("/download")
async def proxy_download(url: str, request: Request, filename: str = None):
    response = await proxy_stream(url, request)

    if response.status_code in [200, 206]:
        if not filename:
            from urllib.parse import urlparse
            import os
            path = urlparse(url).path
            filename = os.path.basename(path) or "download.mp4"

        response.headers["Content-Disposition"] = f'attachment; filename="{filename}"'

    return response
