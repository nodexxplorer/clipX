from app.providers.moviebox_provider import MovieboxProvider
from app.models.responses import (
    SearchResult, SearchResponse, ContentBase, TrendingResponse,
    MovieDetails, ContentStreamResponse, ContentDownloadResponse,
    StreamLink, DownloadLink
)
from app.core.config import settings
from typing import Optional, List

class MovieService:
    def __init__(self):
        self._provider = None

    @property
    def provider(self):
        if self._provider is None:
            self._provider = MovieboxProvider(host=settings.MOVIEBOX_HOST)
        return self._provider

    async def search_content(self, query: str, page: int = 1) -> SearchResponse:
        raw_results = await self.provider.search(query, page)
        items = []
        for item in raw_results.items:
            items.append(SearchResult(
                id=item.subjectId,
                title=item.title,
                type="movie" if item.subjectType == 1 else "series",
                poster_url=str(item.cover.url) if item.cover else None,
                rating=item.imdbRatingValue,
                year=str(item.releaseDate.year) if item.releaseDate else None,
                description=item.description,
                genres=item.genre
            ))
        
        return SearchResponse(
            results=items,
            page=raw_results.pager.page,
            has_more=raw_results.pager.hasMore
        )

    async def get_trending(self) -> TrendingResponse:
        raw_results = await self.provider.get_trending()
        items = []
        for item in raw_results.items:
            items.append(ContentBase(
                id=item.subjectId,
                title=item.title,
                type="movie" if item.subjectType == 1 else "series",
                poster_url=str(item.cover.url) if item.cover else None,
                rating=item.imdbRatingValue,
                year=str(item.releaseDate.year) if item.releaseDate else None
            ))
        return TrendingResponse(results=items)

    async def get_details(self, movie_id: str) -> Optional[MovieDetails]:
        raw_details = await self.provider.get_details(movie_id)
        if not raw_details:
            return None
        
        # Accessing nested resData
        res_data = raw_details.resData
        subject = res_data.subject
        
        def parse_duration(dur_str):
            if not dur_str: return None
            if isinstance(dur_str, int): return dur_str
            # Extract digits from string like "105 min"
            digits = "".join(filter(str.isdigit, str(dur_str)))
            return int(digits) if digits else None

        return MovieDetails(
            id=subject.subjectId,
            title=subject.title,
            type="movie" if subject.subjectType == 1 else "series",
            poster_url=str(subject.cover.url) if subject.cover else None,
            rating=subject.imdbRatingValue,
            year=str(subject.releaseDate.year) if subject.releaseDate else None,
            description=subject.description,
            genres=subject.genre,
            duration=parse_duration(subject.duration),
            country=subject.countryName
        )

    async def get_stream_links(self, movie_id: str) -> ContentStreamResponse:
        raw_links = await self.provider.get_stream_links(movie_id)
        links = []
        if raw_links and raw_links.hasResource:
            for stream in raw_links.streams:
                links.append(StreamLink(
                    quality=f"{stream.resolutions}p",
                    url=str(stream.url),
                    format=stream.format,
                    size=stream.size,
                    duration=stream.duration
                ))
        return ContentStreamResponse(links=links)

    async def get_download_links(self, movie_id: str) -> ContentDownloadResponse:
        raw_links = await self.provider.get_download_links(movie_id)
        links = []
        if raw_links and raw_links.hasResource:
            for download in raw_links.downloads:
                links.append(DownloadLink(
                    quality=f"{download.resolution}p",
                    url=str(download.url),
                    size=download.size,
                    size_str=f"{download.size // (1024*1024)} MB" if download.size else "Unknown",
                    ext=download.ext
                ))
        
        # Subtitles
        subtitles = []
        if raw_links and hasattr(raw_links, 'captions'):
            for cap in raw_links.captions:
                subtitles.append({
                    "lang": cap.lanName,
                    "code": cap.lan,
                    "url": str(cap.url)
                })
                
        return ContentDownloadResponse(links=links, subtitles=subtitles)

movie_service = MovieService()
