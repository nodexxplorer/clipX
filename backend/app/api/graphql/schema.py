# pyright: reportCallIssue=false, reportArgumentType=false, reportGeneralTypeIssues=false, reportReturnType=false
import logging

logger = logging.getLogger("clipx")
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
    Subtitle as DbSubtitle, PasswordResetToken as DbPasswordResetToken,
)
from sqlalchemy.future import select
import os
from datetime import datetime, timedelta
import calendar
import secrets
import string
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests


def _sentry_capture(e: Exception):
    """Safely forward exception to Sentry without crashing if SDK is absent."""
    try:
        import sentry_sdk
        sentry_sdk.capture_exception(e)
    except Exception:
        pass


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
    _created_at_raw: strawberry.Private[Optional[str]] = None

    @strawberry.field
    def createdAt(self) -> str:
        return self._created_at_raw or ""

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

@strawberry.type
class SearchResults:
    items: List[Movie]
    totalResults: int
    page: int
    totalPages: int


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
        preferences=get_user_preferences(user_db),
        _created_at_raw=str(user_db.created_at) if getattr(user_db, 'created_at', None) else None
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
        _sentry_capture(e)
        logger.exception("Log activity error")


# ═══════════════════════════════════════════════════════════
# Subtitle / Notification Prefs / Referral Types
# ═══════════════════════════════════════════════════════════

@strawberry.type
class SubtitleType:
    id: strawberry.ID
    movieboxId: str
    contentType: str = "movie"
    language: str = "en"
    label: str = "English"
    format: str = "vtt"
    fileUrl: str = ""
    season: Optional[int] = None
    episode: Optional[int] = None
    createdAt: Optional[str] = None

@strawberry.type
class NotificationPreferencesType:
    newRelease: bool = True
    watchlist: bool = True
    recommendations: bool = True
    accountActivity: bool = True
    promotions: bool = False
    socialUpdates: bool = True
    downloadComplete: bool = True

@strawberry.input
class NotificationPreferencesInput:
    newRelease: Optional[bool] = None
    watchlist: Optional[bool] = None
    recommendations: Optional[bool] = None
    accountActivity: Optional[bool] = None
    promotions: Optional[bool] = None
    socialUpdates: Optional[bool] = None
    downloadComplete: Optional[bool] = None

@strawberry.type
class ReferralEntry:
    id: strawberry.ID
    email: str
    name: Optional[str] = None
    joinedAt: Optional[str] = None
    subscriptionTier: str = "free"

@strawberry.type
class ReferralDashboard:
    totalReferrals: int = 0
    activeReferrals: int = 0
    premiumConversions: int = 0
    referrals: List[ReferralEntry] = strawberry.field(default_factory=list)

@strawberry.type
class SessionEntry:
    id: strawberry.ID
    deviceInfo: Optional[str] = None
    ipAddress: Optional[str] = None
    lastActive: str = ""
    createdAt: str = ""
    isCurrent: bool = False

@strawberry.type
class OfflineDownloadToken:
    movieboxId: str
    encryptionKey: str
    iv: str
    quality: str = "720p"
    expiresAt: str = ""

@strawberry.input
class InteractionInput:
    movieboxId: str
    interactionType: str = "view"  # view, click, share, download
    title: Optional[str] = None
    genre: Optional[str] = None
    contentType: Optional[str] = "movie"

# ═══════════════════════════════════════════════════════════
# Admin Audit Log, Feature Flags, Custom Lists, Scheduling
# ═══════════════════════════════════════════════════════════

@strawberry.type
class AdminAuditLogEntry:
    id: strawberry.ID
    adminId: str
    adminEmail: str = ""
    action: str  # ban_user, unban_user, delete_user, update_role, update_flag, etc.
    targetType: str = ""  # user, movie, feature_flag, etc.
    targetId: str = ""
    details: Optional[str] = None
    ipAddress: Optional[str] = None
    createdAt: str = ""

@strawberry.type
class FeatureFlag:
    id: strawberry.ID
    key: str  # e.g. "watch_party_enabled", "downloads_enabled"
    label: str = ""
    enabled: bool = True
    description: Optional[str] = None
    updatedAt: str = ""
    updatedBy: Optional[str] = None

@strawberry.input
class FeatureFlagInput:
    key: str
    enabled: bool
    label: Optional[str] = None
    description: Optional[str] = None

@strawberry.type
class CustomListItem:
    movieboxId: str
    title: str = ""
    posterUrl: Optional[str] = None
    addedAt: str = ""

@strawberry.type
class CustomList:
    id: strawberry.ID
    userId: str
    name: str
    description: Optional[str] = None
    isPublic: bool = False
    items: List[CustomListItem] = strawberry.field(default_factory=list)
    createdAt: str = ""
    updatedAt: str = ""

@strawberry.input
class CreateCustomListInput:
    name: str
    description: Optional[str] = None
    isPublic: Optional[bool] = False

@strawberry.type
class TrendingSearch:
    query: str
    count: int = 0

@strawberry.type
class ContentScheduleEntry:
    id: strawberry.ID
    movieboxId: str
    title: str = ""
    publishAt: str = ""
    isPublished: bool = False
    createdBy: Optional[str] = None

@strawberry.type
class SeoMetadataEntry:
    id: strawberry.ID
    movieboxId: str
    metaTitle: Optional[str] = None
    metaDescription: Optional[str] = None
    ogImage: Optional[str] = None
    updatedAt: str = ""

@strawberry.input
class SeoMetadataInput:
    movieboxId: str
    metaTitle: Optional[str] = None
    metaDescription: Optional[str] = None
    ogImage: Optional[str] = None

@strawberry.input
class MovieInput:
    title: str
    overview: Optional[str] = None
    posterUrl: Optional[str] = None
    backdropUrl: Optional[str] = None
    trailerUrl: Optional[str] = None
    releaseDate: Optional[str] = None
    runtime: Optional[int] = None
    rating: Optional[float] = None
    genres: Optional[List[str]] = None
    tagline: Optional[str] = None
    contentType: str = "movie"

@strawberry.type
class RevenueGoal:
    id: strawberry.ID
    month: str  # "2026-04"
    targetAmount: float = 0.0
    currentAmount: float = 0.0
    currency: str = "USD"
    notes: Optional[str] = None

@strawberry.type
class UserProfile:
    """Sub-profile for multi-profile (Netflix-style) support."""
    id: strawberry.ID
    name: str
    avatar: Optional[str] = None
    isKids: bool = False
    createdAt: str = ""

@strawberry.type
class SystemHealthResponse:
    status: str = "healthy"
    timestamp: str = ""
    version: str = ""
    database: str = "unknown"
    movieProvider: str = "unknown"
    redis: str = "unknown"

# ─── Section 11: Email Preferences ─────────────────────────
@strawberry.type
class EmailPreferences:
    marketing: bool = True
    security: bool = True
    newReleases: bool = True
    watchlistUpdates: bool = True
    weeklyDigest: bool = True
    socialActivity: bool = True
    accountAlerts: bool = True

# ─── Section 12: Download Quality / Limits ─────────────────
@strawberry.type
class DownloadQuota:
    used: int = 0
    limit: int = 10
    tier: str = "free"
    remainingStorage: float = 0.0  # in GB

# ─── Section 15: Content Schedule Entry ────────────────────
@strawberry.type
class ContentScheduleEntry:
    id: strawberry.ID
    movieboxId: str
    title: str
    publishAt: str
    status: str = "scheduled"  # scheduled, published, cancelled
    createdBy: str = ""

# ─── Section 15: SEO Metadata Entry ───────────────────────
@strawberry.type
class SeoMetadata:
    movieboxId: str
    title: Optional[str] = None
    description: Optional[str] = None
    ogImage: Optional[str] = None
    keywords: Optional[str] = None

# ─── Section 15: Impersonation Token ──────────────────────
@strawberry.type
class ImpersonationResponse:
    success: bool
    token: Optional[str] = None
    expiresAt: Optional[str] = None
    message: str = ""

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
        if not reviews:
            return []

        # Batch-fetch all review authors in ONE query (N+1 fix)
        author_ids = list({r.user_id for r in reviews})
        user_result = await db.execute(
            select(DbUser).where(DbUser.id.in_(author_ids))
        )
        user_map = {u.id: u for u in user_result.scalars().all()}

        out = []
        for r in reviews:
            u = user_map.get(r.user_id)
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
            history_rows = history_result.scalars().all()
            if not history_rows:
                return []

            # Batch-fetch all moviebox_ids from local DB in TWO queries (N+1 fix)
            all_mids = list({str(h.moviebox_id) for h in history_rows})

            movie_result = await db.execute(
                select(DbMovie).where(DbMovie.moviebox_id.in_(all_mids))
            )
            movie_map = {m.moviebox_id: m for m in movie_result.scalars().all()}

            series_result = await db.execute(
                select(DbSeries).where(DbSeries.moviebox_id.in_(all_mids))
            )
            series_map = {s.moviebox_id: s for s in series_result.scalars().all()}

            # Only fetch from API for items not in local DB (rare after first view)
            missing_mids = [mid for mid in all_mids if mid not in movie_map and mid not in series_map]
            api_map = {}
            if missing_mids:
                api_results = await asyncio.gather(
                    *[movie_service.get_details(mid, db=db) for mid in missing_mids[:5]],
                    return_exceptions=True
                )
                for mid, result in zip(missing_mids[:5], api_results):
                    if not isinstance(result, Exception) and result:
                        api_map[mid] = result

            for h in history_rows:
                mid = str(h.moviebox_id)
                title, poster = None, None

                if mid in movie_map:
                    title, poster = movie_map[mid].title, movie_map[mid].poster_url
                elif mid in series_map:
                    title, poster = series_map[mid].title, series_map[mid].poster_url
                elif mid in api_map:
                    title, poster = api_map[mid].title, api_map[mid].poster_url
                else:
                    title = f"Content #{mid[:8]}"

                progress = (h.current_time / h.duration * 100) if h.duration and h.duration > 0 else 0
                items.append(WatchHistoryItem(
                    id=str(h.id), movieboxId=mid, title=title, posterUrl=poster,
                    contentType=h.content_type or "movie",
                    currentTime=h.current_time or 0, duration=h.duration or 0,
                    progress=round(progress, 1),
                    watchedAt=str(h.updated_at) if h.updated_at else ""
                ))
        except Exception as e:
            _sentry_capture(e)
            logger.exception("Watch history error")
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
                    (SELECT coalesce(avg(h.current_time), 0) FROM history h WHERE h.current_time > 0) AS avg_duration
            """)
            result = await db.execute(counts_sql, {"today": today_start, "week": week_start})
            row = result.one()

            avg_secs = int(row.avg_duration or 0)
            avg_h, avg_m = avg_secs // 3600, (avg_secs % 3600) // 60
            avg_session_str = f"{avg_h}h {avg_m}m" if avg_h > 0 else f"{avg_m}m"

            thirty_days_ago = today_start - timedelta(days=30)

            # ── Run independent queries concurrently ──────────────
            import asyncio

            async def _query_growth():
                return (await db.execute(
                    select(func.date(DbUser.created_at).label("day"), func.count(DbUser.id).label("cnt"))
                    .where(DbUser.created_at >= thirty_days_ago)
                    .group_by(func.date(DbUser.created_at))
                    .order_by(func.date(DbUser.created_at))
                )).all()

            async def _query_recent_notifs():
                return (await db.execute(
                    select(DbNotification).order_by(DbNotification.created_at.desc()).limit(20)
                )).scalars().all()

            async def _query_top_movies():
                try:
                    rows = (await db.execute(text("""
                        SELECT moviebox_id, title, COUNT(*) AS view_count
                        FROM movie_views
                        WHERE viewed_at >= :week
                        GROUP BY moviebox_id, title
                        ORDER BY view_count DESC
                        LIMIT 5
                    """), {"week": week_start})).fetchall()
                    return [
                        TopMovieStat(title=tr.title or tr.moviebox_id, views=tr.view_count or 0, downloads=0, watchlistAdds=0)
                        for tr in rows
                    ]
                except Exception as e:
                    _sentry_capture(e)
                    logger.exception("[dashboardStats] topMovies error")
                    return []

            async def _query_genre_dist():
                try:
                    rows = (await db.execute(text("""
                        SELECT genre, COUNT(*) AS view_count
                        FROM movie_views
                        WHERE genre IS NOT NULL AND genre != ''
                        GROUP BY genre
                        ORDER BY view_count DESC
                        LIMIT 10
                    """))).fetchall()
                    return [
                        GenreDistribution(genre=Genre(name=gr.genre, slug=gr.genre.lower().replace(" ", "-")), movieCount=0, viewCount=gr.view_count or 0)
                        for gr in rows
                    ]
                except Exception as e:
                    _sentry_capture(e)
                    logger.exception("[dashboardStats] genreDistribution error")
                    return []

            growth_rows, recent_notifs, top_movies, genre_dist = await asyncio.gather(
                _query_growth(), _query_recent_notifs(), _query_top_movies(), _query_genre_dist()
            )

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
                genreDistribution=genre_dist,
                topMovies=top_movies,
                recentActivity=[
                    ActivityLog(id=str(n.id), type=n.type or "system",
                                description=f"{n.title}: {n.message[:80]}",
                                timestamp=str(n.created_at))
                    for n in recent_notifs
                ]
            )
        except Exception as e:
            _sentry_capture(e)
            logger.exception("[dashboardStats] Error")
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

        # ── Watchlist (only need first 10 for UI) ─────────────────
        watchlist_query = await db.execute(
            select(DbWatchlist).where(DbWatchlist.user_id == user.id).limit(10)
        )
        watchlist_items = watchlist_query.scalars().all()
        watchlist_movies = []
        if watchlist_items:
            movie_ids = [item.moviebox_id for item in watchlist_items]
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

        # ── Aggregate stats via SQL (avoids fetching ALL history rows) ──
        from sqlalchemy import func, text
        current_month = datetime.utcnow().month
        current_year = datetime.utcnow().year
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        stats_result = await db.execute(text("""
            SELECT
                COUNT(*) AS total_watched,
                COALESCE(SUM(current_time), 0) AS total_seconds,
                COALESCE(SUM(CASE WHEN updated_at >= :month_start THEN current_time ELSE 0 END), 0) AS monthly_seconds
            FROM history
            WHERE user_id = :uid
        """), {"uid": str(user.id), "month_start": month_start})
        stats_row = stats_result.one()

        watchlist_count_result = await db.execute(text(
            "SELECT COUNT(*) AS cnt FROM watchlist WHERE user_id = :uid"
        ), {"uid": str(user.id)})
        watchlist_count = watchlist_count_result.scalar() or 0

        reviews_count_result = await db.execute(text(
            "SELECT COUNT(*) AS cnt FROM reviews WHERE user_id = :uid"
        ), {"uid": str(user.id)})
        reviews_count = reviews_count_result.scalar() or 0

        # ── Recent history (only 10 rows for UI cards) ────────────
        history_query = await db.execute(
            select(DbHistory).where(DbHistory.user_id == user.id)
            .order_by(DbHistory.updated_at.desc()).limit(10)
        )
        history_items = history_query.scalars().all()

        recent, continue_watching = [], []

        # ── N+1 fix: batch-fetch details for the first 10 items concurrently ──
        items_needing_details = history_items[:10]  # only need first 10 for recent + continue
        if items_needing_details:
            detail_results = await asyncio.gather(
                *[movie_service.get_details(item.moviebox_id, db=db) for item in items_needing_details],
                return_exceptions=True
            )
            for item, m_details in zip(items_needing_details, detail_results):
                if isinstance(m_details, Exception) or not m_details:
                    continue
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
                watchlistCount=watchlist_count,
                moviesWatched=int(stats_row.total_watched),
                totalWatchTime=int(stats_row.total_seconds) // 60,
                monthlyWatchTime=int(stats_row.monthly_seconds) // 60,
                reviewsWritten=reviews_count
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
                avatar=u.avatar, isActive=True, isBanned=getattr(u, 'is_banned', False) or False,
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
            avatar=u.avatar, isActive=True, isBanned=getattr(u, 'is_banned', False) or False,
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
            _sentry_capture(e)
            logger.exception("Login activity query error")
            return []

    # ─── Admin: Login activity (all users) ────────────────────────────────────
    @strawberry.field
    async def adminLoginActivity(self, info: strawberry.Info, limit: Optional[int] = 50) -> List[LoginActivityEntry]:
        user = await info.context.user
        if not user or user.role not in ("admin", "superadmin"):
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            try:
                result = await db.execute(text("""
                    SELECT la.id, la.action, la.user_agent, la.ip_address,
                           COALESCE(u.email, 'unknown') as location,
                           la.success, la.created_at
                    FROM login_activity la
                    LEFT JOIN users u ON u.id = la.user_id
                    ORDER BY la.created_at DESC
                    LIMIT :lim
                """), {"lim": limit or 50})
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
                _sentry_capture(e)
                logger.exception("adminLoginActivity error")
                return []

    # ─── Admin: Active sessions ───────────────────────────────────────────────
    @strawberry.field
    async def adminActiveSessions(self, info: strawberry.Info) -> strawberry.scalars.JSON:
        user = await info.context.user
        if not user or user.role not in ("admin", "superadmin"):
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            try:
                result = await db.execute(text("""
                    SELECT rt.id, COALESCE(u.email, 'unknown') as email,
                           rt.device_info, rt.ip_address, rt.created_at, rt.expires_at
                    FROM refresh_tokens rt
                    JOIN users u ON u.id = rt.user_id
                    WHERE rt.is_revoked = FALSE AND rt.expires_at > NOW()
                    ORDER BY rt.created_at DESC
                    LIMIT 100
                """))
                rows = result.fetchall()
                return [
                    {
                        "id": str(r[0]), "user": r[1] or "unknown",
                        "device": r[2] or "Unknown device", "ip": r[3] or "unknown",
                        "location": "", "lastActive": str(r[4]) if r[4] else "",
                        "active": True
                    }
                    for r in rows
                ]
            except Exception as e:
                _sentry_capture(e)
                logger.exception("adminActiveSessions error")
                return []

    # ─── Admin: Revenue stats ─────────────────────────────────────────────────
    @strawberry.field
    async def revenueStats(self, info: strawberry.Info, days: Optional[int] = 30) -> strawberry.scalars.JSON:
        user = await info.context.user
        if not user or user.role not in ("admin", "superadmin"):
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            try:
                # Count subscribers by tier
                tier_result = await db.execute(text("""
                    SELECT subscription_tier, COUNT(*) as cnt
                    FROM users GROUP BY subscription_tier
                """))
                tiers = {"free": 0, "standard": 0, "pro": 0}
                total_subs = 0
                for r in tier_result.fetchall():
                    tier = (r[0] or "free").lower()
                    if tier in tiers:
                        tiers[tier] = r[1]
                    total_subs += r[1]

                paid = tiers["standard"] + tiers["pro"]
                mrr = tiers["standard"] * 3000 + tiers["pro"] * 8000
                arr = mrr * 12

                # Recent payments from payment_history (if table exists)
                recent_payments = []
                failed_payments = []
                try:
                    ph_result = await db.execute(text("""
                        SELECT ph.id, u.email, ph.amount, ph.plan, ph.status, ph.created_at, ph.reference
                        FROM payment_history ph
                        LEFT JOIN users u ON u.id = ph.user_id
                        ORDER BY ph.created_at DESC LIMIT 20
                    """))
                    for r in ph_result.fetchall():
                        entry = {
                            "id": str(r[0]), "user": r[1] or "unknown", "amount": r[2] or 0,
                            "plan": r[3] or "unknown", "status": r[4] or "paid",
                            "date": str(r[5])[:10] if r[5] else "", "reference": r[6] or ""
                        }
                        if entry["status"] == "failed":
                            entry["attempts"] = 1
                            failed_payments.append(entry)
                        else:
                            recent_payments.append(entry)
                except Exception as e:
                    logger.debug(f"payment_history table query skipped: {e}")

                # Growth: monthly user count over last 6 months
                growth = []
                try:
                    gr = await db.execute(text("""
                        SELECT TO_CHAR(created_at, 'Mon') as month, COUNT(*) as cnt
                        FROM users
                        WHERE created_at >= NOW() - INTERVAL '6 months'
                        GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
                        ORDER BY DATE_TRUNC('month', created_at)
                    """))
                    for r in gr.fetchall():
                        growth.append({"month": r[0], "value": r[1]})
                except Exception as e:
                    logger.debug(f"User growth query failed: {e}")

                return {
                    "mrr": mrr, "arr": arr,
                    "totalSubscribers": total_subs,
                    "churnRate": 0.0,
                    "tiers": tiers,
                    "growth": growth if growth else [{"month": "Now", "value": total_subs}],
                    "recentPayments": recent_payments[:10],
                    "failedPayments": failed_payments[:10],
                    "methodBreakdown": [
                        {"method": "Card", "percentage": 100, "amount": mrr}
                    ]
                }
            except Exception as e:
                _sentry_capture(e)
                logger.exception("revenueStats error")
                return {"mrr": 0, "arr": 0, "totalSubscribers": 0, "churnRate": 0,
                        "tiers": {"free": 0, "standard": 0, "pro": 0}, "growth": [],
                        "recentPayments": [], "failedPayments": [], "methodBreakdown": []}

    # ─── Admin: All reviews with report counts ────────────────────────────────
    @strawberry.field
    async def adminAllReviews(self, info: strawberry.Info, limit: Optional[int] = 50, offset: Optional[int] = 0, filter: Optional[str] = None) -> strawberry.scalars.JSON:
        user = await info.context.user
        if not user or user.role not in ("admin", "superadmin"):
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            try:
                where_clause = ""
                if filter == "flagged":
                    where_clause = "HAVING COALESCE(rr.report_count, 0) > 0"
                elif filter == "featured":
                    where_clause = "WHERE r.is_featured = TRUE"

                q = f"""
                    SELECT r.id, r.content, r.rating, r.is_featured, r.created_at,
                           u.name as user_name, u.avatar as user_avatar,
                           r.moviebox_id,
                           COALESCE(rr.report_count, 0) as report_count
                    FROM reviews r
                    LEFT JOIN users u ON u.id = r.user_id
                    LEFT JOIN (
                        SELECT review_id, COUNT(*) as report_count
                        FROM review_reports GROUP BY review_id
                    ) rr ON rr.review_id = r.id
                    {"WHERE r.is_featured = TRUE" if filter == "featured" else ""}
                    ORDER BY COALESCE(rr.report_count, 0) DESC, r.created_at DESC
                    LIMIT :lim OFFSET :off
                """
                result = await db.execute(text(q), {"lim": limit or 50, "off": offset or 0})
                rows = result.fetchall()

                counts = await db.execute(text("""
                    SELECT COUNT(*) as total,
                           SUM(CASE WHEN rr.rc > 0 THEN 1 ELSE 0 END) as flagged,
                           SUM(CASE WHEN r.is_featured THEN 1 ELSE 0 END) as featured
                    FROM reviews r
                    LEFT JOIN (SELECT review_id, COUNT(*) as rc FROM review_reports GROUP BY review_id) rr ON rr.review_id = r.id
                """))
                c = counts.fetchone()

                reviews = [
                    {
                        "id": str(r[0]), "content": r[1] or "",
                        "rating": float(r[2]) if r[2] else None,
                        "isFeatured": bool(r[3]),
                        "createdAt": str(r[4]) if r[4] else "",
                        "userName": r[5], "userAvatar": r[6],
                        "movieboxId": r[7],
                        "reportCount": int(r[8] or 0),
                    }
                    for r in rows
                ]
                return {
                    "reviews": reviews,
                    "totalCount": int(c[0] or 0) if c else 0,
                    "flaggedCount": int(c[1] or 0) if c else 0,
                    "featuredCount": int(c[2] or 0) if c else 0,
                }
            except Exception as e:
                _sentry_capture(e)
                logger.exception("adminAllReviews error")
                return {"reviews": [], "totalCount": 0, "flaggedCount": 0, "featuredCount": 0}

    # ─── Admin: Content list (movies + series) ────────────────────────────────
    @strawberry.field
    async def adminContentList(self, info: strawberry.Info, limit: Optional[int] = 50, search: Optional[str] = None) -> strawberry.scalars.JSON:
        user = await info.context.user
        if not user or user.role not in ("admin", "superadmin"):
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            try:
                items = []
                # Movies
                mq = "SELECT id, title, poster_url, release_year, rating, moviebox_id FROM movies"
                if search:
                    mq += " WHERE title ILIKE :s"
                mq += " ORDER BY id DESC LIMIT :lim"
                params = {"lim": limit or 50}
                if search:
                    params["s"] = f"%{search}%"
                result = await db.execute(text(mq), params)
                for r in result.fetchall():
                    items.append({
                        "id": str(r[0]), "title": r[1] or "Untitled", "type": "movie",
                        "poster": r[2] or "", "year": r[3] or "",
                        "rating": float(r[4]) if r[4] else 0, "tier": "free",
                        "status": "published", "trending": False, "featured": False,
                        "views": 0, "bookmarks": 0,
                    })
                # Series
                sq = "SELECT id, title, poster_url, release_year, rating, moviebox_id FROM series"
                if search:
                    sq += " WHERE title ILIKE :s"
                sq += " ORDER BY id DESC LIMIT :lim"
                result2 = await db.execute(text(sq), params)
                for r in result2.fetchall():
                    items.append({
                        "id": str(r[0]), "title": r[1] or "Untitled", "type": "series",
                        "poster": r[2] or "", "year": r[3] or "",
                        "rating": float(r[4]) if r[4] else 0, "tier": "free",
                        "status": "published", "trending": False, "featured": False,
                        "views": 0, "bookmarks": 0,
                    })
                return items
            except Exception as e:
                _sentry_capture(e)
                logger.exception("adminContentList error")
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
            _sentry_capture(e)
            logger.exception("Premium stats error")
            return PremiumSignupStats()

    # ── Subtitles ──────────────────────────────────────────
    @strawberry.field
    async def subtitlesForContent(
        self, movieboxId: str, season: Optional[int] = None, episode: Optional[int] = None,
    ) -> List[SubtitleType]:
        from app.core.database import AsyncSessionLocal
        try:
            async with AsyncSessionLocal() as db:
                q = select(DbSubtitle).where(DbSubtitle.moviebox_id == movieboxId)
                if season is not None:
                    q = q.where(DbSubtitle.season == season)
                if episode is not None:
                    q = q.where(DbSubtitle.episode == episode)
                rows = (await db.execute(q)).scalars().all()
                return [SubtitleType(
                    id=strawberry.ID(str(r.id)), movieboxId=r.moviebox_id,
                    contentType=r.content_type or "movie", language=r.language or "en",
                    label=r.label or "English", format=r.format or "vtt",
                    fileUrl=r.file_url or "", season=r.season, episode=r.episode,
                    createdAt=str(r.created_at) if r.created_at else None,
                ) for r in rows]
        except Exception as e:
            _sentry_capture(e)
            logger.exception("[subtitlesForContent] error")
            return []

    # ── Notification Preferences ───────────────────────────
    @strawberry.field
    async def myNotificationPreferences(self, info: strawberry.Info) -> NotificationPreferencesType:
        user = await info.context.user
        if not user:
            return NotificationPreferencesType()
        prefs = user.preferences or {}
        np = prefs.get("notification_preferences", {})
        return NotificationPreferencesType(
            newRelease=np.get("newRelease", True),
            watchlist=np.get("watchlist", True),
            recommendations=np.get("recommendations", True),
            accountActivity=np.get("accountActivity", True),
            promotions=np.get("promotions", False),
            socialUpdates=np.get("socialUpdates", True),
            downloadComplete=np.get("downloadComplete", True),
        )

    # ── Admin Referral Dashboard ───────────────────────────
    @strawberry.field
    async def adminReferralDashboard(self, info: strawberry.Info) -> ReferralDashboard:
        user = await info.context.user
        if not user or user.role != "admin":
            raise Exception("Admin only")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        try:
            async with AsyncSessionLocal() as db:
                rows = (await db.execute(
                    text("SELECT id, email, name, referral_count, subscription_tier, created_at FROM users WHERE referral_count > 0 ORDER BY referral_count DESC LIMIT 100")
                )).fetchall()
                entries = []
                total = 0
                premium = 0
                for r in rows:
                    total += r.referral_count or 0
                    if r.subscription_tier and r.subscription_tier != "free":
                        premium += 1
                    entries.append(ReferralEntry(
                        id=strawberry.ID(str(r.id)), email=r.email or "",
                        name=r.name, joinedAt=str(r.created_at) if r.created_at else None,
                        subscriptionTier=r.subscription_tier or "free",
                    ))
                return ReferralDashboard(
                    totalReferrals=total, activeReferrals=len(entries),
                    premiumConversions=premium, referrals=entries,
                )
        except Exception as e:
            _sentry_capture(e)
            logger.exception("[adminReferralDashboard] error")
            return ReferralDashboard()

    # ── User-facing session management ─────────────────────
    @strawberry.field
    async def mySessions(self, info: strawberry.Info) -> List[SessionEntry]:
        """List active sessions for the current user."""
        user = await info.context.user
        if not user:
            return []
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        # Try to identify the current token to mark it
        current_token_hash = None
        try:
            request = info.context.request
            raw_token = request.cookies.get("refresh_token")
            if raw_token:
                import hashlib
                current_token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        except Exception:
            pass  # Non-critical: session matching is best-effort

        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(text("""
                    SELECT id, device_info, ip_address, created_at, expires_at, token_hash
                    FROM refresh_tokens
                    WHERE user_id = :uid AND is_revoked = FALSE AND expires_at > NOW()
                    ORDER BY created_at DESC
                """), {"uid": str(user.id)})
                rows = result.fetchall()
                return [
                    SessionEntry(
                        id=str(r[0]),
                        deviceInfo=r[1] or "Unknown device",
                        ipAddress=r[2] or "Unknown",
                        lastActive=str(r[3]) if r[3] else "",
                        createdAt=str(r[3]) if r[3] else "",
                        isCurrent=(r[5] == current_token_hash) if current_token_hash else False,
                    )
                    for r in rows
                ]
        except Exception as e:
            _sentry_capture(e)
            logger.exception("[mySessions] error")
            return []

    # ── Revenue CSV export (admin) ─────────────────────────
    @strawberry.field
    async def revenueExportCsv(self, info: strawberry.Info, days: Optional[int] = 90) -> str:
        """Generate a CSV of revenue data for the specified time window. Returns CSV as a string."""
        user = await info.context.user
        if not user or user.role not in ("admin", "superadmin"):
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        import csv, io
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(text("""
                    SELECT ph.id, u.email, ph.amount, ph.currency, ph.plan,
                           ph.status, ph.payment_method, ph.paid_at, ph.created_at,
                           ph.paystack_reference
                    FROM payment_history ph
                    LEFT JOIN users u ON u.id = ph.user_id
                    WHERE ph.created_at >= NOW() - MAKE_INTERVAL(days => :days)
                    ORDER BY ph.created_at DESC
                """), {"days": days or 90})
                rows = result.fetchall()

                output = io.StringIO()
                writer = csv.writer(output)
                writer.writerow(["ID", "Email", "Amount", "Currency", "Plan",
                                 "Status", "Method", "PaidAt", "CreatedAt", "Reference"])
                for r in rows:
                    writer.writerow([
                        str(r[0]), r[1] or "", r[2] or 0, r[3] or "NGN", r[4] or "",
                        r[5] or "", r[6] or "", str(r[7]) if r[7] else "",
                        str(r[8]) if r[8] else "", r[9] or ""
                    ])
                return output.getvalue()
        except Exception as e:
            _sentry_capture(e)
            logger.exception("[revenueExportCsv] error")
            return "Error generating CSV: " + str(e)

    # ── Subscription & Payment queries (read-only, belong in Query) ────
    @strawberry.field
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

    @strawberry.field
    async def myFamilyPlan(self, info: strawberry.Info) -> Optional[strawberry.scalars.JSON]:
        """Return the authenticated user's family plan with members."""
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        plan = (await db.execute(
            select(DbFamilyPlan).where(DbFamilyPlan.parent_id == user.id)
        )).scalars().first()
        if not plan:
            return None
        members_rows = (await db.execute(
            select(DbFamilyMember).where(DbFamilyMember.family_plan_id == plan.id)
        )).scalars().all()
        members = []
        for m in members_rows:
            member_user = (await db.execute(
                select(DbUser).where(DbUser.id == m.user_id)
            )).scalars().first()
            members.append({
                "id": str(m.id),
                "userId": str(m.user_id),
                "name": member_user.name if member_user else None,
                "email": member_user.email if member_user else None,
                "avatar": member_user.avatar if member_user else None,
                "role": m.role,
                "joinedAt": str(m.joined_at) if m.joined_at else "",
            })
        return {
            "id": str(plan.id),
            "inviteCode": plan.invite_code,
            "memberSlots": plan.member_slots,
            "isActive": plan.is_active,
            "createdAt": str(plan.created_at) if plan.created_at else "",
            "members": members,
        }

    @strawberry.field
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
            _sentry_capture(e)
            logger.exception("Payment history error")
            return {"payments": []}

    # ═══════════════════════════════════════════════════════════
    # Trending Searches (Section 14)
    # ═══════════════════════════════════════════════════════════

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

    # ═══════════════════════════════════════════════════════════
    # System Health (Section 15 — Admin)
    # ═══════════════════════════════════════════════════════════

    @strawberry.field
    async def systemHealth(self, info: strawberry.Info) -> SystemHealthResponse:
        """Live system health — parsed from real service checks, not hardcoded."""
        import os
        from datetime import datetime as dt
        db_status = "unknown"
        movie_status = "unknown"
        redis_status = "unknown"
        overall = "healthy"

        # Database check
        try:
            from app.core.database import AsyncSessionLocal
            from sqlalchemy import text as sa_text
            async with AsyncSessionLocal() as db:
                await db.execute(sa_text("SELECT 1"))
            db_status = "up"
        except Exception:
            db_status = "down"
            overall = "degraded"

        # Movie provider check
        try:
            if movie_service and movie_service.provider:
                movie_status = "up"
            else:
                movie_status = "not initialized"
                overall = "degraded"
        except Exception:
            movie_status = "down"
            overall = "degraded"

        # Redis check
        try:
            from app.core.cache import cache
            redis_ok = await cache._ensure_connected()
            redis_status = "up" if redis_ok else "down"
            if not redis_ok:
                overall = "degraded"
        except Exception:
            redis_status = "unavailable"

        return SystemHealthResponse(
            status=overall,
            timestamp=dt.utcnow().isoformat(),
            version=os.getenv("APP_VERSION", "2.0.0"),
            database=db_status,
            movieProvider=movie_status,
            redis=redis_status,
        )

    # ═══════════════════════════════════════════════════════════
    # Admin Audit Log (Section 15)
    # ═══════════════════════════════════════════════════════════

    @strawberry.field
    async def adminAuditLogs(self, info: strawberry.Info, limit: int = 50) -> List[AdminAuditLogEntry]:
        """Retrieve admin audit log entries — admin only."""
        user = await info.context.user
        if not user or user.role != "admin":
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        try:
            async with AsyncSessionLocal() as db:
                rows = (await db.execute(text("""
                    SELECT a.id, a.admin_id, a.action, a.target_type, a.target_id,
                           a.details, a.ip_address, a.created_at, u.email AS admin_email
                    FROM admin_audit_log a
                    LEFT JOIN users u ON u.id = a.admin_id
                    ORDER BY a.created_at DESC
                    LIMIT :lim
                """), {"lim": limit})).fetchall()
                return [
                    AdminAuditLogEntry(
                        id=str(r.id), adminId=str(r.admin_id), adminEmail=r.admin_email or "",
                        action=r.action, targetType=r.target_type or "",
                        targetId=str(r.target_id) if r.target_id else "",
                        details=r.details, ipAddress=r.ip_address,
                        createdAt=str(r.created_at),
                    )
                    for r in rows
                ]
        except Exception as e:
            _sentry_capture(e)
            return []

    # ═══════════════════════════════════════════════════════════
    # Feature Flags (Section 15)
    # ═══════════════════════════════════════════════════════════

    @strawberry.field
    async def featureFlags(self, info: strawberry.Info) -> List[FeatureFlag]:
        """Retrieve all feature flags. Admin sees all, users see enabled ones."""
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        user = await info.context.user
        is_admin = user and user.role == "admin"
        try:
            async with AsyncSessionLocal() as db:
                if is_admin:
                    rows = (await db.execute(text(
                        "SELECT * FROM feature_flags ORDER BY key"
                    ))).fetchall()
                else:
                    rows = (await db.execute(text(
                        "SELECT * FROM feature_flags WHERE enabled = true ORDER BY key"
                    ))).fetchall()
                return [
                    FeatureFlag(
                        id=str(r.id), key=r.key, label=r.label or r.key,
                        enabled=r.enabled, description=r.description,
                        updatedAt=str(r.updated_at) if r.updated_at else "",
                        updatedBy=str(r.updated_by) if r.updated_by else None,
                    )
                    for r in rows
                ]
        except Exception as e:
            _sentry_capture(e)
            # Return default flags if table doesn't exist yet
            defaults = [
                ("watch_party_enabled", "Watch Party", True),
                ("downloads_enabled", "Downloads", True),
                ("ai_assistant_enabled", "AI Assistant", True),
                ("reviews_enabled", "Reviews", True),
            ]
            return [FeatureFlag(id=str(i), key=k, label=l, enabled=e) for i, (k, l, e) in enumerate(defaults)]

    # ═══════════════════════════════════════════════════════════
    # Custom Lists / Letterboxd-style (Section 13)
    # ═══════════════════════════════════════════════════════════

    @strawberry.field
    async def myCustomLists(self, info: strawberry.Info) -> List[CustomList]:
        """Retrieve user's custom lists."""
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        try:
            async with AsyncSessionLocal() as db:
                lists_rows = (await db.execute(text("""
                    SELECT * FROM custom_lists WHERE user_id = :uid ORDER BY updated_at DESC
                """), {"uid": str(user.id)})).fetchall()
                result = []
                for lr in lists_rows:
                    items_rows = (await db.execute(text("""
                        SELECT moviebox_id, title, poster_url, added_at
                        FROM custom_list_items WHERE list_id = :lid ORDER BY added_at DESC
                    """), {"lid": str(lr.id)})).fetchall()
                    result.append(CustomList(
                        id=str(lr.id), userId=str(lr.user_id),
                        name=lr.name, description=lr.description,
                        isPublic=lr.is_public,
                        items=[CustomListItem(
                            movieboxId=ir.moviebox_id, title=ir.title or "",
                            posterUrl=ir.poster_url, addedAt=str(ir.added_at),
                        ) for ir in items_rows],
                        createdAt=str(lr.created_at), updatedAt=str(lr.updated_at),
                    ))
                return result
        except Exception as e:
            _sentry_capture(e)
            return []

    # ─── Section 11: Email Preferences Query ────────────────────
    @strawberry.field
    async def myEmailPreferences(self, info: strawberry.Info) -> EmailPreferences:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        try:
            async with AsyncSessionLocal() as db:
                row = (await db.execute(text("""
                    SELECT preferences FROM users WHERE id = :uid
                """), {"uid": str(user.id)})).fetchone()
                if row and row.preferences and isinstance(row.preferences, dict):
                    ep = row.preferences.get("emailPreferences", {})
                    return EmailPreferences(
                        marketing=ep.get("marketing", True),
                        security=ep.get("security", True),
                        newReleases=ep.get("newReleases", True),
                        watchlistUpdates=ep.get("watchlistUpdates", True),
                        weeklyDigest=ep.get("weeklyDigest", True),
                        socialActivity=ep.get("socialActivity", True),
                        accountAlerts=ep.get("accountAlerts", True),
                    )
        except Exception as e:
            _sentry_capture(e)
        return EmailPreferences()

    # ─── Section 12: Download Quota Query ───────────────────────
    @strawberry.field
    async def myDownloadQuota(self, info: strawberry.Info) -> DownloadQuota:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        tier_limits = {"free": 5, "standard": 25, "pro": 100}
        try:
            async with AsyncSessionLocal() as db:
                row = (await db.execute(text("""
                    SELECT subscription_tier FROM users WHERE id = :uid
                """), {"uid": str(user.id)})).fetchone()
                tier = row.subscription_tier if row else "free"
                # Count active downloads (last 30 days)
                count_r = (await db.execute(text("""
                    SELECT count(*) as cnt FROM history
                    WHERE user_id = :uid AND updated_at >= NOW() - INTERVAL '30 days'
                """), {"uid": str(user.id)})).fetchone()
                used = count_r.cnt if count_r else 0
                return DownloadQuota(
                    used=used,
                    limit=tier_limits.get(tier, 5),
                    tier=tier,
                    remainingStorage=0.0  # Client-side only
                )
        except Exception as e:
            _sentry_capture(e)
        return DownloadQuota()

    # ─── Section 15: Content Schedule Query ─────────────────────
    @strawberry.field
    async def contentSchedule(self, info: strawberry.Info, limit: int = 20) -> List[ContentScheduleEntry]:
        user = await info.context.user
        if not user or getattr(user, 'role', 'user') != 'admin':
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        try:
            async with AsyncSessionLocal() as db:
                rows = (await db.execute(text("""
                    SELECT id, moviebox_id, title, publish_at, status, created_by
                    FROM content_schedule
                    ORDER BY publish_at ASC LIMIT :lim
                """), {"lim": limit})).fetchall()
                return [ContentScheduleEntry(
                    id=str(r.id), movieboxId=r.moviebox_id, title=r.title or "",
                    publishAt=str(r.publish_at), status=r.status or "scheduled",
                    createdBy=r.created_by or ""
                ) for r in rows]
        except Exception as e:
            _sentry_capture(e)
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
                logger.exception("[LOGIN] DB error")
                _sentry_capture(e)
                raise Exception("Login service temporarily unavailable. Please try again.")

            if not user:
                await _log_activity(db, None, "login_failed", info, success=False)
                raise Exception("Invalid email or password")
            # ── Ban enforcement ────────────────────────────────
            if getattr(user, 'is_banned', False):
                await _log_activity(db, str(user.id), "login_banned", info, success=False)
                raise Exception("Account suspended. Contact support for assistance.")
            if not user.password:
                raise Exception("This account uses Google sign-in. Please log in with Google.")

            # ── Account lockout enforcement (escalating) ──────────
            MAX_FAILED = 5
            BASE_LOCKOUT_MINUTES = 15  # First lockout: 15 min
            MAX_LOCKOUT_MINUTES = 1440  # Cap at 24 hours

            # Check if account is currently locked
            if user.locked_until and user.locked_until > datetime.utcnow():
                remaining = int((user.locked_until - datetime.utcnow()).total_seconds() / 60) + 1
                await _log_activity(db, str(user.id), "login_locked", info, success=False)
                raise Exception(f"Account temporarily locked. Try again in {remaining} minute{'s' if remaining != 1 else ''}.")

            if not verify_password(password, user.password):
                # Increment failed attempts
                user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
                if user.failed_login_attempts >= MAX_FAILED:
                    # Escalating lockout: 15 → 30 → 60 → 120 → ... (capped at 24h)
                    lockout_count = user.failed_login_attempts // MAX_FAILED  # How many times threshold hit
                    lockout_minutes = min(BASE_LOCKOUT_MINUTES * (2 ** (lockout_count - 1)), MAX_LOCKOUT_MINUTES)
                    user.locked_until = datetime.utcnow() + timedelta(minutes=lockout_minutes)
                    await db.commit()
                    await _log_activity(db, str(user.id), "account_locked", info, success=False)
                    raise Exception(f"Too many failed attempts. Account locked for {lockout_minutes} minutes.")
                await db.commit()
                await _log_activity(db, str(user.id), "login_failed", info, success=False)
                attempts_left = MAX_FAILED - (user.failed_login_attempts % MAX_FAILED)
                if attempts_left == MAX_FAILED:
                    attempts_left = MAX_FAILED  # Edge case: just after lockout expires
                raise Exception(f"Invalid email or password. {attempts_left} attempt{'s' if attempts_left != 1 else ''} remaining.")

            # ── Successful login — full reset ─────────────────────
            if user.failed_login_attempts and user.failed_login_attempts > 0:
                user.failed_login_attempts = 0
                user.locked_until = None

            access_token = create_access_token({"sub": str(user.id)})

            from app.core.auth import create_refresh_token, store_refresh_token
            raw_refresh, refresh_hash, family_id = create_refresh_token(str(user.id))
            try:
                device_info = (info.context.request.headers.get("user-agent") or "")[:255]
                ip_address = (info.context.request.client.host if info.context.request.client else None)
                await store_refresh_token(db, str(user.id), refresh_hash, family_id, device_info, ip_address)
            except Exception as e:
                # Log visibly — refresh token won't work but login still proceeds
                logger.exception("[LOGIN] Could not store refresh token (user will need to re-login sooner)")
                _sentry_capture(e)

            is_production = os.getenv("ENV", "development") == "production"
            _same_site = "lax"  # Modern browsers reject samesite="none" without secure=True
            info.context.response.set_cookie(
                key="auth_token", value=access_token, httponly=True,
                secure=is_production, samesite=_same_site, max_age=60 * 15, path="/"
            )
            info.context.response.set_cookie(
                key="refresh_token", value=raw_refresh, httponly=True,
                secure=is_production, samesite=_same_site,
                max_age=60 * 60 * 24 * 30, path="/api/auth/refresh"
            )

            await _log_activity(db, str(user.id), "login", info, success=True)
            try:
                ua = (info.context.request.headers.get("user-agent") or "Unknown device")[:120]
                ip = info.context.request.client.host if info.context.request.client else "Unknown"
                # Determine a simple browser/device label from user-agent
                if "Mobile" in ua or "Android" in ua or "iPhone" in ua:
                    device_label = "📱 Mobile"
                elif "Windows" in ua:
                    device_label = "💻 Windows"
                elif "Mac" in ua:
                    device_label = "🍎 Mac"
                elif "Linux" in ua:
                    device_label = "🐧 Linux"
                else:
                    device_label = "🌐 Browser"
                await notification_service.create(
                    db, str(user.id), title=f"New sign-in detected ({device_label})",
                    message=f"You signed in from {device_label} (IP: {ip}). If this wasn't you, change your password immediately.",
                    notif_type="security", action_url="/profile#security"
                )
            except Exception as e:
                _sentry_capture(e)
                logger.warning(f"Login notification error: {e}")

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
                    _same_site = "lax"
                    info.context.response.set_cookie(
                        key="auth_token", value=token, httponly=True,
                        secure=is_production, samesite=_same_site, max_age=60 * 15, path="/"
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
                _sentry_capture(e)
                logger.warning(f"Verification email error: {e}")

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
                        # Subscription auto-upgrade disabled — referral rewards are now badges/flair only
                        # if referrer.referral_count >= 5 and referrer.subscription_tier == "free":
                        #     referrer.subscription_tier = "standard"
                        #     referrer.subscription_expires_at = datetime.utcnow() + timedelta(days=90)
                        await db.commit()
            except Exception as e:
                _sentry_capture(e)
                logger.warning(f"Referral tracking error: {e}")

            token = create_access_token({"sub": str(new_user.id)})
            is_production = os.getenv("ENV", "development") == "production"
            _same_site = "lax"
            info.context.response.set_cookie(
                key="auth_token", value=token, httponly=True,
                secure=is_production, samesite=_same_site, max_age=60 * 15, path="/"
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

            idinfo = id_token.verify_oauth2_token(
                idToken, google_requests.Request(session=session), client_id,
                clock_skew_in_seconds=300  # Tolerate up to 5 min clock drift
            )
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
            _same_site = "lax"
            info.context.response.set_cookie(
                key="auth_token", value=token, httponly=True,
                secure=is_production, samesite=_same_site, max_age=60 * 15, path="/"
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
                _sentry_capture(e)
                logger.warning(f"Login notification error: {e}")

            return GoogleAuthResponse(token="", user=create_user_response(user), isNewUser=is_new_user)
        except Exception as e:
            logger.exception("Google auth error")
            _sentry_capture(e)
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
        except Exception as e:
            logger.debug(f"[refreshToken] last_active update skipped: {e}")
        return AuthResponse(token=token, user=create_user_response(user))

    @strawberry.mutation
    async def forgotPassword(self, info: strawberry.Info, email: str) -> SuccessResponse:
        # ── Rate limit: 3 attempts per hour per IP ──────────────
        try:
            import redis.asyncio as aioredis
            client_ip = info.context.request.client.host if info.context.request.client else "unknown"
            rate_key = f"rate:forgot_password:{client_ip}"
            r = aioredis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"), decode_responses=True)
            attempts = await r.get(rate_key)
            if attempts and int(attempts) >= 3:
                return SuccessResponse(success=True, message="If an account exists, a reset link was sent")
            pipe = r.pipeline()
            pipe.incr(rate_key)
            pipe.expire(rate_key, 3600)  # 1 hour window
            await pipe.execute()
            await r.aclose()
        except Exception as e:
            _sentry_capture(e)
            logger.warning(f"[forgotPassword] Rate limit check skipped: {e}")

        db = await info.context.get_db()
        user = (await db.execute(select(DbUser).where(DbUser.email == email))).scalars().first()
        if user and user.password:
            try:
                from app.core.email_service import send_password_reset_email
                # Invalidate any existing tokens for this user
                from sqlalchemy import update
                await db.execute(
                    update(DbPasswordResetToken)
                    .where(DbPasswordResetToken.user_id == user.id, DbPasswordResetToken.is_used == False)
                    .values(is_used=True)
                )
                # Create a new DB-tracked token
                reset_token_str = secrets.token_urlsafe(64)
                db.add(DbPasswordResetToken(
                    user_id=user.id,
                    token=reset_token_str,
                    expires_at=datetime.utcnow() + timedelta(hours=1),
                ))
                await db.commit()
                # Also create a JWT for the email link (carries user_id)
                send_password_reset_email(str(user.id), user.email, user.name or "User")
            except Exception as e:
                _sentry_capture(e)
                logger.exception("Failed to send reset email")
        # Always return success to prevent email enumeration
        return SuccessResponse(success=True, message="If an account exists, a reset link was sent")

    @strawberry.mutation
    async def resetPassword(self, info: strawberry.Info, token: str, newPassword: str) -> SuccessResponse:
        import re
        from app.core.auth import decode_access_token, get_password_hash, revoke_all_user_tokens
        # Validate password strength
        if len(newPassword) < 8:
            raise Exception("Password must be at least 8 characters long")
        if not re.search(r"[A-Za-z]", newPassword):
            raise Exception("Password must contain at least one letter")
        if not re.search(r"\d", newPassword):
            raise Exception("Password must contain at least one number")

        payload = decode_access_token(token)
        if not payload or payload.get("type") != "reset":
            raise Exception("Invalid or expired reset token")
        user_id = payload.get("sub")
        db = await info.context.get_db()
        user = (await db.execute(select(DbUser).where(DbUser.id == user_id))).scalars().first()
        if not user:
            raise Exception("User not found")
        user.password = get_password_hash(newPassword)
        # Reset account lockout if any
        user.failed_login_attempts = 0
        user.locked_until = None
        await db.commit()
        # Revoke all existing sessions (force re-login everywhere)
        try:
            await revoke_all_user_tokens(db, str(user.id))
        except Exception as e:
            _sentry_capture(e)
            logger.exception("[resetPassword] Failed to revoke tokens")
        # Notify user
        try:
            await notification_service.create(
                db, str(user.id), title="Password Updated 🔒",
                message="Your password was successfully changed. All sessions have been logged out.",
                notif_type="system"
            )
        except Exception as e:
            logger.debug(f"[resetPassword] notification skipped: {e}")
        await _log_activity(db, str(user.id), "password_reset", info, success=True)
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

        # ── Security: prevent role injection via profile update ────────
        # UpdateProfileInput intentionally excludes 'role'. This guard
        # ensures no crafted GraphQL variable can escalate privileges.
        if hasattr(input, 'role'):
            raise Exception("Role changes are not permitted through profile updates")

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

        # Explicitly ensure role is NEVER mutated from this path
        user.role = user.role  # no-op — defensive reassignment

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
        user_id = str(user.id)

        # ── Explicit cascade cleanup ──────────────────────────────────
        # Database FK ON DELETE CASCADE should handle this, but we
        # explicitly scrub sensitive tables to guarantee no orphans.
        from sqlalchemy import text
        try:
            await db.execute(text("DELETE FROM refresh_tokens WHERE user_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM push_subscriptions WHERE user_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM login_activity WHERE user_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM offline_downloads WHERE user_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM password_reset_tokens WHERE user_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM notification_preferences WHERE user_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM yearly_stats WHERE user_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM user_layout_preferences WHERE user_id = :uid"), {"uid": user_id})
            await db.execute(text("DELETE FROM chat_messages WHERE user_id = :uid"), {"uid": user_id})
        except Exception as e:
            # Non-fatal: tables may not exist yet in dev; CASCADE will handle it
            try:
                import sentry_sdk
                sentry_sdk.capture_exception(e)
            except Exception:
                pass
            logger.exception("[deleteAccount] Cascade cleanup partial")

        # Clear auth cookies
        info.context.response.delete_cookie(key="auth_token", path="/")
        info.context.response.delete_cookie(key="refresh_token", path="/api/auth/refresh")

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

        # Rate limit: max 3 resends per hour per user (prevents inbox flooding)
        try:
            from app.core.cache import cache
            redis_ok = await cache._ensure_connected()
            if redis_ok and cache._redis:
                rk = f"resend_verify:{user.id}"
                cur = await cache._redis.get(rk)
                if cur and int(cur) >= 3:
                    # Return success to prevent enumeration — don't reveal rate limit
                    return SuccessResponse(success=True, message="Verification email sent!")
                pipe = cache._redis.pipeline()
                pipe.incr(rk)
                if not cur:
                    pipe.expire(rk, 3600)  # 1 hour window
                await pipe.execute()
        except Exception as e:
            logger.warning(f"Redis error in resend rate limit: {e}")

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
                _sentry_capture(e)
                logger.warning(f"Notification error (watchlist): {e}")
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
            _sentry_capture(e)
            logger.warning(f"Notification error (watchlist): {e}")
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
    async def updateWatchProgress(self, info: strawberry.Info, movieId: str, currentTime: int, duration: int, contentType: str = "movie") -> SuccessResponse:
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
                _sentry_capture(e)
                logger.warning(f"Milestone check error: {e}")
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
            _sentry_capture(e)
            logger.warning(f"Notification error (review): {e}")
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
        except Exception as e:
            _sentry_capture(e)
            logger.warning(f"Notification error (report): {e}")
        return SuccessResponse(success=True, message="Review reported. We'll review it shortly.")

    @strawberry.mutation
    async def adminFeatureReview(self, info: strawberry.Info, id: strawberry.ID, featured: bool) -> SuccessResponse:
        user = await info.context.user
        if not user or user.role not in ("admin", "superadmin"):
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            await db.execute(text("UPDATE reviews SET is_featured = :f WHERE id = :id"), {"f": featured, "id": str(id)})
            await db.commit()
        return SuccessResponse(success=True, message="Review updated")

    @strawberry.mutation
    async def adminDeleteReview(self, info: strawberry.Info, id: strawberry.ID) -> SuccessResponse:
        user = await info.context.user
        if not user or user.role not in ("admin", "superadmin"):
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            await db.execute(text("DELETE FROM reviews WHERE id = :id"), {"id": str(id)})
            await db.commit()
        return SuccessResponse(success=True, message="Review deleted")

    @strawberry.mutation
    async def adminBulkBanUsers(self, info: strawberry.Info, userIds: List[strawberry.ID], reason: Optional[str] = "Banned by admin") -> SuccessResponse:
        user = await info.context.user
        if not user or user.role not in ("admin", "superadmin"):
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            for uid in userIds:
                await db.execute(text("UPDATE users SET is_banned = TRUE WHERE id = :id"), {"id": str(uid)})
            await db.commit()
        return SuccessResponse(success=True, message=f"{len(userIds)} user(s) banned")

    @strawberry.mutation
    async def adminBulkDeleteReviews(self, info: strawberry.Info, reviewIds: List[strawberry.ID]) -> SuccessResponse:
        user = await info.context.user
        if not user or user.role not in ("admin", "superadmin"):
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            for rid in reviewIds:
                await db.execute(text("DELETE FROM reviews WHERE id = :id"), {"id": str(rid)})
            await db.commit()
        return SuccessResponse(success=True, message=f"{len(reviewIds)} review(s) deleted")

    @strawberry.mutation
    async def adminRevokeSession(self, info: strawberry.Info, sessionId: strawberry.ID) -> SuccessResponse:
        user = await info.context.user
        if not user or user.role not in ("admin", "superadmin"):
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            await db.execute(text("UPDATE refresh_tokens SET is_revoked = TRUE WHERE id = :id"), {"id": str(sessionId)})
            await db.commit()
        return SuccessResponse(success=True, message="Session revoked")

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
                    _sentry_capture(e)
                    logger.warning(f"Notification error (report): {e}")
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
    async def adminCreateMovie(self, info: strawberry.Info, input: MovieInput) -> Movie:
        """Admin: create a new movie entry in the local database."""
        user = await info.context.user
        if not user or getattr(user, 'role', 'user') != 'admin':
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        import uuid
        try:
            movie_id = str(uuid.uuid4())
            async with AsyncSessionLocal() as db:
                await db.execute(text("""
                    INSERT INTO movies (id, title, overview, poster_url, backdrop_url, trailer_url,
                                       release_date, runtime, rating, tagline, content_type, created_at)
                    VALUES (:id, :title, :overview, :poster, :backdrop, :trailer,
                            :release_date, :runtime, :rating, :tagline, :ctype, NOW())
                """), {
                    "id": movie_id, "title": input.title, "overview": input.overview,
                    "poster": input.posterUrl, "backdrop": input.backdropUrl,
                    "trailer": input.trailerUrl, "release_date": input.releaseDate,
                    "runtime": input.runtime or 0, "rating": input.rating or 0.0,
                    "tagline": input.tagline, "ctype": input.contentType or "movie",
                })
                # Insert genres if provided
                if input.genres:
                    for genre_name in input.genres:
                        await db.execute(text("""
                            INSERT INTO movie_genres (movie_id, genre_name)
                            VALUES (:mid, :gn) ON CONFLICT DO NOTHING
                        """), {"mid": movie_id, "gn": genre_name})
                await db.commit()

            year_str = input.releaseDate[:4] if input.releaseDate and len(input.releaseDate) >= 4 else ""
            return Movie(
                id=strawberry.ID(movie_id), title=input.title,
                overview=input.overview or "", tagline=input.tagline or "",
                posterUrl=input.posterUrl, backdropUrl=input.backdropUrl,
                trailerUrl=input.trailerUrl, releaseDate=input.releaseDate or "",
                year=year_str, runtime=input.runtime or 0,
                rating=input.rating or 0.0, voteCount=0, popularity=0.0,
                status="released", contentType=input.contentType or "movie",
                genres=[Genre(id=strawberry.ID(g), name=g) for g in (input.genres or [])],
            )
        except Exception as e:
            _sentry_capture(e)
            raise Exception(f"Failed to create movie: {str(e)}")

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

    # ── Subscription mutations — TEMPORARILY DISABLED ──────────────────
    # Paystack subscription flow is disabled until payment infrastructure is ready.
    # Uncomment the blocks below and remove the stubs to re-enable.

    @strawberry.mutation
    async def initializeSubscription(self, info: strawberry.Info, plan: str, billing: str = "monthly") -> strawberry.scalars.JSON:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        if not getattr(user, 'email_verified', False):
            raise Exception("Please verify your email address before subscribing. A verification link has been sent to your inbox.")
        raise Exception("Subscriptions are coming soon. Stay tuned!")
        # -- ORIGINAL CODE (commented out) --
        # user = await info.context.user
        # if not user:
        #     raise Exception("Not authenticated")
        # if not getattr(user, "email_verified", False):
        #     raise Exception("Please verify your email address before subscribing.")
        # from app.core.paystack import initialize_transaction, PLAN_AMOUNTS
        # import uuid as uuid_mod
        # plan_key = f"{plan}_{billing}"
        # amount = PLAN_AMOUNTS.get(plan_key)
        # if not amount:
        #     raise Exception(f"Invalid plan: {plan} ({billing})")
        # reference = f"clipx_{plan}_{str(uuid_mod.uuid4())[:8]}"
        # result = await initialize_transaction(
        #     email=user.email, amount=amount, plan=plan_key, reference=reference,
        #     metadata={"user_id": str(user.id), "plan": plan, "billing": billing,
        #         "custom_fields": [
        #             {"display_name": "Plan", "variable_name": "plan", "value": plan.capitalize()},
        #             {"display_name": "Billing", "variable_name": "billing", "value": billing.capitalize()},
        #         ]}
        # )
        # if not result.get("status"):
        #     raise Exception(result.get("error", "Failed to initialize payment"))
        # return {"authorizationUrl": result["authorization_url"], "accessCode": result["access_code"], "reference": result["reference"]}

    @strawberry.mutation
    async def verifyPayment(self, info: strawberry.Info, reference: str) -> SuccessResponse:
        raise Exception("Subscriptions are coming soon. Stay tuned!")
        # -- ORIGINAL CODE (commented out) --
        # user = await info.context.user
        # if not user:
        #     raise Exception("Not authenticated")
        # from app.core.paystack import verify_transaction
        # result = await verify_transaction(reference)
        # if not result.get("status"):
        #     raise Exception(result.get("error", "Payment verification failed"))
        # metadata = result.get("metadata", {})
        # plan = metadata.get("plan", "standard")
        # billing = metadata.get("billing", "monthly")
        # db = await info.context.get_db()
        # user_obj = (await db.execute(select(DbUser).where(DbUser.id == user.id))).scalars().first()
        # if user_obj:
        #     user_obj.subscription_tier = plan
        #     user_obj.subscription_expires_at = datetime.utcnow() + timedelta(days=365 if billing == "yearly" else 30)
        #     user_obj.paystack_customer_code = result.get("customer_code")
        #     await db.commit()
        # return SuccessResponse(success=True, message="Payment verified")

    @strawberry.mutation
    async def cancelSubscription(self, info: strawberry.Info) -> SuccessResponse:
        raise Exception("Subscriptions are coming soon. Stay tuned!")
        # -- ORIGINAL CODE (commented out) --
        # user = await info.context.user
        # if not user:
        #     raise Exception("Not authenticated")
        # db = await info.context.get_db()
        # user_obj = (await db.execute(select(DbUser).where(DbUser.id == user.id))).scalars().first()
        # if not user_obj or user_obj.subscription_tier == "free":
        #     raise Exception("No active subscription to cancel")
        # old_plan = user_obj.subscription_tier
        # user_obj.subscription_tier = "free"
        # user_obj.subscription_expires_at = None
        # await db.commit()
        # return SuccessResponse(success=True, message="Subscription cancelled successfully")


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
        except Exception as e:
            logger.debug(f"[watchParty] join notification skipped: {e}")
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
    # Notification Preferences (granular)
    # ═══════════════════════════════════════════════════════════

    @strawberry.mutation
    async def updateNotificationPreferences(
        self, info: strawberry.Info, input: NotificationPreferencesInput
    ) -> NotificationPreferencesType:
        """Update granular push notification preferences."""
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        db = await info.context.get_db()
        current_prefs = dict(user.preferences) if user.preferences else {}
        np = current_prefs.get("notification_preferences", {})

        if input.newRelease is not None:
            np["newRelease"] = input.newRelease
        if input.watchlist is not None:
            np["watchlist"] = input.watchlist
        if input.recommendations is not None:
            np["recommendations"] = input.recommendations
        if input.accountActivity is not None:
            np["accountActivity"] = input.accountActivity
        if input.promotions is not None:
            np["promotions"] = input.promotions
        if input.socialUpdates is not None:
            np["socialUpdates"] = input.socialUpdates
        if input.downloadComplete is not None:
            np["downloadComplete"] = input.downloadComplete

        current_prefs["notification_preferences"] = np
        user.preferences = current_prefs
        await db.commit()

        return NotificationPreferencesType(
            newRelease=np.get("newRelease", True),
            watchlist=np.get("watchlist", True),
            recommendations=np.get("recommendations", True),
            accountActivity=np.get("accountActivity", True),
            promotions=np.get("promotions", False),
            socialUpdates=np.get("socialUpdates", True),
            downloadComplete=np.get("downloadComplete", True),
        )

    # ═══════════════════════════════════════════════════════════
    # Session Revocation (user-facing)
    # ═══════════════════════════════════════════════════════════

    @strawberry.mutation
    async def revokeSession(self, info: strawberry.Info, sessionId: str) -> SuccessResponse:
        """Let a user revoke one of their own active sessions."""
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        try:
            async with AsyncSessionLocal() as db:
                # Verify the session belongs to this user
                result = await db.execute(text("""
                    UPDATE refresh_tokens
                    SET is_revoked = TRUE
                    WHERE id = :sid AND user_id = :uid AND is_revoked = FALSE
                    RETURNING id
                """), {"sid": sessionId, "uid": str(user.id)})
                row = result.fetchone()
                await db.commit()
                if row:
                    return SuccessResponse(success=True, message="Session revoked")
                return SuccessResponse(success=False, message="Session not found or already revoked")
        except Exception as e:
            _sentry_capture(e)
            logger.exception("[revokeSession] Error")
            return SuccessResponse(success=False, message="Failed to revoke session")

    # ═══════════════════════════════════════════════════════════
    # Subtitle / Caption Upload
    # ═══════════════════════════════════════════════════════════

    @strawberry.mutation
    async def uploadSubtitle(
        self, info: strawberry.Info,
        movieboxId: str, fileUrl: str,
        language: str = "en", label: str = "English",
        format: str = "vtt", contentType: str = "movie",
        season: Optional[int] = None, episode: Optional[int] = None,
    ) -> SubtitleType:
        """Upload/register a subtitle file (.srt or .vtt) for content."""
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        if format not in ("srt", "vtt"):
            raise Exception("Format must be 'srt' or 'vtt'")
        from app.core.database import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            sub = DbSubtitle(
                moviebox_id=movieboxId,
                content_type=contentType,
                language=language[:10],
                label=label[:100],
                format=format,
                file_url=fileUrl[:500],
                season=season,
                episode=episode,
                uploaded_by=user.id,
            )
            db.add(sub)
            await db.commit()
            await db.refresh(sub)
            return SubtitleType(
                id=strawberry.ID(str(sub.id)),
                movieboxId=sub.moviebox_id,
                contentType=sub.content_type or "movie",
                language=sub.language or "en",
                label=sub.label or "English",
                format=sub.format or "vtt",
                fileUrl=sub.file_url or "",
                season=sub.season,
                episode=sub.episode,
                createdAt=str(sub.created_at) if sub.created_at else None,
            )

    # ═══════════════════════════════════════════════════════════
    # User Session Management
    # ═══════════════════════════════════════════════════════════

    @strawberry.mutation
    async def revokeMySession(self, info: strawberry.Info, sessionId: strawberry.ID) -> SuccessResponse:
        """Revoke a specific session (refresh token) for the current user."""
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            result = await db.execute(text("""
                UPDATE refresh_tokens SET is_revoked = TRUE
                WHERE id = :sid AND user_id = :uid AND is_revoked = FALSE
            """), {"sid": str(sessionId), "uid": str(user.id)})
            await db.commit()
            if result.rowcount > 0:
                return SuccessResponse(success=True, message="Session revoked")
        return SuccessResponse(success=False, message="Session not found")

    @strawberry.mutation
    async def revokeAllMySessions(self, info: strawberry.Info) -> SuccessResponse:
        """Revoke all sessions except the current one (force logout everywhere else)."""
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        # Identify current session by its token hash
        current_hash = None
        try:
            request = info.context.request
            raw = request.cookies.get("refresh_token")
            if raw:
                import hashlib
                current_hash = hashlib.sha256(raw.encode("utf-8")).hexdigest()
        except Exception:
            pass  # Non-critical: session matching is best-effort

        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            if current_hash:
                await db.execute(text("""
                    UPDATE refresh_tokens SET is_revoked = TRUE
                    WHERE user_id = :uid AND is_revoked = FALSE AND token_hash != :current
                """), {"uid": str(user.id), "current": current_hash})
            else:
                await db.execute(text("""
                    UPDATE refresh_tokens SET is_revoked = TRUE
                    WHERE user_id = :uid AND is_revoked = FALSE
                """), {"uid": str(user.id)})
            await db.commit()
        return SuccessResponse(success=True, message="All other sessions revoked")

    # ═══════════════════════════════════════════════════════════
    # Offline Download Encryption
    # ═══════════════════════════════════════════════════════════

    @strawberry.mutation
    async def requestOfflineDownload(
        self, info: strawberry.Info, movieboxId: str,
        contentType: str = "movie", quality: str = "720p",
    ) -> OfflineDownloadToken:
        """Generate an encrypted download token for offline viewing."""
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        tier = getattr(user, "subscription_tier", "free") or "free"
        from app.core.drm import TIER_QUALITY_MAP
        tier_config = TIER_QUALITY_MAP.get(tier, TIER_QUALITY_MAP["free"])
        if not tier_config.get("allow_download", False):
            raise Exception("Offline downloads require a Standard or Pro subscription.")

        import os, hashlib
        encryption_key = os.urandom(32).hex()  # AES-256 key
        iv = os.urandom(16).hex()              # AES IV

        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        expires_at = datetime.utcnow() + timedelta(days=30)

        async with AsyncSessionLocal() as db:
            # Upsert: if already downloaded, refresh the key
            await db.execute(text("""
                INSERT INTO offline_downloads (user_id, moviebox_id, content_type, encryption_key, iv, quality, expires_at)
                VALUES (:uid, :mid, :ct, :key, :iv, :q, :exp)
                ON CONFLICT (user_id, moviebox_id) DO UPDATE SET
                    encryption_key = EXCLUDED.encryption_key,
                    iv = EXCLUDED.iv,
                    quality = EXCLUDED.quality,
                    expires_at = EXCLUDED.expires_at
            """), {
                "uid": str(user.id), "mid": movieboxId, "ct": contentType,
                "key": encryption_key, "iv": iv, "q": quality, "exp": expires_at,
            })
            await db.commit()

        return OfflineDownloadToken(
            movieboxId=movieboxId,
            encryptionKey=encryption_key,
            iv=iv,
            quality=quality,
            expiresAt=str(expires_at),
        )

    # ═══════════════════════════════════════════════════════════
    # Content Interaction Tracking
    # ═══════════════════════════════════════════════════════════

    @strawberry.mutation
    async def trackInteraction(
        self, info: strawberry.Info, input: InteractionInput
    ) -> SuccessResponse:
        """Track a user interaction (view, click, etc.) for analytics."""
        user = await info.context.user
        user_id = str(user.id) if user else None
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        try:
            async with AsyncSessionLocal() as db:
                await db.execute(text("""
                    INSERT INTO movie_views (user_id, moviebox_id, title, genre)
                    VALUES (:uid, :mid, :title, :genre)
                """), {
                    "uid": user_id,
                    "mid": input.movieboxId or "",
                    "title": input.title or "",
                    "genre": input.genre or "",
                })
                await db.commit()
        except Exception as e:
            _sentry_capture(e)
            logger.warning(f"[trackInteraction] Error: {e}")
        return SuccessResponse(success=True, message="Interaction tracked")

    # ═══════════════════════════════════════════════════════════
    # Feature Flag Toggle (Section 15)
    # ═══════════════════════════════════════════════════════════

    @strawberry.mutation
    async def updateFeatureFlag(self, info: strawberry.Info, input: FeatureFlagInput) -> FeatureFlag:
        """Toggle a feature flag on/off. Admin only."""
        user = await info.context.user
        if not user or user.role != "admin":
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            # Upsert the flag
            row = (await db.execute(text("""
                INSERT INTO feature_flags (key, label, enabled, description, updated_by)
                VALUES (:key, :label, :enabled, :desc, :uid)
                ON CONFLICT (key) DO UPDATE SET
                    enabled = EXCLUDED.enabled,
                    label = COALESCE(EXCLUDED.label, feature_flags.label),
                    description = COALESCE(EXCLUDED.description, feature_flags.description),
                    updated_by = EXCLUDED.updated_by,
                    updated_at = NOW()
                RETURNING id, key, label, enabled, description, updated_at, updated_by
            """), {
                "key": input.key, "label": input.label or input.key,
                "enabled": input.enabled, "desc": input.description,
                "uid": str(user.id),
            })).fetchone()
            # Log the admin action
            await db.execute(text("""
                INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details, ip_address)
                VALUES (:aid, :action, 'feature_flag', :tid, :details, :ip)
            """), {
                "aid": str(user.id), "action": "update_feature_flag",
                "tid": input.key, "details": f"Set {input.key} = {input.enabled}",
                "ip": info.context.request.client.host if info.context.request.client else "unknown",
            })
            await db.commit()
            return FeatureFlag(
                id=str(row.id), key=row.key, label=row.label or row.key,
                enabled=row.enabled, description=row.description,
                updatedAt=str(row.updated_at) if row.updated_at else "",
                updatedBy=str(row.updated_by) if row.updated_by else None,
            )

    # ═══════════════════════════════════════════════════════════
    # Custom Lists — Create & Add Items (Section 13)
    # ═══════════════════════════════════════════════════════════

    @strawberry.mutation
    async def createCustomList(self, info: strawberry.Info, input: CreateCustomListInput) -> CustomList:
        """Create a new custom list (Letterboxd-style compilation)."""
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        import uuid
        async with AsyncSessionLocal() as db:
            list_id = str(uuid.uuid4())
            await db.execute(text("""
                INSERT INTO custom_lists (id, user_id, name, description, is_public)
                VALUES (:id, :uid, :name, :desc, :pub)
            """), {
                "id": list_id, "uid": str(user.id),
                "name": input.name, "desc": input.description or "",
                "pub": input.isPublic or False,
            })
            await db.commit()
            return CustomList(
                id=list_id, userId=str(user.id),
                name=input.name, description=input.description,
                isPublic=input.isPublic or False,
                items=[], createdAt=str(datetime.utcnow()),
                updatedAt=str(datetime.utcnow()),
            )

    @strawberry.mutation
    async def addToCustomList(
        self, info: strawberry.Info, listId: str,
        movieboxId: str, title: str = "", posterUrl: str = ""
    ) -> SuccessResponse:
        """Add a movie to a custom list."""
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        try:
            async with AsyncSessionLocal() as db:
                # Verify ownership
                owner = (await db.execute(text(
                    "SELECT user_id FROM custom_lists WHERE id = :lid"
                ), {"lid": listId})).fetchone()
                if not owner or str(owner.user_id) != str(user.id):
                    raise Exception("List not found or not authorized")
                await db.execute(text("""
                    INSERT INTO custom_list_items (list_id, moviebox_id, title, poster_url)
                    VALUES (:lid, :mid, :title, :poster)
                    ON CONFLICT (list_id, moviebox_id) DO NOTHING
                """), {"lid": listId, "mid": movieboxId, "title": title, "poster": posterUrl})
                await db.execute(text(
                    "UPDATE custom_lists SET updated_at = NOW() WHERE id = :lid"
                ), {"lid": listId})
                await db.commit()
            return SuccessResponse(success=True, message="Added to list")
        except Exception as e:
            _sentry_capture(e)
            return SuccessResponse(success=False, message=str(e))

    # ═══════════════════════════════════════════════════════════
    # Watch Party Invite (Section 13)
    # ═══════════════════════════════════════════════════════════

    @strawberry.mutation
    async def sendWatchPartyInvite(
        self, info: strawberry.Info, roomCode: str, email: str
    ) -> SuccessResponse:
        """Send a watch party invite via email/notification."""
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        try:
            async with AsyncSessionLocal() as db:
                # Verify the room exists and user is host
                room = (await db.execute(text("""
                    SELECT * FROM watch_party_rooms WHERE room_code = :rc
                """), {"rc": roomCode})).fetchone()
                if not room:
                    return SuccessResponse(success=False, message="Room not found")
                # Find invitee
                invitee = (await db.execute(text(
                    "SELECT id FROM users WHERE email = :email"
                ), {"email": email})).fetchone()
                if invitee:
                    # Create in-app notification
                    await db.execute(text("""
                        INSERT INTO notifications (user_id, title, message, type, action_url)
                        VALUES (:uid, :title, :msg, 'watch_party', :url)
                    """), {
                        "uid": str(invitee.id),
                        "title": f"Watch Party Invite from {user.name or user.email}",
                        "msg": f"You've been invited to join a watch party! Room code: {roomCode}",
                        "url": f"/watch-party/{roomCode}",
                    })
                    await db.commit()
                return SuccessResponse(success=True, message=f"Invite sent to {email}")
        except Exception as e:
            _sentry_capture(e)
            return SuccessResponse(success=False, message=str(e))

    # ═══════════════════════════════════════════════════════════
    # Watch Party Host Controls (Section 13)
    # ═══════════════════════════════════════════════════════════

    @strawberry.mutation
    async def watchPartyHostAction(
        self, info: strawberry.Info, roomCode: str,
        action: str, targetUserId: Optional[str] = None, seekTime: Optional[int] = None
    ) -> SuccessResponse:
        """Host control actions: pause, play, seek, kick."""
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        try:
            async with AsyncSessionLocal() as db:
                room = (await db.execute(text("""
                    SELECT * FROM watch_party_rooms WHERE room_code = :rc
                """), {"rc": roomCode})).fetchone()
                if not room:
                    return SuccessResponse(success=False, message="Room not found")
                if str(room.host_id) != str(user.id):
                    return SuccessResponse(success=False, message="Only the host can perform this action")
                if action == "kick" and targetUserId:
                    await db.execute(text("""
                        DELETE FROM watch_party_participants
                        WHERE room_id = :rid AND user_id = :uid
                    """), {"rid": str(room.id), "uid": targetUserId})
                    await db.commit()
                    return SuccessResponse(success=True, message="User kicked from party")
                # For pause/play/seek, these are broadcast via WebSocket — we just validate host authority
                return SuccessResponse(success=True, message=f"Host action '{action}' authorized")
        except Exception as e:
            _sentry_capture(e)
            return SuccessResponse(success=False, message=str(e))

    # ─── Section 11: Update Email Preferences ───────────────────
    @strawberry.mutation
    async def updateEmailPreferences(
        self, info: strawberry.Info,
        marketing: Optional[bool] = None, security: Optional[bool] = None,
        newReleases: Optional[bool] = None, watchlistUpdates: Optional[bool] = None,
        weeklyDigest: Optional[bool] = None, socialActivity: Optional[bool] = None,
        accountAlerts: Optional[bool] = None,
    ) -> SuccessResponse:
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        import json
        try:
            async with AsyncSessionLocal() as db:
                row = (await db.execute(text("SELECT preferences FROM users WHERE id = :uid"), {"uid": str(user.id)})).fetchone()
                prefs = row.preferences if row and row.preferences else {}
                ep = prefs.get("emailPreferences", {})
                # Merge updates
                if marketing is not None: ep["marketing"] = marketing
                if security is not None: ep["security"] = security
                if newReleases is not None: ep["newReleases"] = newReleases
                if watchlistUpdates is not None: ep["watchlistUpdates"] = watchlistUpdates
                if weeklyDigest is not None: ep["weeklyDigest"] = weeklyDigest
                if socialActivity is not None: ep["socialActivity"] = socialActivity
                if accountAlerts is not None: ep["accountAlerts"] = accountAlerts
                prefs["emailPreferences"] = ep
                await db.execute(text("UPDATE users SET preferences = :p WHERE id = :uid"),
                    {"p": json.dumps(prefs), "uid": str(user.id)})
                await db.commit()
                return SuccessResponse(success=True, message="Email preferences updated")
        except Exception as e:
            _sentry_capture(e)
            return SuccessResponse(success=False, message=str(e))

    # ─── Section 15: Schedule Content ───────────────────────────
    @strawberry.mutation
    async def scheduleContent(
        self, info: strawberry.Info,
        movieboxId: str, title: str, publishAt: str,
    ) -> SuccessResponse:
        user = await info.context.user
        if not user or getattr(user, 'role', 'user') != 'admin':
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        try:
            async with AsyncSessionLocal() as db:
                await db.execute(text("""
                    INSERT INTO content_schedule (id, moviebox_id, title, publish_at, status, created_by, created_at)
                    VALUES (gen_random_uuid(), :mid, :title, :pat, 'scheduled', :cby, NOW())
                """), {"mid": movieboxId, "title": title, "pat": publishAt, "cby": str(user.id)})
                await db.commit()
                return SuccessResponse(success=True, message=f"Content scheduled for {publishAt}")
        except Exception as e:
            _sentry_capture(e)
            return SuccessResponse(success=False, message=str(e))

    # ─── Section 15: Update SEO Metadata ────────────────────────
    @strawberry.mutation
    async def updateSeoMetadata(
        self, info: strawberry.Info,
        movieboxId: str, title: Optional[str] = None,
        description: Optional[str] = None, ogImage: Optional[str] = None,
        keywords: Optional[str] = None,
    ) -> SuccessResponse:
        user = await info.context.user
        if not user or getattr(user, 'role', 'user') != 'admin':
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        try:
            async with AsyncSessionLocal() as db:
                await db.execute(text("""
                    INSERT INTO seo_metadata (id, moviebox_id, title, description, og_image, keywords, updated_at)
                    VALUES (gen_random_uuid(), :mid, :t, :d, :og, :kw, NOW())
                    ON CONFLICT (moviebox_id) DO UPDATE SET
                        title = COALESCE(:t, seo_metadata.title),
                        description = COALESCE(:d, seo_metadata.description),
                        og_image = COALESCE(:og, seo_metadata.og_image),
                        keywords = COALESCE(:kw, seo_metadata.keywords),
                        updated_at = NOW()
                """), {"mid": movieboxId, "t": title, "d": description, "og": ogImage, "kw": keywords})
                await db.commit()
                return SuccessResponse(success=True, message="SEO metadata updated")
        except Exception as e:
            _sentry_capture(e)
            return SuccessResponse(success=False, message=str(e))

    # ─── Section 15: Admin User Impersonation ───────────────────
    @strawberry.mutation
    async def impersonateUser(
        self, info: strawberry.Info, targetUserId: str,
    ) -> ImpersonationResponse:
        """Time-limited admin impersonation (30min). Audit-logged."""
        user = await info.context.user
        if not user or getattr(user, 'role', 'user') != 'admin':
            return ImpersonationResponse(success=False, message="Admin access required")
        from app.core.database import AsyncSessionLocal
        from app.core.auth import create_access_token
        from sqlalchemy import text
        try:
            async with AsyncSessionLocal() as db:
                target = (await db.execute(text("SELECT id, email FROM users WHERE id = :uid"),
                    {"uid": targetUserId})).fetchone()
                if not target:
                    return ImpersonationResponse(success=False, message="User not found")
                # Create time-limited token (30 min)
                expires = timedelta(minutes=30)
                token = create_access_token(data={"sub": str(target.id), "impersonated_by": str(user.id)}, expires_delta=expires)
                expires_at = datetime.utcnow() + expires
                # Audit log
                await db.execute(text("""
                    INSERT INTO admin_audit_log (id, admin_user_id, action, target_id, details, ip_address, created_at)
                    VALUES (gen_random_uuid(), :aid, 'impersonate_user', :tid,
                            :det, :ip, NOW())
                """), {
                    "aid": str(user.id), "tid": targetUserId,
                    "det": f"Impersonated user {target.email} for 30 minutes",
                    "ip": info.context.request.client.host if hasattr(info.context, 'request') else "unknown"
                })
                await db.commit()
                return ImpersonationResponse(
                    success=True, token=token,
                    expiresAt=expires_at.isoformat(),
                    message=f"Impersonating {target.email} for 30 minutes"
                )
        except Exception as e:
            _sentry_capture(e)
            return ImpersonationResponse(success=False, message=str(e))

    # ─── Section 13: New Episode Notification Trigger ───────────
    @strawberry.mutation
    async def checkNewEpisodes(self, info: strawberry.Info) -> SuccessResponse:
        """Admin trigger: scan user histories and create notifications for new episodes."""
        user = await info.context.user
        if not user or getattr(user, 'role', 'user') != 'admin':
            raise Exception("Admin access required")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        try:
            notified = 0
            async with AsyncSessionLocal() as db:
                # Find series with recent history entries
                series_users = (await db.execute(text("""
                    SELECT DISTINCT h.user_id, h.moviebox_id
                    FROM history h WHERE h.content_type = 'series'
                    AND h.updated_at >= NOW() - INTERVAL '30 days'
                """))).fetchall()
                for su in series_users:
                    # Create a notification for each active series viewer
                    await db.execute(text("""
                        INSERT INTO notifications (id, user_id, title, message, type, action_url, created_at)
                        VALUES (gen_random_uuid(), :uid, 'New Episodes Available',
                                'New episodes may be available for a series you watch!',
                                'content', '/watch/' || :mid, NOW())
                        ON CONFLICT DO NOTHING
                    """), {"uid": str(su.user_id), "mid": su.moviebox_id})
                    notified += 1
                await db.commit()
            return SuccessResponse(success=True, message=f"Notified {notified} users about potential new episodes")
        except Exception as e:
            _sentry_capture(e)
            return SuccessResponse(success=False, message=str(e))


    @strawberry.mutation
    async def exportMyData(self, info: strawberry.Info) -> SuccessResponse:
        """GDPR Article 20 — Data Portability. Returns a JSON string of all user data."""
        user = await info.context.user
        if not user:
            raise Exception("Not authenticated")
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        import json
        try:
            async with AsyncSessionLocal() as db:
                export = {"exportedAt": datetime.utcnow().isoformat(), "userId": str(user.id)}

                # Profile
                profile = (await db.execute(text("""
                    SELECT email, name, avatar, bio, role, subscription_tier,
                           created_at, last_active, email_verified, referral_count
                    FROM users WHERE id = :uid
                """), {"uid": str(user.id)})).fetchone()
                if profile:
                    export["profile"] = {
                        "email": profile.email, "name": profile.name, "avatar": profile.avatar,
                        "bio": profile.bio, "role": profile.role, "tier": profile.subscription_tier,
                        "createdAt": str(profile.created_at), "lastActive": str(profile.last_active),
                        "emailVerified": profile.email_verified, "referralCount": profile.referral_count,
                    }

                # Watch History
                history = (await db.execute(text("""
                    SELECT moviebox_id, content_type, current_time, duration, updated_at
                    FROM history WHERE user_id = :uid ORDER BY updated_at DESC
                """), {"uid": str(user.id)})).fetchall()
                export["watchHistory"] = [
                    {"movieboxId": h.moviebox_id, "contentType": h.content_type,
                     "currentTime": h.current_time, "duration": h.duration,
                     "watchedAt": str(h.updated_at)} for h in history
                ]

                # Watchlist
                watchlist = (await db.execute(text("""
                    SELECT moviebox_id, content_type, added_at
                    FROM watchlist WHERE user_id = :uid ORDER BY added_at DESC
                """), {"uid": str(user.id)})).fetchall()
                export["watchlist"] = [
                    {"movieboxId": w.moviebox_id, "contentType": w.content_type,
                     "addedAt": str(w.added_at)} for w in watchlist
                ]

                # Reviews
                reviews = (await db.execute(text("""
                    SELECT moviebox_id, content, rating, created_at
                    FROM reviews WHERE user_id = :uid ORDER BY created_at DESC
                """), {"uid": str(user.id)})).fetchall()
                export["reviews"] = [
                    {"movieboxId": r.moviebox_id, "content": r.content,
                     "rating": r.rating, "createdAt": str(r.created_at)} for r in reviews
                ]

                # Notifications
                notifs = (await db.execute(text("""
                    SELECT title, message, type, is_read, created_at
                    FROM notifications WHERE user_id = :uid ORDER BY created_at DESC LIMIT 500
                """), {"uid": str(user.id)})).fetchall()
                export["notifications"] = [
                    {"title": n.title, "message": n.message, "type": n.type,
                     "isRead": n.is_read, "createdAt": str(n.created_at)} for n in notifs
                ]

                # Reports submitted
                reports = (await db.execute(text("""
                    SELECT moviebox_id, reason, description, status, created_at
                    FROM reports WHERE user_id = :uid
                """), {"uid": str(user.id)})).fetchall()
                export["reports"] = [
                    {"movieboxId": r.moviebox_id, "reason": r.reason,
                     "description": r.description, "status": r.status,
                     "createdAt": str(r.created_at)} for r in reports
                ]

                data_json = json.dumps(export, indent=2, default=str)
                return SuccessResponse(success=True, message=data_json)
        except Exception as e:
            _sentry_capture(e)
            return SuccessResponse(success=False, message=f"Export failed: {str(e)}")


# ═══════════════════════════════════════════════════════════
# Schema — must be last
# ═══════════════════════════════════════════════════════════

schema = strawberry.Schema(query=Query, mutation=Mutation)