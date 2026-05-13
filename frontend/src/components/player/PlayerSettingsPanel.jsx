/**
 * Player Settings Panel
 * Playback speed, audio tracks, video fit, subtitles, quality selection
 * Slides in from the right of the player.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiChevronRight, FiChevronLeft } from 'react-icons/fi';

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const FIT_OPTIONS = [
  { value: 'contain', label: 'Fit' },
  { value: 'cover', label: 'Fill' },
  { value: 'fill', label: 'Stretch' },
  { value: '16:9', label: '16:9' },
  { value: '4:3', label: '4:3' },
];

// Parse quality string like "720p" → 720 for sorting
function parseQualityNum(q) {
  if (!q) return 0;
  const s = q.toLowerCase().replace('p', '').trim();
  if (s === '4k' || s === '2160') return 2160;
  return parseInt(s, 10) || 0;
}

// Quality label with badge
function qualityLabel(q) {
  const num = parseQualityNum(q);
  if (num >= 2160) return '4K Ultra HD';
  if (num >= 1080) return '1080p Full HD';
  if (num >= 720) return '720p HD';
  if (num >= 480) return '480p SD';
  if (num >= 360) return '360p';
  return q || 'Auto';
}

function qualityBadge(q) {
  const num = parseQualityNum(q);
  if (num >= 2160) return '4K';
  if (num >= 1080) return 'HD';
  if (num >= 720) return 'HD';
  return null;
}

export default function PlayerSettingsPanel({
  isOpen,
  onClose,
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
  // Quality selection
  qualityOptions = [],
  activeQuality,
  onQualityChange,
}) {
  const [activeMenu, setActiveMenu] = useState('main'); // 'main' | 'speed' | 'audio' | 'fit' | 'quality'

  const goBack = () => setActiveMenu('main');

  // Reset to main when panel closes
  if (!isOpen && activeMenu !== 'main') {
    setActiveMenu('main');
  }

  // Sort quality options: highest first
  const sortedQualities = [...qualityOptions].sort(
    (a, b) => parseQualityNum(b.quality) - parseQualityNum(a.quality)
  );

  // Current quality label for the menu row
  const currentQualityLabel = activeQuality
    ? qualityOptions.find(q => q.quality === activeQuality)?.quality || 'Auto'
    : 'Auto';

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
              {/* Quality */}
              {sortedQualities.length > 0 && (
                <MenuItem
                  label="Quality"
                  value={currentQualityLabel}
                  badge={qualityBadge(currentQualityLabel)}
                  onClick={() => setActiveMenu('quality')}
                />
              )}
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
              {sortedQualities.map((opt) => {
                const isActive = activeQuality === opt.quality;
                const badge = qualityBadge(opt.quality);
                const sizeStr = opt.size
                  ? `${(opt.size / (1024 * 1024)).toFixed(0)} MB`
                  : null;
                return (
                  <button
                    key={opt.quality}
                    onClick={() => { onQualityChange?.(opt.quality, opt.url); setActiveMenu('main'); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                      ${isActive ? 'bg-primary-500/10' : 'hover:bg-white/5'}`}
                  >
                    <div className="w-5 flex justify-center">
                      {isActive && <FiCheck className="w-4 h-4 text-primary-400" />}
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <span className={`text-sm font-bold ${isActive ? 'text-primary-400' : 'text-white'}`}>
                        {qualityLabel(opt.quality)}
                      </span>
                      {badge && (
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm tracking-wider
                          ${isActive ? 'bg-primary-500/30 text-primary-300' : 'bg-white/10 text-gray-400'}`}>
                          {badge}
                        </span>
                      )}
                    </div>
                    {sizeStr && (
                      <span className="text-[10px] text-gray-500 font-mono">{sizeStr}</span>
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
function MenuItem({ label, value, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors group"
    >
      <span className="text-sm font-bold text-white">{label}</span>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-gray-400">{value}</span>
          {badge && (
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm bg-primary-500/20 text-primary-400 tracking-wider">
              {badge}
            </span>
          )}
        </div>
        <FiChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors" />
      </div>
    </button>
  );
}
