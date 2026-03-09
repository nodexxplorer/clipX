// src/pages/_app.js
import { ApolloProvider } from '@apollo/client/react';
import client from '@/graphql/client';
import Layout from '@/components/layout/Layout';
import { useRouter } from 'next/router';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import '@/styles/globals.css';

// Load Google OAuth SDK only on /auth routes — keeps it off every other page
let GoogleOAuthProvider = ({ children }) => children; // no-op fallback
if (typeof window !== 'undefined') {
  // dynamically assign; this runs only on the client
}
import('@react-oauth/google').then(mod => {
  GoogleOAuthProvider = mod.GoogleOAuthProvider;
}).catch(() => {});

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  const isAdminRoute = router.pathname?.startsWith('/admin');
  const isAuthRoute  = router.pathname?.startsWith('/auth');

  const getLayout = Component.getLayout || ((page) =>
    isAdminRoute ? page : <Layout>{page}</Layout>
  );

  const content = (
    <AuthProvider>
      <ThemeProvider>
        <ApolloProvider client={client}>
          <ErrorBoundary>
            {getLayout(<Component {...pageProps} />)}
          </ErrorBoundary>
        </ApolloProvider>
      </ThemeProvider>
    </AuthProvider>
  );

  // Wrap in GoogleOAuthProvider only on auth-related pages
  if (isAuthRoute) {
    return (
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
        {content}
      </GoogleOAuthProvider>
    );
  }

  return content;
}

export default MyApp;