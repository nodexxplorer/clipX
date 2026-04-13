// mobile/utils/haptics.ts
// ─── Section 18: Haptic Feedback Utility ─────────────────────────────────────
// Provides tactile feedback on iOS/Android for user interactions.
// Falls back gracefully when expo-haptics is unavailable.

let Haptics: any = null;

// Lazy-load expo-haptics to avoid crashes on web/unsupported platforms
async function loadHaptics() {
  if (Haptics) return Haptics;
  try {
    Haptics = await import('expo-haptics');
    return Haptics;
  } catch {
    return null;
  }
}

/**
 * Light impact — buttons, tab switches, toggle flips.
 */
export async function hapticLight() {
  try {
    const h = await loadHaptics();
    if (h) await h.impactAsync(h.ImpactFeedbackStyle.Light);
  } catch {}
}

/**
 * Medium impact — add to watchlist, like, submit review.
 */
export async function hapticMedium() {
  try {
    const h = await loadHaptics();
    if (h) await h.impactAsync(h.ImpactFeedbackStyle.Medium);
  } catch {}
}

/**
 * Heavy impact — play/pause, download start, delete action.
 */
export async function hapticHeavy() {
  try {
    const h = await loadHaptics();
    if (h) await h.impactAsync(h.ImpactFeedbackStyle.Heavy);
  } catch {}
}

/**
 * Selection feedback — scrolling through lists, picker changes.
 */
export async function hapticSelection() {
  try {
    const h = await loadHaptics();
    if (h) await h.selectionAsync();
  } catch {}
}

/**
 * Success notification — download complete, action confirmed.
 */
export async function hapticSuccess() {
  try {
    const h = await loadHaptics();
    if (h) await h.notificationAsync(h.NotificationFeedbackType.Success);
  } catch {}
}

/**
 * Warning notification — rate limit, low storage.
 */
export async function hapticWarning() {
  try {
    const h = await loadHaptics();
    if (h) await h.notificationAsync(h.NotificationFeedbackType.Warning);
  } catch {}
}

/**
 * Error notification — failed action, network error.
 */
export async function hapticError() {
  try {
    const h = await loadHaptics();
    if (h) await h.notificationAsync(h.NotificationFeedbackType.Error);
  } catch {}
}

export default {
  light: hapticLight,
  medium: hapticMedium,
  heavy: hapticHeavy,
  selection: hapticSelection,
  success: hapticSuccess,
  warning: hapticWarning,
  error: hapticError,
};
