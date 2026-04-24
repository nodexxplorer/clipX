/**
 * Next.js API Route — POST|GET /api/graphql
 *
 * Proxies GraphQL requests to the backend and explicitly forwards
 * Set-Cookie headers back to the browser. This is necessary because
 * Next.js rewrites do not reliably forward Set-Cookie headers from
 * proxied responses — which breaks login/register (they set httpOnly
 * auth cookies via Set-Cookie).
 *
 * The Apollo client is configured to hit /api/graphql (this route)
 * instead of the rewrite at /graphql.
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
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ errors: [{ message: 'Method not allowed' }] });
  }

  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace('/graphql', '') ||
    'http://localhost:8000';

  const fetchOptions = {
    method: req.method,
    headers: {
      'Content-Type': req.headers['content-type'] || 'application/json',
      Cookie:            req.headers.cookie || '',
      'User-Agent':      req.headers['user-agent'] || '',
      'X-Requested-With': req.headers['x-requested-with'] || '',
      'X-Forwarded-For':
        req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
      Origin:  req.headers.origin || '',
      Referer: req.headers.referer || '',
    },
  };

  if (req.method === 'POST') {
    fetchOptions.body = JSON.stringify(req.body);
  }

  try {
    const backendRes = await fetch(`${backendUrl}/graphql`, fetchOptions);

    // Forward Set-Cookie headers (login, register, logout mutations set these)
    const setCookies = getSetCookieHeaders(backendRes);
    if (setCookies.length > 0) {
      res.setHeader('Set-Cookie', setCookies);
    }

    const contentType =
      backendRes.headers.get('content-type') || 'application/json';
    res.setHeader('Content-Type', contentType);

    const xResponseTime = backendRes.headers.get('x-response-time');
    if (xResponseTime) res.setHeader('X-Response-Time', xResponseTime);

    const body = await backendRes.text();
    return res.status(backendRes.status).send(body);
  } catch (error) {
    console.error('[GraphQL Proxy] Error:', error.message);
    return res.status(502).json({
      errors: [{ message: 'GraphQL service unavailable' }],
    });
  }
}
