# pyright: reportCallIssue=false, reportArgumentType=false, reportGeneralTypeIssues=false, reportReturnType=false
"""Movie-related queries: browse, search, trending, details, etc."""

import strawberry
import asyncio
from typing import List, Optional

from app.services.movie_service import movie_service
from app.api.graphql.types import (
    Movie, Genre, Season, Episode, MoviePagination, SearchResults,
    SeriesFilter, BrowseSeriesResponse, TrendingSearch,
    StreamLinkType, ProviderSubtitleType, StreamDataType,
)
from app.api.graphql.helpers import _sentry_capture, logger


@strawberry.type
class MovieQueries:

    @strawberry.field
    async def movies(
        self,
        info: strawberry.Info,
        filter: Optional[strawberry.scalars.JSON] = None,
        sort: Optional[str] = "popular",
        limit: int = 20,
        offset: int = 0,
    ) -> strawberry.scalars.JSON:
        """Browse movies with optional filtering by type, genre, year, country."""
        f_type = f_genre = f_year = f_country = None
        if filter:
            f_type = filter.get("type")
            f_genre = filter.get("genre")
            f_year = filter.get("year")
            f_country = filter.get("country")

        page = (offset // max(limit, 1)) + 1
        try:
            if f_type and f_type.lower() == "series":
                data = await movie_service.get_series(page=page)
            elif f_type and f_type.lower() == "anime":
                data = await movie_service.get_anime(page=page)
            elif f_genre and f_genre.lower() not in ("all", ""):
                data = await movie_service.search_content(f_genre, page=page)
            elif sort and sort.lower() == "latest":
                data = await movie_service.search_content("new", page=page)
            else:
                data = await movie_service.get_movies(page=page)
        except Exception as e:
            _sentry_capture(e)
            logger.exception("movies query error")
            return {"movies": [], "total": 0, "hasMore": False}

        results = data.results if hasattr(data, "results") else []

        if f_year and str(f_year).lower() not in ("all", ""):
            yr_str = str(f_year)
            if yr_str.endswith("s"):
                decade = int(yr_str[:4])
                results = [r for r in results if r.year and decade <= int(r.year) < decade + 10]
            else:
                results = [r for r in results if r.year and str(r.year) == yr_str]

        paged = results[offset:offset + limit] if offset > 0 else results[:limit]
        movies_out = [
            {
                "id": r.id,
                "title": r.title,
                "type": getattr(r, "type", "movie"),
                "description": getattr(r, "description", None),
                "year": r.year,
                "rating": r.rating,
                "posterUrl": r.poster_url,
                "genres": [
                    {"id": g, "name": g, "slug": g.lower().replace(" ", "-")}
                    for g in (getattr(r, "genres", None) or [])
                ],
            }
            for r in paged
        ]
        return {"movies": movies_out, "total": len(results), "hasMore": getattr(data, "has_more", False)}

    @strawberry.field
    async def personalizedRecommendations(self, info: strawberry.Info, userId: Optional[strawberry.ID] = None, limit: Optional[int] = 10) -> List[Movie]:
        from app.core.cache import cache
        cache_key = f"personalizedRecommendations:{userId or 'guest'}:{limit}"
        cached = await cache.get(cache_key)
        if cached:
            return [Movie(**c) for c in cached]
        resp = await movie_service.get_trending()
        results = [
            Movie(
                id=item.id, title=item.title,
                overview=item.description if hasattr(item, 'description') else "AI-powered pick for you.",
                posterPath=item.poster_url, backdropPath=item.poster_url,
                releaseDate=item.year, voteAverage=item.rating,
                reason="Top Choice" if i < 3 else "Trending Item",
                score=0.99 - (i * 0.01)
            )
            for i, item in enumerate(resp.results[:limit])
        ]
        await cache.set(cache_key, [vars(m) for m in results], expire=600)
        return results

    @strawberry.field
    async def trending(self, info: strawberry.Info, limit: Optional[int] = 20, timeWindow: Optional[str] = "week") -> List[Movie]:
        from app.core.cache import cache
        cache_key = f"trending:{limit}:{timeWindow}"
        cached = await cache.get(cache_key)
        if cached:
            return [Movie(**c) for c in cached]
        db = await info.context.get_db()
        resp = await movie_service.get_trending(db=db)
        results = [
            Movie(
                id=item.id, title=item.title,
                overview=item.description if hasattr(item, 'description') else None,
                posterPath=item.poster_url, backdropPath=item.poster_url,
                releaseDate=item.year, voteAverage=item.rating, voteCount=100, popularity=0.0
            )
            for item in resp.results[:limit]
        ]
        await cache.set(cache_key, [vars(m) for m in results], expire=300)
        return results

    @strawberry.field
    async def popular(self, info: strawberry.Info, limit: Optional[int] = 20, page: Optional[int] = 1) -> List[Movie]:
        from app.core.cache import cache
        cache_key = f"popular:{limit}:{page}"
        cached = await cache.get(cache_key)
        if cached:
            return [Movie(**c) for c in cached]
        db = await info.context.get_db()
        resp = await movie_service.get_trending(db=db)
        results = [
            Movie(
                id=item.id, title=item.title,
                overview=item.description if hasattr(item, 'description') else None,
                posterPath=item.poster_url, backdropPath=item.poster_url,
                releaseDate=item.year, voteAverage=item.rating, voteCount=100, popularity=0.0
            )
            for item in resp.results[:limit]
        ]
        await cache.set(cache_key, [vars(m) for m in results], expire=300)
        return results

    @strawberry.field
    async def trendingSeries(self, info: strawberry.Info, limit: Optional[int] = 10) -> List[Movie]:
        from app.core.cache import cache
        cache_key = f"trendingSeries:{limit}"
        cached = await cache.get(cache_key)
        if cached:
            return [Movie(**c) for c in cached]
        db = await info.context.get_db()
        resp = await movie_service.get_series(db=db)
        results = [
            Movie(
                id=item.id, title=item.title,
                overview=item.description if hasattr(item, 'description') else None,
                posterPath=item.poster_url, backdropPath=item.poster_url,
                releaseDate=item.year, voteAverage=item.rating
            )
            for item in resp.results[:limit]
        ]
        await cache.set(cache_key, [vars(m) for m in results], expire=300)
        return results

    @strawberry.field
    async def featured(self, info: strawberry.Info, limit: Optional[int] = 5) -> List[Movie]:
        db = await info.context.get_db()
        resp = await movie_service.get_trending(db=db)
        return [
            Movie(
                id=item.id, title=item.title,
                overview="Featured premium content on clipX.",
                posterPath=item.poster_url, backdropPath=item.poster_url,
                releaseDate=item.year, voteAverage=item.rating, tagline="Staff Pick"
            )
            for item in resp.results[:limit]
        ]

    @strawberry.field
    async def editorsChoice(self, limit: Optional[int] = 5) -> List[Movie]:
        resp = await movie_service.get_trending()
        return [
            Movie(
                id=item.id, title=item.title,
                posterPath=item.poster_url, backdropPath=item.poster_url,
                releaseDate=item.year, voteAverage=item.rating,
                editorNote="A must-watch masterpiece chosen by our experts."
            )
            for item in resp.results[:limit]
        ]

    @strawberry.field
    async def awardWinning(self, limit: Optional[int] = 10) -> List[Movie]:
        resp = await movie_service.get_trending()
        items = resp.results[5:5 + limit] if len(resp.results) > 5 else resp.results[:limit]
        return [
            Movie(
                id=item.id, title=item.title,
                posterPath=item.poster_url, backdropPath=item.poster_url,
                releaseDate=item.year, voteAverage=item.rating,
                awards="Best Picture, Best Director"
            )
            for item in items
        ]

    @strawberry.field
    async def movie(self, info: strawberry.Info, id: strawberry.ID) -> Optional[Movie]:
        db = await info.context.get_db()
        details = await movie_service.get_details(str(id), db=db)
        if not details:
            return None
        return Movie(
            id=details.id, title=details.title, overview=details.description,
            posterPath=details.poster_url, backdropPath=details.poster_url,
            releaseDate=details.year, voteAverage=details.rating, voteCount=100,
            runtime=details.duration, trailerUrl=details.trailer_url,
            genres=[Genre(id=str(i), name=g, slug=g.lower()) for i, g in enumerate(details.genres or [])],
            seasons=[
                Season(
                    id=s.id, seasonNumber=s.season_number,
                    episodes=[
                        Episode(
                            id=e.id, title=e.title,
                            episodeNumber=e.episode_number, seasonNumber=e.season_number,
                            releaseDate=e.release_date, posterUrl=e.poster_url, description=e.description
                        )
                        for e in s.episodes
                    ]
                )
                for s in details.seasons
            ] if details.seasons else None
        )

    @strawberry.field
    async def searchMovies(self, info: strawberry.Info, query: str, page: Optional[int] = 1, limit: Optional[int] = 24) -> MoviePagination:
        db = await info.context.get_db()
        resp = await movie_service.search_content(query, page, db=db)
        items = [
            Movie(
                id=item.id, title=item.title, overview=item.description,
                posterPath=item.poster_url, backdropPath=item.poster_url,
                releaseDate=item.year, voteAverage=item.rating, voteCount=50,
                genres=[Genre(id=str(i), name=g, slug=g.lower().replace(' ', '-')) for i, g in enumerate(item.genres or [])] if item.genres else None
            )
            for item in resp.results
        ]

        # ── Relevance ranking ────────────────────────────────────────
        # Score each result by title similarity to the query + popularity.
        # Exact match → 100, starts-with → 60, contains → 30, else 0.
        # Rating (0-10) adds up to 10 points. Higher scores sort first.
        q_lower = query.strip().lower()
        def relevance_score(movie):
            t = (movie.title or "").strip().lower()
            rating_boost = float(movie.voteAverage or 0)
            if t == q_lower:
                return 100 + rating_boost
            elif t.startswith(q_lower):
                return 60 + rating_boost
            elif q_lower in t:
                return 30 + rating_boost
            else:
                return rating_boost

        items.sort(key=relevance_score, reverse=True)

        return MoviePagination(
            items=items,
            totalCount=len(items) + (50 if resp.has_more else 0),
            hasMore=resp.has_more, currentPage=resp.page
        )

    @strawberry.field
    async def searchSuggestions(self, info: strawberry.Info, limit: Optional[int] = 8) -> List[Movie]:
        db = await info.context.get_db()
        resp = await movie_service.get_trending(db=db)
        return [
            Movie(
                id=item.id, title=item.title,
                posterPath=item.poster_url, backdropPath=item.poster_url,
                releaseDate=item.year, voteAverage=item.rating
            )
            for item in resp.results[:limit]
        ]

    @strawberry.field
    async def similarMovies(self, info: strawberry.Info, movieId: strawberry.ID, limit: Optional[int] = 12) -> List[Movie]:
        """Genre-weighted similar movies algorithm.

        1. Fetch the source movie's genres.
        2. Search by the *primary* genre to find candidates sharing thematic DNA.
        3. Score each candidate by the number of overlapping genres with the source.
        4. Sort by genre-overlap score (desc), then by rating (desc).
        5. Fall back to trending if genre search fails.
        """
        db = await info.context.get_db()
        details = await movie_service.get_details(str(movieId), db=db)
        if not details:
            return []

        source_genres = set(g.lower() for g in (details.genres or []))
        primary_genre = (details.genres or [""])[0] if details.genres else ""

        try:
            # Search by primary genre for better thematic matches
            candidates = []
            if primary_genre:
                resp = await movie_service.search_content(primary_genre, 1, db=db)
                candidates.extend(resp.results)

            # If we don't have enough candidates, also search by title
            if len(candidates) < limit * 2 and details.title:
                try:
                    title_resp = await movie_service.search_content(details.title, 1, db=db)
                    seen_ids = {str(c.id) for c in candidates}
                    for item in title_resp.results:
                        if str(item.id) not in seen_ids:
                            candidates.append(item)
                            seen_ids.add(str(item.id))
                except Exception as e:
                    _sentry_capture(e)
                    logger.warning(f"Title search fallback failed in similarMovies: {e}")

            # If we have a secondary genre, pull more candidates
            if len(candidates) < limit * 2 and len(details.genres or []) > 1:
                try:
                    secondary = details.genres[1]
                    sec_resp = await movie_service.search_content(secondary, 1, db=db)
                    seen_ids = {str(c.id) for c in candidates}
                    for item in sec_resp.results:
                        if str(item.id) not in seen_ids:
                            candidates.append(item)
                            seen_ids.add(str(item.id))
                except Exception as e:
                    _sentry_capture(e)
                    logger.warning(f"Secondary genre search failed in similarMovies: {e}")

            # Filter out the source movie
            candidates = [c for c in candidates if str(c.id) != str(movieId)]

            # Score by genre overlap
            def genre_score(item):
                item_genres = set(g.lower() for g in (getattr(item, 'genres', None) or []))
                overlap = len(source_genres & item_genres)
                rating = item.rating or 0.0
                return (overlap, rating)

            candidates.sort(key=genre_score, reverse=True)

            return [
                Movie(
                    id=item.id, title=item.title, overview=item.description,
                    posterPath=item.poster_url, backdropPath=item.poster_url,
                    releaseDate=item.year, voteAverage=item.rating, voteCount=50,
                    genres=[Genre(id=str(i), name=g, slug=g.lower().replace(' ', '-'))
                           for i, g in enumerate(item.genres or [])] if hasattr(item, 'genres') and item.genres else None
                )
                for item in candidates
            ][:limit]
        except Exception as e:
            _sentry_capture(e)
            logger.exception("similarMovies error")
            try:
                fallback = await movie_service.get_trending(db=db)
                return [
                    Movie(
                        id=item.id, title=item.title,
                        posterPath=item.poster_url, backdropPath=item.poster_url,
                        releaseDate=item.year, voteAverage=item.rating
                    )
                    for item in fallback.results
                    if str(item.id) != str(movieId)
                ][:limit]
            except Exception:
                return []

    @strawberry.field
    async def allSeries(self, info: strawberry.Info, filter: Optional[SeriesFilter] = None, sort: Optional[str] = "popular", limit: Optional[int] = 20, offset: Optional[int] = 0) -> BrowseSeriesResponse:
        db = await info.context.get_db()
        resp = await movie_service.get_series(db=db)
        items = resp.results
        if filter:
            if filter.year:
                items = [i for i in items if i.year and str(filter.year) in i.year]
            if filter.minRating:
                items = [i for i in items if (i.rating or 0) >= filter.minRating]
        series_list = [
            Movie(
                id=item.id, title=item.title,
                overview=item.description if hasattr(item, 'description') else None,
                posterPath=item.poster_url, backdropPath=item.poster_url,
                releaseDate=item.year, voteAverage=item.rating
            )
            for item in items
        ]
        start = offset or 0
        end = start + (limit or 20)
        return BrowseSeriesResponse(series=series_list[start:end], total=len(series_list), hasMore=len(series_list) > end)

    @strawberry.field
    async def anime(self, info: strawberry.Info, page: Optional[int] = 1, limit: Optional[int] = 20) -> MoviePagination:
        db = await info.context.get_db()
        resp = await movie_service.get_anime(page=page, db=db)
        items = [
            Movie(
                id=item.id, title=item.title, overview=item.description,
                posterPath=item.poster_url, backdropPath=item.poster_url,
                releaseDate=item.year, voteAverage=item.rating
            )
            for item in resp.results
        ]
        return MoviePagination(
            items=items,
            totalCount=100 if resp.has_more else len(items),
            hasMore=resp.has_more, currentPage=resp.page
        )

    @strawberry.field
    async def moviesByGenre(self, info: strawberry.Info, genreId: Optional[strawberry.ID] = None, genreSlug: Optional[str] = None, page: Optional[int] = 1, limit: Optional[int] = 20) -> MoviePagination:
        db = await info.context.get_db()
        target = genreSlug or (str(genreId) if genreId else None)
        if not target:
            resp = await movie_service.get_trending(db=db)
        else:
            resp = await movie_service.search_content(target.replace('-', ' '), page=page, db=db)
        movies_list = [
            Movie(
                id=item.id, title=item.title,
                overview=item.description if hasattr(item, 'description') else None,
                posterPath=item.poster_url, backdropPath=item.poster_url,
                releaseDate=item.year, voteAverage=item.rating
            )
            for item in resp.results
        ]
        return MoviePagination(
            items=movies_list,
            totalCount=100 if resp.has_more else len(movies_list),
            hasMore=resp.has_more, currentPage=page or 1
        )

    @strawberry.field
    async def moviesByIds(self, ids: List[strawberry.ID]) -> List[Movie]:
        details_list = await asyncio.gather(*[movie_service.get_details(str(mid)) for mid in ids])
        return [
            Movie(
                id=details.id, title=details.title, overview=details.description,
                posterPath=details.poster_url, backdropPath=details.poster_url,
                releaseDate=details.year, voteAverage=details.rating,
                genres=[Genre(id=str(i), name=g, slug=g.lower()) for i, g in enumerate(details.genres or [])]
            )
            for details in details_list if details
        ]

    @strawberry.field
    async def streamingUrl(self, info: strawberry.Info, movieId: strawberry.ID, season: Optional[int] = 0, episode: Optional[int] = 1) -> Optional[str]:
        try:
            db = await info.context.get_db()
            links = await movie_service.get_stream_links(str(movieId), season=season or 0, episode=episode or 1, db=db)
            if links and links.links:
                raw_url = links.links[0].url
                # The service returns absolute proxy URLs like
                #   http://localhost:8000/api/proxy/stream?url=<encoded_cdn_url>
                # Mobile clients can't reach localhost, so extract the real CDN
                # URL, wrap it in a signed token, and return a relative path
                # that works with any base URL the client is configured to use.
                import urllib.parse
                if raw_url and '?url=' in raw_url:
                    parsed = urllib.parse.urlparse(raw_url)
                    qs = urllib.parse.parse_qs(parsed.query)
                    cdn_url = qs.get('url', [None])[0]
                    if cdn_url:
                        from app.core.stream_token import create_stream_token
                        token = create_stream_token(cdn_url)
                        return f"/api/proxy/stream?token={token}"
                return raw_url
            return None
        except Exception as e:
            _sentry_capture(e)
            logger.exception("Error fetching streaming URL")
            return None

    @strawberry.field
    async def streamData(self, info: strawberry.Info, movieId: strawberry.ID, season: Optional[int] = 0, episode: Optional[int] = 1) -> Optional[StreamDataType]:
        """Return all available stream quality links + provider subtitles."""
        try:
            import urllib.parse
            from app.core.stream_token import create_stream_token

            db = await info.context.get_db()
            result = await movie_service.get_stream_links(str(movieId), season=season or 0, episode=episode or 1, db=db)
            if not result:
                return None

            def _sign_proxy_url(raw_url: str) -> str:
                """Extract CDN URL from proxy wrapper and re-sign with token."""
                if raw_url and '?url=' in raw_url:
                    parsed = urllib.parse.urlparse(raw_url)
                    qs = urllib.parse.parse_qs(parsed.query)
                    cdn_url = qs.get('url', [None])[0]
                    if cdn_url:
                        token = create_stream_token(cdn_url)
                        return f"/api/proxy/stream?token={token}"
                return raw_url

            # Build quality links
            links = []
            for link in result.links:
                signed_url = _sign_proxy_url(link.url)
                links.append(StreamLinkType(
                    quality=link.quality, url=signed_url,
                    format=link.format, size=link.size,
                ))

            # Build provider subtitles
            subtitles = []
            for sub in (result.subtitles or []):
                raw_url = sub.get('url')
                if not raw_url:
                    continue
                signed_url = _sign_proxy_url(raw_url)
                subtitles.append(ProviderSubtitleType(
                    lang=sub.get('lang', 'Unknown'),
                    code=sub.get('code', 'unknown'),
                    url=signed_url,
                ))

            return StreamDataType(links=links, subtitles=subtitles)
        except Exception as e:
            _sentry_capture(e)
            logger.exception("Error fetching stream data")
            return None

    @strawberry.field
    async def genres(self) -> List[Genre]:
        genre_list = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Drama", "Sci-Fi"]
        return [Genre(id=str(i), name=g, slug=g.lower(), movieCount=100) for i, g in enumerate(genre_list)]

    @strawberry.field
    async def trendingSearches(self, info: strawberry.Info, limit: int = 10) -> List[TrendingSearch]:
        """Return the most popular recent search terms from search_analytics."""
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        try:
            async with AsyncSessionLocal() as db:
                rows = (await db.execute(text("""
                    SELECT query, COUNT(*) AS cnt
                    FROM search_analytics
                    WHERE searched_at >= NOW() - INTERVAL '7 days'
                    GROUP BY query
                    ORDER BY cnt DESC
                    LIMIT :lim
                """), {"lim": limit})).fetchall()
                return [TrendingSearch(query=r.query, count=r.cnt) for r in rows]
        except Exception as e:
            _sentry_capture(e)
            # Fallback: return empty if table doesn't exist yet
            return []

    # ─── Section 14: Search Relevance Ranking ───────────────────
    @strawberry.field
    async def searchMoviesRanked(
        self, info: strawberry.Info, query: str, limit: int = 20,
        minRating: Optional[float] = None, yearMin: Optional[int] = None,
        yearMax: Optional[int] = None, genres: Optional[List[str]] = None,
    ) -> SearchResults:
        """Enhanced search with composite filters and relevance ranking."""
        try:
            raw_results = await movie_service.search(query, limit=limit * 2)
            items = raw_results if isinstance(raw_results, list) else (raw_results.get("items", []) if isinstance(raw_results, dict) else [])

            scored = []
            for m in items:
                title = getattr(m, 'title', '') or m.get('title', '') if isinstance(m, dict) else getattr(m, 'title', '')
                rating = float(getattr(m, 'vote_average', 0) or (m.get('vote_average', 0) if isinstance(m, dict) else 0))
                year_str = str(getattr(m, 'release_date', '') or (m.get('release_date', '') if isinstance(m, dict) else ''))
                year = int(year_str[:4]) if year_str and len(year_str) >= 4 else 0
                popularity = float(getattr(m, 'popularity', 0) or (m.get('popularity', 0) if isinstance(m, dict) else 0))
                movie_genres = getattr(m, 'genres', []) or (m.get('genres', []) if isinstance(m, dict) else [])

                # Apply composite filters
                if minRating and rating < minRating:
                    continue
                if yearMin and year < yearMin:
                    continue
                if yearMax and year > yearMax:
                    continue
                if genres:
                    genre_names = [g.get('name', '').lower() if isinstance(g, dict) else str(g).lower() for g in movie_genres]
                    if not any(g.lower() in genre_names for g in genres):
                        continue

                # Relevance scoring: title match weight + popularity + rating
                title_lower = title.lower()
                query_lower = query.lower()
                score = 0.0
                if title_lower == query_lower:
                    score += 100  # Exact match
                elif title_lower.startswith(query_lower):
                    score += 50   # Prefix match
                elif query_lower in title_lower:
                    score += 25   # Contains match
                score += popularity * 0.1  # Popularity boost
                score += rating * 2        # Rating boost

                scored.append((score, m))

            # Sort by relevance score descending
            scored.sort(key=lambda x: x[0], reverse=True)
            ranked_items = [item for _, item in scored[:limit]]

            movies = []
            for m in ranked_items:
                movie = _raw_to_movie(m)
                if movie:
                    movies.append(movie)

            return SearchResults(items=movies, totalResults=len(scored), page=1, totalPages=1)
        except Exception as e:
            _sentry_capture(e)
            return SearchResults(items=[], totalResults=0, page=1, totalPages=1)
