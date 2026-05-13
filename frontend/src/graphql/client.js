// src/graphql/client.js

import { ApolloClient, InMemoryCache, createHttpLink, from, Observable } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { refreshAccessToken } from '@/lib/tokenRefresh';

const httpLink = createHttpLink({
  uri: '/api/graphql',  // Routed through our API proxy which forwards Set-Cookie headers
  credentials: 'include', // sends the httpOnly auth_token cookie automatically
  headers: {
    'X-Requested-With': 'XMLHttpRequest', // CSRF protection — required by backend middleware
  },
});

// Token refresh is handled by the shared singleton in lib/tokenRefresh.js
// to prevent concurrent refresh calls from different call sites
// (Apollo, watch page, AuthContext) that would trigger theft detection.


const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    for (const { message, extensions } of graphQLErrors) {
      if (process.env.NODE_ENV === 'development') {
        console.error(
          `[GraphQL] op=${operation.operationName} msg="${message}"`
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
        // Don't immediately log the user out — try refreshing first
        return new Observable((observer) => {
          refreshAccessToken().then((success) => {
            if (success) {
              // Retry the original operation with fresh cookies
              const subscriber = forward(operation).subscribe({
                next: observer.next.bind(observer),
                error: observer.error.bind(observer),
                complete: observer.complete.bind(observer),
              });
              return () => subscriber.unsubscribe();
            } else {
              // Refresh truly failed — session is gone
              window.dispatchEvent(new CustomEvent('clipx:session-expired'));
              observer.error(graphQLErrors[0]);
            }
          });
        });
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