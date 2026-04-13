// frontend/src/lib/i18n.js
// ─── Internationalization Provider (Section 16) ──────────────────────────────
// Provides multi-language support with English, French, and Arabic translations.
// Includes RTL detection and CSS direction switching.

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

// ─── Translation Dictionaries ────────────────────────────────────────────────

const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.search': 'Search',
    'nav.watchlist': 'Watchlist',
    'nav.downloads': 'Downloads',
    'nav.profile': 'Profile',
    'nav.help': 'Help',
    'nav.settings': 'Settings',
    'nav.logout': 'Log Out',
    // Dashboard
    'dashboard.welcome': 'Welcome back',
    'dashboard.trending': 'Trending Now',
    'dashboard.new_releases': 'New Releases',
    'dashboard.top_in_country': 'Top 10 in Your Country',
    'dashboard.because_you_watched': 'Because You Watched',
    'dashboard.coming_soon': 'Coming Soon',
    'dashboard.continue_watching': 'Continue Watching',
    'dashboard.my_watchlist': 'My Watchlist',
    'dashboard.recently_viewed': 'Recently Viewed',
    // Search
    'search.placeholder': 'Search movies, series, actors…',
    'search.no_results': 'No results found',
    'search.trending': 'Trending Searches',
    'search.recent': 'Recent Searches',
    'search.clear_history': 'Clear History',
    'search.did_you_mean': 'You might also like',
    // Player
    'player.play': 'Play',
    'player.pause': 'Pause',
    'player.fullscreen': 'Fullscreen',
    'player.subtitles': 'Subtitles',
    'player.quality': 'Quality',
    'player.audio_tracks': 'Audio Tracks',
    'player.cast': 'Cast to Device',
    'player.speed': 'Playback Speed',
    'player.stats': 'Playback Statistics',
    // Profile
    'profile.edit': 'Edit Profile',
    'profile.change_password': 'Change Password',
    'profile.delete_account': 'Delete Account',
    'profile.sessions': 'Active Sessions',
    'profile.notifications': 'Notification Preferences',
    // Common
    'common.loading': 'Loading…',
    'common.error': 'Something went wrong',
    'common.retry': 'Try Again',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.confirm': 'Confirm',
    'common.close': 'Close',
    'common.all': 'All',
    'common.none': 'None',
  },
  fr: {
    'nav.home': 'Accueil',
    'nav.search': 'Rechercher',
    'nav.watchlist': 'Ma liste',
    'nav.downloads': 'Téléchargements',
    'nav.profile': 'Profil',
    'nav.help': 'Aide',
    'nav.settings': 'Paramètres',
    'nav.logout': 'Déconnexion',
    'dashboard.welcome': 'Bon retour',
    'dashboard.trending': 'Tendances',
    'dashboard.new_releases': 'Nouveautés',
    'dashboard.top_in_country': 'Top 10 dans votre pays',
    'dashboard.because_you_watched': 'Parce que vous avez regardé',
    'dashboard.coming_soon': 'Prochainement',
    'dashboard.continue_watching': 'Continuer à regarder',
    'dashboard.my_watchlist': 'Ma liste',
    'dashboard.recently_viewed': 'Vus récemment',
    'search.placeholder': 'Rechercher des films, séries, acteurs…',
    'search.no_results': 'Aucun résultat',
    'search.trending': 'Recherches tendance',
    'search.recent': 'Recherches récentes',
    'search.clear_history': 'Effacer l\'historique',
    'search.did_you_mean': 'Vous pourriez aussi aimer',
    'player.play': 'Lire',
    'player.pause': 'Pause',
    'player.fullscreen': 'Plein écran',
    'player.subtitles': 'Sous-titres',
    'player.quality': 'Qualité',
    'player.audio_tracks': 'Pistes audio',
    'player.cast': 'Diffuser',
    'player.speed': 'Vitesse de lecture',
    'player.stats': 'Statistiques',
    'profile.edit': 'Modifier le profil',
    'profile.change_password': 'Changer le mot de passe',
    'profile.delete_account': 'Supprimer le compte',
    'profile.sessions': 'Sessions actives',
    'profile.notifications': 'Préférences de notification',
    'common.loading': 'Chargement…',
    'common.error': 'Quelque chose s\'est mal passé',
    'common.retry': 'Réessayer',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.confirm': 'Confirmer',
    'common.close': 'Fermer',
    'common.all': 'Tout',
    'common.none': 'Aucun',
  },
  ar: {
    'nav.home': 'الرئيسية',
    'nav.search': 'بحث',
    'nav.watchlist': 'قائمة المشاهدة',
    'nav.downloads': 'التنزيلات',
    'nav.profile': 'الملف الشخصي',
    'nav.help': 'مساعدة',
    'nav.settings': 'الإعدادات',
    'nav.logout': 'تسجيل الخروج',
    'dashboard.welcome': 'مرحباً بعودتك',
    'dashboard.trending': 'الأكثر رواجاً',
    'dashboard.new_releases': 'إصدارات جديدة',
    'dashboard.top_in_country': 'الأكثر مشاهدة في بلدك',
    'dashboard.because_you_watched': 'لأنك شاهدت',
    'dashboard.coming_soon': 'قريباً',
    'dashboard.continue_watching': 'متابعة المشاهدة',
    'dashboard.my_watchlist': 'قائمتي',
    'dashboard.recently_viewed': 'شوهد مؤخراً',
    'search.placeholder': 'ابحث عن أفلام، مسلسلات، ممثلين…',
    'search.no_results': 'لم يتم العثور على نتائج',
    'search.trending': 'عمليات البحث الرائجة',
    'search.recent': 'عمليات البحث الأخيرة',
    'search.clear_history': 'مسح السجل',
    'search.did_you_mean': 'قد يعجبك أيضاً',
    'player.play': 'تشغيل',
    'player.pause': 'إيقاف',
    'player.fullscreen': 'ملء الشاشة',
    'player.subtitles': 'الترجمة',
    'player.quality': 'الجودة',
    'player.audio_tracks': 'المسارات الصوتية',
    'player.cast': 'بث',
    'player.speed': 'سرعة التشغيل',
    'player.stats': 'إحصائيات',
    'profile.edit': 'تعديل الملف الشخصي',
    'profile.change_password': 'تغيير كلمة المرور',
    'profile.delete_account': 'حذف الحساب',
    'profile.sessions': 'الجلسات النشطة',
    'profile.notifications': 'إعدادات الإشعارات',
    'common.loading': 'جارٍ التحميل…',
    'common.error': 'حدث خطأ ما',
    'common.retry': 'حاول مرة أخرى',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.confirm': 'تأكيد',
    'common.close': 'إغلاق',
    'common.all': 'الكل',
    'common.none': 'لا شيء',
  },
};

// RTL languages list
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

// ─── Context ─────────────────────────────────────────────────────────────────

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState('en');

  // Load saved locale on mount
  useEffect(() => {
    const saved = localStorage.getItem('clipx_locale');
    if (saved && translations[saved]) {
      setLocaleState(saved);
    } else {
      // Auto-detect from browser
      const browserLang = navigator.language?.split('-')[0];
      if (browserLang && translations[browserLang]) {
        setLocaleState(browserLang);
      }
    }
  }, []);

  // Apply RTL and lang attribute when locale changes
  useEffect(() => {
    const isRtl = RTL_LANGUAGES.includes(locale);
    document.documentElement.setAttribute('lang', locale);
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    // Toggle RTL class for CSS targeting
    document.documentElement.classList.toggle('rtl', isRtl);
    document.documentElement.classList.toggle('ltr', !isRtl);
  }, [locale]);

  const setLocale = useCallback((newLocale) => {
    if (translations[newLocale]) {
      setLocaleState(newLocale);
      localStorage.setItem('clipx_locale', newLocale);
    }
  }, []);

  const t = useCallback((key, fallback) => {
    return translations[locale]?.[key] || translations.en?.[key] || fallback || key;
  }, [locale]);

  const isRtl = RTL_LANGUAGES.includes(locale);

  const value = useMemo(() => ({
    locale, setLocale, t, isRtl,
    availableLocales: Object.keys(translations),
    localeLabels: { en: 'English', fr: 'Français', ar: 'العربية' },
  }), [locale, setLocale, t, isRtl]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Fallback for components outside provider
    return {
      locale: 'en', setLocale: () => {}, t: (k) => k,
      isRtl: false, availableLocales: ['en'],
      localeLabels: { en: 'English' },
    };
  }
  return ctx;
}

export default { I18nProvider, useI18n };
