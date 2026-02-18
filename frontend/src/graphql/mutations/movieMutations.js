// src/graphql/mutations/movieMutations.js
import { gql } from '@apollo/client';

export const TRACK_MOVIE_VIEW = gql`
  mutation TrackMovieView($movieId: ID!) {
    trackMovieView(movieId: $movieId) {
      success
      message
    }
  }
`;

export const TRACK_DOWNLOAD = gql`
  mutation TrackDownload($movieId: ID!) {
    trackDownload(movieId: $movieId) {
      success
      downloadUrl
      movie {
        id
        downloadCount
      }
    }
  }
`;

export const ADD_TO_WATCHLIST = gql`
  mutation AddToWatchlist($movieId: ID!) {
    addToWatchlist(movieId: $movieId) {
      success
      message
      watchlist {
        id
        movies {
          id
          title
          posterUrl
        }
      }
    }
  }
`;

export const REMOVE_FROM_WATCHLIST = gql`
  mutation RemoveFromWatchlist($movieId: ID!) {
    removeFromWatchlist(movieId: $movieId) {
      success
      message
    }
  }
`;

export const RATE_MOVIE = gql`
  mutation RateMovie($movieId: ID!, $rating: Float!) {
    rateMovie(movieId: $movieId, rating: $rating) {
      success
      message
      movie {
        id
        rating
      }
    }
  }
`;

export const TRACK_SEARCH = gql`
  mutation TrackSearch($query: String!) {
    trackSearch(query: $query) {
      success
    }
  }
`;