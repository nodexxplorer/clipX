// src/pages/_app.js
import { ApolloProvider } from '@apollo/client/react';
import client from '@/graphql/client';
import Layout from '@/components/layout/Layout';
import { useRouter } from 'next/router';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import '@/styles/globals.css';

function MyApp({ Component, pageProps }) {
  // Use custom layout if component has one. For admin routes we prefer
  // to avoid the public site `Layout` (header/footer), so skip it.
  const router = useRouter();
  const isAdminRoute = router.pathname?.startsWith('/admin');
  const getLayout = Component.getLayout || ((page) => isAdminRoute ? page : <Layout>{page}</Layout>);

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
    <AuthProvider>
      <ThemeProvider>
        <ApolloProvider client={client}>
          {getLayout(<Component {...pageProps} />)}
        </ApolloProvider>
      </ThemeProvider>
    </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default MyApp;