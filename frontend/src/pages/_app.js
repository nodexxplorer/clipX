// src/pages/_app.js
import { useEffect } from 'react';
import { ApolloProvider } from '@apollo/client/react';
import client from '@/graphql/client';
import Layout from '@/components/layout/Layout';
import { useRouter } from 'next/router';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import OnboardingTour from '@/components/common/OnboardingTour';
import WhatsNewPopup from '@/components/common/WhatsNewPopup';
import { GoogleOAuthProvider } from '@react-oauth/google';
import '@/styles/globals.css';

// Register service worker for PWA support
function useServiceWorker() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => { });
    }
  }, []);
}

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  useServiceWorker();

  const isAdminRoute = router.pathname?.startsWith('/admin');
  const isAuthRoute = router.pathname?.startsWith('/auth');

  const getLayout = Component.getLayout || ((page) =>
    isAdminRoute ? page : <Layout>{page}</Layout>
  );

  const content = (
    <AuthProvider>
      <ThemeProvider>
        <ApolloProvider client={client}>
          <ErrorBoundary>
            {getLayout(<Component {...pageProps} />)}
            {!isAdminRoute && <OnboardingTour />}
            {!isAdminRoute && <WhatsNewPopup />}
          </ErrorBoundary>
        </ApolloProvider>
      </ThemeProvider>
    </AuthProvider>
  );

  // Wrap in GoogleOAuthProvider only on auth-related pages
  if (isAuthRoute) {
    return (
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
        {content}
      </GoogleOAuthProvider>
    );
  }

  return content;
}

export default MyApp;
