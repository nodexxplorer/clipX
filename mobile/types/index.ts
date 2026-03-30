// ============================================
// clipX Mobile — Global TypeScript Types
// ============================================

// === User & Auth ===
export interface User {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    bio: string | null;
    role: 'user' | 'admin';
    createdAt: string;
    subscriptionTier: 'free' | 'standard' | 'pro';
    subscriptionExpiresAt: string | null;
    emailVerified: boolean;
    referralCount: number;
    preferences: UserPreferences | null;
    stats: UserStats | null;
}

export interface UserPreferences {
    favoriteGenres: string[];
    theme: string;
    emailNotifications: boolean;
    autoPlayTrailers: boolean;
}

export interface UserStats {
    moviesWatched: number;
    totalWatchTime: number;
    monthlyWatchTime?: number;
    watchlistCount?: number;
    reviewsWritten?: number;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

// === Movies ===
export interface Movie {
    id: string;
    title: string;
    overview?: string;
    description?: string;
    posterPath?: string;
    posterUrl?: string;
    backdropPath?: string;
    backdropUrl?: string;
    releaseDate?: string;
    year?: number;
    voteAverage?: number;
    rating?: number;
    voteCount?: number;
    runtime?: number;
    popularity?: number;
    tagline?: string;
    status?: string;
    trailerUrl?: string;
    genres?: Genre[];
    cast?: CastMember[];
    seasons?: Season[];
    recommendations?: Movie[];
    durationMinutes?: number;
}

export interface Genre {
    id: string;
    name: string;
    slug?: string;
    movieCount?: number;
}

export interface CastMember {
    id: string;
    name: string;
    character?: string;
    profileImage?: string;
}

export interface Season {
    id: string;
    seasonNumber: number;
    episodes: Episode[];
}

export interface Episode {
    id: string;
    title: string;
    episodeNumber: number;
    seasonNumber: number;
}

export interface BrowseMoviesResponse {
    movies: Movie[];
    total: number;
    hasMore: boolean;
}

export interface SearchResult {
    items: Movie[];
    totalCount: number;
    hasMore: boolean;
}

// === Watchlist ===
export interface Watchlist {
    id: string;
    movies: Movie[];
}

// === Continue Watching ===
export interface ContinueWatchingItem {
    id: string;
    movie: Movie;
    currentTime: number;
    duration: number;
}

// === Dashboard ===
export interface DashboardData {
    watchlist: Movie[];
    recentlyViewed: Movie[];
    continueWatching: ContinueWatchingItem[];
    stats: UserStats;
}

// === Reviews ===
export interface Review {
    id: string;
    content: string;
    rating: number;
    userName: string;
    userAvatar?: string;
    isFeatured?: boolean;
    createdAt: string;
}

// === Notifications ===
export interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    actionUrl?: string;
    isRead: boolean;
    createdAt: string;
}

// === Payment ===
export interface Payment {
    id: string;
    amount: number;
    currency: string;
    status: 'paid' | 'failed' | 'pending';
    plan: string;
    reference?: string;
    method?: string;
    paidAt?: string;
}

// === Navigation ===
export type RootStackParamList = {
    '(tabs)': undefined;
    'movie/[id]': { id: string };
    'watch/[id]': { id: string; season?: number; episode?: number };
    'genres/[slug]': { slug: string };
    'auth/login': undefined;
    'auth/register': undefined;
    'auth/forgot-password': undefined;
    'search': undefined;
    'dashboard': undefined;
    'pricing': undefined;
    'subscription': undefined;
    'notifications': undefined;
    'history': undefined;
    'genres/index': undefined;
    'movies/index': { category?: string };
    'series': { type?: string };
    'report': { movieId?: string; movieTitle?: string };
};
