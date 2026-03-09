from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Any

class ContentBase(BaseModel):
    id: str
    title: str
    type: str # movie or series
    poster_url: Optional[str] = None
    rating: float = 0.0
    year: Optional[str] = None
    detail_path: Optional[str] = None

class SearchResult(ContentBase):
    description: Optional[str] = None
    genres: List[str] = []

class Episode(BaseModel):
    id: str
    title: str
    episode_number: int
    season_number: int
    release_date: Optional[str] = None
    poster_url: Optional[str] = None
    description: Optional[str] = None

class Season(BaseModel):
    id: str
    season_number: int
    episodes: List[Episode] = []

class MovieDetails(ContentBase):
    description: Optional[str] = None
    genres: List[str] = []
    duration: Optional[int] = None
    country: Optional[str] = None
    trailer_url: Optional[str] = None
    seasons: Optional[List[Season]] = None

class StreamLink(BaseModel):
    quality: str
    url: str
    format: Optional[str] = None
    size: Optional[int] = None
    duration: Optional[int] = None

class DownloadLink(BaseModel):
    quality: str
    url: str
    size: Optional[int] = None
    size_str: Optional[str] = None
    ext: str

class ContentStreamResponse(BaseModel):
    links: List[StreamLink]
    subtitles: List[dict] = []

class ContentDownloadResponse(BaseModel):
    links: List[DownloadLink]
    subtitles: List[dict] = []

class TrendingResponse(BaseModel):
    results: List[ContentBase]

class SearchResponse(BaseModel):
    results: List[SearchResult]
    page: int
    has_more: bool
