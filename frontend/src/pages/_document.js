// src/pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" className="dark">
      <Head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />


        {/* ── CDN / Resource Hints ─────────────────────────────────── */}
        {/* DNS pre-fetch for backend API */}
        <link rel="dns-prefetch" href="//localhost:8000" />
        {/* Google Fonts — preconnect so the font CSS arrives faster */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Preload the primary font weight used across all pages */}
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
        />
        {/* TMDB / image CDN preconnect (poster/backdrop images) */}
        <link rel="dns-prefetch" href="//image.tmdb.org" />
        <link rel="preconnect" href="https://image.tmdb.org" crossOrigin="anonymous" />
        {/* ImgBB (used for avatar uploads) */}
        <link rel="dns-prefetch" href="//i.ibb.co" />
        <link rel="preconnect" href="https://i.ibb.co" crossOrigin="anonymous" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#14B8A6" />
        <meta name="application-name" content="clipX" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="clipX" />

        {/* Social Media Meta Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="clipX" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:creator" content="@clipX" />
        {/* Anti-flash: runs before React hydrates */}
        <script dangerouslySetInnerHTML={{
          __html: `
          (function() {
            var t = localStorage.getItem('theme');
            var el = document.documentElement;
            el.classList.add('dark');
            if (t === 'light') { el.classList.add('light'); }
            else { el.classList.remove('light'); }
          })()
        `}} />
      </Head>
      <body style={{ backgroundColor: '#050607', color: '#ffffff' }} className="antialiased">
        {/* Skip-to-content link for keyboard users (WCAG 2.4.1) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-cyan-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-[#050607]"
        >
        </a>
        {/* ARIA live region for dynamic announcements */}
        <div id="aria-live-region" role="status" aria-live="polite" aria-atomic="true" className="sr-only" />
        <main id="main-content" role="main" tabIndex={-1}>
          <Main />
        </main>
        <NextScript />
      </body>
    </Html>
  );
}