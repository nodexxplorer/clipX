import React, {
    createContext, useContext, useState, useEffect,
    useCallback, type ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useMutation, useLazyQuery } from '@apollo/client/react';
import {
    LOGIN, REGISTER, GOOGLE_AUTH, DELETE_ACCOUNT, GET_ME,
} from '@/lib/graphql';
import type { User, AuthState } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MeData      { me: User }
interface RegisterData { register: { token: string; user: User } }
interface GoogleAuthData { googleAuth: { token: string; user: User; isNewUser: boolean } }

interface AuthContextType extends AuthState {
    needsOnboarding: boolean;
    login:         (email: string, password: string) => Promise<void>;
    register:      (name: string, email: string, password: string, referralCode?: string) => Promise<void>;
    googleAuth:    (idToken: string) => Promise<void>;
    logout:        () => Promise<void>;
    refreshUser:   () => Promise<void>;
    deleteAccount: (password?: string) => Promise<void>;
    completeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null, token: null, isAuthenticated: false,
    isLoading: true, needsOnboarding: false,
    login: async () => {},
    register: async () => {},
    googleAuth: async () => {},
    logout: async () => {},
    refreshUser: async () => {},
    deleteAccount: async () => {},
    completeOnboarding: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();

    const [state, setState] = useState<AuthState>({
        user: null, token: null, isAuthenticated: false, isLoading: true,
    });
    // Item 8: track whether new users need to go through onboarding
    const [needsOnboarding, setNeedsOnboarding] = useState(false);

    const [loginMutation]        = useMutation<{ login: any }>(LOGIN);
    const [registerMutation]     = useMutation<RegisterData>(REGISTER);
    const [googleAuthMutation]   = useMutation<GoogleAuthData>(GOOGLE_AUTH);
    const [deleteAccountMutation]= useMutation<{ deleteAccount: { success: boolean; message: string } }>(DELETE_ACCOUNT);
    const [fetchMe]              = useLazyQuery<MeData>(GET_ME, { fetchPolicy: 'network-only' });

    // ── On mount: restore session from SecureStore ──────────────────────────
    useEffect(() => {
        (async () => {
            try {
                const token = await SecureStore.getItemAsync('clipx_token');
                if (token) {
                    const { data } = await fetchMe();
                    if (data?.me) {
                        setState({ user: data.me, token, isAuthenticated: true, isLoading: false });
                        return;
                    }
                }
            } catch { /* token expired or invalid — fall through */ }
            setState(s => ({ ...s, isLoading: false }));
        })();
    }, []);

    // ── Login ───────────────────────────────────────────────────────────────
    const login = useCallback(async (email: string, password: string) => {
        const { data } = await loginMutation({ variables: { email, password } });
        if (!data?.login) throw new Error('Login failed');

        // Backend returns AuthResponse (token + user) as a JSON scalar
        const result = typeof data.login === 'string' ? JSON.parse(data.login) : data.login;
        if (!result.token) throw new Error('Login failed — no token received');

        await SecureStore.setItemAsync('clipx_token', result.token);
        setState({ user: result.user, token: result.token, isAuthenticated: true, isLoading: false });
        // Existing users go to home; no onboarding
    }, [loginMutation]);

    // ── Register ────────────────────────────────────────────────────────────
    // Item 8: after successful registration, set needsOnboarding=true and
    // navigate to the onboarding tour before landing on the home tab.
    const register = useCallback(async (
        name: string, email: string, password: string, referralCode?: string
    ) => {
        const { data } = await registerMutation({
            variables: { input: { name, email, password, referralCode } },
        });
        if (!data) throw new Error('Registration failed');

        const { token, user } = data.register;
        await SecureStore.setItemAsync('clipx_token', token);
        setState({ user, token, isAuthenticated: true, isLoading: false });

        // Mark as needing onboarding and redirect
        setNeedsOnboarding(true);
        router.replace('/auth/onboarding');
    }, [registerMutation, router]);

    // ── Google OAuth ────────────────────────────────────────────────────────
    const googleAuth = useCallback(async (idToken: string) => {
        const { data } = await googleAuthMutation({ variables: { idToken } });
        if (!data?.googleAuth) throw new Error('Google auth failed');

        const { token, user, isNewUser } = data.googleAuth;
        await SecureStore.setItemAsync('clipx_token', token);
        setState({ user, token, isAuthenticated: true, isLoading: false });

        // Item 8: new Google users also get the onboarding tour
        if (isNewUser || !user.name) {
            setNeedsOnboarding(true);
            router.replace('/auth/onboarding');
        }
    }, [googleAuthMutation, router]);

    // ── Logout ──────────────────────────────────────────────────────────────
    const logout = useCallback(async () => {
        await SecureStore.deleteItemAsync('clipx_token');
        setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
        setNeedsOnboarding(false);
    }, []);

    // ── Refresh user from server ─────────────────────────────────────────────
    const refreshUser = useCallback(async () => {
        try {
            const { data } = await fetchMe();
            if (data?.me) setState(s => ({ ...s, user: data.me }));
        } catch { /* ignore — silent failure */ }
    }, [fetchMe]);

    // ── Delete account ───────────────────────────────────────────────────────
    const deleteAccount = useCallback(async (password?: string) => {
        const { data } = await deleteAccountMutation({ variables: { password } });
        if (data?.deleteAccount?.success) {
            await SecureStore.deleteItemAsync('clipx_token');
            setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
        } else {
            throw new Error(data?.deleteAccount?.message || 'Failed to delete account');
        }
    }, [deleteAccountMutation]);

    // ── Complete onboarding (called by onboarding screen on final slide) ─────
    const completeOnboarding = useCallback(() => {
        setNeedsOnboarding(false);
        router.replace('/(tabs)');
    }, [router]);

    return (
        <AuthContext.Provider value={{
            ...state,
            needsOnboarding,
            login, register, googleAuth,
            logout, refreshUser, deleteAccount,
            completeOnboarding,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;