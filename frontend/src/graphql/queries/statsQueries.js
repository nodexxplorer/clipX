
// src/graphql/queries/statsQueries.js
export const GET_SITE_STATS = gql`
  query GetSiteStats {
    siteStats {
      totalMovies
      totalDownloads
      totalUsers
      totalGenres
      popularToday {
        id
        title
        posterUrl
      }
    }
  }
`;

export const GET_MOVIE_STATS = gql`
  query GetMovieStats($movieId: ID!) {
    movieStats(movieId: $movieId) {
      views
      downloads
      averageRating
      totalRatings
      popularityRank
    }
  }
`;