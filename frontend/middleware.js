// middleware.js — Next.js Edge Middleware for CSP nonce injection
//
// This runs on every request BEFORE the page renders. It generates a
// unique nonce, injects it into the CSP header, and passes it to the
// page via a custom header that _document.js reads.

import { NextResponse } from 'next/server';

export function middleware(request) {
    const nonce = generateNonce();
    const response = NextResponse.next();

    // Pass the nonce to _document.js via a request header
    response.headers.set('x-nonce', nonce);

    // Build a strict CSP with the nonce replacing 'unsafe-inline' for scripts
    const csp = [
        `default-src 'self'`,
        `script-src 'self' 'nonce-${nonce}' https://apis.google.com https://accounts.google.com`,
        `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
        `font-src 'self' https://fonts.gstatic.com data:`,
        `img-src 'self' data: blob: https://image.tmdb.org https://i.ibb.co https://moviebox.ph https://*.aoneroom.com https://placehold.co https://via.placeholder.com`,
        `media-src 'self' blob: http://localhost:8000 https://*.aoneroom.com https://vod.aoneroom.com`,
        `connect-src 'self' http://localhost:8000 https://accounts.google.com https://api.paystack.co https://*.aoneroom.com wss://*`,
        `frame-src 'self' https://accounts.google.com https://paystack.com https://checkout.paystack.com`,
        `object-src 'none'`,
        `base-uri 'self'`,
        `form-action 'self'`,
        `frame-ancestors 'none'`,
        `upgrade-insecure-requests`,
    ].join('; ');

    response.headers.set('Content-Security-Policy', csp);

    return response;
}

function generateNonce() {
    // Crypto-safe random nonce (base64, 16 bytes = 128 bits of entropy)
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
}

// Only apply to page routes, not to API/static/image routes
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico
         * - public files (sw.js, manifest.json, etc.)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.json|icons).*)',
    ],
};
