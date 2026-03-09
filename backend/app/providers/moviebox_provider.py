import asyncio
from typing import List, Optional, Any
from moviebox_api.requests import Session
from moviebox_api.core import Search, MovieDetails, Trending, TVSeriesDetails, HotMoviesAndTVSeries, Homepage
from moviebox_api.stream import StreamFilesDetail
from moviebox_api.download import DownloadableMovieFilesDetail, DownloadableTVSeriesFilesDetail
from moviebox_api.constants import SubjectType
import os

# Subclass to fix the missing abstract method in moviebox-api
class FixedStreamFilesDetail(StreamFilesDetail):
    async def get_content_model(self, season: int, episode: int):
        return await self.get_modelled_content(season, episode)

class MovieboxProvider:
    def __init__(self, host: Optional[str] = None):
        if host:
            os.environ["MOVIEBOX_API_HOST"] = host
        self.session = Session()
        self._item_cache = {} # Cache for SearchResultsItem by ID

    async def search(self, query: str, page: int = 1, sub_type: str = "MOVIES") -> Any:
        type_map = {
            "MOVIES": SubjectType.MOVIES,
            "TV_SERIES": SubjectType.TV_SERIES,
            "ALL": SubjectType.ALL
        }
        target_type = type_map.get(sub_type.upper(), SubjectType.MOVIES)
        
        # Search class in moviebox-api
        search_obj = Search(self.session, query, subject_type=target_type)
        results = await search_obj.get_content_model()
        # Populate cache
        for item in results.items:
            self._item_cache[str(item.subjectId)] = item
        return results

    async def get_trending(self) -> Any:
        trending = Trending(self.session)
        results = await trending.get_content_model()
        # Populate cache
        for item in results.items:
            self._item_cache[str(item.subjectId)] = item
        return results

    async def get_hot_content(self) -> Any:
        hot = HotMoviesAndTVSeries(self.session)
        results = await hot.get_content_model()
        # Populate cache
        for item in results.movies + results.tv_series:
            self._item_cache[str(item.subjectId)] = item
        return results

    async def get_homepage(self) -> Any:
        home = Homepage(self.session)
        results = await home.get_content_model()
        # Populate cache
        for item in results.contents:
            if hasattr(item, 'subjectId') and item.subjectId:
                self._item_cache[str(item.subjectId)] = item
            elif hasattr(item, 'id') and item.id:
                # ContentModel has 'id' and 'subjectId'
                self._item_cache[str(item.id)] = item
        return results

    async def _get_item(self, item_id: str) -> Optional[Any]:
        # item_id can be string or numeric
        s_id = str(item_id)
        if s_id in self._item_cache:
            return self._item_cache[s_id]
            
        # If not in cache, try to fetch directly using MovieDetails if plausible ID
        # Moviebox-api MovieDetails can sometimes accept a SearchResultsItem mock or URL
        # We'll stick to search for now but make it more robust.
        
        search_obj = Search(self.session, s_id, subject_type=SubjectType.ALL)
        try:
            results = await search_obj.get_content_model()
            if results.items:
                for it in results.items:
                    if str(it.subjectId) == s_id:
                        self._item_cache[s_id] = it
                        return it
                
                # If no exact ID match in search results, maybe search by title if we had it.
                # Since we don't, we return the most likely candidate from search.
                candidate = results.items[0]
                self._item_cache[s_id] = candidate
                return candidate
        except Exception as e:
            print(f"Provider search error for {s_id}: {e}")
            
        return None

    async def get_details(self, item_id: str, sub_type: str = "MOVIES") -> Any:
        item = await self._get_item(item_id)
        if not item:
            return None
            
        if sub_type.upper() == "TV_SERIES" or item.subjectType == SubjectType.TV_SERIES:
            details_fetcher = TVSeriesDetails(item, self.session)
        else:
            details_fetcher = MovieDetails(item, self.session)
            
        return await details_fetcher.get_content_model()

    async def get_stream_links(self, item_id: str, season: int = 0, episode: int = 1):
        item = await self._get_item(item_id)
        if not item:
            return None
        
        # Refresh cookies/session by fetching details first
        if item.subjectType == SubjectType.TV_SERIES:
            details_fetcher = TVSeriesDetails(item, self.session)
        else:
            details_fetcher = MovieDetails(item, self.session)
        await details_fetcher.get_content_model()
        
        if item.subjectType != SubjectType.TV_SERIES:
            season, episode = 0, 0
            
        stream_detail = FixedStreamFilesDetail(self.session, item)
        return await stream_detail.get_content_model(season, episode)

    async def get_download_links(self, item_id: str, season: int = 0, episode: int = 1):
        item = await self._get_item(item_id)
        if not item:
            return None
        
        # Refresh cookies/session
        if item.subjectType == SubjectType.TV_SERIES:
            details_fetcher = TVSeriesDetails(item, self.session)
        else:
            details_fetcher = MovieDetails(item, self.session)
        await details_fetcher.get_content_model()
        
        if item.subjectType == SubjectType.TV_SERIES:
            download_detail = DownloadableTVSeriesFilesDetail(self.session, item)
            return await download_detail.get_content_model(season, episode)
        else:
            download_detail = DownloadableMovieFilesDetail(self.session, item)
            return await download_detail.get_content_model()
