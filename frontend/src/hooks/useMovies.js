// frontend/src/hooks/useMovies.js
/**
 * Custom hooks for fetching movie data via GraphQL.
 * Previously 0-byte — now implements the exports that hooks/index.js re-exports.
 */

import { useQuery, useLazyQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useCallback, useState } from 'react';

// ─── GraphQL Queries ─────────────────────────────────────────
const GET_MOVIE_DETAILS = gql`
  query MovieDetails($id: ID!) {
    movieDetails(movieId: $id) {
      id title overview posterPath backdropPath releaseDate
      voteAverage voteCount runtime popularity tagline status
      trailerUrl posterUrl backdropUrl firstAirDate rating
      durationMinutes description year inWatchlist downloadCount
      genres { id name slug }
      cast { id name character profileImage }
      seasons { id seasonNumber episodes { id title episodeNumber seasonNumber } }
      recommendations { id title posterPath voteAverage releaseDate posterUrl year }
    }
  }
`;

const SEARCH_MOVIES = gql`
  query SearchMovies($query: String!, $page: Int) {
    searchMovies(query: $query, page: $page) {
      items { id title posterPath voteAverage releaseDate posterUrl year overview
        genres { id name slug } }
      totalResults page totalPages
    }
  }
`;

const GET_MOVIES_BY_GENRE = gql`
  query MoviesByGenre($genre: String!, $page: Int, $limit: Int) {
    browseSeries(genre: $genre, page: $page, limit: $limit) {
      movies { id title posterPath voteAverage releaseDate posterUrl year
        genres { id name slug } }
      total hasMore
    }
  }
`;

const GET_DOWNLOAD_LINKS = gql`
  query DownloadLinks($movieId: ID!, $season: Int, $episode: Int) {
    downloadLinks(movieId: $movieId, season: $season, episode: $episode) {
      links { quality url size sizeStr ext }
      subtitles
    }
  }
`;

// ─── useMovie: Fetch a single movie by ID ────────────────────
export default function useMovie(movieId) {
  const { data, loading, error, refetch } = useQuery(GET_MOVIE_DETAILS, {
    variables: { id: movieId },
    skip: !movieId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    movie: data?.movieDetails || null,
    loading,
    error,
    refetch,
  };
}

// ─── useMovieDownload: Fetch download links ──────────────────
export function useMovieDownload(movieId, { season, episode } = {}) {
  const { data, loading, error, refetch } = useQuery(GET_DOWNLOAD_LINKS, {
    variables: { movieId, season: season || 0, episode: episode || 1 },
    skip: !movieId,
    fetchPolicy: 'network-only',
  });

  return {
    links: data?.downloadLinks?.links || [],
    subtitles: data?.downloadLinks?.subtitles || [],
    loading,
    error,
    refetch,
  };
}

// ─── useMovieSearch: Search movies with pagination ───────────
export function useMovieSearch() {
  const [search, { data, loading, error }] = useLazyQuery(SEARCH_MOVIES, {
    fetchPolicy: 'network-only',
  });

  const searchMovies = useCallback(
    (query, page = 1) => {
      if (!query?.trim()) return;
      search({ variables: { query: query.trim(), page } });
    },
    [search]
  );

  return {
    searchMovies,
    results: data?.searchMovies?.items || [],
    totalResults: data?.searchMovies?.totalResults || 0,
    page: data?.searchMovies?.page || 1,
    totalPages: data?.searchMovies?.totalPages || 1,
    loading,
    error,
  };
}

// ─── useGenreMovies: Browse movies by genre ──────────────────
export function useGenreMovies(genre, { page = 1, limit = 20 } = {}) {
  const { data, loading, error, fetchMore, refetch } = useQuery(GET_MOVIES_BY_GENRE, {
    variables: { genre, page, limit },
    skip: !genre,
    fetchPolicy: 'cache-and-network',
  });

  const loadMore = useCallback(() => {
    if (!data?.browseSeries?.hasMore) return;
    fetchMore({
      variables: { page: page + 1 },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          browseSeries: {
            ...fetchMoreResult.browseSeries,
            movies: [
              ...(prev.browseSeries?.movies || []),
              ...(fetchMoreResult.browseSeries?.movies || []),
            ],
          },
        };
      },
    });
  }, [data, fetchMore, page]);

  return {
    movies: data?.browseSeries?.movies || [],
    total: data?.browseSeries?.total || 0,
    hasMore: data?.browseSeries?.hasMore || false,
    loading,
    error,
    loadMore,
    refetch,
  };
}
