// src/graphql/queries/castQueries.js
export const GET_CAST_MEMBER = gql`
  query GetCastMember($id: ID!) {
    castMember(id: $id) {
      id
      name
      biography
      birthday
      profileImage
      knownFor
      movies {
        id
        title
        posterUrl
        character
        year
      }
    }
  }
`;

export const SEARCH_CAST = gql`
  query SearchCast($query: String!, $limit: Int) {
    searchCast(query: $query, limit: $limit) {
      id
      name
      profileImage
      knownFor
    }
  }
`;