# Penetration & UX Audit: Pending Implementation Checklist
The following features extracted from the analysis block have not been fully implemented or require further development sprints to meet launch/compliance standards.

## 🔐 1. Security & Compliance (Legal/Privacy)
- [ ] **DMCA takedown process:** Missing dedicated `/dmca` page with documented email and request process for safe harbor protection.
- [ ] **GDPR / NDPR compliance:** Missing DPO details, DPIA, and third-party entity declarations in the privacy policy.
- [ ] **Terms covering streaming rights:** Terms require updating to state single-device, non-commercial, personal streaming only.
- [ ] **Cookie consent granular toggle:** Consent is local-storage only. Provide dynamic block hooks for Analytics vs Essential and store consent preferences server-side.
- [ ] **Accessibility statement:** Missing WCAG 2.1 AA compliance statement.

## 👥 2. User Accounts & Management
- [ ] **Admin bulk actions (Extended):** Bulk ban/verify users and bulk delete reviews not fully wired to backend mutations.

## 🎬 3. Content Delivery & Player Experience
- [ ] **Trailer autoplay on hover:** Movie cards lack 1.5s delayed muted trailer hover feature.

## 📱 4. UI/UX Refinements & Content Discovery
- [ ] **Pull to refresh on lists:** Search, History, Watchlist, and Downloads missing pull-to-refresh control handlers (Mobile: `RefreshControl`).
- [ ] **Content language / audio tracks:** Missing display for available audio languages and subtitles on the detail page before the user clicks play.
- [ ] **Haptic feedback on mobile:** Needs deep integration for interactions like Play, Add to Watchlist using `expo-haptics` (mobile only).
- [ ] **Swipe to dismiss on modals:** Settings sheets and Cancel Sub modals lack swipedown cancellation UX via gesture responders (mobile only).

## 🚀 5. Performance Improvements
- [ ] **Image optimisation:** Missing dynamic CDN proxy resize for TMDB posters to reduce bandwidth on mobile/web.
- [ ] **Apollo cache strategy:** Incomplete. Needs `keyFields` for `Movie` and advanced `merge` functions for paginated lists to eliminate network waterfalling.

## 🛡️ 6. Security Hardening (Phase 2)
- [ ] **CSP nonce for inline scripts:** `next.config.mjs` headers rely on `unsafe-inline`. Requires strict nonce implementation for production.
- [ ] **Admin role user-override:** Audit `updateProfile` and `updateProfileFull` mutations to confirm standard users cannot inject `role="admin"`.

## 📊 7. Analytics & Observability
- [ ] **Error tracking (Sentry):** Sentry SDK exists, but a deep pass is required to implement `sentry.capture_exception(e)` across empty `except` blocks that currently silently fail and print output string.
- [ ] **Business metrics:** Missing internal KPI trackers (DAU, MAU, average watch times, or content completion dropoff rates) on the admin dash.

## 🎨 8. Professional Presentation
- [ ] **Support email / help centre:** Help ticketing not integrated; ensure emails to `support@clipx.app` are correctly filtered.

## 🎞️ 9. Content Discovery (Missing Rails)

- [ ] **Top 10 in your country:** Missing geographic tracking & personalized ranking pipeline.
- [ ] **Because you watched X:** Need to tie backend `personalizedRecommendations` into the user's home screen.

## 👤 11. User Account Extensions
<!-- - [ ] **Username / display name overrides:** Lacks ability to assign an alias divorced from the email root for watch-parties and reviews. -->
- [ ] **Profile picture upload:** Form exists, but active S3/Cloudinary media bucket upload routines are not fully scaffolded.
- [ ] **Email preferences centre:** Lacks granular opt-outs for marketing vs. security messages.

## 📥 12. Downloads & Offline DRM
- [ ] **Download quality selection:** Missing modal dialog intercept asking for 720p vs 1080p target sizes to save user disk space.

- [ ] **Storage usage indicator:** Missing generic mobile pie-chart rendering `FileSystem.getFreeDiskStorageAsync()` to tell users how much space is left.
- [ ] **Download limit enforcement:** DB tier definitions exist but download capping logic is skipped.
- [ ] **Background download progress:** Current architecture traps users in the foreground; needs `expo-background-fetch` queue.
- [ ] **File encryption at rest:** Currently downloading raw `.mp4` chunks disguised as `.clipx`. Full AES-256 wrapping via `expo-crypto` required.

## 💬 13. Social & Notifications
- [ ] **New episode notification:** Missing background cron job mapping user histories to new episodes dropped over Postgres.

## 🔍 14. Advanced Search
- [ ] **Search filters (Composite):** Lacks union filters combining Ratings + Year boundaries + Genres simultaneously.
- [ ] **Search relevance ranking:** GraphQL `searchMovies` acts linearly; needs explicit heuristic `ORDER BY` rank + popularity clauses.

## ⚙️ 15. Admin Panel
- [ ] **Content scheduling:** Missing `publish_at` parameters and visibility cron-handlers.
- [ ] **SEO metadata editor:** Needs field editors for title/description/og-image overlays over global defaults.
- [ ] **Revenue goals / targets:** Missing MRR target tracking widget.
- [ ] **User impersonation:** Active session hijack logic for debugging (requires audited time-limits) is missing.


## 🌍 16. Internationalisation & Accessibility
- [ ] **Subtitle rendering options:** No size/color overlay wrappers formatting the raw parsed `.vtt` chunks.

## 📊 17. Analytics & Infrastructure
- [ ] **Real User Monitoring (RUM):** No active telemetry tracking TTFB, CLS, or LCP load behaviors.
- [ ] **Video CDN scaling:** Streaming pipelines point directly to TMDB or raw origins which will cap user saturation quickly.


## 📱 18. Mobile-Specific Polish
- [ ] **App Store Metadata / Branding:** Splash screens and logos exist but require a final brand-alignment pass before hitting production.

- [ ] **Tablet/iPad native layout:** Interface currently statically scales a single-column screen; needs dynamic column routing.


## 📋 19. Legal & Compliance
- [ ] **Cookie Consent blocking:** Needs rigorous JS verification that Sentry/Analytics modules hold initialization until Consent resolves.
- [ ] **DMCA Content reporting workflow:** Custom request forms for takedowns aren't linked efficiently to the backend flagging queue.

## 🐛 20. Known Bugs & Immediate Fixes

- [ ] **YouTube trailer routing:** Code is failing to cleanly fetch and bind raw YouTube IDs into the modal preview viewer contextually.
