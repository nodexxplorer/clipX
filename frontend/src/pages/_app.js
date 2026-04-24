// src/pages/_app.js
import { useEffect } from 'react';
import { ApolloProvider } from '@apollo/client/react';
import client from '@/graphql/client';
import Layout from '@/components/layout/Layout';
import { useRouter } from 'next/router';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { I18nProvider } from '@/lib/i18n';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import OnboardingTour from '@/components/common/OnboardingTour';
import WhatsNewPopup from '@/components/common/WhatsNewPopup';
import CookieConsent from '@/components/CookieConsent';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { initWebVitals } from '@/lib/webVitals';
import '@/styles/globals.css';
import '@/styles/globals-a11y.css';

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

  // Initialize Real User Monitoring (Section 17)
  useEffect(() => { initWebVitals(); }, []);

  const isAdminRoute = router.pathname?.startsWith('/admin');
  const isAuthRoute = router.pathname?.startsWith('/auth');

  const getLayout = Component.getLayout || ((page) =>
    isAdminRoute ? page : <Layout>{page}</Layout>
  );

  const content = (
    <AuthProvider>
      <ThemeProvider>
        <I18nProvider>
          <ApolloProvider client={client}>
            <ErrorBoundary>
              {/* WCAG Skip Link */}
              <a href="#main-content" className="skip-link">Skip to main content</a>
              <main id="main-content">
                {getLayout(<Component {...pageProps} />)}
              </main>
              {!isAdminRoute && <OnboardingTour />}
              {!isAdminRoute && <WhatsNewPopup />}
              <CookieConsent />
            </ErrorBoundary>
          </ApolloProvider>
        </I18nProvider>
      </ThemeProvider>
    </AuthProvider>
  );

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
      {content}
    </GoogleOAuthProvider>
  );
}

export default MyApp;
