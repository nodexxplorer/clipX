// src/graphql/queries/recommendationQueries.js
import { gql } from '@apollo/client';

export const GET_PERSONALIZED_RECOMMENDATIONS = gql`
  query GetPersonalizedRecommendations($userId: ID, $limit: Int) {
    personalizedRecommendations(userId: $userId, limit: $limit) {
      id
      title
      description
      year
      durationMinutes
      rating
      posterUrl
      trailerUrl
      downloadCount
      reason
      score
      genres {
        id
        name
        slug
      }
    }
  }
`;

export const GET_SIMILAR_MOVIES = gql`
  query GetSimilarMovies($movieId: ID!, $limit: Int) {
    similarMovies(movieId: $movieId, limit: $limit) {
      id
      title
      posterPath
      backdropPath
      releaseDate
      voteAverage
      genres {
        id
        name
      }
    }
  }
`;

export const GET_TRENDING_RECOMMENDATIONS = gql`
  query GetTrendingRecommendations($timeWindow: String, $limit: Int) {
    trendingRecommendations(timeWindow: $timeWindow, limit: $limit) {
      id
      title
      posterUrl
      rating
      year
      downloadCount
      genres {
        name
      }
    }
  }
`;

export const GET_TOP_RATED_MOVIES = gql`
  query GetTopRatedMovies($limit: Int, $minRating: Float) {
    topRatedMovies(limit: $limit, minRating: $minRating) {
      id
      title
      description
      posterUrl
      rating
      year
      genres {
        name
      }
    }
  }
`;

export const GET_NEW_RELEASES = gql`
  query GetNewReleases($limit: Int) {
    newReleases(limit: $limit) {
      id
      title
      posterUrl
      rating
      year
      releaseDate
      genres {
        name
      }
    }
  }
`;

export const GET_RECOMMENDATIONS_BY_GENRE = gql`
  query GetRecommendationsByGenre($genreId: ID!, $limit: Int) {
    recommendationsByGenre(genreId: $genreId, limit: $limit) {
      id
      title
      posterUrl
      rating
      year
      reason
      genres {
        name
      }
    }
  }
`;

export const GET_BECAUSE_YOU_WATCHED = gql`
  query GetBecauseYouWatched($movieId: ID!, $limit: Int) {
    becauseYouWatched(movieId: $movieId, limit: $limit) {
      baseMovie {
        id
        title
        posterUrl
      }
      recommendations {
        id
        title
        posterUrl
        rating
        year
        matchScore
      }
    }
  }
`;

export const GET_RECOMMENDATION_FEED = gql`
  query GetRecommendationFeed($userId: ID, $page: Int, $limit: Int) {
    recommendationFeed(userId: $userId, page: $page, limit: $limit) {
      sections {
        id
        title
        type
        movies {
          id
          title
          posterUrl
          rating
          year
          reason
        }
      }
      hasMore
    }
  }
`;

export default {
  GET_PERSONALIZED_RECOMMENDATIONS,
  GET_SIMILAR_MOVIES,
  GET_TRENDING_RECOMMENDATIONS,
  GET_TOP_RATED_MOVIES,
  GET_NEW_RELEASES,
  GET_RECOMMENDATIONS_BY_GENRE,
  GET_BECAUSE_YOU_WATCHED,
  GET_RECOMMENDATION_FEED,
};