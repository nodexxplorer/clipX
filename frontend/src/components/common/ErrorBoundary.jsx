// src/components/common/ErrorBoundary.jsx

/**
 * ErrorBoundary
 * Wraps the whole app — catches any unhandled render errors and shows
 * a styled fallback instead of a white crash screen.
 *
 * Usage in _app.js:
 *   <ErrorBoundary>
 *     {getLayout(<Component {...pageProps} />)}
 *   </ErrorBoundary>
 */

import React from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // In production you'd send this to Sentry / Datadog / etc.
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
    }
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#050607',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily:
            'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          color: '#fff',
          textAlign: 'center',
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 500,
            height: 500,
            background: 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
            borderRadius: '50%',
          }}
        />

        {/* Icon */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(239,68,68,0.1)',
            border: '2px solid rgba(239,68,68,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            color: '#f87171',
          }}
        >
          <FiAlertTriangle size={36} />
        </div>

        <h1
          style={{
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            fontWeight: 900,
            marginBottom: '0.5rem',
            letterSpacing: '-0.02em',
          }}
        >
          Something went wrong
        </h1>
        <p style={{ color: '#9ca3af', maxWidth: 480, lineHeight: 1.6, marginBottom: '2rem' }}>
          An unexpected error occurred. The page couldn&apos;t render. Try
          refreshing&nbsp;— if the&nbsp;problem persists, head back home.
        </p>

        {/* Dev-only error details */}
        {process.env.NODE_ENV === 'development' && this.state.error && (
          <details
            style={{
              marginBottom: '1.5rem',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '1rem',
              maxWidth: 600,
              width: '100%',
              textAlign: 'left',
            }}
          >
            <summary style={{ cursor: 'pointer', color: '#f87171', fontWeight: 700 }}>
              Error details (dev only)
            </summary>
            <pre
              style={{
                marginTop: '0.75rem',
                fontSize: '0.75rem',
                color: '#fca5a5',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error.toString()}
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
        )}

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={this.handleRetry}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.75rem',
              background: 'linear-gradient(135deg,#06b6d4,#3b82f6)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 10px 20px -10px rgba(6,182,212,0.5)',
            }}
          >
            <FiRefreshCw size={18} />
            Try Again
          </button>
          <a
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.75rem',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: '0.95rem',
              textDecoration: 'none',
            }}
          >
            <FiHome size={18} />
            Go Home
          </a>
        </div>
      </div>
    );
  }
}
