// src/contexts/AuthContext.js

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { gql } from '@apollo/client';
import apolloClient from '@/graphql/client';
import {
  LOGIN_MUTATION,
  REGISTER_MUTATION,
  GOOGLE_AUTH_MUTATION,
  UPDATE_PROFILE_MUTATION,
  LOGOUT_MUTATION,
  VERIFY_EMAIL_MUTATION,
  RESEND_VERIFICATION_MUTATION,
} from '@/graphql/mutations/authMutation';

// ---------------------------------------------------------------------------
// GET_CURRENT_USER
// ---------------------------------------------------------------------------
const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    me {
      id
      email
      name
      avatar
      bio
      role
      subscriptionTier
      emailVerified
      referralCount
      createdAt
      preferences {
        favoriteGenres
        theme
        emailNotifications
        autoPlayTrailers
      }
      stats {
        moviesWatched
        totalWatchTime
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const client = apolloClient;

  const [user,                    setUser]                    = useState(null);
  const [loading,                 setLoading]                 = useState(true);
  const [error,                   setError]                   = useState(null);
  const [needsOnboarding,         setNeedsOnboarding]         = useState(false);
  const [needsEmailVerification,  setNeedsEmailVerification]  = useState(false);

  // -------------------------------------------------------------------------
  // refetchUser — calls `me` over the wire; the httpOnly cookie is sent
  // automatically by the browser. No token read from JS.
  // -------------------------------------------------------------------------
  const refetchUser = useCallback(async () => {
    try {
      const { data } = await client.query({
        query: GET_CURRENT_USER,
        fetchPolicy: 'network-only',
      });
      if (data?.me) {
        setUser(data.me);
        const emailNotVerified = !data.me.emailVerified;
        setNeedsEmailVerification(emailNotVerified);
        // Only flag onboarding if email IS verified but name is missing
        setNeedsOnboarding(!emailNotVerified && !data.me.name);
      } else {
        setUser(null);
        setNeedsEmailVerification(false);
      }
    } catch (err) {
      const isAuthErr = err?.graphQLErrors?.some(e => {
        const m = e.message?.toLowerCase() ?? '';
        return m.includes('unauthorized') || m.includes('not authenticated');
      });
      if (isAuthErr) {
        setUser(null);
        setNeedsEmailVerification(false);
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('[Auth] refetchUser error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [client]);

  // Initial auth check on mount — purely driven by the cookie
  useEffect(() => {
    refetchUser();
  }, [refetchUser]);

  // Silent re-fetch every 6 hours to keep user state fresh
  useEffect(() => {
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    const id = setInterval(refetchUser, SIX_HOURS);
    return () => clearInterval(id);
  }, [refetchUser]);

  // Background token refresh every 12 minutes while logged in
  useEffect(() => {
    if (!user) return;
    const TWELVE_MINUTES = 12 * 60 * 1000;
    const refreshToken = async () => {
      try {
        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) {
          console.warn('[Auth] Background token refresh returned', res.status);
        }
      } catch (err) {
        console.warn('[Auth] Background token refresh failed:', err.message);
      }
    };
    const id = setInterval(refreshToken, TWELVE_MINUTES);
    return () => clearInterval(id);
  }, [user]);

  // Listen for session-expired events emitted by the Apollo error link
  useEffect(() => {
    const handle = () => {
      setUser(null);
      setNeedsEmailVerification(false);
      setNeedsOnboarding(false);
      client.clearStore();
    };
    window.addEventListener('clipx:session-expired', handle);
    return () => window.removeEventListener('clipx:session-expired', handle);
  }, [client]);

  // -------------------------------------------------------------------------
  // _handlePostAuthRedirect — centralised post-authentication routing
  // -------------------------------------------------------------------------
  const _handlePostAuthRedirect = useCallback((authUser, isNewUser = false) => {
    // 1. Email not verified → verification page
    if (!authUser.emailVerified) {
      setNeedsEmailVerification(true);
      router.push('/auth/verify-email');
      return;
    }
    setNeedsEmailVerification(false);

    // 2. Admin → admin dashboard
    if (authUser.role === 'admin') {
      router.push('/admin');
      return;
    }

    // 3. New user or missing profile name → onboarding
    if (isNewUser || !authUser.name) {
      setNeedsOnboarding(true);
      router.push('/auth/onboarding');
      return;
    }

    // 4. Normal user → dashboard
    router.push('/dashboard');
  }, [router]);

  // -------------------------------------------------------------------------
  // login
  // -------------------------------------------------------------------------
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const { data, errors } = await client.mutate({
        mutation: LOGIN_MUTATION,
        variables: { email, password },
      });

      if (errors?.length) throw new Error(errors[0].message);

      const result = data?.login;
      if (!result?.user) {
        return { success: false, error: 'Invalid login response' };
      }

      // Cookie is set by the server — we only keep the user object in state
      setUser(result.user);
      _handlePostAuthRedirect(result.user);

      return { success: true };
    } catch (err) {
      const message = err.message || 'Login failed';
      if (process.env.NODE_ENV === 'development') console.error('[Auth] login:', message);
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [client, _handlePostAuthRedirect]);

  // -------------------------------------------------------------------------
  // register — always redirects to email verification after signup
  // -------------------------------------------------------------------------
  const register = useCallback(async (email, password, name, referralCode) => {
    try {
      setLoading(true);
      setError(null);

      const { data, errors } = await client.mutate({
        mutation: REGISTER_MUTATION,
        variables: { input: { email, password, name, referralCode } },
      });

      if (errors?.length) throw new Error(errors[0].message);

      if (data?.register?.user) {
        // Cookie set by server; store the user object
        setUser(data.register.user);
        // New accounts always require email verification first
        setNeedsEmailVerification(true);
        router.push('/auth/verify-email');
        return { success: true };
      }

      return { success: false, error: 'Invalid registration response' };
    } catch (err) {
      const message = err.message || 'Registration failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [client, router]);

  // -------------------------------------------------------------------------
  // Google OAuth — Google-verified emails skip email verification
  // -------------------------------------------------------------------------
  const handleGoogleAuth = useCallback(async (credentialToken) => {
    try {
      setLoading(true);
      setError(null);

      const { data, errors } = await client.mutate({
        mutation: GOOGLE_AUTH_MUTATION,
        variables: { idToken: credentialToken },
      });

      if (errors?.length) throw new Error(errors[0].message);

      if (data?.googleAuth?.user) {
        const { user: authUser, isNewUser } = data.googleAuth;
        // Cookie set by server
        setUser(authUser);
        _handlePostAuthRedirect(authUser, isNewUser);
        return { success: true };
      }

      return { success: false, error: 'Invalid response from server' };
    } catch (err) {
      const message = err.message || 'Google authentication failed';
      if (process.env.NODE_ENV === 'development') console.error('[Auth] googleAuth:', message);
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [client, _handlePostAuthRedirect]);

  // -------------------------------------------------------------------------
  // verifyEmail — called from the verify-email page with token from URL
  // -------------------------------------------------------------------------
  const verifyEmail = useCallback(async (token) => {
    try {
      setError(null);

      const { data, errors } = await client.mutate({
        mutation: VERIFY_EMAIL_MUTATION,
        variables: { token },
      });

      if (errors?.length) throw new Error(errors[0].message);

      if (data?.verifyEmail?.success) {
        // Refresh user state to pick up the new emailVerified: true
        await refetchUser();
        setNeedsEmailVerification(false);
        return { success: true, message: data.verifyEmail.message };
      }

      return { success: false, error: 'Verification failed' };
    } catch (err) {
      const message = err.message || 'Email verification failed';
      setError(message);
      return { success: false, error: message };
    }
  }, [client, refetchUser]);

  // -------------------------------------------------------------------------
  // resendVerificationEmail
  // -------------------------------------------------------------------------
  const resendVerificationEmail = useCallback(async () => {
    try {
      setError(null);

      const { data, errors } = await client.mutate({
        mutation: RESEND_VERIFICATION_MUTATION,
      });

      if (errors?.length) throw new Error(errors[0].message);

      if (data?.resendVerification?.success) {
        return { success: true, message: data.resendVerification.message };
      }

      return { success: false, error: 'Failed to resend verification email' };
    } catch (err) {
      const message = err.message || 'Failed to resend verification email';
      setError(message);
      return { success: false, error: message };
    }
  }, [client]);

  // -------------------------------------------------------------------------
  // completeOnboarding
  // -------------------------------------------------------------------------
  const completeOnboarding = useCallback(async (name, preferences = {}) => {
    try {
      setLoading(true);
      setError(null);

      const { data, errors } = await client.mutate({
        mutation: UPDATE_PROFILE_MUTATION,
        variables: {
          input: {
            name,
            favoriteGenres: preferences.genres || [],
            preferences: {
              theme:               preferences.theme,
              emailNotifications:  preferences.emailNotifications,
              autoPlayTrailers:    preferences.autoPlayTrailers,
            },
          },
        },
      });

      if (errors?.length) throw new Error(errors[0].message);

      if (data?.updateProfile) {
        setUser(data.updateProfile);
        setNeedsOnboarding(false);
        router.push('/dashboard');
        return { success: true };
      }

      return { success: false, error: 'Invalid response from server' };
    } catch (err) {
      const message = err.message || 'Failed to update profile';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [client, router]);

  // -------------------------------------------------------------------------
  // updateProfile
  // -------------------------------------------------------------------------
  const updateProfile = useCallback(async (input) => {
    try {
      setError(null);

      const { data, errors } = await client.mutate({
        mutation: UPDATE_PROFILE_MUTATION,
        variables: { input },
      });

      if (errors?.length) throw new Error(errors[0].message);

      if (data?.updateProfile) {
        setUser(data.updateProfile);
        return { success: true };
      }

      return { success: false, error: 'Invalid update response' };
    } catch (err) {
      const message = err.message || 'Failed to update profile';
      if (process.env.NODE_ENV === 'development') console.error('[Auth] updateProfile:', message);
      setError(message);
      return { success: false, error: message };
    }
  }, [client]);

  // -------------------------------------------------------------------------
  // logout
  // -------------------------------------------------------------------------
  const logout = useCallback(async () => {
    try {
      await client.mutate({ mutation: LOGOUT_MUTATION });
    } catch (err) {
      // Proceed with client-side logout even if the server call fails
      if (process.env.NODE_ENV === 'development') console.error('[Auth] logout error:', err);
    } finally {
      setUser(null);
      setNeedsOnboarding(false);
      setNeedsEmailVerification(false);
      try {
        await client.resetStore();
      } catch {
        // Ignore reset errors
      }
      router.push('/auth/login');
    }
  }, [client, router]);

  // -------------------------------------------------------------------------
  // Context value
  // -------------------------------------------------------------------------
  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    needsOnboarding,
    needsEmailVerification,
    // Derived convenience flags — read from server-verified user object only
    isAdmin:          user?.role === 'admin',
    isPremium:        ['standard', 'pro'].includes(user?.subscriptionTier),
    isEmailVerified:  user?.emailVerified ?? false,
    // Actions
    login,
    register,
    handleGoogleAuth,
    verifyEmail,
    resendVerificationEmail,
    completeOnboarding,
    updateProfile,
    logout,
    refetchUser,
    clearError: () => setError(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export default AuthContext;