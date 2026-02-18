// src/queries/movieQueries.js

/**
 * Movie GraphQL Queries
 */

import { gql } from '@apollo/client';

// Fragment for common movie fields
export const MOVIE_FRAGMENT = gql`
  fragment MovieFields on Movie {
    id
    title
    overview
    posterPath
    backdropPath
    releaseDate
    voteAverage
    voteCount
    runtime
    popularity
  }
`;

export const MOVIE_WITH_GENRES_FRAGMENT = gql`
  fragment MovieWithGenres on Movie {
    ...MovieFields
    genres {
      id
      name
      slug
    }
  }
  ${MOVIE_FRAGMENT}
`;

// Home page data query
export const GET_HOME_PAGE_DATA = gql`
  query GetHomePageData($trendingLimit: Int, $popularLimit: Int) {
    trending(limit: $trendingLimit) {
      ...MovieWithGenres
    }
    popular(limit: $popularLimit) {
      ...MovieWithGenres
    }
    featured {
      ...MovieWithGenres
      tagline
    }
    genres {
      id
      name
      slug
      movieCount
    }
  }
  ${MOVIE_WITH_GENRES_FRAGMENT}
`;

// Get all movies with pagination
export const GET_MOVIES = gql`
  query GetMovies($page: Int, $limit: Int, $sortBy: String, $genreId: ID) {
    movies(page: $page, limit: $limit, sortBy: $sortBy, genreId: $genreId) {
      items {
        ...MovieWithGenres
      }
      totalCount
      hasMore
      currentPage
    }
  }
  ${MOVIE_WITH_GENRES_FRAGMENT}
`;

// Get single movie by ID
export const GET_MOVIE = gql`
  query GetMovie($id: ID!) {
    movie(id: $id) {
      ...MovieWithGenres
      tagline
      tagline
      description
      status
      trailerUrl
      cast {
        id
        name
        character
        profileImage
      }
      recommendations {
        ...MovieFields
      }
    }
  }
  ${MOVIE_WITH_GENRES_FRAGMENT}
  ${MOVIE_FRAGMENT}
`;

// Get trending movies
export const GET_TRENDING = gql`
  query GetTrending($timeWindow: String, $limit: Int) {
    trending(timeWindow: $timeWindow, limit: $limit) {
      ...MovieWithGenres
    }
  }
  ${MOVIE_WITH_GENRES_FRAGMENT}
`;

// Get popular movies
export const GET_POPULAR = gql`
  query GetPopular($page: Int, $limit: Int) {
    popular(page: $page, limit: $limit) {
      ...MovieWithGenres
    }
  }
  ${MOVIE_WITH_GENRES_FRAGMENT}
`;

// Search movies
export const SEARCH_MOVIES = gql`
  query SearchMovies($query: String!, $page: Int, $limit: Int) {
    searchMovies(query: $query, page: $page, limit: $limit) {
      items {
        ...MovieFields
        genres {
          id
          name
        }
      }
      totalCount
      hasMore
      hasMore
    }
  }
  ${MOVIE_FRAGMENT}
`;

// Get movies by genre
export const GET_MOVIES_BY_GENRE = gql`
  query GetMoviesByGenre($genreId: ID, $genreSlug: String, $page: Int, $limit: Int) {
    moviesByGenre(genreId: $genreId, genreSlug: $genreSlug, page: $page, limit: $limit) {
      items {
        ...MovieWithGenres
      }
      totalCount
      hasMore
    }
  }
  ${MOVIE_WITH_GENRES_FRAGMENT}
`;

// Get similar movies
export const GET_SIMILAR_MOVIES = gql`
  query GetSimilarMovies($movieId: ID!, $limit: Int) {
    similarMovies(movieId: $movieId, limit: $limit) {
      ...MovieFields
      similarity
    }
  }
  ${MOVIE_FRAGMENT}
`;

// Get featured movies
export const GET_FEATURED = gql`
  query GetFeatured($limit: Int) {
    featured(limit: $limit) {
      ...MovieWithGenres
      tagline
    }
  }
  ${MOVIE_WITH_GENRES_FRAGMENT}
`;

// Get movie videos (trailers)
export const GET_MOVIE_VIDEOS = gql`
  query GetMovieVideos($movieId: ID!) {
    movieVideos(movieId: $movieId) {
      id
      key
      name
      type
      site
      official
    }
  }
`;

// Backwards-compatible aliases / convenience queries expected elsewhere
export const GET_MOVIE_DETAILS = GET_MOVIE;

export const GET_STREAMING_URL = gql`
  query GetStreamingUrl($movieId: ID!) {
    streamingUrl(movieId: $movieId)
  }
`;

// Get movies for watchlist check (lightweight)
export const GET_MOVIES_LIGHT = gql`
  query GetMoviesLight($ids: [ID!]!) {
    moviesByIds(ids: $ids) {
      id
      title
      posterPath
      voteAverage
    }
  }
`;

// Get trending series
export const GET_TRENDING_SERIES = gql`
  query GetTrendingSeries($limit: Int) {
    trendingSeries(limit: $limit) {
      id
      title
      description
      firstAirDate
      rating
      posterUrl
      genres {
        id
        name
        slug
      }
    }
  }
`;