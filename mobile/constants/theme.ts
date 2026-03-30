/**
 * clipX Theme — Dark-first design system matching the web app
 */

export const colors = {
  // Base
  background: '#050607',
  surface: '#0f1115',
  surfaceLight: '#1a1d24',
  surfaceLighter: '#252830',

  // Brand
  primary: '#0891b2',
  primaryLight: '#06b6d4',
  primaryDark: '#0e7490',
  accent: '#8b5cf6',
  accentLight: '#a78bfa',

  // Text
  text: '#ffffff',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
  textDim: '#4b5563',

  // Status
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Tier colors
  free: '#6b7280',
  standard: '#0891b2',
  pro: '#8b5cf6',

  // Misc
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.12)',
  overlay: 'rgba(0,0,0,0.6)',
  card: 'rgba(255,255,255,0.03)',

  // Tab bar
  tabBar: '#0a0b0d',
  tabInactive: '#6b7280',
  tabActive: '#0891b2',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 9999,
} as const;

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  title: 34,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  black: '900' as const,
};

// Poster aspect ratio: 2:3
export const POSTER_ASPECT = 2 / 3;
export const BACKDROP_ASPECT = 16 / 9;

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.24.170:8000';
export const GRAPHQL_URL = `${API_URL}/graphql`;
