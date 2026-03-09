// src/graphql/client.js
import {
  ApolloClient, InMemoryCache, createHttpLink,
  from, ApolloLink
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

// HTTP connection to the API
const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/graphql',
});

// Authentication middleware
const authLink = setContext((_, { headers }) => {
  // Get token from localStorage (server-side safe check)
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Error handling
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      if (process.env.NODE_ENV === 'development') {
        console.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
      }
    });
  }
  if (networkError && process.env.NODE_ENV === 'development') {
    console.error(`[Network error]: ${networkError}`);
  }
});

// Cache configuration with sensible type policies
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Merge paginated search results
        searchMovies: {
          keyArgs: ['query'],
          merge(existing, incoming) {
            return incoming; // always replace search results
          },
        },
      },
    },
  },
});

// Create Apollo Client
// NOTE: This singleton is safe for client-side Next.js because auth is stored
// in localStorage (per-user), not in HTTP cookies shared across SSR requests.
// If you add SSR rendering with auth cookies in the future, use a per-request factory.
const client = new ApolloClient({
  ssrMode: typeof window === 'undefined',
  link: from([errorLink, authLink, httpLink]),
  cache,
  defaultOptions: {
    watchQuery: {
      // cache-and-network: show cached data instantly, then refresh in background
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      // cache-first: stable data (movies, genres) — no need to refetch every render
      // Override per-query for user-specific or time-sensitive data:
      //   useQuery(GET_CURRENT_USER, { fetchPolicy: 'network-only' })
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
  connectToDevTools: process.env.NODE_ENV === 'development',
});

export default client;