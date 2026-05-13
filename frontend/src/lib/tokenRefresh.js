/**
 * Shared singleton token refresh.
 *
 * Multiple call sites (Apollo error link, watch page, AuthContext, etc.)
 * may independently detect an expired access token and attempt a refresh.
 * Because the backend uses single-use refresh token rotation with theft
 * detection, concurrent refresh calls will revoke the ENTIRE token family.
 *
 * This module deduplicates: the first caller triggers the actual fetch;
 * subsequent callers wait for the same in-flight promise.
 */

let _refreshPromise = null;

/**
 * Attempt a token refresh. Returns `true` if successful, `false` otherwise.
 * Concurrent calls share the same in-flight request.
 */
export async function refreshAccessToken() {
  if (_refreshPromise) {
    // Another caller already started a refresh — piggyback on it
    return _refreshPromise;
  }

  _refreshPromise = (async () => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      // Clear after a short delay so rapid back-to-back calls
      // (e.g., retry immediately after completion) still deduplicate.
      setTimeout(() => { _refreshPromise = null; }, 500);
    }
  })();

  return _refreshPromise;
}
