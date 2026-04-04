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
} from '@/graphql/mutations/authMutation';

// ---------------------------------------------------------------------------
// GET_CURRENT_USER — includes subscriptionTier so withPremium works correctly
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

  const [user,            setUser]            = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

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
        if (!data.me.name) setNeedsOnboarding(true);
      } else {
        setUser(null);
      }
    } catch (err) {
      const isAuthErr = err?.graphQLErrors?.some(e => {
        const m = e.message?.toLowerCase() ?? '';
        return m.includes('unauthorized') || m.includes('not authenticated');
      });
      if (isAuthErr) setUser(null);
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

  // Listen for session-expired events emitted by the Apollo error link
  useEffect(() => {
    const handle = () => {
      setUser(null);
      client.clearStore();
    };
    window.addEventListener('clipx:session-expired', handle);
    return () => window.removeEventListener('clipx:session-expired', handle);
  }, [client]);

  // -------------------------------------------------------------------------
  // login
  // The backend sets the httpOnly cookie in the Set-Cookie response header.
  // We extract the user object from the mutation response and put it in state.
  // Nothing is written to localStorage.
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

      if (result.user.role === 'admin') {
        router.push('/admin');
      } else if (!result.user.name) {
        setNeedsOnboarding(true);
        router.push('/auth/onboarding');
      } else {
        router.push('/dashboard');
      }

      return { success: true };
    } catch (err) {
      const message = err.message || 'Login failed';
      if (process.env.NODE_ENV === 'development') console.error('[Auth] login:', message);
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [client, router]);

  // -------------------------------------------------------------------------
  // register
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
        // Cookie set by server; we store only the user object
        setUser(data.register.user);
        setNeedsOnboarding(true);
        router.push('/auth/onboarding');
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
  // Google OAuth
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

        if (authUser.role === 'admin') {
          router.push('/admin');
        } else if (isNewUser || !authUser.name) {
          setNeedsOnboarding(true);
          router.push('/auth/onboarding');
        } else {
          router.push('/dashboard');
        }

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
  }, [client, router]);

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
  // updateProfile — does NOT set the global loading flag so profile pages can
  // use their own local isSaving state without freezing the nav.
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
  // Calls the backend mutation so the server clears the httpOnly cookie via
  // Set-Cookie: auth_token=; Max-Age=0. Then we clear Apollo's cache so no
  // stale user data lingers in memory.
  // Nothing in localStorage needs to be touched.
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
    // Derived convenience flags — read from server-verified user object only
    isAdmin:   user?.role === 'admin',
    isPremium: ['standard', 'pro'].includes(user?.subscriptionTier),
    // Actions
    login,
    register,
    handleGoogleAuth,
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