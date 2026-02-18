// // frontend/src/hooks/useAdminAuth.js
// import { useState, useEffect, useCallback } from 'react';
// import { useQuery, useMutation, useApolloClient } from '@apollo/client/react';
// import { useRouter } from 'next/router';
// import { GET_ADMIN_ME } from '../graphql/queries/adminQueries';
// import { ADMIN_LOGIN, ADMIN_LOGOUT } from '../graphql/mutations/adminMutations';

// const TOKEN_KEY = 'admin_token';
// const EXPIRY_KEY = 'admin_token_expiry';

// export function useAdminAuth() {
//   const [token, setToken] = useState(null);
//   const router = useRouter();
//   const client = useApolloClient();

//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       // Accept either admin-specific token or the generic token set by unified login
//       const stored = localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token');
//       const expiry = localStorage.getItem(EXPIRY_KEY) || localStorage.getItem('admin_token_expiry');
//       if (stored && expiry && new Date(expiry) > new Date()) {
//         setToken(stored);
//       } else {
//         localStorage.removeItem(TOKEN_KEY);
//         localStorage.removeItem(EXPIRY_KEY);
//         // also cleanup generic token keys if expired
//         localStorage.removeItem('token');
//         localStorage.removeItem('admin_token_expiry');
//       }
//     }
//   }, []);

//   const { data, loading, error, refetch } = useQuery(GET_ADMIN_ME, {
//     skip: !token,
//     context: { headers: { authorization: `Bearer ${token}` } },
//     fetchPolicy: 'network-only'
//   });

//   const [loginMutation] = useMutation(ADMIN_LOGIN);
//   const [logoutMutation] = useMutation(ADMIN_LOGOUT);

//   const login = useCallback(async (email, password, twoFactorCode) => {
//     const { data } = await loginMutation({
//       variables: { input: { email, password, twoFactorCode } }
//     });

//     if (data.adminLogin.requiresTwoFactor) {
//       return { requiresTwoFactor: true };
//     }

//     const { token: newToken, expiresAt } = data.adminLogin;
//     localStorage.setItem(TOKEN_KEY, newToken);
//     localStorage.setItem(EXPIRY_KEY, expiresAt);
//     setToken(newToken);
//     await refetch();
//     return { success: true, admin: data.adminLogin.admin };
//   }, [loginMutation, refetch]);

//   const logout = useCallback(async () => {
//     try {
//       await logoutMutation({ context: { headers: { authorization: `Bearer ${token}` } } });
//     } catch (e) { /* ignore */ }
//     // Remove both admin-specific and generic tokens to ensure clean logout
//     localStorage.removeItem(TOKEN_KEY);
//     localStorage.removeItem(EXPIRY_KEY);
//     localStorage.removeItem('token');
//     localStorage.removeItem('role');
//     setToken(null);
//     await client.clearStore();
//     router.push('/admin/login');
//   }, [logoutMutation, token, client, router]);

//   // Auto-logout on token expiry
//   useEffect(() => {
//     const expiry = localStorage.getItem(EXPIRY_KEY);
//     if (expiry) {
//       const timeout = new Date(expiry).getTime() - Date.now();
//       if (timeout > 0) {
//         const timer = setTimeout(logout, timeout);
//         return () => clearTimeout(timer);
//       }
//     }
//   }, [token, logout]);

//   return {
//     admin: data?.adminMe,
//     loading,
//     error,
//     token,
//     login,
//     logout,
//     isAuthenticated: !!data?.adminMe
//   };
// }