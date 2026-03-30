/**
 * ContentRating Badge — Mobile
 * Displays PG, 13+, 18+ badges prominently.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, fontWeight, radius } from '@/constants/theme';

type RatingKey = 'G' | 'PG' | 'PG-13' | '13+' | 'R' | '18+' | 'NC-17' | 'TV-MA' | 'TV-14' | 'TV-PG' | 'TV-G' | 'TV-Y' | 'NR';

interface RatingConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
}

const RATING_CONFIG: Record<string, RatingConfig> = {
  'G':     { label: 'G',    bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' },
  'PG':    { label: 'PG',   bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' },
  'PG-13': { label: '13+',  bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
  '13+':   { label: '13+',  bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
  'R':     { label: '18+',  bg: 'rgba(239,68,68,0.15)',  text: '#f87171', border: 'rgba(239,68,68,0.3)' },
  '18+':   { label: '18+',  bg: 'rgba(239,68,68,0.15)',  text: '#f87171', border: 'rgba(239,68,68,0.3)' },
  'NC-17': { label: '18+',  bg: 'rgba(239,68,68,0.15)',  text: '#f87171', border: 'rgba(239,68,68,0.3)' },
  'TV-MA': { label: '18+',  bg: 'rgba(239,68,68,0.15)',  text: '#f87171', border: 'rgba(239,68,68,0.3)' },
  'TV-14': { label: '14+',  bg: 'rgba(249,115,22,0.15)', text: '#fb923c', border: 'rgba(249,115,22,0.3)' },
  'TV-PG': { label: 'PG',   bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' },
  'TV-G':  { label: 'G',    bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' },
  'TV-Y':  { label: 'Kids', bg: 'rgba(56,189,248,0.15)', text: '#38bdf8', border: 'rgba(56,189,248,0.3)' },
  'NR':    { label: 'NR',   bg: 'rgba(107,114,128,0.15)', text: '#9ca3af', border: 'rgba(107,114,128,0.3)' },
};

interface ContentRatingProps {
  rating?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  style?: any;
}

export default function ContentRating({ rating, size = 'sm', style }: ContentRatingProps) {
  if (!rating) return null;

  const config = RATING_CONFIG[rating.toUpperCase()] || RATING_CONFIG['NR'];
  const sizeStyles = SIZE_MAP[size];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border }, sizeStyles.container, style]}>
      <Text style={[styles.label, { color: config.text }, sizeStyles.text]}>{config.label}</Text>
    </View>
  );
}

// Absolute-positioned badge for movie cards (top-right corner)
export function ContentRatingBadge({ rating, style }: { rating?: string | null; style?: any }) {
  if (!rating) return null;
  return (
    <View style={[styles.absoluteBadge, style]}>
      <ContentRating rating={rating} size="xs" />
    </View>
  );
}

const SIZE_MAP = {
  xs: {
    container: { paddingHorizontal: 4, paddingVertical: 2 },
    text: { fontSize: 8 },
  },
  sm: {
    container: { paddingHorizontal: 6, paddingVertical: 3 },
    text: { fontSize: 9 },
  },
  md: {
    container: { paddingHorizontal: 8, paddingVertical: 4 },
    text: { fontSize: fontSize.xs },
  },
  lg: {
    container: { paddingHorizontal: 10, paddingVertical: 5 },
    text: { fontSize: fontSize.sm },
  },
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.sm - 2,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: fontWeight.black,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  absoluteBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 10,
  },
});
