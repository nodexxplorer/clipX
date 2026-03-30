/**
 * Skip Intro Overlay
 * Detects intro timestamps from movie metadata and displays a clickable "Skip Intro" button.
 * Also includes Skip Recap for series recaps.
 * 
 * Props:
 *   currentTime - current playback time in seconds
 *   introStart  - intro start timestamp (seconds), from metadata
 *   introEnd    - intro end timestamp (seconds)
 *   recapEnd    - optional recap end timestamp
 *   onSkip      - callback(targetTime) when user clicks skip
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSkipForward } from 'react-icons/fi';

export default function SkipIntro({
  currentTime = 0,
  introStart = null,
  introEnd = null,
  recapEnd = null,
  onSkip,
}) {
  const [dismissed, setDismissed] = useState(false);
  const [recapDismissed, setRecapDismissed] = useState(false);

  // Reset dismissed state when intro timestamps change (e.g. new episode)
  useEffect(() => {
    setDismissed(false);
    setRecapDismissed(false);
  }, [introStart, introEnd, recapEnd]);

  // Show skip recap button
  const showRecap = !recapDismissed && recapEnd && currentTime >= 0 && currentTime < recapEnd && currentTime < 120;

  // Show skip intro button — intro must be defined and we're within the intro window
  const showIntro = !dismissed && introStart != null && introEnd != null &&
    currentTime >= introStart && currentTime < introEnd;

  const handleSkipIntro = () => {
    onSkip?.(introEnd);
    setDismissed(true);
  };

  const handleSkipRecap = () => {
    onSkip?.(recapEnd);
    setRecapDismissed(true);
  };

  return (
    <AnimatePresence>
      {showRecap && (
        <motion.button
          key="recap"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={handleSkipRecap}
          className="absolute bottom-28 right-6 z-30 flex items-center gap-2.5 px-5 py-3
            bg-white/10 hover:bg-white/20 backdrop-blur-xl
            border border-white/20 rounded-xl
            text-white font-bold text-sm
            transition-all hover:scale-[1.03] active:scale-[0.97]
            shadow-lg shadow-black/40"
        >
          <FiSkipForward className="w-4 h-4" />
          Skip Recap
        </motion.button>
      )}

      {showIntro && (
        <motion.button
          key="intro"
          initial={{ opacity: 0, x: 40, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 40, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={handleSkipIntro}
          className="absolute bottom-28 right-6 z-30 group flex items-center gap-3 pl-5 pr-6 py-3 overflow-hidden
            rounded-xl border border-white/20
            text-white font-bold text-sm
            transition-all hover:scale-[1.03] active:scale-[0.97]
            shadow-xl shadow-black/50"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(6,182,212,0.3) 100%)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Animated shine effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <FiSkipForward className="w-5 h-5 relative z-10" />
          <span className="relative z-10">Skip Intro</span>

          {/* Progress indicator showing how much intro remains */}
          {introEnd && introStart && (
            <div className="absolute bottom-0 left-0 h-[2px] bg-primary-500/60 transition-all duration-1000"
              style={{ width: `${Math.min(100, ((currentTime - introStart) / (introEnd - introStart)) * 100)}%` }}
            />
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
