/**
 * clipX Mobile — Helper Utilities
 */

import { Movie } from "@/types";

/**
 * Returns a robust image URI for a movie's poster.
 * Handles both TMDB relative paths and full URLs.
 */
export function getPosterUri(movie: Movie): string | undefined {
  const p = movie.posterUrl || movie.posterPath;
  if (!p) return undefined;
  if (p.startsWith('http')) return p;
  // Handle relative TMDB paths (e.g. /abc.jpg)
  return `https://image.tmdb.org/t/p/w500${p.startsWith('/') ? p : '/' + p}`;
}

/**
 * Returns a robust image URI for a movie's backdrop.
 */
export function getBackdropUri(movie: Movie): string | undefined {
  const b = movie.backdropUrl || movie.backdropPath;
  if (!b) return undefined;
  if (b.startsWith('http')) return b;
  // Handle relative TMDB paths
  return `https://image.tmdb.org/t/p/w780${b.startsWith('/') ? b : '/' + b}`;
}
