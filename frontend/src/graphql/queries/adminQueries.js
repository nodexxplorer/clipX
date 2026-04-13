// frontend/src/graphql/queries/adminQueries.js
import { gql } from '@apollo/client';

export const GET_DASHBOARD_STATS = gql`
  query DashboardStats($dateRange: DateRangeInput) {
    dashboardStats(dateRange: $dateRange) {
      totalUsers
      totalMovies
      totalGenres
      activeUsers
      newUsersToday
      newUsersThisWeek
      totalDownloads
      totalWatchlistItems
      avgSessionDuration
      userGrowth { date count }
      genreDistribution { genre { id name } movieCount viewCount }
      topMovies {
        movie { id title posterUrl releaseDate }
        views
        downloads
        watchlistAdds
      }
      recentActivity { id type description timestamp }
    }
  }
`;

export const GET_ADMIN_MOVIES = gql`
  query AdminMovies($limit: Int) {
    trending(limit: $limit) {
      id
      title
      posterUrl
      year
      rating
      downloadCount
      genres { id name }
    }
  }
`;

export const GET_ADMIN_MOVIE = gql`
  query AdminMovie($id: ID!) {
    movie(id: $id) {
      id title overview tagline
      posterUrl backdropUrl trailerUrl
      releaseDate year runtime
      rating voteCount popularity
      status
      genres { id name }
      cast { id name character profileImage }
    }
  }
`;

export const GET_ADMIN_USERS = gql`
  query AdminUsers($limit: Int, $offset: Int, $search: String, $status: String) {
    adminUsers(limit: $limit, offset: $offset, search: $search, status: $status) {
      users {
        id email username
        firstName lastName avatar
        isActive isBanned
        lastActive createdAt
        watchlistCount downloadCount
      }
      totalCount
    }
  }
`;

export const GET_ADMIN_USER_DETAIL = gql`
  query AdminUserDetail($id: ID!) {
    adminUserDetail(id: $id) {
      id email username
      firstName lastName avatar
      isActive isBanned
      lastActive createdAt
      watchlistCount downloadCount
    }
  }
`;

export const GET_ADMIN_NOTIFICATIONS = gql`
  query AdminNotifications($limit: Int) {
    adminNotifications(limit: $limit) {
      id title message type
      actionUrl isRead createdAt
    }
  }
`;

export const GET_ADMIN_REPORTS = gql`
  query AdminReports {
    getReports {
      id reason description status createdAt
    }
  }
`;

export const GET_GENRES = gql`
  query Genres {
    genres {
      id name slug movieCount
    }
  }
`;

// ─── Revenue Page ────────────────────────────────────────────────────────────
export const GET_REVENUE_STATS = gql`
  query RevenueStats($days: Int) {
    revenueStats(days: $days)
  }
`;

// ─── Security Page ───────────────────────────────────────────────────────────
export const GET_ADMIN_LOGIN_ACTIVITY = gql`
  query AdminLoginActivity($limit: Int) {
    adminLoginActivity(limit: $limit) {
      id action deviceInfo ipAddress location success createdAt
    }
  }
`;

export const GET_ADMIN_ACTIVE_SESSIONS = gql`
  query AdminActiveSessions {
    adminActiveSessions
  }
`;

// ─── Moderation / Reviews ────────────────────────────────────────────────────
export const GET_ADMIN_ALL_REVIEWS = gql`
  query AdminAllReviews($limit: Int, $offset: Int, $filter: String) {
    adminAllReviews(limit: $limit, offset: $offset, filter: $filter)
  }
`;

// ─── Content Management ──────────────────────────────────────────────────────
export const GET_ADMIN_CONTENT_LIST = gql`
  query AdminContentList($limit: Int, $search: String) {
    adminContentList(limit: $limit, search: $search)
  }
`;

// ─── Admin Mutations ─────────────────────────────────────────────────────────
export const ADMIN_FEATURE_REVIEW = gql`
  mutation AdminFeatureReview($id: ID!, $featured: Boolean!) {
    adminFeatureReview(id: $id, featured: $featured) { success message }
  }
`;

export const ADMIN_DELETE_REVIEW = gql`
  mutation AdminDeleteReview($id: ID!) {
    adminDeleteReview(id: $id) { success message }
  }
`;

export const ADMIN_BULK_BAN_USERS = gql`
  mutation AdminBulkBanUsers($userIds: [ID!]!, $reason: String) {
    adminBulkBanUsers(userIds: $userIds, reason: $reason) { success message }
  }
`;

export const ADMIN_BULK_DELETE_REVIEWS = gql`
  mutation AdminBulkDeleteReviews($reviewIds: [ID!]!) {
    adminBulkDeleteReviews(reviewIds: $reviewIds) { success message }
  }
`;

export const ADMIN_REVOKE_SESSION = gql`
  mutation AdminRevokeSession($sessionId: ID!) {
    adminRevokeSession(sessionId: $sessionId) { success message }
  }
`;

// ─── System Health (Section 15) ──────────────────────────────────────────────
export const GET_SYSTEM_HEALTH = gql`
  query SystemHealth {
    systemHealth {
      status timestamp version
      database movieProvider redis
    }
  }
`;

// ─── Feature Flags (Section 15) ──────────────────────────────────────────────
export const GET_FEATURE_FLAGS = gql`
  query FeatureFlags {
    featureFlags {
      id key label enabled description updatedAt updatedBy
    }
  }
`;

export const UPDATE_FEATURE_FLAG = gql`
  mutation UpdateFeatureFlag($input: FeatureFlagInput!) {
    updateFeatureFlag(input: $input) {
      id key label enabled description updatedAt updatedBy
    }
  }
`;

// ─── Admin Audit Log (Section 15) ────────────────────────────────────────────
export const GET_ADMIN_AUDIT_LOGS = gql`
  query AdminAuditLogs($limit: Int) {
    adminAuditLogs(limit: $limit) {
      id adminId adminEmail action targetType targetId details ipAddress createdAt
    }
  }
`;

// ─── Trending Searches (Section 14) ──────────────────────────────────────────
export const GET_TRENDING_SEARCHES = gql`
  query TrendingSearches($limit: Int) {
    trendingSearches(limit: $limit) {
      query count
    }
  }
`;

// ─── Custom Lists / Letterboxd-style (Section 13) ────────────────────────────
export const GET_MY_CUSTOM_LISTS = gql`
  query MyCustomLists {
    myCustomLists {
      id userId name description isPublic
      items { movieboxId title posterUrl addedAt }
      createdAt updatedAt
    }
  }
`;

export const CREATE_CUSTOM_LIST = gql`
  mutation CreateCustomList($input: CreateCustomListInput!) {
    createCustomList(input: $input) {
      id userId name description isPublic createdAt updatedAt
    }
  }
`;

export const ADD_TO_CUSTOM_LIST = gql`
  mutation AddToCustomList($listId: String!, $movieboxId: String!, $title: String, $posterUrl: String) {
    addToCustomList(listId: $listId, movieboxId: $movieboxId, title: $title, posterUrl: $posterUrl) {
      success message
    }
  }
`;

// ─── Watch Party (Section 13) ────────────────────────────────────────────────
export const SEND_WATCH_PARTY_INVITE = gql`
  mutation SendWatchPartyInvite($roomCode: String!, $email: String!) {
    sendWatchPartyInvite(roomCode: $roomCode, email: $email) { success message }
  }
`;

export const WATCH_PARTY_HOST_ACTION = gql`
  mutation WatchPartyHostAction($roomCode: String!, $action: String!, $targetUserId: String, $seekTime: Int) {
    watchPartyHostAction(roomCode: $roomCode, action: $action, targetUserId: $targetUserId, seekTime: $seekTime) {
      success message
    }
  }
`;
