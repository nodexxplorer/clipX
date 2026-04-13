// frontend/src/lib/webVitals.js
// ─── Real User Monitoring (RUM) — Section 17 ────────────────────────────────
// Tracks Core Web Vitals (LCP, FID, CLS, TTFB, INP) and sends to analytics.
// Uses the web-vitals library pattern without requiring the npm package.

const WEB_VITALS_ENDPOINT = '/api/vitals'; // Can point to any analytics sink

/**
 * Observe a specific performance entry type and call a callback.
 */
function observe(type, callback) {
  try {
    if (typeof PerformanceObserver === 'undefined') return;
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        callback(entry);
      }
    });
    po.observe({ type, buffered: true });
    return po;
  } catch {
    // Silently ignore — not all browsers support all entry types
    return null;
  }
}

/**
 * Report a metric to the analytics endpoint.
 */
function reportMetric(name, value, id) {
  const body = {
    name,
    value: Math.round(value * 1000) / 1000,
    id: id || `${name}-${Date.now()}`,
    page: typeof window !== 'undefined' ? window.location.pathname : '',
    timestamp: new Date().toISOString(),
    connection: navigator?.connection?.effectiveType || 'unknown',
    deviceMemory: navigator?.deviceMemory || 'unknown',
  };

  // Use sendBeacon for reliable delivery even on page unload
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon(WEB_VITALS_ENDPOINT, JSON.stringify(body));
  }

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    const color = value > getThreshold(name) ? '#ef4444' : '#22c55e';
    console.log(
      `%c[WebVitals] ${name}: ${body.value}`,
      `color: ${color}; font-weight: bold;`
    );
  }
}

function getThreshold(name) {
  const thresholds = {
    LCP: 2500,    // ms — Largest Contentful Paint
    FID: 100,     // ms — First Input Delay
    CLS: 0.1,     // score — Cumulative Layout Shift
    TTFB: 800,    // ms — Time to First Byte
    INP: 200,     // ms — Interaction to Next Paint
  };
  return thresholds[name] || Infinity;
}

/**
 * Initialize all Core Web Vitals tracking.
 * Call this once from _app.js or a layout component.
 */
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  // ─── Largest Contentful Paint (LCP) ──────────────────────
  observe('largest-contentful-paint', (entry) => {
    reportMetric('LCP', entry.startTime);
  });

  // ─── First Input Delay (FID) ─────────────────────────────
  observe('first-input', (entry) => {
    reportMetric('FID', entry.processingStart - entry.startTime);
  });

  // ─── Cumulative Layout Shift (CLS) ───────────────────────
  let clsValue = 0;
  let clsEntries = [];
  observe('layout-shift', (entry) => {
    if (!entry.hadRecentInput) {
      clsValue += entry.value;
      clsEntries.push(entry);
    }
  });

  // ─── Time to First Byte (TTFB) ──────────────────────────
  observe('navigation', (entry) => {
    reportMetric('TTFB', entry.responseStart - entry.requestStart);
  });

  // ─── Interaction to Next Paint (INP) ─────────────────────
  let maxINP = 0;
  observe('event', (entry) => {
    const duration = entry.duration;
    if (duration > maxINP) {
      maxINP = duration;
    }
  });

  // Report CLS and INP on page visibility change (unload)
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        reportMetric('CLS', clsValue);
        if (maxINP > 0) reportMetric('INP', maxINP);
      }
    });
  }
}

/**
 * Get current performance metrics snapshot (useful for admin dashboard).
 */
export function getPerformanceSnapshot() {
  if (typeof window === 'undefined' || typeof performance === 'undefined') {
    return null;
  }

  const nav = performance.getEntriesByType?.('navigation')?.[0];
  if (!nav) return null;

  return {
    dns: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
    tcp: Math.round(nav.connectEnd - nav.connectStart),
    ttfb: Math.round(nav.responseStart - nav.requestStart),
    domLoad: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
    fullLoad: Math.round(nav.loadEventEnd - nav.startTime),
    transferSize: nav.transferSize || 0,
    // Resource count
    resourceCount: performance.getEntriesByType?.('resource')?.length || 0,
  };
}

export default { initWebVitals, getPerformanceSnapshot };
