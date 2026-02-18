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
  GET_USER_PREFERENCES,
  GET_WATCH_HISTORY,
  GET_WATCHLIST,
} from './genreQueries';

// Cast Queries
export {
  GET_CAST_MEMBER,
  SEARCH_CAST,
} from './genreQueries';

// Stats Queries
export {
  GET_SITE_STATS,
  GET_MOVIE_STATS,
} from './genreQueries';

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