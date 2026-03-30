/**
 * Player Settings Panel
 * Quality selector, playback speed, audio tracks, video fit, subtitles
 * Slides in from the right of the player.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiLock, FiChevronRight, FiChevronLeft } from 'react-icons/fi';

const QUALITY_OPTIONS = [
  { value: 'auto', label: 'Auto', description: 'Adapts to your connection' },
  { value: '4K', label: '4K', description: '2160p · Ultra HD', tier: 'pro' },
  { value: '1080', label: '1080p', description: 'Full HD', tier: 'standard' },
  { value: '720', label: '720p', description: 'HD', tier: 'standard' },
  { value: '480', label: '480p', description: 'SD' },
  { value: '360', label: '360p', description: 'Low · Data saver' },
];

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const FIT_OPTIONS = [
  { value: 'contain', label: 'Fit' },
  { value: 'cover', label: 'Fill' },
  { value: 'fill', label: 'Stretch' },
  { value: '16:9', label: '16:9' },
  { value: '4:3', label: '4:3' },
];

export default function PlayerSettingsPanel({
  isOpen,
  onClose,
  // Quality
  quality,
  onQualityChange,
  availableQualities = [],
  isQualityAllowed, // from useSubscription
  // Speed
  playbackRate,
  onSpeedChange,
  // Video fit
  videoFit,
  onFitChange,
  // Audio tracks
  audioTracks = [],
  activeAudioTrack,
  onAudioTrackChange,
  // Aspect ratio info
  aspectRatio,
}) {
  const [activeMenu, setActiveMenu] = useState('main'); // 'main' | 'quality' | 'speed' | 'audio' | 'fit'

  const goBack = () => setActiveMenu('main');

  // Reset to main when panel closes
  if (!isOpen && activeMenu !== 'main') {
    setActiveMenu('main');
  }

  const filteredQualities = QUALITY_OPTIONS.filter(q => {
    if (q.value === 'auto') return true;
    if (availableQualities.length === 0) return true; // show all if unknown
    return availableQualities.some(aq => aq.toLowerCase().includes(q.value));
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="absolute right-4 bottom-20 z-50 w-72 max-h-[70vh] overflow-y-auto
            bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            {activeMenu !== 'main' ? (
              <button onClick={goBack} className="flex items-center gap-1 text-gray-400 hover:text-white text-sm font-medium transition-colors">
                <FiChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <span className="text-white font-bold text-sm">Settings</span>
            )}
            <button onClick={onClose} className="p-1 text-gray-500 hover:text-white transition-colors">
              <FiX className="w-4 h-4" />
            </button>
          </div>

          {/* Main Menu */}
          {activeMenu === 'main' && (
            <div className="py-1">
              <MenuItem
                label="Quality"
                value={quality === 'auto' ? 'Auto' : quality}
                onClick={() => setActiveMenu('quality')}
              />
              <MenuItem
                label="Speed"
                value={playbackRate === 1 ? 'Normal' : `${playbackRate}x`}
                onClick={() => setActiveMenu('speed')}
              />
              <MenuItem
                label="Video Fit"
                value={FIT_OPTIONS.find(f => f.value === videoFit)?.label || 'Fit'}
                onClick={() => setActiveMenu('fit')}
              />
              {audioTracks.length > 1 && (
                <MenuItem
                  label="Audio"
                  value={activeAudioTrack || 'Default'}
                  onClick={() => setActiveMenu('audio')}
                />
              )}
              {aspectRatio && (
                <div className="px-4 py-2 text-xs text-gray-600">
                  Detected: {aspectRatio}
                </div>
              )}
            </div>
          )}

          {/* Quality Sub-menu */}
          {activeMenu === 'quality' && (
            <div className="py-1">
              <p className="px-4 pt-2 pb-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Quality</p>
              {filteredQualities.map(q => {
                const locked = q.tier && isQualityAllowed && !isQualityAllowed(q.value);
                return (
                  <button
                    key={q.value}
                    onClick={() => !locked && onQualityChange?.(q.value)}
                    disabled={locked}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors group
                      ${quality === q.value ? 'bg-primary-500/10' : 'hover:bg-white/5'}
                      ${locked ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <div className="w-5 flex justify-center">
                      {quality === q.value && <FiCheck className="w-4 h-4 text-primary-400" />}
                    </div>
                    <div className="flex-1">
                      <span className={`text-sm font-bold ${quality === q.value ? 'text-primary-400' : 'text-white'}`}>
                        {q.label}
                      </span>
                      {q.description && (
                        <span className="text-[10px] text-gray-500 ml-2">{q.description}</span>
                      )}
                    </div>
                    {locked && <FiLock className="w-3.5 h-3.5 text-yellow-500/70" />}
                    {q.tier === 'pro' && !locked && (
                      <span className="text-[9px] font-black text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">PRO</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Speed Sub-menu */}
          {activeMenu === 'speed' && (
            <div className="py-1">
              <p className="px-4 pt-2 pb-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Playback Speed</p>
              {SPEED_OPTIONS.map(speed => (
                <button
                  key={speed}
                  onClick={() => onSpeedChange?.(speed)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                    ${playbackRate === speed ? 'bg-primary-500/10' : 'hover:bg-white/5'}`}
                >
                  <div className="w-5 flex justify-center">
                    {playbackRate === speed && <FiCheck className="w-4 h-4 text-primary-400" />}
                  </div>
                  <span className={`text-sm font-bold ${playbackRate === speed ? 'text-primary-400' : 'text-white'}`}>
                    {speed === 1 ? 'Normal' : `${speed}x`}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Video Fit Sub-menu */}
          {activeMenu === 'fit' && (
            <div className="py-1">
              <p className="px-4 pt-2 pb-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Video Fit</p>
              {FIT_OPTIONS.map(f => (
                <button
                  key={f.value}
                  onClick={() => onFitChange?.(f.value)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                    ${videoFit === f.value ? 'bg-primary-500/10' : 'hover:bg-white/5'}`}
                >
                  <div className="w-5 flex justify-center">
                    {videoFit === f.value && <FiCheck className="w-4 h-4 text-primary-400" />}
                  </div>
                  <span className={`text-sm font-bold ${videoFit === f.value ? 'text-primary-400' : 'text-white'}`}>
                    {f.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Audio Tracks Sub-menu */}
          {activeMenu === 'audio' && (
            <div className="py-1">
              <p className="px-4 pt-2 pb-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Audio Track</p>
              {audioTracks.map((track, i) => (
                <button
                  key={track.id || i}
                  onClick={() => onAudioTrackChange?.(track)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                    ${activeAudioTrack === (track.label || track.language) ? 'bg-primary-500/10' : 'hover:bg-white/5'}`}
                >
                  <div className="w-5 flex justify-center">
                    {activeAudioTrack === (track.label || track.language) && <FiCheck className="w-4 h-4 text-primary-400" />}
                  </div>
                  <span className={`text-sm font-bold ${activeAudioTrack === (track.label || track.language) ? 'text-primary-400' : 'text-white'}`}>
                    {track.label || track.language || `Track ${i + 1}`}
                  </span>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Reusable menu item with arrow
function MenuItem({ label, value, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors group"
    >
      <span className="text-sm font-bold text-white">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-400">{value}</span>
        <FiChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors" />
      </div>
    </button>
  );
}
