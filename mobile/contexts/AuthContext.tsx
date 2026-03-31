import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { LOGIN, REGISTER, GOOGLE_AUTH, DELETE_ACCOUNT, GET_ME } from '@/lib/graphql';
import type { User, AuthState } from '@/types';

interface MeData { me: User }
interface RegisterData { register: { token: string; user: User } }
interface GoogleAuthData { googleAuth: { token: string; user: User; isNewUser: boolean } }



interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, referralCode?: string) => Promise<void>;
    googleAuth: (idToken: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    deleteAccount: (password?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    login: async () => { },
    register: async () => { },
    googleAuth: async () => { },
    logout: async () => { },
    refreshUser: async () => { },
    deleteAccount: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true,
    });

    const [loginMutation] = useMutation<{ login: any }>(LOGIN);
    const [registerMutation] = useMutation<RegisterData>(REGISTER);
    const [googleAuthMutation] = useMutation<GoogleAuthData>(GOOGLE_AUTH);
    const [deleteAccountMutation] = useMutation<{ deleteAccount: { success: boolean; message: string } }>(DELETE_ACCOUNT);
    const [fetchMe] = useLazyQuery<MeData>(GET_ME, { fetchPolicy: 'network-only' });

    // Check stored token on mount
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
            } catch { }
            setState(s => ({ ...s, isLoading: false }));
        })();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const { data } = await loginMutation({ variables: { email, password } });
        if (!data?.login) throw new Error('Login failed');

        // Parse JSON response (backend returns JSON scalar)
        const result = typeof data.login === 'string' ? JSON.parse(data.login) : data.login;

        if (!result.token) throw new Error('Login failed — no token');

        await SecureStore.setItemAsync('clipx_token', result.token);
        setState({
            user: result.user,
            token: result.token,
            isAuthenticated: true,
            isLoading: false,
        });
    }, [loginMutation]);

    const register = useCallback(async (name: string, email: string, password: string, referralCode?: string) => {
        const { data } = await registerMutation({
            variables: { input: { name, email, password, referralCode } },
        });
        if (!data) throw new Error('Registration failed');
        const { token, user } = data.register;
        await SecureStore.setItemAsync('clipx_token', token);
        setState({ user, token, isAuthenticated: true, isLoading: false });
    }, [registerMutation]);

    const googleAuth = useCallback(async (idToken: string) => {
        const { data } = await googleAuthMutation({ variables: { idToken } });
        if (!data?.googleAuth) throw new Error('Google auth failed');
        const { token, user } = data.googleAuth;
        await SecureStore.setItemAsync('clipx_token', token);
        setState({ user, token, isAuthenticated: true, isLoading: false });
    }, [googleAuthMutation]);

    const logout = useCallback(async () => {
        await SecureStore.deleteItemAsync('clipx_token');
        setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }, []);

    const refreshUser = useCallback(async () => {
        try {
            const { data } = await fetchMe();
            if (data?.me) {
                setState(s => ({ ...s, user: data.me }));
            }
        } catch { }
    }, [fetchMe]);

    const deleteAccount = useCallback(async (password?: string) => {
        const { data } = await deleteAccountMutation({ variables: { password } });
        if (data?.deleteAccount?.success) {
            await SecureStore.deleteItemAsync('clipx_token');
            setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
        } else {
            throw new Error(data?.deleteAccount?.message || 'Failed to delete account');
        }
    }, [deleteAccountMutation]);

    return (
        <AuthContext.Provider value={{ ...state, login, register, googleAuth, logout, refreshUser, deleteAccount }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;

