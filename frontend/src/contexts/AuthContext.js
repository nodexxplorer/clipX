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
				fetchPolicy: 'network-only' 
			});
			if (data?.me) {
				setUser(data.me);
				if (!data.me.name || data.me.name === '') {
					setNeedsOnboarding(true);
				}
			}
		} catch (err) {
			console.error('Error fetching user:', err);
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

			console.log('Sending Google credential to backend...');

			const { data, errors } = await client.mutate({
				mutation: GOOGLE_AUTH_MUTATION,
				variables: { idToken: credentialToken },
			});

			console.log('Google auth response:', data, errors);

			if (errors && errors.length > 0) {
				throw new Error(errors[0].message);
			}

			if (data?.googleAuth) {
				const { token, user: authUser, isNewUser } = data.googleAuth;

				// Store token
				localStorage.setItem('token', token);
				setUser(authUser);

				// Role-based routing
				if (authUser.role === 'admin') {
					console.log('✅ Admin detected via Google - redirecting to /admin');
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
			console.error('Google auth error:', err);
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

			console.log('🔐 Logging in:', email);

			const { data, errors } = await client.mutate({
				mutation: LOGIN_MUTATION,
				variables: { email, password },
			});

			if (errors && errors.length > 0) {
				throw new Error(errors[0].message);
			}

			if (data?.login) {
				const { token, user: authUser } = data.login;

				console.log('✅ Login successful!');
				console.log('👤 User:', authUser);
				console.log('🎭 Role:', authUser.role);

				// Store token
				localStorage.setItem('token', token);
				setUser(authUser);

				// Role-based routing
				if (authUser.role === 'admin') {
					console.log('📍 Redirecting admin to: /admin');
					router.push('/admin');
				} else if (!authUser.name) {
					console.log('📍 New user - redirecting to onboarding');
					setNeedsOnboarding(true);
					router.push('/auth/onboarding');
				} else {
					console.log('📍 Regular user - redirecting to: /dashboard');
					router.push('/dashboard');
				}

				return { success: true };
			}

			return { success: false, error: 'Invalid login response' };
		} catch (err) {
			const message = err.message || 'Login failed';
			console.error('❌ Login failed:', message);
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
		} catch (err) {
			const message = err.message || 'Failed to update profile';
			setError(message);
			return { success: false, error: message };
		} finally {
			setLoading(false);
		}
	};

	// Update profile
	const updateProfile = async (input) => {
		try {
			setLoading(true);
			setError(null);

			console.log('[Auth] updateProfile called with:', input);

			const { data, errors } = await client.mutate({
				mutation: UPDATE_PROFILE_MUTATION,
				variables: { input },
			});

			console.log('[Auth] GraphQL response data:', data);
			console.log('[Auth] GraphQL response errors:', errors);

			if (errors && errors.length > 0) {
				console.error('[Auth] GraphQL errors:', errors);
				throw new Error(errors[0].message);
			}

			if (!data) {
				console.error('[Auth] No data returned from mutation');
				return { success: false, error: 'No response from server' };
			}

			if (!data.updateProfile) {
				console.error('[Auth] updateProfile field missing from response');
				console.log('[Auth] Available fields:', Object.keys(data));
				return { success: false, error: 'Invalid update response' };
			}

			console.log('[Auth] Update successful, new user data:', data.updateProfile);
			setUser(data.updateProfile);
			return { success: true };

		} catch (err) {
			console.error('[Auth] updateProfile error:', err);
			const message = err.message || 'Failed to update profile';
			setError(message);
			return { success: false, error: message };
		} finally {
			setLoading(false);
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