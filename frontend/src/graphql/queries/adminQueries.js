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
