// src/graphql/queries/genreQueries.js
import { gql } from '@apollo/client';

export const GET_ALL_GENRES = gql`
  query GetAllGenres {
    genres {
      id
      name
      slug
      movieCount
    }
  }
`;

export const GET_GENRE_DETAILS = gql`
  query GetGenreDetails($slug: String!) {
    genre(slug: $slug) {
      id
      name
      slug
      description
      movieCount
      featuredMovies(limit: 8) {
        id
        title
        posterUrl
        rating
        year
      }
    }
  }
`;

export const GET_POPULAR_GENRES = gql`
  query GetPopularGenres($limit: Int) {
    popularGenres(limit: $limit) {
      id
      name
      slug
      movieCount
    }
  }
`;