// frontend/src/graphql/queries/adminQueries.js
import { gql } from '@apollo/client';

export const GET_ADMIN_ME = gql`
  query AdminMe {
    adminMe {
      id
      email
      firstName
      lastName
      fullName
      role
      avatar
      twoFactorEnabled
      mustChangePassword
      permissions {
        movies { read write delete }
        users { read write delete }
        analytics { read export }
        settings { read write delete }
        moderation { read action }
      }
    }
  }
`;

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
        movie { id title posterUrl releaseYear }
        views
        downloads
        watchlistAdds
      }
      recentActivity { id type description timestamp }
    }
  }
`;

export const GET_ADMIN_MOVIES = gql`
  query AdminMovies($limit: Int, $offset: Int, $search: String) {
    adminMovies(limit: $limit, offset: $offset, search: $search) {
      movies {
        id
        title
        posterUrl
        releaseYear
        rating
        isActive
        viewCount
        downloadCount
        genres { id name }
      }
      totalCount
    }
  }
`;

export const GET_ADMIN_MOVIE = gql`
  query AdminMovie($id: ID!) {
    movie(id: $id) {
      id title originalTitle overview tagline
      posterUrl backdropUrl trailerUrl
      releaseDate releaseYear runtime
      rating voteCount popularity
      budget revenue
      language country status
      isActive isFeatured
      genres { id name }
      cast { id name character profileUrl }
      createdAt updatedAt
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

export const GET_ADMIN_USER = gql`
  query AdminUser($id: ID!) {
    user(id: $id) {
      id email username
      firstName lastName avatar bio
      isActive isBanned banReason
      lastActive createdAt
      watchlist { id movie { id title posterUrl } }
      interactions { id type movieId createdAt }
    }
  }
`;

export const GET_ADMIN_LOGS = gql`
  query AdminLogs($filter: AdminLogFilterInput, $limit: Int, $offset: Int) {
    adminLogs(filter: $filter, limit: $limit, offset: $offset) {
      logs {
        id
        action
        resource
        resourceId
        description
        severity
        ipAddress
        createdAt
        admin { id email firstName lastName }
      }
      totalCount
      pageInfo { hasMore total }
    }
  }
`;

export const GET_BANNERS = gql`
  query Banners($position: String, $isActive: Boolean) {
    banners(position: $position, isActive: $isActive) {
      id title subtitle
      imageUrl linkUrl linkType
      position priority
      isActive startDate endDate
      impressions clicks ctr
      createdAt
    }
  }
`;

export const GET_SETTINGS = gql`
  query Settings($category: String) {
    settings(category: $category) {
      id key value category description isPublic updatedAt
    }
  }
`;

export const GET_USER_ANALYTICS = gql`
  query UserAnalytics($dateRange: DateRangeInput!) {
    userAnalytics(dateRange: $dateRange)
  }
`;

export const GET_MOVIE_ANALYTICS = gql`
  query MovieAnalytics($dateRange: DateRangeInput!) {
    movieAnalytics(dateRange: $dateRange)
  }
`;
