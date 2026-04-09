# clipX - Audit Report (Unimplemented Items)

## 🔴 1. CRITICAL BUGS
- [ ] **1 Movie Routing** - Wrong movie loads when clicking a card — two conflicting URL/slug systems: `urlHelpers.movieUrl()` encodes only the title with no ID, while `MovieCard` uses `toSlug(title, id)` which embeds the ID.
- [ ] **2 Subscription Page** - `MY_SUBSCRIPTION` and `MY_PAYMENTS` declared as gql mutation but called with `useQuery`. Apollo throws a type mismatch error and the page crashes on load.
- [ ] **3 Auth — 2FA Flow** - Admin login never reaches 2FA step. `AuthContext.login()` always calls `router.push("/admin")` and returns `{success:true}` without forwarding `requires2FA` or `userId`.
- [ ] **4 Mobile Player** - Quality options use values "1080" and "720" but `useSubscription.ts QUALITY_LEVELS` uses "1080p" and "720p". `isQualityAllowed()` always returns false for HD/Full HD.
- [ ] **5 Backend Schema** - `mySubscription` and `myPaymentHistory` are declared inside the `Mutation` class but have no side effects and must be Query fields.

## 🟠 2. HIGH PRIORITY BUGS
- [ ] **6 Volume (Web)** - Web Audio GainNode for >100% volume is only initialised when the slider first crosses 1.0. If init fails silently, the slider moves but video.volume stays capped at 1.0.
- [ ] **7 Account Lockout** - User model has no `failed_login_attempts` or `locked_until` columns in production DB — the migration was never run.
- [ ] **8 Admin Mock Data** - Admin revenue page uses setTimeout + hardcoded mock data (fake ₦245,000 MRR, fake emails). Also security/moderation pages show static placeholder data.
- [ ] **9 Mobile Rotation** - Watch screen has no screen orientation lock. Landscape mode never activates.
- [ ] **10 Mobile Subtitles** - `PlayerSettings.tsx` has no Subtitles tab. Users cannot select captions on mobile even when subtitle tracks exist.
- [ ] **11 Skip Intro Data** - `SkipIntro` component reads `introStart/introEnd` from `movie?.introStart` which is not included in the `GET_MOVIE` GraphQL query fragment.
- [ ] **12 RevenueChart** - `RevenueChart.jsx` is exported as `export default function RevenueChart() { return null; }`. The chart is completely blank.
- [ ] **13 DEBUG console.log** - `subscription.js` has `console.log("DEBUG_IMPORTS:", {...})` left in production code. Leaks component references.

## 🔒 3. SECURITY ISSUES
- [ ] **14 No CSRF Protection** - GraphQL mutations have no CSRF token validation.
- [ ] **15 IP Rate Limiting** - Account lockout only triggers per-account after 5 failures. There is no IP-level rate limiting on the login endpoint.
- [ ] **16 Admin Role — Client** - Some backend GraphQL resolvers only check `user.role` in the Python resolver, but a few frontend-only admin routes do not have `AdminProtectedRoute` wrapper.
- [ ] **17 Refresh Token — DB** - `store_refresh_token()` is called inside a `try/except` that silently ignores failures.
- [ ] **18 Download Encryption** - Offline downloads are saved as raw unencrypted `.mp4` files to `FileSystem.documentDirectory`.
- [ ] **19 JWT Secret Fallback** - Multiple test/dev code paths use `os.getenv("JWT_SECRET", "dev-secret-change-me")` style fallbacks.
- [ ] **20 Lockout Reset — Multi** - Account lockout counter resets to 0 after a lockout expires instead of incrementing a permanent strike counter.

## 🟡 4. MISSING / INCOMPLETE FEATURES
- [ ] **21 Notif Preferences** - Push notification preferences UI uses `React.useState` without importing `React`, and the mutation variables use camelCase but backend uses snake_case.
- [ ] **22 Bulk Actions UI** - `ADMIN_DELETE_USER` was imported in `admin/users/index.jsx` but not in the original `adminMutations.js` exports. Bulk delete reviews UI is missing.
- [ ] **23 Session Mgmt UI** - Profile security tab shows sessions but missing import (`FiSmartphone`) causes a render error.
- [ ] **24 Subtitle Upload UI** - Admin movie edit page (`admin/movies/[id]/edit.jsx`) is a placeholder that returns null.
- [ ] **25 Timestamps Admin UI** - Backend `adminSetMovieTimestamps` mutation exists, but Admin movie edit page returns null so there is no UI to set timestamps.
- [ ] **26 Watchlist Sharing** - No share button exists on the watchlist page to call backend sharing resolvers.
- [ ] **27 Revenue CSV Export** - `EXPORT_REVENUE_CSV` import references a mutation not yet exported from `adminMutations.js`.
- [ ] **28 Search Analytics** - Backend `logSearch` is never called anywhere in the frontend. The `searchAnalytics` page has no data.
- [ ] **29 Admin Referrals** - Admin sidebar link is not wired — the `referrals` page is unreachable from the admin nav.
- [ ] **30 Mobile Volume Slide** - Binary toggle replaced with Slider component, but requires `@react-native-community/slider` which is not tracked in `package.json`.
- [ ] **31 2FA Admin Enforce** - No mechanism to force-enable 2FA for admin roles.
- [ ] **32 Forgot Password Link** - The login page does not have a visible "Forgot password?" link.
- [ ] **33 Email Verify Banner** - Subscription page dependency issue: `subData.emailVerified` depends on `mySubscription`, causing the warning banner to fail on first visit before auth.
- [ ] **34 Cross-Device Sync** - Mobile watch screen only syncs every 10 seconds and unmount sync is fire-and-forget — progress can be lost on force-close.

## 🔵 5. CODE QUALITY & TECHNICAL DEBT
- [ ] **35 Dual Slug Systems** - Two URL slug utilities coexist: `utils/slug.js` and `utils/urlHelpers.js` producing different URL formats.
- [ ] **36 SimilarMovies movieId** - Passes raw numeric ID, creating ugly non-SEO URLs when passed directly.
- [ ] **37 Admin Placeholder Files** - Multiple admin component files are completely empty stubs that return `null`.
- [ ] **38 Double tagline Field** - `GET_MOVIE` GraphQL query requests `tagline` twice.
- [ ] **39 localStorage Watchlist** - `MovieCard` manages watchlist state in `localStorage` decoupled from the real DB, which can desync.
- [ ] **40 Pyright Suppressions** - `schema.py` has type checking completely disabled via `# pyright: reportCallIssue=false...`.
- [ ] **41 Notification Welcome** - Every login creates a "Welcome back! 👋" notification, spamming the user's feed.
- [ ] **42 Mobile nativeControls** - VideoView in mobile watch screen has `nativeControls={false}` removing all pause/seek ability.
- [ ] **43 History Upsert Race** - `updateWatchProgress` and `recordWatchProgress` both write to the history table without deduplication.
- [ ] **44 Token Refresh Path** - Refresh token cookie is scoped to `/api/auth/refresh`.

## ✨ 6. RECOMMENDED ADDITIONS
- [ ] **45 Password Reset Link** - Add "Forgot password?" link natively bridging directly into the `auth/forgot-password` flow.
- [ ] **46 Email Gate Warning** - Add persistent banner for unverified users.
- [ ] **47 Subtitle Upload UI** - Build admin movie edit UI with `.srt/.vtt` CDN upload connection.
- [ ] **48 Intro Timestamp UI** - Build admin form for setting skip intro/recap timing markers.
- [ ] **49 Search Auto-Log** - Emit `logSearch` mutation post-search execution to harvest search metrics.
- [ ] **50 Watchlist Share Btn** - Add UI implementation to trigger watchlist sharing mutations.
- [ ] **51 Download Encryption** - Tie `FileSystem` local storage directly into AES-256 via `expo-crypto`.
- [ ] **52 AI Review Moderation** - Connect `moderateContent` directly into the end user's UI stream to warn contextually upon toxic submission behavior instead of silently squashing it via the backend context handler.
- [ ] **53 Lockout Escalation** - After first 30-min lockout, double the next lockout duration continuously.
- [ ] **54 PWA Offline Mode** - Background synching for offline progression via `public/sw.js`.
- [ ] **55 Continue Watching Widget on Mobile** - Continue watching features missing from the primary interface hierarchy.
- [ ] **56 Admin Movie Create** - Unwired endpoint connection required for `admin/movies/create.jsx`.

---
*Note: Completed dependencies spanning Sections 1 through 12 outlined in initial audit notes have been excluded from this implementation checklist.*
