// src/graphql/queries/index.js

// Movie Queries
export {
  GET_FEATURED_MOVIES,
  GET_TRENDING_MOVIES,
  GET_MOVIES_BY_GENRE,
  GET_MOVIE_DETAILS,
  GET_ALL_GENRES,
  SEARCH_MOVIES,
  GET_PERSONALIZED_RECOMMENDATIONS,
} from './movieQueries';

// Genre Queries
export {
  GET_GENRE_DETAILS,
  GET_POPULAR_GENRES,
} from './genreQueries';

// User Queries
export {
  GET_WATCHLIST,
} from './userQueries';

// Recommendation Queries
export {
  GET_SIMILAR_MOVIES,
  GET_TRENDING_RECOMMENDATIONS,
  GET_TOP_RATED_MOVIES,
  GET_NEW_RELEASES,
  GET_RECOMMENDATIONS_BY_GENRE,
  GET_BECAUSE_YOU_WATCHED,
  GET_RECOMMENDATION_FEED,
} from './recommendationQueries';