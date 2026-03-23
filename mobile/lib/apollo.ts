import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import * as SecureStore from 'expo-secure-store';
import { GRAPHQL_URL } from '@/constants/theme';

const httpLink = createHttpLink({
    uri: GRAPHQL_URL,
});

const authLink = setContext(async (_, { headers }) => {
    let token: string | null = null;
    try {
        token = await SecureStore.getItemAsync('clipx_token');
    } catch { }
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : '',
        },
    };
});

const client = new ApolloClient({
    link: ApolloLink.from([authLink, httpLink]),
    cache: new InMemoryCache(),
    defaultOptions: {
        watchQuery: { fetchPolicy: 'cache-and-network' },
        query: { fetchPolicy: 'cache-first' },
    },
});

export default client;
