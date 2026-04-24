// src/graphql/client.js

import { ApolloClient, InMemoryCache, createHttpLink, from, Observable } from '@apollo/client';
import { onError } from '@apollo/client/link/error';

const httpLink = createHttpLink({
  uri: '/api/graphql',  // Routed through our API proxy which forwards Set-Cookie headers
  credentials: 'include', // sends the httpOnly auth_token cookie automatically
  headers: {
    'X-Requested-With': 'XMLHttpRequest', // CSRF protection — required by backend middleware
  },
});

// ---------------------------------------------------------------------------
// Token refresh state — shared across all concurrent operations
// ---------------------------------------------------------------------------
let _isRefreshing = false;
let _pendingRefreshSubscribers = [];

function subscribeToRefresh(callback) {
  _pendingRefreshSubscribers.push(callback);
}

function onRefreshComplete(success) {
  _pendingRefreshSubscribers.forEach((cb) => cb(success));
  _pendingRefreshSubscribers = [];
}


async function attemptTokenRefresh() {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}


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
          const retryOrReject = (refreshSuccess) => {
            if (refreshSuccess) {
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
          };

          if (!_isRefreshing) {
            _isRefreshing = true;
            attemptTokenRefresh().then((success) => {
              _isRefreshing = false;
              onRefreshComplete(success);
              retryOrReject(success);
            });
          } else {
            // Another operation already triggered a refresh — wait for it
            subscribeToRefresh(retryOrReject);
          }
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