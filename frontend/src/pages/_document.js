// src/pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
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
      </Head>
      <body className="bg-dark-300 text-white antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}