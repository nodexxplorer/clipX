import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import * as SecureStore from 'expo-secure-store';
import { GRAPHQL_URL } from '@/constants/theme';

console.log('[Apollo] GraphQL endpoint:', GRAPHQL_URL);

// Custom fetch that injects auth token from SecureStore
const authFetchLink = createHttpLink({
    uri: GRAPHQL_URL,
    fetch: async (uri, options) => {
        let token: string | null = null;
        try {
            token = await SecureStore.getItemAsync('clipx_token');
        } catch { }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options?.headers as Record<string, string> || {}),
            ...(token ? { authorization: `Bearer ${token}` } : {}),
        };

        try {
            const response = await fetch(uri as string, { ...options, headers });
            return response;
        } catch (err) {
            console.error('[Apollo] Network error:', err);
            throw err;
        }
    },
});

const client = new ApolloClient({
    link: authFetchLink,
    cache: new InMemoryCache(),
    defaultOptions: {
        watchQuery: { fetchPolicy: 'cache-and-network' as const },
        query: { fetchPolicy: 'cache-first' as const },
    },
});

export default client;
