/**
 * Parental Controls Context + PIN Modal — Mobile
 * When Kids Mode is active, R/18+ content is filtered out.
 * Exiting Kids Mode requires a 4-digit PIN.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, Modal, Alert,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';

const RESTRICTED_RATINGS = ['R', '18+', 'NC-17', 'TV-MA', 'X'];
const STORAGE_KEY = 'clipx_parental';

interface ParentalState {
  isKidsMode: boolean;
  enableKidsMode: (pin: string) => void;
  requestDisableKidsMode: () => void;
  isContentAllowed: (rating?: string | null) => boolean;
}

const ParentalContext = createContext<ParentalState>({
  isKidsMode: false,
  enableKidsMode: () => {},
  requestDisableKidsMode: () => {},
  isContentAllowed: () => true,
});

export const useParentalControls = () => useContext(ParentalContext);

export function ParentalProvider({ children }: { children: React.ReactNode }) {
  const [isKidsMode, setIsKidsMode] = useState(false);
  const [pin, setPin] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);

  // Load from storage
  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then(val => {
      if (val) {
        try {
          const parsed = JSON.parse(val);
          if (parsed?.enabled) {
            setIsKidsMode(true);
            setPin(parsed.pin);
          }
        } catch {}
      }
    });
  }, []);

  const save = (enabled: boolean, pinCode: string | null) => {
    SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify({ enabled, pin: pinCode })).catch(() => {});
  };

  const enableKidsMode = useCallback((pinCode: string) => {
    setPin(pinCode);
    setIsKidsMode(true);
    save(true, pinCode);
  }, []);

  const requestDisableKidsMode = useCallback(() => {
    setShowPinModal(true);
  }, []);

  const handlePinVerified = useCallback(() => {
    setIsKidsMode(false);
    save(false, pin);
    setShowPinModal(false);
  }, [pin]);

  const isContentAllowed = useCallback((rating?: string | null) => {
    if (!isKidsMode || !rating) return true;
    return !RESTRICTED_RATINGS.includes(rating.toUpperCase());
  }, [isKidsMode]);

  return (
    <ParentalContext.Provider value={{ isKidsMode, enableKidsMode, requestDisableKidsMode, isContentAllowed }}>
      {children}
      <PinModal
        visible={showPinModal}
        onClose={() => setShowPinModal(false)}
        correctPin={pin}
        onVerified={handlePinVerified}
      />
    </ParentalContext.Provider>
  );
}

// ─── PIN Verification Modal ─────────────────────────────────────
function PinModal({ visible, onClose, correctPin, onVerified }: {
  visible: boolean;
  onClose: () => void;
  correctPin: string | null;
  onVerified: () => void;
}) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const refs = [useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null)];

  useEffect(() => {
    if (visible) {
      setDigits(['', '', '', '']);
      setError(false);
      setTimeout(() => refs[0].current?.focus(), 200);
    }
  }, [visible]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    setError(false);

    if (value && index < 3) {
      refs[index + 1].current?.focus();
    }

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

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-closed" size={28} color={colors.primary} />
          </View>
          <Text style={styles.modalTitle}>Enter PIN</Text>
          <Text style={styles.modalSubtitle}>Enter your 4-digit parental PIN to exit Kids Mode</Text>

          <View style={styles.pinRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={refs[i]}
                style={[styles.pinInput, d ? styles.pinInputFilled : null, error ? styles.pinInputError : null]}
                value={d}
                onChangeText={v => handleChange(i, v)}
                onKeyPress={e => handleKeyPress(i, e.nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={1}
                secureTextEntry
                textAlign="center"
              />
            ))}
          </View>

          {error && <Text style={styles.errorText}>Incorrect PIN. Try again.</Text>}

          <Pressable onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xxxl,
    width: '85%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(8,145,178,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: 18,
  },
  pinRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  pinInput: {
    width: 52,
    height: 60,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.black,
  },
  pinInputFilled: {
    borderColor: colors.primary,
  },
  pinInputError: {
    borderColor: colors.error,
    backgroundColor: 'rgba(239,68,68,0.05)',
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.lg,
  },
  cancelBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
});
