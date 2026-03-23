import { gql } from '@apollo/client';

// === Movie Fragments ===
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

export const MOVIE_WITH_GENRES = gql`
  fragment MovieWithGenres on Movie {
    ...MovieFields
    genres { id name slug }
  }
  ${MOVIE_FRAGMENT}
`;

// === Queries ===
export const GET_HOME_DATA = gql`
  query GetHomePageData($trendingLimit: Int, $popularLimit: Int) {
    trending(limit: $trendingLimit) { ...MovieWithGenres }
    popular(limit: $popularLimit) { ...MovieWithGenres }
    genres { id name slug movieCount }
  }
  ${MOVIE_WITH_GENRES}
`;

export const GET_MOVIE = gql`
  query GetMovie($id: ID!) {
    movie(id: $id) {
      ...MovieWithGenres
      tagline description status trailerUrl
      cast { id name character profileImage }
      seasons { id seasonNumber episodes { id title episodeNumber seasonNumber } }
      recommendations { ...MovieFields }
    }
  }
  ${MOVIE_WITH_GENRES}
  ${MOVIE_FRAGMENT}
`;

export const SEARCH_MOVIES = gql`
  query SearchMovies($query: String!, $limit: Int) {
    searchMovies(query: $query, limit: $limit) {
      items { ...MovieFields genres { id name } }
      totalCount
      hasMore
    }
  }
  ${MOVIE_FRAGMENT}
`;

export const GET_MOVIES = gql`
  query GetMovies($limit: Int, $offset: Int, $sort: String, $filter: MovieFilter) {
    movies(limit: $limit, offset: $offset, sort: $sort, filter: $filter) {
      movies { ...MovieWithGenres }
      total
      hasMore
    }
  }
  ${MOVIE_WITH_GENRES}
`;

export const GET_STREAMING_URL = gql`
  query GetStreamingUrl($movieId: ID!, $season: Int, $episode: Int) {
    streamingUrl(movieId: $movieId, season: $season, episode: $episode)
  }
`;

export const GET_TRENDING = gql`
  query GetTrending($limit: Int) {
    trending(limit: $limit) { ...MovieWithGenres }
  }
  ${MOVIE_WITH_GENRES}
`;

// === User Queries ===
export const GET_ME = gql`
  query GetCurrentUser {
    me {
      id email name avatar bio role createdAt
      preferences { favoriteGenres theme emailNotifications autoPlayTrailers }
      stats { moviesWatched totalWatchTime }
    }
  }
`;

export const GET_WATCHLIST = gql`
  query GetWatchlist {
    watchlist {
      id
      movies { id title description year rating posterUrl genres { name } }
    }
  }
`;

export const GET_DASHBOARD = gql`
  query GetDashboardData {
    dashboardData {
      watchlist { id title posterUrl rating releaseDate }
      recentlyViewed { id title posterUrl rating }
      continueWatching {
        id
        movie { id title backdropUrl posterUrl durationMinutes }
        currentTime duration
      }
      stats { moviesWatched totalWatchTime monthlyWatchTime watchlistCount reviewsWritten }
    }
  }
`;

export const GET_NOTIFICATIONS = gql`
  query GetNotifications {
    notifications { id title message type actionUrl isRead createdAt }
  }
`;

// === Mutations ===
export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user { id email name avatar role }
    }
  }
`;

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user { id email name avatar role }
    }
  }
`;

export const TOGGLE_WATCHLIST = gql`
  mutation ToggleWatchlist($movieId: ID!) {
    toggleWatchlist(movieId: $movieId) {
      added
      message
    }
  }
`;

export const ADD_REVIEW = gql`
  mutation AddReview($movieId: ID!, $content: String!, $rating: Int!) {
    addReview(movieId: $movieId, content: $content, rating: $rating) {
      id content rating createdAt
    }
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($name: String, $bio: String, $avatar: String) {
    updateProfile(name: $name, bio: $bio, avatar: $avatar) {
      id name bio avatar
    }
  }
`;
