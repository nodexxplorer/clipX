/**
 * ContentRating Badge Component
 * Displays PG, 13+, 18+ ratings with appropriate colours.
 * Usage: <ContentRating rating="PG-13" size="sm" />
 */
import { motion } from 'framer-motion';

const RATING_CONFIG = {
  'G':     { label: 'G',     bg: 'bg-green-500/20',  text: 'text-green-400',  border: 'border-green-500/30' },
  'PG':    { label: 'PG',    bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'PG-13': { label: '13+',   bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  '13+':   { label: '13+',   bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  'R':     { label: '18+',   bg: 'bg-red-500/20',    text: 'text-red-400',    border: 'border-red-500/30' },
  '18+':   { label: '18+',   bg: 'bg-red-500/20',    text: 'text-red-400',    border: 'border-red-500/30' },
  'NC-17': { label: '18+',   bg: 'bg-red-500/20',    text: 'text-red-400',    border: 'border-red-500/30' },
  'TV-MA': { label: '18+',   bg: 'bg-red-500/20',    text: 'text-red-400',    border: 'border-red-500/30' },
  'TV-14': { label: '14+',   bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  'TV-PG': { label: 'PG',    bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'TV-G':  { label: 'G',     bg: 'bg-green-500/20',  text: 'text-green-400',  border: 'border-green-500/30' },
  'TV-Y':  { label: 'Kids',  bg: 'bg-sky-500/20',    text: 'text-sky-400',    border: 'border-sky-500/30' },
  'NR':    { label: 'NR',    bg: 'bg-gray-500/20',   text: 'text-gray-400',   border: 'border-gray-500/30' },
};

const SIZE_CLASSES = {
  xs: 'text-[9px] px-1.5 py-0.5',
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export default function ContentRating({ rating, size = 'sm', className = '', animate = false }) {
  if (!rating) return null;

  const config = RATING_CONFIG[rating.toUpperCase?.()] || RATING_CONFIG['NR'];
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.sm;

  const Wrapper = animate ? motion.span : 'span';
  const animProps = animate ? {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { type: 'spring', stiffness: 400, damping: 15 },
  } : {};

  return (
    <Wrapper
      {...animProps}
      className={`inline-flex items-center font-black uppercase tracking-wider rounded-md border
        ${config.bg} ${config.text} ${config.border} ${sizeClass} ${className}`}
      title={`Rated ${rating}`}
    >
      {config.label}
    </Wrapper>
  );
}

// Inline badge for movie cards (absolute positioned in top-right)
export function ContentRatingBadge({ rating, className = '' }) {
  if (!rating) return null;
  return (
    <div className={`absolute top-2 right-2 z-10 ${className}`}>
      <ContentRating rating={rating} size="xs" />
    </div>
  );
}
