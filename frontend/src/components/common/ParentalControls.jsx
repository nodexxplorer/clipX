/**
 * Parental Controls — Kids Profile Toggle + PIN
 * Stored in localStorage. When active, filters all R/18+ content.
 */
import { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShield, FiLock, FiUnlock, FiX, FiCheck, FiAlertTriangle } from 'react-icons/fi';

// ─── Context ────────────────────────────────────────────────────────
const ParentalContext = createContext({
  isKidsMode: false,
  enableKidsMode: () => {},
  requestDisableKidsMode: () => {},
  isContentAllowed: () => true,
});

const RESTRICTED_RATINGS = ['R', '18+', 'NC-17', 'TV-MA', 'X'];
const STORAGE_KEY = 'clipx_parental';

export function ParentalProvider({ children }) {
  const [isKidsMode, setIsKidsMode] = useState(false);
  const [pin, setPin] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'disable' | null

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved?.enabled) {
        setIsKidsMode(true);
        setPin(saved.pin);
      }
    } catch {}
  }, []);

  const saveState = (enabled, pinCode) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled, pin: pinCode }));
    } catch {}
  };

  const enableKidsMode = useCallback((pinCode) => {
    setPin(pinCode);
    setIsKidsMode(true);
    saveState(true, pinCode);
  }, []);

  const requestDisableKidsMode = useCallback(() => {
    setPendingAction('disable');
    setShowPinModal(true);
  }, []);

  const handlePinVerified = useCallback(() => {
    if (pendingAction === 'disable') {
      setIsKidsMode(false);
      saveState(false, pin);
    }
    setShowPinModal(false);
    setPendingAction(null);
  }, [pendingAction, pin]);

  const isContentAllowed = useCallback((rating) => {
    if (!isKidsMode || !rating) return true;
    return !RESTRICTED_RATINGS.includes(rating.toUpperCase());
  }, [isKidsMode]);

  return (
    <ParentalContext.Provider value={{ isKidsMode, enableKidsMode, requestDisableKidsMode, isContentAllowed }}>
      {children}
      <PinModal
        isOpen={showPinModal}
        onClose={() => { setShowPinModal(false); setPendingAction(null); }}
        correctPin={pin}
        onVerified={handlePinVerified}
      />
    </ParentalContext.Provider>
  );
}

export const useParentalControls = () => useContext(ParentalContext);

// ─── PIN Modal ──────────────────────────────────────────────────────
function PinModal({ isOpen, onClose, correctPin, onVerified }) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const refs = [useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '']);
      setError(false);
      setTimeout(() => refs[0].current?.focus(), 100);
    }
  }, [isOpen]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    setError(false);

    if (value && index < 3) {
      refs[index + 1].current?.focus();
    }

    // Auto-submit when all 4 digits entered
    if (value && index === 3) {
      const entered = newDigits.join('');
      if (entered === correctPin) {
        onVerified();
      } else {
        setError(true);
        setTimeout(() => { setDigits(['', '', '', '']); refs[0].current?.focus(); }, 600);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 border border-white/10 rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-full bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
          <FiLock className="w-7 h-7 text-primary-400" />
        </div>
        <h3 className="text-xl font-black text-white mb-1">Enter PIN</h3>
        <p className="text-gray-400 text-sm mb-6">Enter your 4-digit parental PIN to continue</p>

        <div className="flex justify-center gap-3 mb-6">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              type="password"
              maxLength={1}
              value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className={`w-14 h-16 text-2xl font-black text-center rounded-xl border-2 bg-white/5 outline-none transition-all
                ${error ? 'border-red-500 animate-shake bg-red-500/5 text-red-400' :
                  d ? 'border-primary-500 text-white' : 'border-white/10 text-white focus:border-primary-500/50'}`}
            />
          ))}
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-sm font-medium mb-4"
          >
            Incorrect PIN. Try again.
          </motion.p>
        )}

        <button onClick={onClose} className="text-gray-500 hover:text-white text-sm font-medium transition-colors">
          Cancel
        </button>
      </motion.div>
    </div>
  );
}

// ─── Settings UI for enabling Kids Mode ─────────────────────────────
export function ParentalControlsSettings() {
  const { isKidsMode, enableKidsMode, requestDisableKidsMode } = useParentalControls();
  const [showSetup, setShowSetup] = useState(false);
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const pinRefs = [useRef(), useRef(), useRef(), useRef()];

  const handlePinInput = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...newPin];
    updated[index] = value;
    setNewPin(updated);
    if (value && index < 3) pinRefs[index + 1].current?.focus();
  };

  const handleEnable = () => {
    const pin = newPin.join('');
    if (pin.length !== 4) return;
    enableKidsMode(pin);
    setShowSetup(false);
    setNewPin(['', '', '', '']);
  };

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isKidsMode ? 'bg-green-500/10' : 'bg-purple-500/10'}`}>
            <FiShield className={`w-5 h-5 ${isKidsMode ? 'text-green-400' : 'text-purple-400'}`} />
          </div>
          <div>
            <h4 className="text-white font-bold text-sm">Kids Mode</h4>
            <p className="text-gray-500 text-xs">Blocks 18+ / R-rated content</p>
          </div>
        </div>

        {isKidsMode ? (
          <button
            onClick={requestDisableKidsMode}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm rounded-xl hover:bg-red-500/20 transition-colors"
          >
            <FiUnlock className="w-4 h-4" /> Disable
          </button>
        ) : (
          <button
            onClick={() => { setShowSetup(true); setTimeout(() => pinRefs[0].current?.focus(), 100); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 text-primary-400 font-bold text-sm rounded-xl hover:bg-primary-500/20 transition-colors"
          >
            <FiLock className="w-4 h-4" /> Enable
          </button>
        )}
      </div>

      {isKidsMode && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs font-medium">
          <FiCheck className="w-4 h-4" />
          Kids Mode is active — R-rated content is hidden. Enter PIN to disable.
        </div>
      )}

      <AnimatePresence>
        {showSetup && !isKidsMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-gray-400 text-sm mb-3">Create a 4-digit PIN (required to exit Kids Mode):</p>
              <div className="flex items-center gap-3">
                {newPin.map((d, i) => (
                  <input
                    key={i}
                    ref={pinRefs[i]}
                    type="password"
                    maxLength={1}
                    value={d}
                    onChange={e => handlePinInput(i, e.target.value)}
                    className="w-12 h-14 text-xl font-bold text-center rounded-xl border-2 border-white/10 bg-white/5 text-white outline-none focus:border-primary-500/50 transition-all"
                  />
                ))}
                <button
                  onClick={handleEnable}
                  disabled={newPin.join('').length !== 4}
                  className="px-5 py-3 bg-primary-600 text-white font-bold text-sm rounded-xl hover:bg-primary-500 transition-colors disabled:opacity-40"
                >
                  Activate
                </button>
                <button onClick={() => setShowSetup(false)} className="p-3 text-gray-500 hover:text-white transition-colors">
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
