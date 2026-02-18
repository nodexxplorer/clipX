from fastapi import APIRouter, Query, HTTPException
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
async def get_movie(movie_id: str):
    details = await movie_service.get_details(movie_id)
    if not details:
        raise HTTPException(status_code=404, detail="Movie not found")
    return details

@router.get("/movie/{movie_id}/stream", response_model=ContentStreamResponse)
async def get_stream(movie_id: str):
    try:
        return await movie_service.get_stream_links(movie_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/movie/{movie_id}/download", response_model=ContentDownloadResponse)
async def get_download(movie_id: str):
    try:
        return await movie_service.get_download_links(movie_id)
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
