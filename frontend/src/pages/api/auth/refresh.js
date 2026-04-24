/**
 * Next.js API Route — POST /api/auth/refresh
 *
 * Proxies the refresh-token request to the backend and explicitly
 * forwards Set-Cookie headers back to the browser.
 *
 * Next.js rewrites do not reliably forward Set-Cookie headers from
 * proxied responses. This dedicated API route ensures new auth cookies
 * (auth_token + refresh_token) actually reach the browser after a
 * token rotation.
 */

/**
 * Safely extract Set-Cookie headers from a fetch Response.
 * `getSetCookie()` is available in Node 18.14.1+; we fall back
 * to parsing the raw `set-cookie` header for older runtimes.
 */
function getSetCookieHeaders(response) {
  if (typeof response.headers.getSetCookie === 'function') {
    return response.headers.getSetCookie();
  }
  const raw = response.headers.get('set-cookie');
  if (!raw) return [];
  return raw.split(/,(?=\s*[a-zA-Z0-9_-]+=)/);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace('/graphql', '') ||
    'http://localhost:8000';

  try {
    const backendRes = await fetch(`${backendUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        Cookie:            req.headers.cookie || '',
        'User-Agent':      req.headers['user-agent'] || '',
        'X-Forwarded-For':
          req.headers['x-forwarded-for'] ||
          req.socket?.remoteAddress ||
          '',
      },
    });

    // Explicitly forward Set-Cookie headers from backend → browser
    const setCookies = getSetCookieHeaders(backendRes);
    if (setCookies.length > 0) {
      res.setHeader('Set-Cookie', setCookies);
    }

    const data = await backendRes.json().catch(() => ({}));
    return res.status(backendRes.status).json(data);
  } catch (error) {
    console.error('[API /auth/refresh] proxy error:', error.message);
    return res.status(502).json({ ok: false, detail: 'Refresh proxy error' });
  }
}
