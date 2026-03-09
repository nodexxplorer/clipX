import strawberry
import asyncio
from typing import List, Optional, Any
from app.services.movie_service import movie_service
from app.services.notification_service import notification_service
from app.core.auth import verify_password, get_password_hash, create_access_token
from app.models.database import User as DbUser, Watchlist as DbWatchlist, History as DbHistory, Notification as DbNotification, Report as DbReport, Review as DbReview
from sqlalchemy.future import select
import os
from datetime import datetime
import calendar
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

@strawberry.type
class UserPreferences:
    favoriteGenres: List[str] = strawberry.field(default_factory=list)
    theme: str = "dark"
    emailNotifications: bool = True
    autoPlayTrailers: bool = True

@strawberry.input
class UserPreferencesInput:
    theme: Optional[str] = "dark"
    emailNotifications: Optional[bool] = True
    autoPlayTrailers: Optional[bool] = True

@strawberry.type
class UserStats:
    id: strawberry.ID = "1"
    moviesWatched: int = 0
    totalWatchTime: int = 0
    reviewsWritten: int = 0
    watchlistCount: int = 0

@strawberry.type
class User:
    id: strawberry.ID
    email: str
    name: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    role: str = "user"
    createdAt: str = strawberry.field(resolver=lambda self: str(datetime.now()))
    preferences: UserPreferences = strawberry.field(default_factory=UserPreferences)
    stats: UserStats = strawberry.field(default_factory=UserStats)

@strawberry.type
class SuccessResponse:
    success: bool
    message: Optional[str] = None

@strawberry.type
class AuthResponse:
    token: str
    user: User

@strawberry.type
class GoogleAuthResponse:
    token: str
    user: User
    isNewUser: bool

@strawberry.type
class Genre:
    id: strawberry.ID
    name: str
    slug: str
    movieCount: int = 0

@strawberry.type
class CastMember:
    id: strawberry.ID
    name: str
    character: str
    profileImage: Optional[str]

@strawberry.type
class Episode:
    id: strawberry.ID
    title: str
    episodeNumber: int = strawberry.field(name="episodeNumber")
    seasonNumber: int = strawberry.field(name="seasonNumber")
    releaseDate: Optional[str] = None
    posterUrl: Optional[str] = None
    description: Optional[str] = None

@strawberry.type
class Season:
    id: strawberry.ID
    seasonNumber: int = strawberry.field(name="seasonNumber")
    episodes: List[Episode]

@strawberry.type
class Movie:
    id: strawberry.ID
    title: str
    overview: Optional[str] = None
    posterPath: Optional[str] = None
    posterUrl: Optional[str] = strawberry.field(resolver=lambda self: self.posterPath)
    backdropPath: Optional[str] = None
    backdropUrl: Optional[str] = strawberry.field(resolver=lambda self: self.backdropPath)
    releaseDate: Optional[str] = None
    firstAirDate: Optional[str] = strawberry.field(resolver=lambda self: self.releaseDate)
    voteAverage: float = 0.0
    rating: float = strawberry.field(resolver=lambda self: self.voteAverage)
    voteCount: int = 0
    runtime: Optional[int] = None
    durationMinutes: Optional[int] = strawberry.field(resolver=lambda self: self.runtime)
    popularity: float = 0.0
    genres: Optional[List[Genre]] = None
    tagline: Optional[str] = None
    description: Optional[str] = strawberry.field(resolver=lambda self: self.overview)
    status: Optional[str] = None
    trailerUrl: Optional[str] = None
    inWatchlist: bool = False
    cast: Optional[List[CastMember]] = None
    recommendations: Optional[List["Movie"]] = None
    downloadCount: int = 0
    reason: Optional[str] = None
    score: float = 0.0
    editorNote: Optional[str] = None
    awards: Optional[str] = None
    seasons: Optional[List[Season]] = None
    
    @strawberry.field
    def year(self) -> Optional[int]:
        if not self.releaseDate:
            return None
        s_date = str(self.releaseDate).strip()
        if not s_date:
            return None
            
        try:
            # Handle "YYYY-MM-DD"
            if '-' in s_date:
                return int(s_date.split('-')[0])
            # Handle just "YYYY"
            return int(s_date[:4])
        except (ValueError, IndexError):
            return None

@strawberry.type
class MoviePagination:
    items: List[Movie]
    totalCount: int
    hasMore: bool
    currentPage: int

@strawberry.input
class MovieFilter:
    genre: Optional[str] = None
    year: Optional[int] = None
    minRating: Optional[float] = None

@strawberry.type
class BrowseMoviesResponse:
    movies: List[Movie]
    total: int
    hasMore: bool

@strawberry.input
class SeriesFilter:
    genre: Optional[str] = None
    year: Optional[int] = None
    minRating: Optional[float] = None

@strawberry.type
class BrowseSeriesResponse:
    series: List[Movie]
    total: int
    hasMore: bool

@strawberry.input
class RegisterInput:
    email: str
    password: str

@strawberry.input
class UpdateProfileInput:
    name: Optional[str] = None
    favoriteGenres: Optional[List[str]] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    preferences: Optional[UserPreferencesInput] = None

def get_user_preferences(user_db: DbUser) -> UserPreferences:
    prefs_data = user_db.preferences or {}
    return UserPreferences(
        favoriteGenres=prefs_data.get("favoriteGenres", []),
        theme=prefs_data.get("theme", "dark"),
        emailNotifications=prefs_data.get("emailNotifications", True),
        autoPlayTrailers=prefs_data.get("autoPlayTrailers", True)
    )

def create_user_response(user_db: DbUser) -> User:
    return User(
        id=str(user_db.id),
        email=user_db.email,
        name=user_db.name,
        avatar=user_db.avatar,
        bio=user_db.bio,
        role=user_db.role,
        preferences=get_user_preferences(user_db)
    )

@strawberry.type
class ContinueWatching:
    id: strawberry.ID
    movie: Movie
    currentTime: int
    duration: int

@strawberry.type
class RecentlyViewed:
    id: strawberry.ID
    title: str
    posterUrl: Optional[str]
    rating: float

@strawberry.type
class UserDashboardStats:
    moviesWatched: int = 0
    totalWatchTime: int = 0 # Minutes
    monthlyWatchTime: int = 0 # Minutes this month
    watchlistCount: int = 0
    reviewsWritten: int = 0

@strawberry.type
class Notification:
    id: strawberry.ID
    title: str
    message: str
    type: str = "system"
    actionUrl: Optional[str] = strawberry.field(name="actionUrl", default=None)
    isRead: bool = strawberry.field(name="isRead")
    createdAt: str = strawberry.field(name="createdAt")

@strawberry.type
class Review:
    id: strawberry.ID
    content: str
    rating: Optional[float]
    isFeatured: bool = strawberry.field(name="isFeatured")
    createdAt: str = strawberry.field(name="createdAt")

@strawberry.type
class Report:
    id: strawberry.ID
    reason: str
    description: Optional[str]
    status: str
    createdAt: str = strawberry.field(name="createdAt")

@strawberry.type
class DashboardData:
    watchlist: List[Movie]
    recentlyViewed: List[RecentlyViewed]
    continueWatching: List[ContinueWatching]
    stats: UserDashboardStats

@strawberry.input
class DateRangeInput:
    startDate: str
    endDate: str

@strawberry.type
class GrowthPoint:
    date: str
    count: int

@strawberry.type
class TopMovieStat:
    movie: Movie
    views: int
    downloads: int
    watchlistAdds: int

@strawberry.type
class ActivityLog:
    id: strawberry.ID
    type: str
    description: str
    timestamp: str

@strawberry.type
class GenreDistribution:
    genre: Genre
    movieCount: int
    viewCount: int

@strawberry.type
class AdminDashboardStats:
    totalUsers: int
    totalMovies: int
    totalGenres: int
    activeUsers: int
    newUsersToday: int
    newUsersThisWeek: int
    totalDownloads: int
    totalWatchlistItems: int
    avgSessionDuration: str
    userGrowth: List[GrowthPoint]
    genreDistribution: List[GenreDistribution]
    topMovies: List[TopMovieStat]
    recentActivity: List[ActivityLog]

@strawberry.type
class AdminUser:
    id: strawberry.ID
    email: str
    username: Optional[str] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    avatar: Optional[str] = None
    isActive: bool = True
    isBanned: bool = False
    lastActive: Optional[str] = None
    createdAt: Optional[str] = None
    watchlistCount: int = 0
    downloadCount: int = 0

@strawberry.type
class AdminUsersResponse:
    users: List[AdminUser]
    totalCount: int

@strawberry.type
class ChatMessageType:
    id: strawberry.ID
    userId: str
    userName: Optional[str] = None
    userAvatar: Optional[str] = None
    room: str = "global"
    content: str = ""
    createdAt: str = ""

@strawberry.type
class Query:
    @strawberry.field
    async def me(self, info: strawberry.Info) -> Optional[User]:
        user = await info.context.user
        if not user:
            return None
        return create_user_response(user)

    @strawberry.field
    async def dashboardStats(self, info: strawberry.Info, dateRange: Optional[DateRangeInput] = None) -> AdminDashboardStats:
        from app.models.database import (
            User as DbUser, Movie as DbMovie, Series as DbSeries,
            Watchlist as DbWatchlist, History as DbHistory,
            Notification as DbNotification, Report as DbReport, Review as DbReview
        )
        from datetime import timedelta
        from sqlalchemy import func

        db = await info.context.get_db()
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)

        # --- Core counts ---
        total_users = (await db.execute(select(func.count(DbUser.id)))).scalar() or 0
        total_movies = (await db.execute(select(func.count(DbMovie.id)))).scalar() or 0
        total_series = (await db.execute(select(func.count(DbSeries.id)))).scalar() or 0

        # --- New users today / this week ---
        new_today = (await db.execute(
            select(func.count(DbUser.id)).where(DbUser.created_at >= today_start)
        )).scalar() or 0
        new_this_week = (await db.execute(
            select(func.count(DbUser.id)).where(DbUser.created_at >= week_start)
        )).scalar() or 0

        # --- Active users (users with watch history in last 7 days) ---
        active_users = (await db.execute(
            select(func.count(func.distinct(DbHistory.user_id))).where(DbHistory.updated_at >= week_start)
        )).scalar() or 0

        # --- Watchlist & downloads ---
        total_watchlist = (await db.execute(select(func.count(DbWatchlist.id)))).scalar() or 0

        # --- Avg session duration from watch history ---
        avg_duration_result = (await db.execute(
            select(func.avg(DbHistory.current_time)).where(DbHistory.current_time > 0)
        )).scalar()
        avg_secs = int(avg_duration_result or 0)
        avg_h = avg_secs // 3600
        avg_m = (avg_secs % 3600) // 60
        avg_session_str = f"{avg_h}h {avg_m}m" if avg_h > 0 else f"{avg_m}m"

        # --- User growth (last 30 days, grouped by day) ---
        thirty_days_ago = today_start - timedelta(days=30)
        growth_rows = (await db.execute(
            select(
                func.date(DbUser.created_at).label("day"),
                func.count(DbUser.id).label("cnt")
            )
            .where(DbUser.created_at >= thirty_days_ago)
            .group_by(func.date(DbUser.created_at))
            .order_by(func.date(DbUser.created_at))
        )).all()
        user_growth = [GrowthPoint(date=str(row.day), count=row.cnt) for row in growth_rows]

        # --- Recent activity (from notifications + reports, last 20) ---
        recent_notifs = (await db.execute(
            select(DbNotification)
            .order_by(DbNotification.created_at.desc())
            .limit(15)
        )).scalars().all()
        recent_reports = (await db.execute(
            select(DbReport)
            .order_by(DbReport.created_at.desc())
            .limit(5)
        )).scalars().all()

        activities = []
        for n in recent_notifs:
            activities.append(ActivityLog(
                id=str(n.id),
                type=n.type or "system",
                description=f"{n.title}: {n.message[:80]}",
                timestamp=str(n.created_at)
            ))
        for r in recent_reports:
            activities.append(ActivityLog(
                id=str(r.id),
                type="report",
                description=f"Report ({r.status}): {r.reason}",
                timestamp=str(r.created_at)
            ))
        # Sort by timestamp descending and take top 20
        activities.sort(key=lambda a: a.timestamp, reverse=True)
        activities = activities[:20]

        return AdminDashboardStats(
            totalUsers=total_users,
            totalMovies=total_movies + total_series,
            totalGenres=14,
            activeUsers=active_users,
            newUsersToday=new_today,
            newUsersThisWeek=new_this_week,
            totalDownloads=0,
            totalWatchlistItems=total_watchlist,
            avgSessionDuration=avg_session_str,
            userGrowth=user_growth,
            genreDistribution=[],
            topMovies=[],
            recentActivity=activities
        )

    @strawberry.field
    async def dashboardData(self, info: strawberry.Info) -> Optional[DashboardData]:
        user = await info.context.user
        if not user:
            return None
        
        db = await info.context.get_db()
        
        # 1. Fetch Watchlist
        # We need to fetch actual movie details for each watchlist item
        watchlist_query = await db.execute(select(DbWatchlist).where(DbWatchlist.user_id == user.id))
        watchlist_items = watchlist_query.scalars().all()
        
        watchlist_movies = []
        if watchlist_items:
             # Extract Moviebox IDs
            movie_ids = [item.moviebox_id for item in watchlist_items][:10] # Limit to 10 for dashboard
            
            # Fetch details concurrently
            tasks = [movie_service.get_details(mid, db=db) for mid in movie_ids]
            details_list = await asyncio.gather(*tasks)
            
            for details in details_list:
                if not details: continue
                watchlist_movies.append(Movie(
                     id=details.id,
                    title=details.title,
                    overview=details.description,
                    posterPath=details.poster_url,
                    backdropPath=details.poster_url,
                    releaseDate=str(details.year) if details.year else None,
                    voteAverage=details.rating or 0.0,
                    genres=[Genre(id=str(i), name=g, slug=g.lower()) for i, g in enumerate(details.genres or [])],
                    runtime=details.duration or 0
                ))
        
        # Real queries for History and RecentlyViewed
        history_query = await db.execute(select(DbHistory).where(DbHistory.user_id == user.id).order_by(DbHistory.updated_at.desc()))
        history_items = history_query.scalars().all()

        reviews_query = await db.execute(select(DbReview).where(DbReview.user_id == user.id))
        all_reviews = reviews_query.scalars().all()

        recent = []
        continue_watching = []
        movies_watched = len(history_items)
        total_time_seconds = 0
        monthly_time_seconds = 0
        current_month = datetime.utcnow().month
        current_year = datetime.utcnow().year

        for item in history_items:
            # We assume duration is in seconds. Convert to minutes downstream.
            total_time_seconds += (item.current_time or 0)
            if item.updated_at and item.updated_at.month == current_month and item.updated_at.year == current_year:
                monthly_time_seconds += (item.current_time or 0)

            # Resolve Movie detail. This is slow if there are many, so limit to 5 recent and 5 continue
            if len(recent) < 5 or len(continue_watching) < 5:
                # Basic fetch (Mock for perfectly mapped details)
                m_details = await movie_service.get_details(item.moviebox_id, db=db)
                if m_details:
                    mapped_movie = Movie(
                        id=m_details.id,
                        title=m_details.title,
                        overview=m_details.description,
                        posterPath=m_details.poster_url,
                        backdropPath=m_details.poster_url,
                        releaseDate=str(m_details.year) if m_details.year else None,
                        voteAverage=m_details.rating or 0.0
                    )
                    
                    if len(recent) < 5:
                        recent.append(RecentlyViewed(
                            id=str(item.id),
                            title=m_details.title,
                            posterUrl=m_details.poster_url,
                            rating=m_details.rating or 0.0
                        ))
                    if len(continue_watching) < 5 and item.current_time and item.duration and item.current_time < item.duration:
                        continue_watching.append(ContinueWatching(
                            id=str(item.id),
                            movie=mapped_movie,
                            currentTime=item.current_time,
                            duration=item.duration
                        ))
        
        # 4. Stats
        stats = UserDashboardStats(
            watchlistCount=len(watchlist_items),
            moviesWatched=movies_watched,
            totalWatchTime=total_time_seconds // 60,
            monthlyWatchTime=monthly_time_seconds // 60,
            reviewsWritten=len(all_reviews)
        )
        
        return DashboardData(
            watchlist=watchlist_movies,
            recentlyViewed=recent,
            continueWatching=continue_watching,
            stats=stats
        )

    @strawberry.field
    async def personalizedRecommendations(self, info: strawberry.Info, userId: Optional[strawberry.ID] = None, limit: Optional[int] = 10) -> List[Movie]:
        resp = await movie_service.get_trending()
        results = []
        for i, item in enumerate(resp.results[:limit]):
            results.append(Movie(
                id=item.id,
                title=item.title,
                overview=item.description if hasattr(item, 'description') else "AI-powered pick for you.",
                posterPath=item.poster_url,
                backdropPath=item.poster_url,
                releaseDate=item.year,
                voteAverage=item.rating,
                reason="Top Choice" if i < 3 else "Trending Item",
                score=0.99 - (i * 0.01)
            ))
        return results

    @strawberry.field
    async def trending(self, info: strawberry.Info, limit: Optional[int] = 20, timeWindow: Optional[str] = "week") -> List[Movie]:
        db = await info.context.get_db()
        resp = await movie_service.get_trending(db=db)
        return [
            Movie(
                id=item.id,
                title=item.title,
                overview=item.description if hasattr(item, 'description') else None,
                posterPath=item.poster_url,
                backdropPath=item.poster_url,
                releaseDate=item.year,
                voteAverage=item.rating,
                voteCount=100,
                popularity=0.0
            ) for item in resp.results[:limit]
        ]

    @strawberry.field
    async def popular(self, info: strawberry.Info, limit: Optional[int] = 20, page: Optional[int] = 1) -> List[Movie]:
        # Reuse trending logic directly to avoid self-reference issues
        db = await info.context.get_db()
        resp = await movie_service.get_trending(db=db)
        return [
            Movie(
                id=item.id,
                title=item.title,
                overview=item.description if hasattr(item, 'description') else None,
                posterPath=item.poster_url,
                backdropPath=item.poster_url,
                releaseDate=item.year,
                voteAverage=item.rating,
                voteCount=100,
                popularity=0.0
            ) for item in resp.results[:limit]
        ]

    @strawberry.field
    async def trendingSeries(self, info: strawberry.Info, limit: Optional[int] = 10) -> List[Movie]:
        db = await info.context.get_db()
        resp = await movie_service.get_series(db=db)
        return [
            Movie(
                id=item.id,
                title=item.title,
                overview=item.description if hasattr(item, 'description') else None,
                posterPath=item.poster_url,
                backdropPath=item.poster_url,
                releaseDate=item.year,
                voteAverage=item.rating
            ) for item in resp.results[:limit]
        ]

    @strawberry.field
    async def featured(self, info: strawberry.Info, limit: Optional[int] = 5) -> List[Movie]:
        db = await info.context.get_db()
        resp = await movie_service.get_trending(db=db)
        return [
            Movie(
                id=item.id,
                title=item.title,
                overview="Featured premium content on clipX.",
                posterPath=item.poster_url,
                backdropPath=item.poster_url,
                releaseDate=item.year,
                voteAverage=item.rating,
                tagline="Staff Pick"
            ) for item in resp.results[:limit]
        ]

    @strawberry.field
    async def editorsChoice(self, limit: Optional[int] = 5) -> List[Movie]:
        resp = await movie_service.get_trending()
        return [
            Movie(
                id=item.id,
                title=item.title,
                posterPath=item.poster_url,
                backdropPath=item.poster_url,
                releaseDate=item.year,
                voteAverage=item.rating,
                editorNote="A must-watch masterpiece chosen by our experts."
            ) for item in resp.results[:limit]
        ]

    @strawberry.field
    async def awardWinning(self, limit: Optional[int] = 10) -> List[Movie]:
        resp = await movie_service.get_trending()
        # Mocking some award results by skipping some
        items = resp.results[5:5+limit] if len(resp.results) > 5 else resp.results[:limit]
        return [
            Movie(
                id=item.id,
                title=item.title,
                posterPath=item.poster_url,
                backdropPath=item.poster_url,
                releaseDate=item.year,
                voteAverage=item.rating,
                awards="Best Picture, Best Director"
            ) for item in items
        ]

    @strawberry.field
    async def movie(self, info: strawberry.Info, id: strawberry.ID) -> Optional[Movie]:
        db = await info.context.get_db()
        details = await movie_service.get_details(str(id), db=db)
        if not details:
            return None
        return Movie(
            id=details.id,
            title=details.title,
            overview=details.description,
            posterPath=details.poster_url,
            backdropPath=details.poster_url,
            releaseDate=details.year,
            voteAverage=details.rating,
            voteCount=100,
            runtime=details.duration,
            trailerUrl=details.trailer_url,
            genres=[Genre(id=str(i), name=g, slug=g.lower()) for i, g in enumerate(details.genres or [])],
            seasons=[
                Season(
                    id=s.id,
                    seasonNumber=s.season_number,
                    episodes=[
                        Episode(
                            id=e.id,
                            title=e.title,
                            episodeNumber=e.episode_number,
                            seasonNumber=e.season_number,
                            releaseDate=e.release_date,
                            posterUrl=e.poster_url,
                            description=e.description
                        ) for e in s.episodes
                    ]
                ) for s in details.seasons
            ] if details.seasons else None
        )

    @strawberry.field
    async def searchMovies(self, info: strawberry.Info, query: str, page: Optional[int] = 1, limit: Optional[int] = 24) -> MoviePagination:
        db = await info.context.get_db()
        resp = await movie_service.search_content(query, page, db=db)
        items = [
            Movie(
                id=item.id,
                title=item.title,
                overview=item.description,
                posterPath=item.poster_url,
                backdropPath=item.poster_url,
                releaseDate=item.year,
                voteAverage=item.rating,
                voteCount=50,
                genres=[Genre(id=str(i), name=g, slug=g.lower().replace(' ', '-')) for i, g in enumerate(item.genres or [])] if item.genres else None
            ) for item in resp.results
        ]
        return MoviePagination(
            items=items,
            totalCount=len(items) + (50 if resp.has_more else 0),
            hasMore=resp.has_more,
            currentPage=resp.page
        )

    @strawberry.field
    async def searchSuggestions(self, info: strawberry.Info, limit: Optional[int] = 8) -> List[Movie]:
        """Return trending items as search suggestions when search bar is focused."""
        db = await info.context.get_db()
        resp = await movie_service.get_trending(db=db)
        return [
            Movie(
                id=item.id,
                title=item.title,
                posterPath=item.poster_url,
                backdropPath=item.poster_url,
                releaseDate=item.year,
                voteAverage=item.rating,
            ) for item in resp.results[:limit]
        ]

    @strawberry.field
    async def similarMovies(self, info: strawberry.Info, movieId: strawberry.ID, limit: Optional[int] = 12) -> List[Movie]:
        """Return movies similar to the given movie by searching with its title as seed."""
        db = await info.context.get_db()
        # First fetch the source movie to get its title and genres
        details = await movie_service.get_details(str(movieId), db=db)
        if not details:
            return []
        # Search using the title as seed to get related content
        try:
            resp = await movie_service.search_content(details.title, 1, db=db)
            results = [
                Movie(
                    id=item.id,
                    title=item.title,
                    overview=item.description,
                    posterPath=item.poster_url,
                    backdropPath=item.poster_url,
                    releaseDate=item.year,
                    voteAverage=item.rating,
                    voteCount=50,
                    similarity=0.85
                )
                for item in resp.results
                if str(item.id) != str(movieId)  # exclude the source movie
            ]
            return results[:limit]
        except Exception as e:
            print(f"similarMovies error: {e}")
            # Fallback: return trending
            try:
                fallback = await movie_service.get_trending(db=db)
                return [
                    Movie(
                        id=item.id,
                        title=item.title,
                        posterPath=item.poster_url,
                        backdropPath=item.poster_url,
                        releaseDate=item.year,
                        voteAverage=item.rating,
                        similarity=0.5
                    )
                    for item in fallback.results
                    if str(item.id) != str(movieId)
                ][:limit]
            except Exception:
                return []

    @strawberry.field
    async def movies(self, info: strawberry.Info, filter: Optional[MovieFilter] = None, sort: Optional[str] = "popular", limit: Optional[int] = 20, offset: Optional[int] = 0) -> BrowseMoviesResponse:
        db = await info.context.get_db()
        resp = await movie_service.get_movies(db=db)
        items = resp.results
        
        if filter:
            if filter.year:
                items = [i for i in items if i.year and str(filter.year) in i.year]
            if filter.minRating:
                items = [i for i in items if (i.rating or 0) >= filter.minRating]
                
        movies_list = [
            Movie(
                id=item.id,
                title=item.title,
                overview=item.description if hasattr(item, 'description') else None,
                posterPath=item.poster_url,
                backdropPath=item.poster_url,
                releaseDate=item.year,
                voteAverage=item.rating
            ) for item in items
        ]
        
        start = offset or 0
        end = start + (limit or 20)
        paged_movies = movies_list[start:end]
        
        return BrowseMoviesResponse(
            movies=paged_movies,
            total=len(movies_list),
            hasMore=len(movies_list) > end
        )

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
                id=item.id,
                title=item.title,
                overview=item.description if hasattr(item, 'description') else None,
                posterPath=item.poster_url,
                backdropPath=item.poster_url,
                releaseDate=item.year,
                voteAverage=item.rating
            ) for item in items
        ]
        
        start = offset or 0
        end = start + (limit or 20)
        paged_series = series_list[start:end]
        
        return BrowseSeriesResponse(
            series=paged_series,
            total=len(series_list),
            hasMore=len(series_list) > end
        )

    @strawberry.field
    async def anime(self, info: strawberry.Info, page: Optional[int] = 1, limit: Optional[int] = 20) -> MoviePagination:
        db = await info.context.get_db()
        resp = await movie_service.get_anime(page=page, db=db)
        items = [
            Movie(
                id=item.id,
                title=item.title,
                overview=item.description,
                posterPath=item.poster_url,
                backdropPath=item.poster_url,
                releaseDate=item.year,
                voteAverage=item.rating
            ) for item in resp.results
        ]
        return MoviePagination(
            items=items,
            totalCount=100 if resp.has_more else len(items),
            hasMore=resp.has_more,
            currentPage=resp.page
        )

    @strawberry.field
    async def moviesByGenre(self, info: strawberry.Info, genreId: Optional[strawberry.ID] = None, genreSlug: Optional[str] = None, page: Optional[int] = 1, limit: Optional[int] = 20) -> MoviePagination:
        db = await info.context.get_db()
        # Use genre name as search query for discovery
        target = genreSlug or (str(genreId) if genreId else None)
        if not target:
             resp = await movie_service.get_trending(db=db)
        else:
             resp = await movie_service.search_content(target.replace('-', ' '), page=page, db=db)
             
        movies_list = [
            Movie(
                id=item.id,
                title=item.title,
                overview=item.description if hasattr(item, 'description') else None,
                posterPath=item.poster_url,
                backdropPath=item.poster_url,
                releaseDate=item.year,
                voteAverage=item.rating
            ) for item in resp.results
        ]
        
        return MoviePagination(
            items=movies_list,
            totalCount=100 if resp.has_more else len(movies_list),
            hasMore=resp.has_more,
            currentPage=page or 1
        )

    @strawberry.field
    async def moviesByIds(self, ids: List[strawberry.ID]) -> List[Movie]:
        tasks = [movie_service.get_details(str(mid)) for mid in ids]
        details_list = await asyncio.gather(*tasks)
        results = []
        for details in details_list:
            if not details: continue
            results.append(Movie(
                id=details.id,
                title=details.title,
                overview=details.description,
                posterPath=details.poster_url,
                backdropPath=details.poster_url,
                releaseDate=details.year,
                voteAverage=details.rating,
                genres=[Genre(id=str(i), name=g, slug=g.lower()) for i, g in enumerate(details.genres or [])]
            ))
        return results

    @strawberry.field
    async def streamingUrl(self, movieId: strawberry.ID, season: Optional[int] = 0, episode: Optional[int] = 1) -> Optional[str]:
        try:
            links = await movie_service.get_stream_links(str(movieId), season=season or 0, episode=episode or 1)
            if links and links.links:
                # Prioritize higher quality, or just return first for now
                return links.links[0].url
            return None
        except Exception as e:
            print(f"Error fetching streaming URL: {e}")
            return None

    @strawberry.field
    async def genres(self) -> List[Genre]:
        genre_list = [
            "Action", "Adventure", "Animation", "Comedy", "Crime", "Drama", "Sci-Fi"
        ]
        return [Genre(id=str(i), name=g, slug=g.lower(), movieCount=100) for i, g in enumerate(genre_list)]

    @strawberry.field
    async def notifications(self, info: strawberry.Info) -> List[Notification]:
        user = await info.context.user
        if not user:
            return []
        db = await info.context.get_db()
        q = await db.execute(select(DbNotification).where(DbNotification.user_id == user.id).order_by(DbNotification.created_at.desc()).limit(50))
        db_items = q.scalars().all()
        return [
            Notification(
                id=str(n.id),
                title=n.title,
                message=n.message,
                type=n.type or "system",
                actionUrl=n.action_url,
                isRead=n.is_read,
                createdAt=str(n.created_at)
            ) for n in db_items
        ]

    @strawberry.field
    async def unreadNotificationCount(self, info: strawberry.Info) -> int:
        user = await info.context.user
        if not user:
            return 0
        db = await info.context.get_db()
        from sqlalchemy import func
        q = await db.execute(
            select(func.count(DbNotification.id)).where(
                DbNotification.user_id == user.id,
                DbNotification.is_read == False
            )
        )
        return q.scalar() or 0

    @strawberry.field
    async def landingReviews(self, info: strawberry.Info) -> List[Review]:
        db = await info.context.get_db()
        q = await db.execute(select(DbReview).where(DbReview.is_featured == True).order_by(DbReview.created_at.desc()).limit(10))
        db_items = q.scalars().all()
        return [
            Review(
                id=str(r.id),
                content=r.content,
                rating=r.rating,
                isFeatured=r.is_featured,
                createdAt=str(r.created_at)
            ) for r in db_items
        ]

    @strawberry.field
    async def getReports(self, info: strawberry.Info) -> List[Report]:
        user = await info.context.user
        if not user or user.role != "admin":
            return []
        
        db = await info.context.get_db()
        q = await db.execute(select(DbReport).order_by(DbReport.created_at.desc()))
        db_items = q.scalars().all()
        return [
            Report(
                id=str(r.id),
                reason=r.reason,
                description=r.description,
                status=r.status,
                createdAt=str(r.created_at)
            ) for r in db_items
        ]

    @strawberry.field
    async def adminUsers(self, info: strawberry.Info, limit: Optional[int] = 20, offset: Optional[int] = 0, search: Optional[str] = None, status: Optional[str] = None) -> AdminUsersResponse:
        """Admin endpoint: list all users with search, filter, pagination."""
        from app.models.database import User as DbUser, Watchlist as DbWatchlist, History as DbHistory
        from sqlalchemy import func
        db = await info.context.get_db()

        query = select(DbUser)
        count_query = select(func.count(DbUser.id))

        # Search filter
        if search:
            search_term = f"%{search}%"
            query = query.where(
                (DbUser.email.ilike(search_term)) |
                (DbUser.name.ilike(search_term))
            )
            count_query = count_query.where(
                (DbUser.email.ilike(search_term)) |
                (DbUser.name.ilike(search_term))
            )

        total_count = (await db.execute(count_query)).scalar() or 0

        query = query.order_by(DbUser.created_at.desc()).offset(offset or 0).limit(limit or 20)
        result = await db.execute(query)
        db_users = result.scalars().all()

        users = []
        for u in db_users:
            # Count watchlist items
            wl_count = (await db.execute(
                select(func.count(DbWatchlist.id)).where(DbWatchlist.user_id == u.id)
            )).scalar() or 0

            # Get last activity from history
            last_hist = (await db.execute(
                select(DbHistory.updated_at)
                .where(DbHistory.user_id == u.id)
                .order_by(DbHistory.updated_at.desc())
                .limit(1)
            )).scalar()

            name_parts = (u.name or "").split(" ", 1)
            users.append(AdminUser(
                id=str(u.id),
                email=u.email,
                username=u.email.split("@")[0],
                firstName=name_parts[0] if name_parts else "",
                lastName=name_parts[1] if len(name_parts) > 1 else "",
                avatar=u.avatar,
                isActive=True,
                isBanned=False,
                lastActive=str(last_hist) if last_hist else None,
                createdAt=str(u.created_at) if u.created_at else None,
                watchlistCount=wl_count,
                downloadCount=0
            ))

        return AdminUsersResponse(users=users, totalCount=total_count)

    @strawberry.field
    async def chatMessages(self, info: strawberry.Info, room: Optional[str] = "global", limit: Optional[int] = 50, before: Optional[str] = None) -> List[ChatMessageType]:
        """Fetch recent chat messages for a room."""
        from app.models.database import ChatMessage as DbChatMessage, User as DbUser
        db = await info.context.get_db()

        query = (
            select(DbChatMessage, DbUser.name, DbUser.avatar)
            .join(DbUser, DbChatMessage.user_id == DbUser.id)
            .where(DbChatMessage.room == (room or "global"))
            .order_by(DbChatMessage.created_at.desc())
            .limit(limit or 50)
        )
        if before:
            query = query.where(DbChatMessage.created_at < before)

        rows = (await db.execute(query)).all()
        return [
            ChatMessageType(
                id=str(row[0].id),
                userId=str(row[0].user_id),
                userName=row[1] or "User",
                userAvatar=row[2],
                room=row[0].room,
                content=row[0].content,
                createdAt=str(row[0].created_at)
            ) for row in reversed(rows)  # Reverse so oldest first
        ]

@strawberry.type
class Mutation:
    @strawberry.mutation
    async def login(self, info: strawberry.Info, email: str, password: str) -> AuthResponse:
        try:
            db = await info.context.get_db()
            result = await db.execute(select(DbUser).where(DbUser.email == email))
            user = result.scalars().first()
        except Exception as e:
            print(f"[LOGIN] DB error for {email}: {e}")
            raise Exception("Login service temporarily unavailable. Please try again.")

        if not user:
            print(f"[LOGIN] No user found for email: {email}")
            raise Exception("Invalid email or password")

        if not user.password:
            print(f"[LOGIN] User {email} has no password set (OAuth-only account)")
            raise Exception("This account uses Google sign-in. Please log in with Google.")

        if not verify_password(password, user.password):
            print(f"[LOGIN] Wrong password for {email}")
            raise Exception("Invalid email or password")

        token = create_access_token({"sub": user.email})
        print(f"[LOGIN] Success: {email} (role={user.role})")
        return AuthResponse(
            token=token,
            user=create_user_response(user)
        )

    @strawberry.mutation
    async def register(self, info: strawberry.Info, input: RegisterInput) -> AuthResponse:
        db = await info.context.get_db()
        result = await db.execute(select(DbUser).where(DbUser.email == input.email))
        existing_user = result.scalars().first()
        if existing_user:
            # If user exists but has no password (e.g. created via Google Auth), allow setting password (account linking)
            # This is a simplification. Ideally we should verify email ownership first.
            if not existing_user.password:
                 hashed_password = get_password_hash(input.password)
                 existing_user.password = hashed_password
                 await db.commit()
                 await db.refresh(existing_user)
                 token = create_access_token({"sub": existing_user.email})
                 return AuthResponse(
                    token=token,
                    user=create_user_response(existing_user)
                 )
            
            raise Exception("User already exists")
            
        hashed_password = get_password_hash(input.password)
        new_user = DbUser(
            email=input.email,
            password=hashed_password,
            role="user",
            preferences={}
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        token = create_access_token({"sub": new_user.email})
        return AuthResponse(
            token=token,
            user=create_user_response(new_user)
        )

    @strawberry.mutation
    async def googleAuth(self, info: strawberry.Info, idToken: str) -> GoogleAuthResponse:
        try:
            import requests
            import certifi
            from requests.adapters import HTTPAdapter
            from urllib3.util.retry import Retry
            
            # Robust session configuration
            session = requests.Session()
            # Explicitly use certifi's CA bundle and disable trust_env to avoid
            # interference from local proxies/VPNs which often cause SSL EOF errors.
            session.verify = certifi.where()
            session.trust_env = False
            
            # Retry strategy
            retries = Retry(
                total=5,
                backoff_factor=1,
                status_forcelist=[500, 502, 503, 504],
                allowed_methods=["GET", "POST"]
            )
            session.mount('https://', HTTPAdapter(max_retries=retries))
            
            client_id = os.getenv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "923142375396-2ervt54j93hat9deg7t4k621cmbvi3tt.apps.googleusercontent.com")
            
            # Use the custom session wrapped in google transport request
            transport_request = google_requests.Request(session=session)
            idinfo = id_token.verify_oauth2_token(idToken, transport_request, client_id)
            
            email = idinfo['email']
            name = idinfo.get('name')
            avatar = idinfo.get('picture')
            
            db = await info.context.get_db()
            result = await db.execute(select(DbUser).where(DbUser.email == email))
            user = result.scalars().first()
            
            is_new_user = False
            if not user:
                user = DbUser(
                    email=email,
                    name=name,
                    avatar=avatar,
                    role="user",
                    preferences={}
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)
                is_new_user = True
            
            token = create_access_token({"sub": user.email})
            
            return GoogleAuthResponse(
                token=token,
                user=create_user_response(user),
                isNewUser=is_new_user
            )
        except Exception as e:
            print(f"Google auth error: {e}")
            raise Exception(f"Google authentication failed: {str(e)}")

    @strawberry.mutation
    async def updateProfile(self, info: strawberry.Info, input: UpdateProfileInput) -> User:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
            
        db = await info.context.get_db()
        if input.name:
            user.name = input.name
        if input.avatar:
            user.avatar = input.avatar
        if input.bio:
            user.bio = input.bio
        
        # Determine existing preferences
        current_prefs = dict(user.preferences) if user.preferences else {}
        
        if input.favoriteGenres is not None:
            current_prefs["favoriteGenres"] = input.favoriteGenres
            
        if input.preferences:
            if input.preferences.theme is not None:
                current_prefs["theme"] = input.preferences.theme
            if input.preferences.emailNotifications is not None:
                current_prefs["emailNotifications"] = input.preferences.emailNotifications
            if input.preferences.autoPlayTrailers is not None:
                current_prefs["autoPlayTrailers"] = input.preferences.autoPlayTrailers
        
        # Important: re-assign to trigger SQLalchemy update
        user.preferences = current_prefs
            
        await db.commit()
        await db.refresh(user)
        
        return create_user_response(user)

    @strawberry.mutation
    async def recordWatchProgress(self, info: strawberry.Info, movieId: strawberry.ID, currentTime: int, duration: int) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        
        db = await info.context.get_db()
        
        # Check if history already exists for this movie/user
        result = await db.execute(select(DbHistory).where(
            DbHistory.user_id == user.id,
            DbHistory.moviebox_id == str(movieId)
        ))
        history_item = result.scalars().first()
        is_new_watch = history_item is None
        
        if history_item:
            history_item.current_time = currentTime
            history_item.duration = duration
            history_item.updated_at = datetime.utcnow()
        else:
            history_item = DbHistory(
                user_id=user.id,
                moviebox_id=str(movieId),
                current_time=currentTime,
                duration=duration,
                content_type="movie"
            )
            db.add(history_item)
            
        await db.commit()

        # Check for watch milestones on new watches
        if is_new_watch:
            try:
                from sqlalchemy import func
                count_q = await db.execute(
                    select(func.count(DbHistory.id)).where(DbHistory.user_id == user.id)
                )
                total_watched = count_q.scalar() or 0
                if total_watched in [5, 10, 25, 50, 100]:
                    await notification_service.notify_watch_milestone(db, str(user.id), total_watched)
            except Exception as e:
                print(f"Milestone check error: {e}")

        return SuccessResponse(success=True)

    @strawberry.mutation
    async def addToWatchlist(self, info: strawberry.Info, movieId: strawberry.ID) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        watchlist_item = DbWatchlist(user_id=user.id, moviebox_id=str(movieId))
        db.add(watchlist_item)
        await db.commit()
        # Notify user
        try:
            details = await movie_service.get_details(str(movieId), db=db)
            title = details.title if details else "Content"
            await notification_service.notify_watchlist_add(db, str(user.id), title, str(movieId))
        except Exception as e:
            print(f"Notification error (watchlist): {e}")
        return SuccessResponse(success=True)

    @strawberry.mutation
    async def logout(self) -> SuccessResponse:
        return SuccessResponse(success=True)

    @strawberry.mutation
    async def submitReport(self, info: strawberry.Info, reason: str, description: str, movieboxId: Optional[str] = None) -> SuccessResponse:
        user = await info.context.user
        db = await info.context.get_db()
        r = DbReport(
            user_id=user.id if user else None,
            reason=reason,
            description=description,
            moviebox_id=movieboxId
        )
        db.add(r)
        
        # Auto-create notification for admins or the user if they're logged in 
        if user:
            n = DbNotification(
                user_id=user.id,
                title="Report Submitted",
                message="Thank you for your report. Our team will review it shortly."
            )
            db.add(n)
            
        await db.commit()
        return SuccessResponse(success=True, message="Report submitted successfully")

    @strawberry.mutation
    async def markNotificationRead(self, info: strawberry.Info, id: strawberry.ID) -> SuccessResponse:
        user = await info.context.user
        if not user: return SuccessResponse(success=False, message="Unauthorized")
        db = await info.context.get_db()
        q = await db.execute(select(DbNotification).where(DbNotification.id == id, DbNotification.user_id == user.id))
        n = q.scalars().first()
        if n:
            n.is_read = True
            await db.commit()
        return SuccessResponse(success=True)

    @strawberry.mutation
    async def addReview(self, info: strawberry.Info, content: str, rating: float, isFeatured: Optional[bool] = False, movieboxId: Optional[str] = None) -> SuccessResponse:
        user = await info.context.user
        if not user: return SuccessResponse(success=False, message="Unauthorized")
        db = await info.context.get_db()
        r = DbReview(
            user_id=user.id,
            content=content,
            rating=rating,
            is_featured=isFeatured
        )
        db.add(r)
        await db.commit()
        # Notify review posted
        try:
            await notification_service.notify_review_posted(db, str(user.id))
        except Exception as e:
            print(f"Notification error (review): {e}")
        return SuccessResponse(success=True, message="Review added successfully")

    @strawberry.mutation
    async def updateReportStatus(self, info: strawberry.Info, id: strawberry.ID, status: str) -> SuccessResponse:
        user = await info.context.user
        if not user or user.role != "admin":
             return SuccessResponse(success=False, message="Unauthorized")
        db = await info.context.get_db()
        q = await db.execute(select(DbReport).where(DbReport.id == id))
        report = q.scalars().first()
        if report:
            report.status = status
            await db.commit()
            # Notify the report author
            if report.user_id:
                try:
                    await notification_service.notify_report_status(db, str(report.user_id), status)
                except Exception as e:
                    print(f"Notification error (report): {e}")
            return SuccessResponse(success=True, message="Status updated")
        return SuccessResponse(success=False, message="Report not found")

    @strawberry.mutation
    async def markAllNotificationsRead(self, info: strawberry.Info) -> SuccessResponse:
        user = await info.context.user
        if not user:
            return SuccessResponse(success=False, message="Unauthorized")
        db = await info.context.get_db()
        from sqlalchemy import update
        await db.execute(
            update(DbNotification).where(
                DbNotification.user_id == user.id,
                DbNotification.is_read == False
            ).values(is_read=True)
        )
        await db.commit()
        return SuccessResponse(success=True)

    @strawberry.mutation
    async def deleteNotification(self, info: strawberry.Info, id: strawberry.ID) -> SuccessResponse:
        user = await info.context.user
        if not user:
            return SuccessResponse(success=False, message="Unauthorized")
        db = await info.context.get_db()
        q = await db.execute(select(DbNotification).where(DbNotification.id == id, DbNotification.user_id == user.id))
        n = q.scalars().first()
        if n:
            await db.delete(n)
            await db.commit()
        return SuccessResponse(success=True)

    @strawberry.mutation
    async def sendChatMessage(self, info: strawberry.Info, content: str, room: Optional[str] = "global") -> ChatMessageType:
        """Send a chat message (persisted to DB)."""
        from app.models.database import ChatMessage as DbChatMessage
        user = await info.context.user
        if not user:
            raise ValueError("Must be logged in to send messages")
        db = await info.context.get_db()
        msg = DbChatMessage(
            user_id=user.id,
            room=room or "global",
            content=content[:2000],  # Limit length
        )
        db.add(msg)
        await db.commit()
        await db.refresh(msg)
        return ChatMessageType(
            id=str(msg.id),
            userId=str(user.id),
            userName=user.name or "User",
            userAvatar=user.avatar,
            room=msg.room,
            content=msg.content,
            createdAt=str(msg.created_at)
        )

schema = strawberry.Schema(query=Query, mutation=Mutation)
