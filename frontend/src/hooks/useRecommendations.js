// src/hooks/useRecommendations.js
import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';

const GET_RECOMMENDATIONS = gql`
  query GetRecommendations($userId: ID) {
    personalizedRecommendations(userId: $userId, limit: 20) {
      id
      title
      posterUrl
      rating
      year
      reason
      score
      genres {
        name
      }
    }
    similarMovies(movieId: $movieId, limit: 10) {
      id
      title
      posterUrl
      rating
    }
  }
`;

export const useRecommendations = (userId = null) => {
  const { loading, error, data, refetch } = useQuery(GET_RECOMMENDATIONS, {
    variables: { userId },
    fetchPolicy: 'cache-and-network',
  });

  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    if (data?.personalizedRecommendations) {
      setRecommendations(data.personalizedRecommendations);
    }
  }, [data]);

  const refreshRecommendations = async () => {
    try {
      const result = await refetch();
      if (result.data?.personalizedRecommendations) {
        setRecommendations(result.data.personalizedRecommendations);
      }
    } catch (err) {
      console.error('Failed to refresh recommendations:', err);
    }
  };

  return {
    recommendations,
    loading,
    error,
    refreshRecommendations,
  };
};

export const useSimilarMovies = (movieId) => {
  const { loading, error, data } = useQuery(
    gql`
      query GetSimilarMovies($movieId: ID!) {
        movie(id: $movieId) {
          recommendations {
            id
            title
            posterUrl
            rating
            year
            genres {
              name
            }
          }
        }
      }
    `,
    {
      variables: { movieId },
      skip: !movieId,
    }
  );

  return {
    similarMovies: data?.movie?.recommendations || [],
    loading,
    error,
  };
};

export const useRecommendationFilters = (recommendations) => {
  const [filtered, setFiltered] = useState(recommendations);
  const [filters, setFilters] = useState({
    genre: '',
    minRating: 0,
    year: null,
  });

  useEffect(() => {
    let result = [...recommendations];

    if (filters.genre) {
      result = result.filter((movie) =>
        movie.genres?.some((g) => g.name === filters.genre)
      );
    }

    if (filters.minRating > 0) {
      result = result.filter((movie) => movie.rating >= filters.minRating);
    }

    if (filters.year) {
      result = result.filter((movie) => movie.year === filters.year);
    }

    setFiltered(result);
  }, [recommendations, filters]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ genre: '', minRating: 0, year: null });
  };

  return {
    filtered,
    filters,
    updateFilter,
    clearFilters,
  };
};

export default useRecommendations;