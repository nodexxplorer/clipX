import { Redirect } from 'expo-router';

/**
 * Redirect standalone /search to the search tab
 */
export default function SearchRedirect() {
    return <Redirect href="/(tabs)/search" />;
}
