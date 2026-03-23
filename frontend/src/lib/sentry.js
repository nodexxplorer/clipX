/**
 * Sentry Error Logging - Frontend
 * 
 * Setup:
 * 1. npm install @sentry/nextjs
 * 2. Set NEXT_PUBLIC_SENTRY_DSN in .env.local
 * 3. Run: npx @sentry/wizard@latest -i nextjs
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

export function initSentry() {
    if (!SENTRY_DSN) {
        console.log('⚠️  NEXT_PUBLIC_SENTRY_DSN not set — frontend error logging disabled');
        return;
    }

    Sentry.init({
        dsn: SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',

        // Performance monitoring
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

        // Replay sessions for debugging (captures user actions before error)
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,

        // Filter noisy errors
        beforeSend(event, hint) {
            const error = hint?.originalException;
            const msg = error?.message || '';

            // Skip network errors and auth redirects
            if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) return null;
            if (msg.includes('401') || msg.includes('Unauthorized')) return null;
            if (msg.includes('ChunkLoadError')) return null; // Next.js hot reload

            return event;
        },

        // Ignore useless breadcrumbs
        beforeBreadcrumb(breadcrumb) {
            if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') return null;
            return breadcrumb;
        },
    });

    console.log('✅ Sentry frontend initialized');
}

export function captureError(error, context = {}) {
    Sentry.withScope((scope) => {
        Object.entries(context).forEach(([key, value]) => {
            scope.setExtra(key, value);
        });
        Sentry.captureException(error);
    });
}

export function setUserContext(userId, email) {
    Sentry.setUser({ id: userId, email });
}

export function clearUserContext() {
    Sentry.setUser(null);
}

export default Sentry;
