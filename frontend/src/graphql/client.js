// src/graphql/client.js

import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/graphql',
  credentials: 'include', // sends the httpOnly auth_token cookie automatically
});

const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    for (const { message, path, extensions } of graphQLErrors) {
      if (process.env.NODE_ENV === 'development') {
        console.error(
          `[GraphQL] op=${operation.operationName} path=${JSON.stringify(path)} msg="${message}"`
        );
      }

      const code = extensions?.code ?? '';
      const msg  = (message ?? '').toLowerCase();
      const isAuthFailure =
        code === 'UNAUTHENTICATED' ||
        code === '401'             ||
        msg.includes('not authenticated') ||
        msg.includes('unauthorized')      ||
        msg.includes('invalid token')     ||
        msg.includes('expired token')     ||
        msg.includes('jwt');

      if (isAuthFailure && typeof window !== 'undefined') {
        // AuthContext listens for this event and calls logout()
        window.dispatchEvent(new CustomEvent('clipx:session-expired'));
      }
    }
  }

  if (networkError && process.env.NODE_ENV === 'development') {
    console.error(`[Network] ${networkError}`);
  }
});

// ---------------------------------------------------------------------------
// Apollo cache with sensible type policies
// ---------------------------------------------------------------------------
const cache = new InMemoryCache({
  typePolicies: {
    User: { keyFields: ['id'] },
    Query: {
      fields: {
        // Replace search results on every new search — don't merge pages
        searchMovies: {
          keyArgs: ['query'],
          merge(_existing, incoming) {
            return incoming;
          },
        },
      },
    },
  },
});

// ---------------------------------------------------------------------------
// Client singleton
//
// SSR note: this is a client-side singleton. Cookie auth works correctly here
// because each browser has its own cookie jar. If you add Next.js SSR pages
// that need auth, create a per-request client using makeApolloClient(cookie)
// and forward the Cookie header from the incoming SSR request.
// ---------------------------------------------------------------------------
const client = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
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