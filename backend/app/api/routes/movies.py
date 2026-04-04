from fastapi import APIRouter, Query, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.movie_service import movie_service
from app.models.responses import (
    SearchResponse, TrendingResponse, MovieDetails, 
    ContentStreamResponse, ContentDownloadResponse
)

router = APIRouter()

@router.get("/search", response_model=SearchResponse)
async def search(q: str, page: int = Query(1, ge=1)):
    try:
        return await movie_service.search_content(q, page)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trending", response_model=TrendingResponse)
async def trending():
    try:
        return await movie_service.get_trending()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/latest", response_model=TrendingResponse)
async def latest():
    # Mapping "latest" to trending for now as a fallback, 
    # or we can specifically query latest if the API supports it.
    try:
        return await movie_service.get_trending()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/movie/{movie_id}", response_model=MovieDetails)
async def get_movie(movie_id: str, db: AsyncSession = Depends(get_db)):
    details = await movie_service.get_details(movie_id, db)
    if not details:
        raise HTTPException(status_code=404, detail="Movie not found")
    return details

@router.get("/movie/{movie_id}/stream", response_model=ContentStreamResponse)
async def get_stream(movie_id: str, season: int = 0, episode: int = 1, db: AsyncSession = Depends(get_db)):
    try:
        data = await movie_service.get_stream_links(movie_id, season=season, episode=episode, db=db)
        # Obfuscate stream URLs — replace raw CDN URLs with signed proxy tokens
        from app.core.stream_token import create_stream_token
        import urllib.parse
        if hasattr(data, 'links'):
            for link in data.links:
                if link.url:
                    # The movie_service already wraps CDN URLs in proxy URLs like:
                    #   http://localhost:8000/api/proxy/stream?url=<encoded_cdn_url>
                    # We need to extract the raw CDN URL before tokenizing,
                    # otherwise the token resolves to a localhost URL which is
                    # blocked by the proxy's own SSRF protection.
                    raw_url = link.url
                    if '?url=' in raw_url:
                        parsed = urllib.parse.urlparse(raw_url)
                        qs = urllib.parse.parse_qs(parsed.query)
                        if 'url' in qs:
                            raw_url = qs['url'][0]

                    if raw_url.startswith('http'):
                        token = create_stream_token(raw_url)
                        # Replace with proxy URL — frontend will call /api/proxy/stream?token=xxx
                        link.url = f'/api/proxy/stream?token={token}'
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/movie/{movie_id}/download", response_model=ContentDownloadResponse)
async def get_download(movie_id: str, season: int = 0, episode: int = 1, db: AsyncSession = Depends(get_db)):
    try:
        return await movie_service.get_download_links(movie_id, season=season, episode=episode, db=db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/genres")
async def get_genres():
    # Curated list of typical genres for Moviebox
    return [
        "Action", "Adventure", "Animation", "Biography", "Comedy", "Crime",
        "Documentary", "Drama", "Family", "Fantasy", "History", "Horror",
        "Music", "Musical", "Mystery", "Romance", "Sci-Fi", "Sport",
        "Thriller", "War", "Western"
    ]

@router.get("/genre/{genre_name}", response_model=SearchResponse)
async def get_by_genre(genre_name: str, page: int = Query(1, ge=1)):
    try:
        # We can treat genre search as a keyword search for now
        return await movie_service.search_content(genre_name, page)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
