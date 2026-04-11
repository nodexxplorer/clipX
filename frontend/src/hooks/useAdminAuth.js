/**
 * useAdminAuth — DEPRECATED
 *
 * Admin authentication is now handled through the unified AuthContext.
 * Admin users log in via the standard login flow; the AuthContext checks
 * user.role === 'admin' and redirects to /admin automatically.
 *
 * This file is kept as a stub to prevent import errors in any legacy code.
 */

export function useAdminAuth() {
  console.warn('[useAdminAuth] Deprecated — use useAuth() from AuthContext instead.');
  return {
    admin: null,
    loading: false,
    error: null,
    token: null,
    login: async () => ({ success: false, error: 'Use useAuth().login() instead' }),
    logout: async () => {},
    isAuthenticated: false,
  };
}