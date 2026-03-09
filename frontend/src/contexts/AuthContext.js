// src/contexts/AuthContext.js

/**
 * Authentication Context
 * Single login for both users and admins with role-based routing
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import apolloClient from '@/graphql/client';
import {
	LOGIN_MUTATION,
	REGISTER_MUTATION,
	GOOGLE_AUTH_MUTATION,
	UPDATE_PROFILE_MUTATION,
	LOGOUT_MUTATION
} from '@/graphql/mutations/authMutation';
// Note: ADMIN_LOGIN is not needed anymore - using regular LOGIN_MUTATION for all users
import { GET_CURRENT_USER } from '@/graphql/queries/userQueries';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const router = useRouter();

	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [needsOnboarding, setNeedsOnboarding] = useState(false);

	const client = apolloClient;

	// Fetch current user on mount (client-side only)
	const refetchUser = async () => {
		try {
			const { data } = await client.query({
				query: GET_CURRENT_USER,
				fetchPolicy: 'network-only', // always fresh — user data must be accurate
			});
			if (data?.me) {
				setUser(data.me);
				if (!data.me.name || data.me.name === '') {
					setNeedsOnboarding(true);
				}
			}
		} catch (err) {
			if (process.env.NODE_ENV === 'development') console.error('Error fetching user:', err);
		} finally {
			setLoading(false);
		}
	};

	// On mount, try to fetch current user (client-side only)
	useEffect(() => {
		if (typeof window === 'undefined') return;
		refetchUser();
	}, []);

	// Handle Google OAuth
	const handleGoogleAuth = async (credentialToken) => {
		try {
			setLoading(true);
			setError(null);


			const { data, errors } = await client.mutate({
				mutation: GOOGLE_AUTH_MUTATION,
				variables: { idToken: credentialToken },
			});


			if (errors && errors.length > 0) {
				throw new Error(errors[0].message);
			}

			if (data?.googleAuth) {
				const { token, user: authUser, isNewUser } = data.googleAuth;

				// Store token
				localStorage.setItem('token', token);
				if (authUser.role) {
					localStorage.setItem('role', authUser.role);
				}
				setUser(authUser);

				// Role-based routing
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
			if (process.env.NODE_ENV === 'development') console.error('Google auth error:', err);
			const message = err.message || 'Google authentication failed';
			setError(message);
			return { success: false, error: message };
		} finally {
			setLoading(false);
		}
	};

	// Email/Password Login - SIMPLIFIED (one mutation only)
	const login = async (email, password) => {
		try {
			setLoading(true);
			setError(null);


			const { data, errors } = await client.mutate({
				mutation: LOGIN_MUTATION,
				variables: { email, password },
			});

			if (errors && errors.length > 0) {
				throw new Error(errors[0].message);
			}

			if (data?.login) {
				const { token, user: authUser } = data.login;

				localStorage.setItem('token', token);
				if (authUser.role) {
					localStorage.setItem('role', authUser.role);
				}
				setUser(authUser);

				// Role-based routing
				if (authUser.role === 'admin') {
					router.push('/admin');
				} else if (!authUser.name) {
					setNeedsOnboarding(true);
					router.push('/auth/onboarding');
				} else {
					router.push('/dashboard');
				}

				return { success: true };
			}

			return { success: false, error: 'Invalid login response' };
		} catch (err) {
			const message = err.message || 'Login failed';
			if (process.env.NODE_ENV === 'development') console.error('❌ Login failed:', message);
			setError(message);
			return { success: false, error: message };
		} finally {
			setLoading(false);
		}
	};

	// Email/Password Registration
	const register = async (email, password) => {
		try {
			setLoading(true);
			setError(null);

			const { data, errors } = await client.mutate({
				mutation: REGISTER_MUTATION,
				variables: { input: { email, password } },
			});

			if (errors && errors.length > 0) {
				throw new Error(errors[0].message);
			}

			if (data?.register) {
				const { token, user: authUser } = data.register;

				localStorage.setItem('token', token);
				setUser(authUser);
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
	};

	// Complete user onboarding
	const completeOnboarding = async (name, preferences = {}) => {
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
							theme: preferences.theme,
							emailNotifications: preferences.emailNotifications,
							autoPlayTrailers: preferences.autoPlayTrailers
						}
					}
				},
			});

			if (errors && errors.length > 0) {
				throw new Error(errors[0].message);
			}

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
	};

	// Update profile — does NOT touch the global `loading` flag
	// (that flag is reserved for the initial auth check; profile saves
	//  use local `isSaving` state in profile.js instead)
	const updateProfile = async (input) => {
		try {
			setError(null);

			const { data, errors } = await client.mutate({
				mutation: UPDATE_PROFILE_MUTATION,
				variables: { input },
			});

			if (errors && errors.length > 0) {
				if (process.env.NODE_ENV === 'development') console.error('[Auth] GraphQL errors:', errors);
				throw new Error(errors[0].message);
			}

			if (!data || !data.updateProfile) {
				if (process.env.NODE_ENV === 'development') console.warn('[Auth] updateProfile: no data returned');
				return { success: false, error: 'Invalid update response' };
			}

			setUser(data.updateProfile);
			return { success: true };

		} catch (err) {
			if (process.env.NODE_ENV === 'development') console.error('[Auth] updateProfile error:', err);
			const message = err.message || 'Failed to update profile';
			setError(message);
			return { success: false, error: message };
		}
	};

	// Logout
	const logout = async () => {
		try {
			await client.mutate({ mutation: LOGOUT_MUTATION });
		} catch (err) {
			console.error('Logout error:', err);
		} finally {
			localStorage.removeItem('token');
			localStorage.removeItem('role');
			localStorage.removeItem('admin_token');
			setUser(null);
			setNeedsOnboarding(false);

			try {
				await client.resetStore();
			} catch (e) {
				// ignore
			}
			router.push('/auth/login');
		}
	};

	const value = {
		user,
		loading,
		error,
		isAuthenticated: !!user,
		needsOnboarding,
		login,
		register,
		handleGoogleAuth,
		completeOnboarding,
		updateProfile,
		logout,
		clearError: () => setError(null)
	};

	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}

export default AuthContext;