import { gql } from '@apollo/client';

export const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    me {
      id
      email
      name
      avatar
      bio
      role
      createdAt
      preferences {
        favoriteGenres
        theme
        emailNotifications
        autoPlayTrailers
      }
      stats {
        moviesWatched
        totalWatchTime
      }
    }
  }
`;

export const GET_DASHBOARD_DATA = gql`
  query GetDashboardData {
    dashboardData {
      watchlist {
        id
        title
        posterUrl
        rating
        releaseDate
      }
      recentlyViewed {
        id
        title
        posterUrl
        rating
      }
      continueWatching {
        id
        movie {
          id
          title
          backdropUrl
          posterUrl
          durationMinutes
        }
        currentTime
        duration
      }
      stats {
        moviesWatched
        totalWatchTime
        monthlyWatchTime
        watchlistCount
        reviewsWritten
      }
    }
  }
`;

export const GET_WATCHLIST = gql`
  query GetWatchlist {
    dashboardData {
      watchlist {
        id
        title
        description
        year
        rating
        posterUrl
        genres {
          name
        }
      }
    }
  }
`;

export const GET_NOTIFICATIONS = gql`
  query GetNotifications {
    notifications {
      id
      title
      message
      type
      actionUrl
      isRead
      createdAt
    }
  }
`;

export const GET_LANDING_REVIEWS = gql`
  query GetLandingReviews {
    landingReviews {
      id
      content
      rating
      userName
      userAvatar
      isFeatured
      createdAt
    }
  }
`;

export const GET_WATCH_HISTORY = gql`
  query GetWatchHistory($limit: Int, $offset: Int) {
    watchHistory(limit: $limit, offset: $offset) {
      id
      movieboxId
      title
      posterUrl
      contentType
      currentTime
      duration
      progress
      watchedAt
    }
  }
`;