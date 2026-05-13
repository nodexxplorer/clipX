# pyright: reportCallIssue=false, reportArgumentType=false, reportGeneralTypeIssues=false, reportReturnType=false
"""All Strawberry GraphQL type / input / response definitions for ClipX."""

import strawberry
from typing import List, Optional


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
class StreamLinkType:
    """A single stream link with quality info (e.g. 360p, 720p, 1080p)."""
    quality: str
    url: str
    format: Optional[str] = None
    size: Optional[int] = None

@strawberry.type
class ProviderSubtitleType:
    """Subtitle track scraped from the stream provider (not stored in DB)."""
    lang: str
    code: str
    url: str

@strawberry.type
class StreamDataType:
    """Combined stream links (multiple qualities) + provider subtitles."""
    links: List[StreamLinkType]
    subtitles: List[ProviderSubtitleType]

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
    status: str = "scheduled"  # scheduled, published, cancelled
    createdBy: str = ""

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
