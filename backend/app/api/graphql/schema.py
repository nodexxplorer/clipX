# pyright: reportCallIssue=false, reportArgumentType=false, reportGeneralTypeIssues=false, reportReturnType=false
import strawberry
import asyncio
from typing import List, Optional, Any
from app.services.movie_service import movie_service
from app.services.notification_service import notification_service
from app.core.auth import verify_password, get_password_hash, create_access_token, decode_access_token
from app.models.database import (
    User as DbUser, Watchlist as DbWatchlist, History as DbHistory,
    Notification as DbNotification, Report as DbReport, Review as DbReview,
    RecentlyViewed as DbRecentlyViewed,
    ReviewLike as DbReviewLike, ReviewReport as DbReviewReport,
    WatchPartyRoom as DbWatchPartyRoom, WatchPartyParticipant as DbWatchPartyParticipant,
    FamilyPlan as DbFamilyPlan, FamilyMember as DbFamilyMember, FamilyInvite as DbFamilyInvite,
    UserLayoutPreference as DbUserLayoutPreference, PushSubscription as DbPushSubscription,
    YearlyStats as DbYearlyStats,
)
from sqlalchemy.future import select
import os
from datetime import datetime, timedelta
import calendar
import secrets
import string
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests


# ═══════════════════════════════════════════════════════════
# Types
# ═══════════════════════════════════════════════════════════

@strawberry.type
class UserPreferences:
    favorite_genres: List[str] = strawberry.field(default_factory=list)
    theme: str = strawberry.field(default="dark")
    email_notifications: bool = strawberry.field(default=True)
    auto_play_trailers: bool = strawberry.field(default=True)

@strawberry.input
class UserPreferencesInput:
    theme: Optional[str] = "dark"
    email_notifications: Optional[bool] = True
    auto_play_trailers: Optional[bool] = True

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
    subscriptionTier: str = "free"
    emailVerified: bool = False
    referralCount: int = 0
    preferences: UserPreferences = strawberry.field(default_factory=UserPreferences)
    stats: UserStats = strawberry.field(default_factory=UserStats)

    @strawberry.field
    def createdAt(self) -> str:
        return str(datetime.now())

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
    backdropPath: Optional[str] = None
    releaseDate: Optional[str] = None
    voteAverage: float = 0.0
    voteCount: int = 0
    runtime: Optional[int] = None
    popularity: float = 0.0
    genres: Optional[List[Genre]] = None
    tagline: Optional[str] = None
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
    def posterUrl(self) -> Optional[str]:
        return self.posterPath

    @strawberry.field
    def backdropUrl(self) -> Optional[str]:
        return self.backdropPath

    @strawberry.field
    def firstAirDate(self) -> Optional[str]:
        return self.releaseDate

    @strawberry.field
    def rating(self) -> float:
        return self.voteAverage

    @strawberry.field
    def durationMinutes(self) -> Optional[int]:
        return self.runtime

    @strawberry.field
    def description(self) -> Optional[str]:
        return self.overview

    @strawberry.field
    def year(self) -> Optional[int]:
        if not self.releaseDate:
            return None
        s_date = str(self.releaseDate).strip()
        if not s_date:
            return None
        try:
            if '-' in s_date:
                return int(s_date.split('-')[0])
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
    name: Optional[str] = None
    referralCode: Optional[str] = None

@strawberry.input
class UpdateProfileInput:
    name: Optional[str] = None
    favoriteGenres: Optional[List[str]] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    preferences: Optional[UserPreferencesInput] = None

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
class WatchHistoryItem:
    id: strawberry.ID
    movieboxId: str
    title: str
    posterUrl: Optional[str]
    contentType: str = "movie"
    currentTime: int = 0
    duration: int = 0
    progress: float = 0.0
    watchedAt: str = ""

@strawberry.type
class UserDashboardStats:
    moviesWatched: int = 0
    totalWatchTime: int = 0
    monthlyWatchTime: int = 0
    watchlistCount: int = 0
    reviewsWritten: int = 0

@strawberry.type
class Notification:
    id: strawberry.ID
    title: str
    message: str
    isRead: bool = strawberry.field(name="isRead")
    createdAt: str = strawberry.field(name="createdAt")
    type: str = "system"
    actionUrl: Optional[str] = strawberry.field(name="actionUrl", default=None)

@strawberry.type
class Review:
    id: strawberry.ID
    content: str
    rating: Optional[float]
    isFeatured: bool = strawberry.field(name="isFeatured")
    createdAt: str = strawberry.field(name="createdAt")
    userName: Optional[str] = None
    userAvatar: Optional[str] = None

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
class LoginActivityEntry:
    id: strawberry.ID
    action: str
    deviceInfo: Optional[str] = None
    ipAddress: Optional[str] = None
    location: Optional[str] = None
    success: bool = True
    createdAt: str = ""

@strawberry.type
class PromoCodeResult:
    success: bool
    message: str
    discountPercent: int = 0
    plan: Optional[str] = None

@strawberry.type
class PremiumSignupStats:
    totalPremiumUsers: int = 0
    remainingSlots: int = 50
    isEligible: bool = True
    isActive: bool = True

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
class ToggleWatchlistResponse:
    added: bool
    message: str


# ═══════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════

def get_user_preferences(user_db: DbUser) -> UserPreferences:
    prefs_data = user_db.preferences or {}
    return UserPreferences(
        favorite_genres=prefs_data.get("favoriteGenres", []),
        theme=prefs_data.get("theme", "dark"),
        email_notifications=prefs_data.get("emailNotifications", True),
        auto_play_trailers=prefs_data.get("autoPlayTrailers", True)
    )

def create_user_response(user_db: DbUser) -> User:
    return User(
        id=str(user_db.id),
        email=user_db.email,
        name=user_db.name,
        avatar=user_db.avatar,
        bio=user_db.bio,
        role=user_db.role,
        subscriptionTier=getattr(user_db, 'subscription_tier', 'free') or 'free',
        emailVerified=getattr(user_db, 'email_verified', False) or False,
        referralCount=getattr(user_db, 'referral_count', 0) or 0,
        preferences=get_user_preferences(user_db)
    )

async def _log_activity(db, user_id, action: str, info=None, success: bool = True):
    """Log a login/security event."""
    from sqlalchemy import text
    try:
        ip = "unknown"
        ua = ""
        if info and hasattr(info.context, 'request'):
            request = info.context.request
            ip = request.client.host if request.client else "unknown"
            ua = request.headers.get("user-agent", "")[:1000]
        if not user_id:
            return
        await db.execute(text("""
            INSERT INTO login_activity (user_id, action, ip_address, user_agent, success)
            VALUES (:uid, :action, :ip, :ua, :success)
        """), {"uid": user_id, "action": action, "ip": ip, "ua": ua, "success": success})
        await db.commit()
    except Exception as e:
        print(f"Log activity error: {e}")


# ═══════════════════════════════════════════════════════════
# Query
# ═══════════════════════════════════════════════════════════

@strawberry.type
class Query:

    @strawberry.field
    async def me(self, info: strawberry.Info) -> Optional[User]:
        user = await info.context.user
        if not user:
            return None
        return create_user_response(user)

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
            print(f"movies query error: {e}")
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
    async def myReferralCode(self, info: strawberry.Info) -> Optional[str]:
        user = await info.context.user
        if not user:
            return None
        return str(user.id).replace("-", "")[:8].upper()

    @strawberry.field
    async def validateReferral(self, info: strawberry.Info, code: str) -> bool:
        db = await info.context.get_db()
        from sqlalchemy import func, cast, String
        safe_code = code.upper().strip()[:8]
        result = await db.execute(
            select(DbUser).where(
                func.upper(
                    func.substr(func.replace(cast(DbUser.id, String), "-", ""), 1, 8)
                ) == safe_code
            )
        )
        return result.scalars().first() is not None

    @strawberry.field
    async def movieReviews(self, info: strawberry.Info, movieId: str) -> List[Review]:
        db = await info.context.get_db()
        from sqlalchemy import desc
        result = await db.execute(
            select(DbReview).where(DbReview.moviebox_id == movieId)
            .order_by(desc(DbReview.created_at))
        )
        reviews = result.scalars().all()
        out = []
        for r in reviews:
            user_result = await db.execute(select(DbUser).where(DbUser.id == r.user_id))
            u = user_result.scalars().first()
            out.append(Review(
                id=str(r.id), content=r.content, rating=r.rating,
                userName=u.name if u else "User", userAvatar=u.avatar if u else None,
                isFeatured=r.is_featured, createdAt=str(r.created_at)
            ))
        return out

    @strawberry.field
    async def watchHistory(self, info: strawberry.Info, limit: int = 50, offset: int = 0) -> List[WatchHistoryItem]:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        from app.models.database import History as DbHistoryModel, Movie as DbMovie, Series as DbSeries
        from sqlalchemy import desc
        items = []
        try:
            history_result = await db.execute(
                select(DbHistoryModel)
                .where(DbHistoryModel.user_id == user.id)
                .order_by(desc(DbHistoryModel.updated_at))
                .offset(offset).limit(limit)
            )
            for h in history_result.scalars().all():
                title, poster = "Unknown", None
                mid = str(h.moviebox_id)
                movie_res = await db.execute(select(DbMovie).where(DbMovie.moviebox_id == mid))
                movie_db = movie_res.scalars().first()
                if movie_db:
                    title, poster = movie_db.title or "Unknown", movie_db.poster_url
                else:
                    series_res = await db.execute(select(DbSeries).where(DbSeries.moviebox_id == mid))
                    series_db = series_res.scalars().first()
                    if series_db:
                        title, poster = series_db.title or "Unknown", series_db.poster_url
                progress = (h.current_time / h.duration * 100) if h.duration and h.duration > 0 else 0
                items.append(WatchHistoryItem(
                    id=str(h.id), movieboxId=mid, title=title, posterUrl=poster,
                    contentType=h.content_type or "movie",
                    currentTime=h.current_time or 0, duration=h.duration or 0,
                    progress=round(progress, 1),
                    watchedAt=str(h.updated_at) if h.updated_at else ""
                ))
        except Exception as e:
            print(f"Watch history error: {e}")
        return items

    @strawberry.field
    async def dashboardStats(self, info: strawberry.Info, dateRange: Optional[DateRangeInput] = None) -> AdminDashboardStats:
        from sqlalchemy import func, text
        try:
            db = await info.context.get_db()
            now = datetime.utcnow()
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            week_start = today_start - timedelta(days=7)

            counts_sql = text("""
                SELECT
                    (SELECT count(*) FROM users) AS total_users,
                    (SELECT count(*) FROM movies) AS total_movies,
                    (SELECT count(*) FROM series) AS total_series,
                    (SELECT count(*) FROM users WHERE created_at >= :today) AS new_today,
                    (SELECT count(*) FROM users WHERE created_at >= :week) AS new_week,
                    (SELECT count(DISTINCT user_id) FROM history WHERE updated_at >= :week) AS active_users,
                    (SELECT count(*) FROM watchlist) AS total_watchlist,
                    (SELECT coalesce(avg(current_time), 0) FROM history WHERE current_time > 0) AS avg_duration
            """)
            result = await db.execute(counts_sql, {"today": today_start, "week": week_start})
            row = result.one()

            avg_secs = int(row.avg_duration or 0)
            avg_h, avg_m = avg_secs // 3600, (avg_secs % 3600) // 60
            avg_session_str = f"{avg_h}h {avg_m}m" if avg_h > 0 else f"{avg_m}m"

            thirty_days_ago = today_start - timedelta(days=30)
            growth_rows = (await db.execute(
                select(func.date(DbUser.created_at).label("day"), func.count(DbUser.id).label("cnt"))
                .where(DbUser.created_at >= thirty_days_ago)
                .group_by(func.date(DbUser.created_at))
                .order_by(func.date(DbUser.created_at))
            )).all()

            recent_notifs = (await db.execute(
                select(DbNotification).order_by(DbNotification.created_at.desc()).limit(20)
            )).scalars().all()

            return AdminDashboardStats(
                totalUsers=row.total_users or 0,
                totalMovies=(row.total_movies or 0) + (row.total_series or 0),
                totalGenres=14,
                activeUsers=row.active_users or 0,
                newUsersToday=row.new_today or 0,
                newUsersThisWeek=row.new_week or 0,
                totalDownloads=0,
                totalWatchlistItems=row.total_watchlist or 0,
                avgSessionDuration=avg_session_str,
                userGrowth=[GrowthPoint(date=str(r.day), count=r.cnt) for r in growth_rows],
                genreDistribution=[],
                topMovies=[],
                recentActivity=[
                    ActivityLog(id=str(n.id), type=n.type or "system",
                                description=f"{n.title}: {n.message[:80]}",
                                timestamp=str(n.created_at))
                    for n in recent_notifs
                ]
            )
        except Exception as e:
            print(f"[dashboardStats] Error: {e}")
            return AdminDashboardStats(
                totalUsers=0, totalMovies=0, totalGenres=14, activeUsers=0,
                newUsersToday=0, newUsersThisWeek=0, totalDownloads=0,
                totalWatchlistItems=0, avgSessionDuration="0m",
                userGrowth=[], genreDistribution=[], topMovies=[], recentActivity=[]
            )

    @strawberry.field
    async def dashboardData(self, info: strawberry.Info) -> Optional[DashboardData]:
        user = await info.context.user
        if not user:
            return None
        db = await info.context.get_db()

        watchlist_query = await db.execute(select(DbWatchlist).where(DbWatchlist.user_id == user.id))
        watchlist_items = watchlist_query.scalars().all()
        watchlist_movies = []
        if watchlist_items:
            movie_ids = [item.moviebox_id for item in watchlist_items][:10]
            details_list = await asyncio.gather(*[movie_service.get_details(mid, db=db) for mid in movie_ids])
            for details in details_list:
                if not details:
                    continue
                watchlist_movies.append(Movie(
                    id=details.id, title=details.title, overview=details.description,
                    posterPath=details.poster_url, backdropPath=details.poster_url,
                    releaseDate=str(details.year) if details.year else None,
                    voteAverage=details.rating or 0.0,
                    genres=[Genre(id=str(i), name=g, slug=g.lower()) for i, g in enumerate(details.genres or [])],
                    runtime=details.duration or 0
                ))

        history_query = await db.execute(
            select(DbHistory).where(DbHistory.user_id == user.id).order_by(DbHistory.updated_at.desc())
        )
        history_items = history_query.scalars().all()
        all_reviews = (await db.execute(select(DbReview).where(DbReview.user_id == user.id))).scalars().all()

        recent, continue_watching = [], []
        total_time_seconds = monthly_time_seconds = 0
        current_month, current_year = datetime.utcnow().month, datetime.utcnow().year

        for item in history_items:
            total_time_seconds += (item.current_time or 0)
            if item.updated_at and item.updated_at.month == current_month and item.updated_at.year == current_year:
                monthly_time_seconds += (item.current_time or 0)
            if len(recent) < 5 or len(continue_watching) < 5:
                m_details = await movie_service.get_details(item.moviebox_id, db=db)
                if m_details:
                    mapped_movie = Movie(
                        id=m_details.id, title=m_details.title, overview=m_details.description,
                        posterPath=m_details.poster_url, backdropPath=m_details.poster_url,
                        releaseDate=str(m_details.year) if m_details.year else None,
                        voteAverage=m_details.rating or 0.0
                    )
                    if len(recent) < 5:
                        recent.append(RecentlyViewed(
                            id=str(item.id), title=m_details.title,
                            posterUrl=m_details.poster_url, rating=m_details.rating or 0.0
                        ))
                    if len(continue_watching) < 5 and item.current_time and item.duration and item.current_time < item.duration:
                        continue_watching.append(ContinueWatching(
                            id=str(item.id), movie=mapped_movie,
                            currentTime=item.current_time, duration=item.duration
                        ))

        return DashboardData(
            watchlist=watchlist_movies,
            recentlyViewed=recent,
            continueWatching=continue_watching,
            stats=UserDashboardStats(
                watchlistCount=len(watchlist_items),
                moviesWatched=len(history_items),
                totalWatchTime=total_time_seconds // 60,
                monthlyWatchTime=monthly_time_seconds // 60,
                reviewsWritten=len(all_reviews)
            )
        )

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
        db = await info.context.get_db()
        details = await movie_service.get_details(str(movieId), db=db)
        if not details:
            return []
        try:
            resp = await movie_service.search_content(details.title, 1, db=db)
            return [
                Movie(
                    id=item.id, title=item.title, overview=item.description,
                    posterPath=item.poster_url, backdropPath=item.poster_url,
                    releaseDate=item.year, voteAverage=item.rating, voteCount=50
                )
                for item in resp.results
                if str(item.id) != str(movieId)
            ][:limit]
        except Exception as e:
            print(f"similarMovies error: {e}")
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
            print(f"Error fetching streaming URL: {e}")
            return None


    @strawberry.field
    async def genres(self) -> List[Genre]:
        genre_list = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Drama", "Sci-Fi"]
        return [Genre(id=str(i), name=g, slug=g.lower(), movieCount=100) for i, g in enumerate(genre_list)]

    @strawberry.field
    async def notifications(self, info: strawberry.Info) -> List[Notification]:
        user = await info.context.user
        if not user:
            return []
        db = await info.context.get_db()
        q = await db.execute(
            select(DbNotification)
            .where(DbNotification.user_id == user.id)
            .order_by(DbNotification.created_at.desc())
            .limit(50)
        )
        return [
            Notification(
                id=str(n.id), title=n.title, message=n.message,
                type=n.type or "system", actionUrl=n.action_url,
                isRead=n.is_read, createdAt=str(n.created_at)
            )
            for n in q.scalars().all()
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
        from sqlalchemy.orm import selectinload
        q = await db.execute(
            select(DbReview).options(selectinload(DbReview.user))
            .order_by(DbReview.created_at.desc()).limit(12)
        )
        return [
            Review(
                id=str(r.id), content=r.content, rating=r.rating,
                userName=r.user.name if r.user else "Anonymous",
                userAvatar=r.user.avatar if r.user else None,
                isFeatured=r.is_featured, createdAt=str(r.created_at)
            )
            for r in q.scalars().all()
        ]

    @strawberry.field
    async def getReports(self, info: strawberry.Info) -> List[Report]:
        user = await info.context.user
        if not user or user.role != "admin":
            return []
        db = await info.context.get_db()
        q = await db.execute(select(DbReport).order_by(DbReport.created_at.desc()))
        return [
            Report(id=str(r.id), reason=r.reason, description=r.description,
                   status=r.status, createdAt=str(r.created_at))
            for r in q.scalars().all()
        ]

    @strawberry.field
    async def adminUsers(self, info: strawberry.Info, limit: Optional[int] = 20, offset: Optional[int] = 0, search: Optional[str] = None, status: Optional[str] = None) -> AdminUsersResponse:
        from sqlalchemy import func
        db = await info.context.get_db()
        query = select(DbUser)
        count_query = select(func.count(DbUser.id))
        if search:
            search_term = f"%{search}%"
            cond = (DbUser.email.ilike(search_term)) | (DbUser.name.ilike(search_term))
            query = query.where(cond)
            count_query = count_query.where(cond)
        total_count = (await db.execute(count_query)).scalar() or 0
        query = query.order_by(DbUser.created_at.desc()).offset(offset or 0).limit(limit or 20)
        db_users = (await db.execute(query)).scalars().all()
        users = []
        for u in db_users:
            wl_count = (await db.execute(select(func.count(DbWatchlist.id)).where(DbWatchlist.user_id == u.id))).scalar() or 0
            last_hist = (await db.execute(
                select(DbHistory.updated_at).where(DbHistory.user_id == u.id)
                .order_by(DbHistory.updated_at.desc()).limit(1)
            )).scalar()
            name_parts = (u.name or "").split(" ", 1)
            users.append(AdminUser(
                id=str(u.id), email=u.email, username=u.email.split("@")[0],
                firstName=name_parts[0] if name_parts else "",
                lastName=name_parts[1] if len(name_parts) > 1 else "",
                avatar=u.avatar, isActive=True, isBanned=False,
                lastActive=str(last_hist) if last_hist else None,
                createdAt=str(u.created_at) if u.created_at else None,
                watchlistCount=wl_count, downloadCount=0
            ))
        return AdminUsersResponse(users=users, totalCount=total_count)

    @strawberry.field
    async def adminUserDetail(self, info: strawberry.Info, id: strawberry.ID) -> AdminUser:
        user = await info.context.user
        if not user or user.role != "admin":
            raise ValueError("Admin access required")
        from sqlalchemy import func
        db = await info.context.get_db()
        u = (await db.execute(select(DbUser).where(DbUser.id == id))).scalars().first()
        if not u:
            raise ValueError("User not found")
        wl_count = (await db.execute(select(func.count()).where(DbWatchlist.user_id == u.id))).scalar() or 0
        return AdminUser(
            id=str(u.id), email=u.email, username=u.name,
            firstName=u.name.split(' ')[0] if u.name else '',
            lastName=' '.join(u.name.split(' ')[1:]) if u.name and ' ' in u.name else '',
            avatar=u.avatar, isActive=True, isBanned=False,
            lastActive=str(u.created_at), createdAt=str(u.created_at),
            watchlistCount=wl_count, downloadCount=0
        )

    @strawberry.field
    async def adminNotifications(self, info: strawberry.Info, limit: Optional[int] = 50) -> List[Notification]:
        user = await info.context.user
        if not user or user.role != "admin":
            raise ValueError("Admin access required")
        db = await info.context.get_db()
        notifs = (await db.execute(
            select(DbNotification).order_by(DbNotification.created_at.desc()).limit(limit or 50)
        )).scalars().all()
        return [
            Notification(
                id=str(n.id), title=n.title, message=n.message,
                type=n.type or "system", actionUrl=n.action_url,
                isRead=n.is_read, createdAt=str(n.created_at)
            )
            for n in notifs
        ]

    @strawberry.field
    async def chatMessages(self, info: strawberry.Info, room: Optional[str] = "global", limit: Optional[int] = 50, before: Optional[str] = None) -> List[ChatMessageType]:
        from app.models.database import ChatMessage as DbChatMessage
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
                id=str(row[0].id), userId=str(row[0].user_id),
                userName=row[1] or "User", userAvatar=row[2],
                room=row[0].room, content=row[0].content, createdAt=str(row[0].created_at)
            )
            for row in reversed(rows)
        ]

    @strawberry.field
    async def loginActivity(self, info: strawberry.Info, limit: Optional[int] = 20) -> List[LoginActivityEntry]:
        user = await info.context.user
        if not user:
            return []
        db = await info.context.get_db()
        from sqlalchemy import text
        try:
            result = await db.execute(text(
                "SELECT id, action, COALESCE(device_info, user_agent) as device_info, "
                "ip_address, location, success, created_at "
                "FROM login_activity WHERE user_id = :uid ORDER BY created_at DESC LIMIT :lim"
            ), {"uid": str(user.id), "lim": limit or 20})
            return [
                LoginActivityEntry(
                    id=str(r[0]), action=r[1] or "login", deviceInfo=r[2],
                    ipAddress=r[3], location=r[4],
                    success=r[5] if r[5] is not None else True,
                    createdAt=str(r[6]) if r[6] else ""
                )
                for r in result.fetchall()
            ]
        except Exception as e:
            print(f"Login activity query error: {e}")
            return []

    @strawberry.field
    async def premiumSignupStats(self) -> PremiumSignupStats:
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        try:
            async with AsyncSessionLocal() as db:
                total_premium = (await db.execute(
                    text("SELECT count(*) FROM users WHERE subscription_tier != 'free'")
                )).scalar() or 0
                remaining = max(0, 50 - total_premium)
                return PremiumSignupStats(
                    totalPremiumUsers=total_premium, remainingSlots=remaining,
                    isEligible=remaining > 0, isActive=remaining > 0
                )
        except Exception as e:
            print(f"Premium stats error: {e}")
            return PremiumSignupStats()


# ═══════════════════════════════════════════════════════════
# Mutation
# ═══════════════════════════════════════════════════════════

@strawberry.type
class Mutation:

    @strawberry.mutation
    async def login(self, info: strawberry.Info, email: str, password: str) -> AuthResponse:
        from app.core.database import AsyncSessionLocal
        from app.core.auth import verify_password, create_access_token
        import os
        async with AsyncSessionLocal() as db:
            try:
                result = await db.execute(select(DbUser).where(DbUser.email == email))
                user = result.scalars().first()
            except Exception as e:
                print(f"[LOGIN] DB error: {type(e).__name__}: {e}")
                raise Exception("Login service temporarily unavailable. Please try again.")

            if not user:
                await _log_activity(db, None, "login_failed", info, success=False)
                raise Exception("Invalid email or password")
            if not user.password:
                raise Exception("This account uses Google sign-in. Please log in with Google.")
            if not verify_password(password, user.password):
                await _log_activity(db, str(user.id), "login_failed", info, success=False)
                raise Exception("Invalid email or password")

            access_token = create_access_token({"sub": str(user.id)})

            from app.core.auth import create_refresh_token, store_refresh_token
            raw_refresh, refresh_hash, family_id = create_refresh_token(str(user.id))
            try:
                device_info = (info.context.request.headers.get("user-agent") or "")[:255]
                ip_address = (info.context.request.client.host if info.context.request.client else None)
                await store_refresh_token(db, str(user.id), refresh_hash, family_id, device_info, ip_address)
            except Exception as e:
                print(f"[LOGIN] Could not store refresh token: {e}")

            is_production = os.getenv("ENV", "development") == "production"
            info.context.response.set_cookie(
                key="auth_token", value=access_token, httponly=True,
                secure=is_production, samesite="lax", max_age=60 * 15, path="/"
            )
            info.context.response.set_cookie(
                key="refresh_token", value=raw_refresh, httponly=True,
                secure=is_production, samesite="lax",
                max_age=60 * 60 * 24 * 30, path="/api/auth/refresh"
            )

            await _log_activity(db, str(user.id), "login", info, success=True)
            try:
                await notification_service.create(
                    db, str(user.id), title="Welcome back! 👋",
                    message="You just signed in to clipX. Enjoy your session!",
                    notif_type="system", action_url="/dashboard"
                )
            except Exception as e:
                print(f"Login notification error: {e}")

            return AuthResponse(
                token=access_token,
                user=create_user_response(user)
            )

    @strawberry.mutation
    async def register(self, info: strawberry.Info, input: RegisterInput) -> AuthResponse:
        from app.core.database import AsyncSessionLocal
        from app.core.auth import get_password_hash, create_access_token
        import re, os

        if len(input.password) < 8:
            raise Exception("Password must be at least 8 characters long")
        if not re.search(r"[A-Za-z]", input.password):
            raise Exception("Password must contain at least one letter")
        if not re.search(r"\d", input.password):
            raise Exception("Password must contain at least one number")

        async with AsyncSessionLocal() as db:
            existing_user = (await db.execute(select(DbUser).where(DbUser.email == input.email))).scalars().first()
            if existing_user:
                if not existing_user.password:
                    existing_user.password = get_password_hash(input.password)
                    await db.commit()
                    await db.refresh(existing_user)
                    token = create_access_token({"sub": str(existing_user.id)})
                    is_production = os.getenv("ENV", "development") == "production"
                    info.context.response.set_cookie(
                        key="auth_token", value=token, httponly=True,
                        secure=is_production, samesite="lax", max_age=60 * 15, path="/"
                    )
                    return AuthResponse(token="", user=create_user_response(existing_user))
                raise Exception("An account with this email already exists")

            new_user = DbUser(
                email=input.email, password=get_password_hash(input.password),
                name=input.name, role="user", preferences={}, email_verified=False
            )
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)

            try:
                from app.core.email_service import send_verification_email
                send_verification_email(str(new_user.id), new_user.email, new_user.name or "")
            except Exception as e:
                print(f"Verification email error: {e}")

            try:
                if input.referralCode:
                    from sqlalchemy import func, cast, String
                    code = input.referralCode.upper().strip()[:8]
                    referrer = (await db.execute(
                        select(DbUser).where(
                            func.upper(func.substr(func.replace(cast(DbUser.id, String), "-", ""), 1, 8)) == code
                        )
                    )).scalars().first()
                    if referrer:
                        referrer.referral_count = (referrer.referral_count or 0) + 1
                        if referrer.referral_count >= 5 and referrer.subscription_tier == "free":
                            referrer.subscription_tier = "standard"
                            referrer.subscription_expires_at = datetime.utcnow() + timedelta(days=90)
                        await db.commit()
            except Exception as e:
                print(f"Referral tracking error: {e}")

            token = create_access_token({"sub": str(new_user.id)})
            is_production = os.getenv("ENV", "development") == "production"
            info.context.response.set_cookie(
                key="auth_token", value=token, httponly=True,
                secure=is_production, samesite="lax", max_age=60 * 15, path="/"
            )
            return AuthResponse(token="", user=create_user_response(new_user))

    @strawberry.mutation
    async def googleAuth(self, info: strawberry.Info, idToken: str) -> GoogleAuthResponse:
        try:
            import requests, certifi
            from requests.adapters import HTTPAdapter
            from urllib3.util.retry import Retry
            session = requests.Session()
            session.verify = certifi.where()
            session.trust_env = False
            retries = Retry(total=5, backoff_factor=1, status_forcelist=[500, 502, 503, 504], allowed_methods=["GET", "POST"])
            session.mount('https://', HTTPAdapter(max_retries=retries))

            client_id = os.getenv("NEXT_PUBLIC_GOOGLE_CLIENT_ID")
            if not client_id:
                raise Exception("Google Client ID not configured.")

            idinfo = id_token.verify_oauth2_token(idToken, google_requests.Request(session=session), client_id)
            email, name, avatar = idinfo['email'], idinfo.get('name'), idinfo.get('picture')

            db = await info.context.get_db()
            user = (await db.execute(select(DbUser).where(DbUser.email == email))).scalars().first()
            is_new_user = False
            if not user:
                user = DbUser(email=email, name=name, avatar=avatar, role="user", preferences={})
                db.add(user)
                await db.commit()
                await db.refresh(user)
                is_new_user = True

            token = create_access_token({"sub": str(user.id)})
            is_production = os.getenv("ENV", "development") == "production"
            info.context.response.set_cookie(
                key="auth_token", value=token, httponly=True,
                secure=is_production, samesite="lax", max_age=60 * 15, path="/"
            )
            try:
                if is_new_user:
                    await notification_service.notify_welcome(db, str(user.id), name=name)
                else:
                    await notification_service.create(
                        db, str(user.id), title="Welcome back! 👋",
                        message="You just signed in to clipX. Enjoy your session!",
                        notif_type="system", action_url="/dashboard"
                    )
            except Exception as e:
                print(f"Login notification error: {e}")

            return GoogleAuthResponse(token="", user=create_user_response(user), isNewUser=is_new_user)
        except Exception as e:
            print(f"Google auth error: {e}")
            raise Exception(f"Google authentication failed: {str(e)}")

    @strawberry.mutation
    async def logout(self, info: strawberry.Info) -> SuccessResponse:
        info.context.response.delete_cookie(key="auth_token", path="/")
        return SuccessResponse(success=True)

    @strawberry.mutation
    async def refreshToken(self, info: strawberry.Info) -> AuthResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        import uuid as uuid_mod
        token = create_access_token(data={
            "sub": str(user.id),
            "jti": str(uuid_mod.uuid4()),
            "rotated": True,
        }, expires_delta=timedelta(days=7))
        try:
            db = await info.context.get_db()
            user.last_active = datetime.utcnow()
            await db.commit()
        except Exception:
            pass
        return AuthResponse(token=token, user=create_user_response(user))

    @strawberry.mutation
    async def forgotPassword(self, info: strawberry.Info, email: str) -> SuccessResponse:
        db = await info.context.get_db()
        user = (await db.execute(select(DbUser).where(DbUser.email == email))).scalars().first()
        if user:
            try:
                from app.core.email_service import send_password_reset_email
                if user.password:
                    send_password_reset_email(str(user.id), user.email, user.name or "User")
            except Exception as e:
                print(f"Failed to send reset email: {e}")
        return SuccessResponse(success=True, message="If an account exists, a reset link was sent")

    @strawberry.mutation
    async def resetPassword(self, info: strawberry.Info, token: str, newPassword: str) -> SuccessResponse:
        from app.core.auth import decode_access_token, get_password_hash
        payload = decode_access_token(token)
        if not payload or payload.get("type") != "reset":
            raise Exception("Invalid or expired reset token")
        user_id = payload.get("sub")
        db = await info.context.get_db()
        user = (await db.execute(select(DbUser).where(DbUser.id == user_id))).scalars().first()
        if not user:
            raise Exception("User not found")
        user.password = get_password_hash(newPassword)
        await db.commit()
        try:
            await notification_service.create(
                db, str(user.id), title="Password Updated 🔒",
                message="Your password was successfully changed.", notif_type="system"
            )
        except Exception:
            pass
        return SuccessResponse(success=True, message="Password reset successfully")

    @strawberry.mutation
    async def changePassword(self, info: strawberry.Info, currentPassword: str, newPassword: str) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        if not user.password:
            raise Exception("This account uses Google sign-in. Password change is not available.")
        if not verify_password(currentPassword, user.password):
            raise Exception("Current password is incorrect")
        if len(newPassword) < 6:
            raise Exception("New password must be at least 6 characters")
        db = await info.context.get_db()
        user.password = get_password_hash(newPassword)
        await db.commit()
        return SuccessResponse(success=True, message="Password changed successfully")

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
        current_prefs = dict(user.preferences) if user.preferences else {}
        if input.favoriteGenres is not None:
            current_prefs["favoriteGenres"] = input.favoriteGenres
        if input.preferences:
            if input.preferences.theme is not None:
                current_prefs["theme"] = input.preferences.theme
            if input.preferences.email_notifications is not None:
                current_prefs["emailNotifications"] = input.preferences.email_notifications
            if input.preferences.auto_play_trailers is not None:
                current_prefs["autoPlayTrailers"] = input.preferences.auto_play_trailers
        user.preferences = current_prefs
        await db.commit()
        await db.refresh(user)
        return create_user_response(user)

    @strawberry.mutation
    async def deleteAccount(self, info: strawberry.Info, password: Optional[str] = None) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        if user.password and password:
            if not verify_password(password, user.password):
                raise Exception("Incorrect password")
        elif user.password and not password:
            raise Exception("Password required to delete account")
        db = await info.context.get_db()
        await db.delete(user)
        await db.commit()
        return SuccessResponse(success=True, message="Account deleted successfully")

    @strawberry.mutation
    async def verifyEmail(self, info: strawberry.Info, token: str) -> SuccessResponse:
        from app.core.auth import decode_access_token
        payload = decode_access_token(token)
        if not payload or payload.get("type") != "email_verify":
            raise Exception("Invalid or expired verification token")
        user_id = payload.get("sub")
        if not user_id:
            raise Exception("Invalid token")
        db = await info.context.get_db()
        import uuid
        try:
            result = await db.execute(select(DbUser).where(DbUser.id == uuid.UUID(user_id)))
        except ValueError:
            result = await db.execute(select(DbUser).where(DbUser.email == user_id))
        user = result.scalars().first()
        if not user:
            raise Exception("User not found")
        user.email_verified = True
        await db.commit()
        return SuccessResponse(success=True, message="Email verified successfully!")

    @strawberry.mutation
    async def resendVerification(self, info: strawberry.Info) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        if getattr(user, 'email_verified', False):
            return SuccessResponse(success=True, message="Email already verified")
        try:
            from app.core.email_service import send_verification_email
            send_verification_email(str(user.id), user.email, user.name or "")
            return SuccessResponse(success=True, message="Verification email sent!")
        except Exception as e:
            raise Exception(f"Failed to send email: {e}")

    @strawberry.mutation
    async def toggleWatchlist(self, info: strawberry.Info, movieId: strawberry.ID) -> ToggleWatchlistResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        result = await db.execute(select(DbWatchlist).where(
            DbWatchlist.user_id == user.id, DbWatchlist.moviebox_id == str(movieId)
        ))
        existing = result.scalars().first()
        if existing:
            await db.delete(existing)
            await db.commit()
            return ToggleWatchlistResponse(added=False, message="Removed from watchlist")
        else:
            db.add(DbWatchlist(user_id=user.id, moviebox_id=str(movieId)))
            await db.commit()
            try:
                details = await movie_service.get_details(str(movieId), db=db)
                title = details.title if details else "Content"
                await notification_service.notify_watchlist_add(db, str(user.id), title, str(movieId))
            except Exception as e:
                print(f"Notification error (watchlist): {e}")
            return ToggleWatchlistResponse(added=True, message="Added to watchlist")

    @strawberry.mutation
    async def addToWatchlist(self, info: strawberry.Info, movieId: strawberry.ID) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        db.add(DbWatchlist(user_id=user.id, moviebox_id=str(movieId)))
        await db.commit()
        try:
            details = await movie_service.get_details(str(movieId), db=db)
            title = details.title if details else "Content"
            await notification_service.notify_watchlist_add(db, str(user.id), title, str(movieId))
        except Exception as e:
            print(f"Notification error (watchlist): {e}")
        return SuccessResponse(success=True)

    @strawberry.mutation
    async def removeFromWatchlist(self, info: strawberry.Info, movieId: strawberry.ID) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        result = await db.execute(select(DbWatchlist).where(
            DbWatchlist.user_id == user.id, DbWatchlist.moviebox_id == str(movieId)
        ))
        item = result.scalars().first()
        if item:
            await db.delete(item)
            await db.commit()
        return SuccessResponse(success=True, message="Removed from watchlist")

    @strawberry.mutation
    async def updateWatchProgress(self, info: strawberry.Info, movieId: str, contentType: str, currentTime: int, duration: int) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        history_item = (await db.execute(
            select(DbHistory).where(DbHistory.user_id == user.id, DbHistory.moviebox_id == movieId)
        )).scalars().first()
        if history_item:
            history_item.current_time = currentTime
            if duration > 0:
                history_item.duration = max(history_item.duration or 0, duration)
            history_item.updated_at = datetime.utcnow()
        else:
            db.add(DbHistory(user_id=user.id, moviebox_id=movieId, content_type=contentType, current_time=currentTime, duration=duration))
        recent_item = (await db.execute(
            select(DbRecentlyViewed).where(DbRecentlyViewed.user_id == user.id, DbRecentlyViewed.moviebox_id == movieId)
        )).scalars().first()
        if recent_item:
            recent_item.viewed_at = datetime.utcnow()
        else:
            db.add(DbRecentlyViewed(user_id=user.id, moviebox_id=movieId, content_type=contentType))
        await db.commit()
        return SuccessResponse(success=True, message="Progress saved")

    @strawberry.mutation
    async def recordWatchProgress(self, info: strawberry.Info, movieId: strawberry.ID, currentTime: int, duration: int) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        history_item = (await db.execute(
            select(DbHistory).where(DbHistory.user_id == user.id, DbHistory.moviebox_id == str(movieId))
        )).scalars().first()
        is_new_watch = history_item is None
        if history_item:
            history_item.current_time = currentTime
            history_item.duration = duration
            history_item.updated_at = datetime.utcnow()
        else:
            history_item = DbHistory(user_id=user.id, moviebox_id=str(movieId), current_time=currentTime, duration=duration, content_type="movie")
            db.add(history_item)
        await db.commit()
        if is_new_watch:
            try:
                from sqlalchemy import func
                total_watched = (await db.execute(select(func.count(DbHistory.id)).where(DbHistory.user_id == user.id))).scalar() or 0
                if total_watched in [5, 10, 25, 50, 100]:
                    await notification_service.notify_watch_milestone(db, str(user.id), total_watched)
            except Exception as e:
                print(f"Milestone check error: {e}")
        return SuccessResponse(success=True)

    @strawberry.mutation
    async def clearWatchHistory(self, info: strawberry.Info) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        from sqlalchemy import delete
        await db.execute(delete(DbHistory).where(DbHistory.user_id == user.id))
        await db.execute(delete(DbRecentlyViewed).where(DbRecentlyViewed.user_id == user.id))
        await db.commit()
        return SuccessResponse(success=True, message="Watch history cleared")

    @strawberry.mutation
    async def addReview(self, info: strawberry.Info, content: str, rating: float, isFeatured: Optional[bool] = False, movieboxId: Optional[str] = None) -> SuccessResponse:
        user = await info.context.user
        if not user:
            return SuccessResponse(success=False, message="Unauthorized")
        db = await info.context.get_db()
        db.add(DbReview(user_id=user.id, content=content, rating=rating, is_featured=isFeatured))
        await db.commit()
        try:
            await notification_service.notify_review_posted(db, str(user.id))
        except Exception as e:
            print(f"Notification error (review): {e}")
        return SuccessResponse(success=True, message="Review added successfully")

    @strawberry.mutation
    async def submitReview(self, info: strawberry.Info, content: str, rating: float) -> Review:
        user = await info.context.user
        if not user:
            raise ValueError("Must be logged in to submit a review")
        if not content.strip() or len(content.strip()) < 10:
            raise ValueError("Review must be at least 10 characters")
        if rating < 1 or rating > 5:
            raise ValueError("Rating must be between 1 and 5")
        db = await info.context.get_db()
        review = DbReview(user_id=user.id, content=content.strip()[:500], rating=rating, is_featured=False)
        db.add(review)
        await db.commit()
        await db.refresh(review)
        return Review(id=str(review.id), content=review.content, rating=review.rating,
                      userName=user.name or "User", userAvatar=user.avatar,
                      isFeatured=False, createdAt=str(review.created_at))

    @strawberry.mutation
    async def submitMovieReview(self, info: strawberry.Info, movieId: str, content: str, rating: float) -> Review:
        user = await info.context.user
        if not user:
            raise ValueError("Must be logged in to review")
        if not content.strip() or len(content.strip()) < 10:
            raise ValueError("Review must be at least 10 characters")
        if rating < 1 or rating > 5:
            raise ValueError("Rating must be between 1 and 5")
        db = await info.context.get_db()
        from sqlalchemy import and_
        old_review = (await db.execute(
            select(DbReview).where(and_(DbReview.user_id == user.id, DbReview.moviebox_id == movieId))
        )).scalars().first()
        if old_review:
            old_review.content = content.strip()[:500]
            old_review.rating = rating
            await db.commit()
            return Review(id=str(old_review.id), content=old_review.content, rating=old_review.rating,
                          userName=user.name or "User", userAvatar=user.avatar,
                          isFeatured=False, createdAt=str(old_review.created_at))
        review = DbReview(user_id=user.id, moviebox_id=movieId, content=content.strip()[:500], rating=rating, is_featured=False)
        db.add(review)
        await db.commit()
        await db.refresh(review)
        return Review(id=str(review.id), content=review.content, rating=review.rating,
                      userName=user.name or "User", userAvatar=user.avatar,
                      isFeatured=False, createdAt=str(review.created_at))

    @strawberry.mutation
    async def likeReview(self, info: strawberry.Info, reviewId: str, likeType: str) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        if likeType not in ('like', 'dislike'):
            raise Exception("likeType must be 'like' or 'dislike'")
        db = await info.context.get_db()
        existing_like = (await db.execute(
            select(DbReviewLike).where(DbReviewLike.user_id == user.id, DbReviewLike.review_id == reviewId)
        )).scalars().first()
        if existing_like:
            if existing_like.like_type == likeType:
                await db.delete(existing_like)
                await db.commit()
                return SuccessResponse(success=True, message=f"{likeType.capitalize()} removed")
            existing_like.like_type = likeType
            await db.commit()
            return SuccessResponse(success=True, message=f"Changed to {likeType}")
        db.add(DbReviewLike(user_id=user.id, review_id=reviewId, like_type=likeType))
        await db.commit()
        return SuccessResponse(success=True, message=f"Review {likeType}d")

    @strawberry.mutation
    async def reportReview(self, info: strawberry.Info, reviewId: str, reason: str, description: Optional[str] = None) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        if reason not in ('spam', 'harassment', 'spoiler', 'inappropriate', 'other'):
            raise Exception("Invalid reason")
        db = await info.context.get_db()
        if (await db.execute(
            select(DbReviewReport).where(DbReviewReport.user_id == user.id, DbReviewReport.review_id == reviewId)
        )).scalars().first():
            return SuccessResponse(success=False, message="You've already reported this review")
        db.add(DbReviewReport(user_id=user.id, review_id=reviewId, reason=reason, description=(description or "")[:500]))
        await db.commit()
        try:
            for admin in (await db.execute(select(DbUser).where(DbUser.role == "admin"))).scalars().all():
                await notification_service.create(
                    db, str(admin.id), title="⚠️ Review Reported",
                    message=f"A review was reported for: {reason}",
                    notif_type="report", action_url=f"/admin/reviews?report={reviewId}"
                )
        except Exception:
            pass
        return SuccessResponse(success=True, message="Review reported. We'll review it shortly.")

    @strawberry.mutation
    async def submitReport(self, info: strawberry.Info, reason: str, description: str, movieboxId: Optional[str] = None) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise ValueError("You must be logged in to submit a report")
        db = await info.context.get_db()
        db.add(DbReport(user_id=user.id, reason=reason, description=description, moviebox_id=movieboxId))
        db.add(DbNotification(
            user_id=user.id, title="Report Submitted",
            message="Thank you for your report. Our team will review it shortly."
        ))
        await db.commit()
        return SuccessResponse(success=True, message="Report submitted successfully")

    @strawberry.mutation
    async def updateReportStatus(self, info: strawberry.Info, id: strawberry.ID, status: str) -> SuccessResponse:
        user = await info.context.user
        if not user or user.role != "admin":
            return SuccessResponse(success=False, message="Unauthorized")
        db = await info.context.get_db()
        report = (await db.execute(select(DbReport).where(DbReport.id == id))).scalars().first()
        if report:
            report.status = status
            await db.commit()
            if report.user_id:
                try:
                    await notification_service.notify_report_status(db, str(report.user_id), status)
                except Exception as e:
                    print(f"Notification error (report): {e}")
            return SuccessResponse(success=True, message="Status updated")
        return SuccessResponse(success=False, message="Report not found")

    @strawberry.mutation
    async def markNotificationRead(self, info: strawberry.Info, id: strawberry.ID) -> SuccessResponse:
        user = await info.context.user
        if not user:
            return SuccessResponse(success=False, message="Unauthorized")
        db = await info.context.get_db()
        n = (await db.execute(select(DbNotification).where(DbNotification.id == id, DbNotification.user_id == user.id))).scalars().first()
        if n:
            n.is_read = True
            await db.commit()
        return SuccessResponse(success=True)

    @strawberry.mutation
    async def markAllNotificationsRead(self, info: strawberry.Info) -> SuccessResponse:
        user = await info.context.user
        if not user:
            return SuccessResponse(success=False, message="Unauthorized")
        db = await info.context.get_db()
        from sqlalchemy import update
        await db.execute(
            update(DbNotification).where(
                DbNotification.user_id == user.id, DbNotification.is_read == False
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
        n = (await db.execute(select(DbNotification).where(DbNotification.id == id, DbNotification.user_id == user.id))).scalars().first()
        if n:
            await db.delete(n)
            await db.commit()
        return SuccessResponse(success=True)

    @strawberry.mutation
    async def sendChatMessage(self, info: strawberry.Info, content: str, room: Optional[str] = "global") -> ChatMessageType:
        from app.models.database import ChatMessage as DbChatMessage
        user = await info.context.user
        if not user:
            raise ValueError("Must be logged in to send messages")
        db = await info.context.get_db()
        msg = DbChatMessage(user_id=user.id, room=room or "global", content=content[:2000])
        db.add(msg)
        await db.commit()
        await db.refresh(msg)
        return ChatMessageType(
            id=str(msg.id), userId=str(user.id), userName=user.name or "User",
            userAvatar=user.avatar, room=msg.room, content=msg.content, createdAt=str(msg.created_at)
        )

    @strawberry.mutation
    async def adminSendNotification(self, info: strawberry.Info, title: str, message: str, userId: Optional[strawberry.ID] = None, notifType: Optional[str] = "system") -> SuccessResponse:
        user = await info.context.user
        if not user or user.role != "admin":
            raise ValueError("Admin access required")
        db = await info.context.get_db()
        if userId:
            db.add(DbNotification(user_id=userId, title=title, message=message, type=notifType or "system"))
            await db.commit()
            return SuccessResponse(success=True, message="Notification sent")
        user_ids = [str(row[0]) for row in (await db.execute(select(DbUser.id))).all()]
        for uid in user_ids:
            db.add(DbNotification(user_id=uid, title=title, message=message, type=notifType or "system"))
        await db.commit()
        return SuccessResponse(success=True, message=f"Notification sent to {len(user_ids)} users")

    @strawberry.mutation
    async def adminUpdateUserRole(self, info: strawberry.Info, id: strawberry.ID, role: str) -> SuccessResponse:
        user = await info.context.user
        if not user or user.role != "admin":
            raise ValueError("Admin access required")
        if role not in ("admin", "user"):
            raise ValueError("Invalid role. Must be 'admin' or 'user'")
        db = await info.context.get_db()
        target = (await db.execute(select(DbUser).where(DbUser.id == id))).scalars().first()
        if not target:
            raise ValueError("User not found")
        target.role = role
        await db.commit()
        return SuccessResponse(success=True, message=f"User role updated to {role}")

    @strawberry.mutation
    async def adminDeleteUser(self, info: strawberry.Info, id: strawberry.ID) -> SuccessResponse:
        user = await info.context.user
        if not user or user.role != "admin":
            raise ValueError("Admin access required")
        if str(user.id) == str(id):
            raise ValueError("Cannot delete yourself")
        db = await info.context.get_db()
        target = (await db.execute(select(DbUser).where(DbUser.id == id))).scalars().first()
        if not target:
            raise ValueError("User not found")
        await db.delete(target)
        await db.commit()
        return SuccessResponse(success=True, message="User deleted")

    @strawberry.mutation
    async def initializeSubscription(self, info: strawberry.Info, plan: str, billing: str = "monthly") -> strawberry.scalars.JSON:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        from app.core.paystack import initialize_transaction, PLAN_AMOUNTS
        import uuid as uuid_mod
        plan_key = f"{plan}_{billing}"
        amount = PLAN_AMOUNTS.get(plan_key)
        if not amount:
            raise Exception(f"Invalid plan: {plan} ({billing})")
        reference = f"clipx_{plan}_{str(uuid_mod.uuid4())[:8]}"
        result = await initialize_transaction(
            email=user.email, amount=amount, plan=plan_key, reference=reference,
            metadata={
                "user_id": str(user.id), "plan": plan, "billing": billing,
                "custom_fields": [
                    {"display_name": "Plan", "variable_name": "plan", "value": plan.capitalize()},
                    {"display_name": "Billing", "variable_name": "billing", "value": billing.capitalize()},
                ]
            }
        )
        if not result.get("status"):
            raise Exception(result.get("error", "Failed to initialize payment"))
        return {"authorizationUrl": result["authorization_url"], "accessCode": result["access_code"], "reference": result["reference"]}

    @strawberry.mutation
    async def verifyPayment(self, info: strawberry.Info, reference: str) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        from app.core.paystack import verify_transaction
        result = await verify_transaction(reference)
        if not result.get("status"):
            raise Exception(result.get("error", "Payment verification failed"))
        metadata = result.get("metadata", {})
        plan = metadata.get("plan", "standard")
        billing = metadata.get("billing", "monthly")
        db = await info.context.get_db()
        user_obj = (await db.execute(select(DbUser).where(DbUser.id == user.id))).scalars().first()
        if user_obj:
            user_obj.subscription_tier = plan
            user_obj.subscription_expires_at = datetime.utcnow() + timedelta(days=365 if billing == "yearly" else 30)
            user_obj.paystack_customer_code = result.get("customer_code")
            await db.commit()
            try:
                from app.core.email_service import send_subscription_email
                send_subscription_email(user_obj.email, user_obj.name or "", plan, "activated")
            except Exception:
                pass
        return SuccessResponse(success=True, message=f"Payment successful! You're now on the {plan.capitalize()} plan.")

    @strawberry.mutation
    async def cancelSubscription(self, info: strawberry.Info) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        user_obj = (await db.execute(select(DbUser).where(DbUser.id == user.id))).scalars().first()
        if not user_obj or user_obj.subscription_tier == "free":
            raise Exception("No active subscription to cancel")
        old_plan = user_obj.subscription_tier
        user_obj.subscription_tier = "free"
        user_obj.subscription_expires_at = None
        await db.commit()
        try:
            from app.core.email_service import send_subscription_email
            send_subscription_email(user_obj.email, user_obj.name or "", old_plan, "cancelled")
        except Exception:
            pass
        return SuccessResponse(success=True, message="Subscription cancelled successfully")

    @strawberry.mutation
    async def mySubscription(self, info: strawberry.Info) -> strawberry.scalars.JSON:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        return {
            "tier": getattr(user, "subscription_tier", "free") or "free",
            "expiresAt": str(user.subscription_expires_at) if getattr(user, "subscription_expires_at", None) else None,
            "emailVerified": getattr(user, "email_verified", False),
            "referralCount": getattr(user, "referral_count", 0) or 0,
        }

    @strawberry.mutation
    async def myPaymentHistory(self, info: strawberry.Info) -> strawberry.scalars.JSON:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        from sqlalchemy import text
        try:
            result = await db.execute(text(
                "SELECT id, amount, currency, status, plan, payment_method, paid_at, created_at "
                "FROM payment_history WHERE user_id = :uid ORDER BY created_at DESC LIMIT 20"
            ), {"uid": str(user.id)})
            return {
                "payments": [
                    {"id": str(r[0]), "amount": r[1], "currency": r[2], "status": r[3],
                     "plan": r[4], "method": r[5],
                     "paidAt": str(r[6]) if r[6] else None, "createdAt": str(r[7]) if r[7] else None}
                    for r in result.fetchall()
                ]
            }
        except Exception as e:
            print(f"Payment history error: {e}")
            return {"payments": []}

    @strawberry.mutation
    async def applyPromoCode(self, info: strawberry.Info, code: str) -> PromoCodeResult:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        from sqlalchemy import text
        row = (await db.execute(text(
            "SELECT id, code, discount_percent, discount_months, plan, max_uses, current_uses, "
            "is_active, expires_at FROM promo_codes WHERE UPPER(code) = UPPER(:code)"
        ), {"code": code.strip()})).fetchone()
        if not row:
            return PromoCodeResult(success=False, message="Invalid promo code")
        promo_id, _, discount, months, plan, max_uses, current_uses, is_active, expires_at = row
        if not is_active:
            return PromoCodeResult(success=False, message="This promo code is no longer active")
        if expires_at and datetime.utcnow() > expires_at:
            return PromoCodeResult(success=False, message="This promo code has expired")
        if max_uses and current_uses >= max_uses:
            return PromoCodeResult(success=False, message="This promo code has reached its usage limit")
        if (await db.execute(text("SELECT 1 FROM applied_promos WHERE user_id = :uid AND promo_code_id = :pid"),
                             {"uid": str(user.id), "pid": str(promo_id)})).fetchone():
            return PromoCodeResult(success=False, message="You've already used this promo code")
        await db.execute(text("INSERT INTO applied_promos (user_id, promo_code_id) VALUES (:uid, :pid)"),
                         {"uid": str(user.id), "pid": str(promo_id)})
        await db.execute(text("UPDATE promo_codes SET current_uses = current_uses + 1 WHERE id = :pid"),
                         {"pid": str(promo_id)})
        if plan:
            user.subscription_tier = plan
            user.subscription_expires_at = datetime.utcnow() + timedelta(days=30 * (months or 1))
        await db.commit()
        return PromoCodeResult(
            success=True,
            message=f"Promo applied! {discount}% off" + (f" on {plan.capitalize()} plan" if plan else ""),
            discountPercent=discount or 0, plan=plan
        )

    # ═══════════════════════════════════════════════════════════
    # Watch Party
    # ═══════════════════════════════════════════════════════════

    @strawberry.mutation
    async def createWatchParty(self, info: strawberry.Info, movieboxId: str, contentType: str = "movie") -> strawberry.scalars.JSON:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        room_code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
        room = DbWatchPartyRoom(host_id=user.id, moviebox_id=movieboxId, content_type=contentType, room_code=room_code)
        db.add(room)
        db.add(DbWatchPartyParticipant(room_id=room.id, user_id=user.id))
        await db.commit()
        import json
        return json.dumps({
            "roomId": str(room.id), "roomCode": room_code, "movieboxId": movieboxId,
            "contentType": contentType, "hostName": user.name, "shareLink": f"/watch-party/{room_code}"
        })

    @strawberry.mutation
    async def joinWatchParty(self, info: strawberry.Info, roomCode: str) -> strawberry.scalars.JSON:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        room = (await db.execute(
            select(DbWatchPartyRoom).where(DbWatchPartyRoom.room_code == roomCode, DbWatchPartyRoom.status == "active")
        )).scalars().first()
        if not room:
            raise Exception("Room not found or has ended")
        participants = (await db.execute(
            select(DbWatchPartyParticipant).where(DbWatchPartyParticipant.room_id == room.id)
        )).scalars().all()
        if len(participants) >= room.max_participants:
            raise Exception("Room is full")
        already_in = any(p.user_id == user.id for p in participants)
        if not already_in:
            db.add(DbWatchPartyParticipant(room_id=room.id, user_id=user.id))
            await db.commit()
        try:
            await notification_service.create(
                db, str(room.host_id), title="🎉 New Viewer Joined!",
                message=f"{user.name} joined your watch party",
                notif_type="social", action_url=f"/watch-party/{roomCode}"
            )
        except Exception:
            pass
        import json
        return json.dumps({
            "roomId": str(room.id), "roomCode": room.room_code, "movieboxId": room.moviebox_id,
            "contentType": room.content_type, "currentTime": room.current_time,
            "isPlaying": room.is_playing,
            "participantCount": len(participants) + (0 if already_in else 1)
        })

    @strawberry.mutation
    async def endWatchParty(self, info: strawberry.Info, roomCode: str) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        room = (await db.execute(
            select(DbWatchPartyRoom).where(DbWatchPartyRoom.room_code == roomCode, DbWatchPartyRoom.host_id == user.id)
        )).scalars().first()
        if not room:
            raise Exception("Room not found or you're not the host")
        room.status = "ended"
        room.ended_at = datetime.utcnow()
        await db.commit()
        return SuccessResponse(success=True, message="Watch party ended")

    # ═══════════════════════════════════════════════════════════
    # Family Plan
    # ═══════════════════════════════════════════════════════════

    @strawberry.mutation
    async def createFamilyPlan(self, info: strawberry.Info) -> strawberry.scalars.JSON:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        if getattr(user, 'subscription_tier', 'free') != 'family':
            raise Exception("Family plan requires the Family subscription tier")
        db = await info.context.get_db()
        if (await db.execute(select(DbFamilyPlan).where(DbFamilyPlan.parent_id == user.id))).scalars().first():
            raise Exception("You already have a family plan")
        invite_code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
        plan = DbFamilyPlan(parent_id=user.id, invite_code=invite_code)
        db.add(plan)
        db.add(DbFamilyMember(family_plan_id=plan.id, user_id=user.id, role="owner"))
        await db.commit()
        import json
        return json.dumps({"planId": str(plan.id), "inviteCode": invite_code, "memberSlots": plan.member_slots, "membersUsed": 1})

    @strawberry.mutation
    async def inviteFamilyMember(self, info: strawberry.Info, email: str) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        plan = (await db.execute(select(DbFamilyPlan).where(DbFamilyPlan.parent_id == user.id))).scalars().first()
        if not plan:
            raise Exception("You don't have a family plan")
        members = (await db.execute(select(DbFamilyMember).where(DbFamilyMember.family_plan_id == plan.id))).scalars().all()
        if len(members) >= plan.member_slots:
            raise Exception(f"Family plan is full ({plan.member_slots} members max)")
        if (await db.execute(
            select(DbFamilyInvite).where(
                DbFamilyInvite.family_plan_id == plan.id,
                DbFamilyInvite.email == email, DbFamilyInvite.status == "pending"
            )
        )).scalars().first():
            return SuccessResponse(success=False, message="An invite is already pending for this email")
        db.add(DbFamilyInvite(
            family_plan_id=plan.id, email=email,
            token=secrets.token_urlsafe(32),
            expires_at=datetime.utcnow() + timedelta(days=7)
        ))
        await db.commit()
        return SuccessResponse(success=True, message=f"Invite sent to {email}")

    @strawberry.mutation
    async def acceptFamilyInvite(self, info: strawberry.Info, token: str) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        invite = (await db.execute(
            select(DbFamilyInvite).where(DbFamilyInvite.token == token, DbFamilyInvite.status == "pending")
        )).scalars().first()
        if not invite:
            raise Exception("Invalid or expired invite")
        if invite.expires_at and invite.expires_at < datetime.utcnow():
            invite.status = "expired"
            await db.commit()
            raise Exception("This invite has expired")
        if (await db.execute(select(DbFamilyMember).where(DbFamilyMember.user_id == user.id))).scalars().first():
            raise Exception("You're already part of a family plan")
        plan = (await db.execute(select(DbFamilyPlan).where(DbFamilyPlan.id == invite.family_plan_id))).scalars().first()
        members = (await db.execute(select(DbFamilyMember).where(DbFamilyMember.family_plan_id == plan.id))).scalars().all()
        if len(members) >= plan.member_slots:
            raise Exception("Family plan is full")
        db.add(DbFamilyMember(family_plan_id=plan.id, user_id=user.id, role="member"))
        invite.status = "accepted"
        user.subscription_tier = "family"
        await db.commit()
        return SuccessResponse(success=True, message="Welcome to the family plan!")

    @strawberry.mutation
    async def removeFamilyMember(self, info: strawberry.Info, memberId: str) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        plan = (await db.execute(select(DbFamilyPlan).where(DbFamilyPlan.parent_id == user.id))).scalars().first()
        if not plan:
            raise Exception("You don't have a family plan")
        member = (await db.execute(
            select(DbFamilyMember).where(DbFamilyMember.id == memberId, DbFamilyMember.family_plan_id == plan.id)
        )).scalars().first()
        if not member:
            raise Exception("Member not found")
        if member.role == "owner":
            raise Exception("Cannot remove the plan owner")
        removed_user = (await db.execute(select(DbUser).where(DbUser.id == member.user_id))).scalars().first()
        if removed_user:
            removed_user.subscription_tier = "free"
        await db.delete(member)
        await db.commit()
        return SuccessResponse(success=True, message="Member removed from family plan")

    # ═══════════════════════════════════════════════════════════
    # Layout & Push Notifications
    # ═══════════════════════════════════════════════════════════

    @strawberry.mutation
    async def saveLayoutPreference(self, info: strawberry.Info, layoutOrder: List[str]) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        existing = (await db.execute(
            select(DbUserLayoutPreference).where(DbUserLayoutPreference.user_id == user.id)
        )).scalars().first()
        if existing:
            existing.layout_order = layoutOrder
            existing.updated_at = datetime.utcnow()
        else:
            db.add(DbUserLayoutPreference(user_id=user.id, layout_order=layoutOrder))
        await db.commit()
        return SuccessResponse(success=True, message="Layout saved")

    @strawberry.mutation
    async def registerPushToken(self, info: strawberry.Info, fcmToken: str, deviceType: str = "web") -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        existing = (await db.execute(
            select(DbPushSubscription).where(DbPushSubscription.user_id == user.id, DbPushSubscription.fcm_token == fcmToken)
        )).scalars().first()
        if existing:
            existing.is_active = True
        else:
            db.add(DbPushSubscription(user_id=user.id, fcm_token=fcmToken, device_type=deviceType))
        await db.commit()
        return SuccessResponse(success=True, message="Push token registered")

    @strawberry.mutation
    async def unregisterPushToken(self, info: strawberry.Info, fcmToken: str) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        existing = (await db.execute(
            select(DbPushSubscription).where(DbPushSubscription.user_id == user.id, DbPushSubscription.fcm_token == fcmToken)
        )).scalars().first()
        if existing:
            existing.is_active = False
            await db.commit()
        return SuccessResponse(success=True, message="Push token removed")


# ═══════════════════════════════════════════════════════════
# Schema — must be last
# ═══════════════════════════════════════════════════════════

schema = strawberry.Schema(query=Query, mutation=Mutation)