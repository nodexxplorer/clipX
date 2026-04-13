from app.providers.moviebox_provider import MovieboxProvider
from app.models.responses import (
    SearchResult, SearchResponse, ContentBase, TrendingResponse,
    MovieDetails, ContentStreamResponse, ContentDownloadResponse,
    StreamLink, DownloadLink
)
from app.core.config import settings
from app.models.database import Movie as DbMovie, Series as DbSeries
from sqlalchemy.future import select
from typing import Optional, List, Any
import asyncio
import time
from collections import OrderedDict

def _sentry_capture(e: Exception):
    """Safely forward exception to Sentry without crashing if SDK is absent."""
    try:
        import sentry_sdk
        sentry_sdk.capture_exception(e)
    except Exception:
        pass

class SearchCache:
    """LRU cache with TTL for search results."""
    def __init__(self, max_size=200, ttl=300):
        self._cache = OrderedDict()
        self._max_size = max_size
        self._ttl = ttl  # seconds

    def _make_key(self, query: str, page: int) -> str:
        return f"{query.strip().lower()}:{page}"

    def get(self, query: str, page: int):
        key = self._make_key(query, page)
        if key in self._cache:
            entry = self._cache[key]
            if time.time() - entry["ts"] < self._ttl:
                self._cache.move_to_end(key)
                return entry["data"]
            else:
                del self._cache[key]
        return None

    def put(self, query: str, page: int, data):
        key = self._make_key(query, page)
        self._cache[key] = {"data": data, "ts": time.time()}
        self._cache.move_to_end(key)
        while len(self._cache) > self._max_size:
            self._cache.popitem(last=False)

class MovieService:
    def __init__(self):
        self._provider = None
        self._search_cache = SearchCache(max_size=200, ttl=300)
        self._trending_cache = {"data": None, "ts": 0}

    @property
    def provider(self):
        if self._provider is None:
            self._provider = MovieboxProvider(host=settings.MOVIEBOX_HOST)
        return self._provider

    async def _sync_items(self, items: List[Any], db: Optional[Any] = None):
        if not db:
            return
        
        for item in items:
            try:
                mid = str(item.subjectId)
                is_movie = item.subjectType == 1
                model = DbMovie if is_movie else DbSeries
                
                result = await db.execute(select(model).where(model.moviebox_id == mid))
                db_item = result.scalars().first()
                
                if not db_item:
                    db_item = model(
                        moviebox_id=mid,
                        title=item.title,
                        detail_path=item.detailPath,
                        subject_type=item.subjectType.value if hasattr(item.subjectType, 'value') else item.subjectType,
                        poster_url=str(item.cover.url) if item.cover else None,
                        rating=float(item.imdbRatingValue or 0),
                        year=int(item.releaseDate.year) if item.releaseDate and item.releaseDate.year else None
                    )
                    # Use savepoint so a duplicate key doesn't poison the whole session
                    async with db.begin_nested():
                        db.add(db_item)
                else:
                    if not db_item.detail_path:
                        db_item.detail_path = item.detailPath
            except Exception as e:
                # Savepoint rollback already happened; just log
                _sentry_capture(e)
                print(f"Sync skip {item.title}: {e}")
        
        try:
            await db.commit()
        except Exception as e:
            _sentry_capture(e)
            print(f"Error committing synced items: {e}")
            try:
                await db.rollback()
            except Exception:
                pass

    async def search_content(self, query: str, page: int = 1, db: Optional[Any] = None) -> SearchResponse:
        # Check cache first
        cached = self._search_cache.get(query, page)
        if cached:
            return cached

        raw_results = await self.provider.search(query, page)
        await self._sync_items(raw_results.items, db)
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
                genres=item.genre,
                detail_path=item.detailPath
            ))
        
        response = SearchResponse(
            results=items,
            page=raw_results.pager.page,
            has_more=raw_results.pager.hasMore
        )
        # Cache the result
        self._search_cache.put(query, page, response)
        return response

    async def get_trending(self, db: Optional[Any] = None) -> TrendingResponse:
        # Check trending cache (TTL 5 min)
        if self._trending_cache["data"] and time.time() - self._trending_cache["ts"] < 300:
            return self._trending_cache["data"]

        raw_results = await self.provider.get_trending()
        await self._sync_items(raw_results.items, db)
        items = []
        for item in raw_results.items:
            items.append(ContentBase(
                id=item.subjectId,
                title=item.title,
                type="movie" if item.subjectType == 1 else "series",
                poster_url=str(item.cover.url) if item.cover else None,
                rating=item.imdbRatingValue,
                year=str(item.releaseDate.year) if item.releaseDate else None,
                detail_path=item.detailPath
            ))
        response = TrendingResponse(results=items)
        self._trending_cache = {"data": response, "ts": time.time()}
        return response

    async def get_movies(self, page: int = 1, db: Optional[Any] = None) -> SearchResponse:
        # Use hot content or empty query search for discovery
        try:
            hot = await self.provider.get_hot_content()
            items = hot.movies
        except Exception as _e:
            _sentry_capture(_e)
             # Fallback to search if hot fails
             res = await self.provider.search("", page=page, sub_type="MOVIES")
             items = res.items
             
        await self._sync_items(items, db)
        return SearchResponse(
            results=[SearchResult(
                id=item.subjectId,
                title=item.title,
                type="movie",
                poster_url=str(item.cover.url) if item.cover else None,
                rating=item.imdbRatingValue,
                year=str(item.releaseDate.year) if item.releaseDate else None,
                detail_path=item.detailPath
            ) for item in items],
            page=1,
            has_more=False
        )

    async def get_series(self, page: int = 1, db: Optional[Any] = None) -> SearchResponse:
        try:
            hot = await self.provider.get_hot_content()
            items = hot.tv_series
        except Exception as _e:
            _sentry_capture(_e)
             res = await self.provider.search("", page=page, sub_type="TV_SERIES")
             items = res.items

        await self._sync_items(items, db)
        return SearchResponse(
            results=[SearchResult(
                id=item.subjectId,
                title=item.title,
                type="series",
                poster_url=str(item.cover.url) if item.cover else None,
                rating=item.imdbRatingValue,
                year=str(item.releaseDate.year) if item.releaseDate else None,
                detail_path=item.detailPath
            ) for item in items],
            page=1,
            has_more=False
        )

    async def get_anime(self, page: int = 1, db: Optional[Any] = None) -> SearchResponse:
        # Search for anime keyword
        return await self.search_content("anime", page=page, db=db)

    async def get_details(self, movie_id: str, db: Optional[Any] = None) -> Optional[MovieDetails]:
        from pydantic import ValidationError as PydanticValidationError

        # Try finding the item in provider's memory cache first
        item = await self.provider._get_item(movie_id)
        
        # If not in cache and db provided, look up slug
        try:
            if not item and db:
                # Try both tables
                res = await db.execute(select(DbMovie).where(DbMovie.moviebox_id == movie_id))
                db_movie = res.scalars().first()
                if not db_movie:
                    res = await db.execute(select(DbSeries).where(DbSeries.moviebox_id == movie_id))
                    db_movie = res.scalars().first()
                
                if db_movie and db_movie.detail_path:
                    print(f"Found detail_path in DB for {movie_id}: {db_movie.detail_path}")
                    url = f"/detail/{db_movie.detail_path}?id={movie_id}"
                    raw_details = await self.provider.get_details(url, sub_type="TV_SERIES" if db_movie.subject_type == 2 else "MOVIES")
                else:
                    raw_details = await self.provider.get_details(movie_id)
            else:
                raw_details = await self.provider.get_details(movie_id)
        except PydanticValidationError as e:
            _sentry_capture(e)
            print(f"Pydantic validation error for movie {movie_id}: {e}")
            return None
        except Exception as e:
            _sentry_capture(e)
            print(f"Error fetching details for movie {movie_id}: {e}")
            return None
            
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

        # Parse seasons if TV series
        seasons = []
        if subject.subjectType == 2 and hasattr(res_data, 'resource') and hasattr(res_data.resource, 'seasons'):
            from app.models.responses import Season, Episode
            for s in res_data.resource.seasons:
                episodes = []
                # If we don't have individual episode metadata, we generate based on maxEp
                for i in range(1, s.maxEp + 1):
                    episodes.append(Episode(
                        id=f"{subject.subjectId}_s{s.se}_e{i}",
                        title=f"Episode {i}",
                        episode_number=i,
                        season_number=s.se
                    ))
                seasons.append(Season(
                    id=f"{subject.subjectId}_s{s.se}",
                    season_number=s.se,
                    episodes=episodes
                ))

        # Pull trailer_url from DB if stored (admin-set or previously synced)
        db_trailer_url = None
        if db:
            try:
                res = await db.execute(select(DbMovie).where(DbMovie.moviebox_id == str(subject.subjectId)))
                db_movie = res.scalars().first()
                if db_movie and db_movie.trailer_url:
                    db_trailer_url = db_movie.trailer_url
            except Exception:
                pass

        # Normalize trailer URL: if it's a raw YouTube ID, convert to full URL
        if db_trailer_url:
            import re
            # Check if it's a bare YouTube ID (11 chars, alphanumeric + dash/underscore)
            if re.match(r'^[\w-]{11}$', db_trailer_url):
                db_trailer_url = f"https://www.youtube.com/watch?v={db_trailer_url}"
            elif 'youtube.com' not in db_trailer_url and 'youtu.be' not in db_trailer_url and not db_trailer_url.startswith('http'):
                db_trailer_url = f"https://www.youtube.com/watch?v={db_trailer_url}"

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
            country=subject.countryName,
            trailer_url=db_trailer_url,
            seasons=seasons if seasons else None
        )

    async def _preload_cache(self, movie_id: str, db: Optional[Any] = None):
        """Preload the API memory cache by searching for the movie title from DB before we make queries by ID."""
        # If we already have this item in the provider cache, skip
        if movie_id in self.provider._item_cache:
            return

        if db:
            # Try to find the movie title in DB and use it to warm the provider cache
            res = await db.execute(select(DbMovie).where(DbMovie.moviebox_id == movie_id))
            db_movie = res.scalars().first()
            if not db_movie:
                res = await db.execute(select(DbSeries).where(DbSeries.moviebox_id == movie_id))
                db_movie = res.scalars().first()
            if db_movie:
                await self.provider.search(db_movie.title, sub_type="TV_SERIES" if db_movie.subject_type == 2 else "MOVIES")
                return

        # Fallback: search by the numeric ID as keyword — moviebox returns the item in results
        try:
            await self.provider.search(movie_id, sub_type="ALL")
        except Exception as e:
            _sentry_capture(e)
            print(f"Preload cache search failed for {movie_id}: {e}")

    async def get_stream_links(self, movie_id: str, season: int = 0, episode: int = 1, db: Optional[Any] = None) -> ContentStreamResponse:
        await self._preload_cache(movie_id, db)
        raw_links = await self.provider.get_stream_links(movie_id, season=season, episode=episode)
        
        # Subtitles are stored on the downloads detail model in this API, not the streams
        # So we fetch the downloads concurrently to scrape the captions for the stream player!
        try:
            raw_downloads = await self.provider.get_download_links(movie_id, season=season, episode=episode)
        except Exception as e:
            _sentry_capture(e)
            print(f"Failed to fetch subtitles: {e}")
            raw_downloads = None

        
        links = []
        if raw_links and raw_links.hasResource:
            for stream in raw_links.streams:
                import urllib.parse
                links.append(StreamLink(
                    quality=f"{stream.resolutions}p",
                    url=f"{settings.BASE_URL}{settings.API_V1_STR}/proxy/stream?url={urllib.parse.quote(str(stream.url), safe='')}",
                    format=stream.format,
                    size=stream.size,
                    duration=stream.duration
                ))
                
        subtitles_list = []
        if raw_downloads and hasattr(raw_downloads, 'captions') and raw_downloads.captions:
            import urllib.parse
            for cap in raw_downloads.captions:
                subtitles_list.append({
                    "lang": cap.lanName,
                    "code": cap.lan,
                    "url": f"{settings.BASE_URL}{settings.API_V1_STR}/proxy/stream?url={urllib.parse.quote(str(cap.url), safe='')}" 
                    if getattr(cap, 'url', None) else None
                })
        
        return ContentStreamResponse(links=links, subtitles=subtitles_list)

    async def get_download_links(self, movie_id: str, season: int = 0, episode: int = 1, db: Optional[Any] = None) -> ContentDownloadResponse:
        await self._preload_cache(movie_id, db)
        raw_links = await self.provider.get_download_links(movie_id, season=season, episode=episode)
        links = []
        if raw_links and raw_links.hasResource:
            for download in raw_links.downloads:
                import urllib.parse
                import re
                
                # Fetch details to get a nice filename if we don't have it
                details = await self.get_details(movie_id)
                title = details.title if details else "Watch"
                
                # Clean title for filename
                clean_title = re.sub(r'[^\w\s-]', '', title).strip().replace(' ', '_')
                filename = f"{clean_title}_{download.resolution}p.{download.ext}"
                if season > 0:
                    filename = f"{clean_title}_S{season}E{episode}_{download.resolution}p.{download.ext}"

                links.append(DownloadLink(
                    quality=f"{download.resolution}p",
                # Use proxy URL for downloads too
                url=f"{settings.BASE_URL}{settings.API_V1_STR}/proxy/download?url={urllib.parse.quote(str(download.url), safe='')}&filename={urllib.parse.quote(filename)}",
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
