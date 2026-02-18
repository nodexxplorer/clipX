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
          durationMinutes
        }
        currentTime
        duration
      }
      stats {
        moviesWatched
        totalWatchTime
      }
    }
  }
`;

export const GET_WATCHLIST = gql`
  query GetWatchlist {
    watchlist {
      id
      movies {
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