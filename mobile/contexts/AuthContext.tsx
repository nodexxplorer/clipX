import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useMutation, useLazyQuery } from '@apollo/client';
import { LOGIN, REGISTER, GET_ME } from '@/lib/graphql';
import type { User, AuthState } from '@/types';

interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, referralCode?: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    login: async () => { },
    register: async () => { },
    logout: async () => { },
    refreshUser: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true,
    });

    const [loginMutation] = useMutation(LOGIN);
    const [registerMutation] = useMutation(REGISTER);
    const [fetchMe] = useLazyQuery(GET_ME, { fetchPolicy: 'network-only' });

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
        const { token, user } = data.login;
        await SecureStore.setItemAsync('clipx_token', token);
        setState({ user, token, isAuthenticated: true, isLoading: false });
    }, [loginMutation]);

    const register = useCallback(async (name: string, email: string, password: string, referralCode?: string) => {
        const { data } = await registerMutation({
            variables: { input: { name, email, password, referralCode } },
        });
        const { token, user } = data.register;
        await SecureStore.setItemAsync('clipx_token', token);
        setState({ user, token, isAuthenticated: true, isLoading: false });
    }, [registerMutation]);

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

    return (
        <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
