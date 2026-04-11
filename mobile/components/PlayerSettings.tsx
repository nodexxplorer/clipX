/**
 * Mobile Player Settings Bottom Sheet
 * Quality selector, playback speed, subtitles, and screen rotation.
 */
import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Modal, ScrollView, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';

const QUALITY_OPTIONS = [
  { value: 'auto', label: 'Auto', desc: 'Best for your connection' },
  { value: '4K', label: '4K', desc: 'Ultra HD' },
  { value: '1080p', label: '1080p', desc: 'Full HD' },
  { value: '720p', label: '720p', desc: 'HD' },
  { value: '480p', label: '480p', desc: 'SD' },
  { value: '360p', label: '360p', desc: 'Data saver' },
];

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const DEFAULT_SUBTITLE_TRACKS = [
  { id: 'off', label: 'Off', language: null },
  { id: 'en', label: 'English', language: 'en' },
  { id: 'fr', label: 'French', language: 'fr' },
  { id: 'es', label: 'Spanish', language: 'es' },
  { id: 'ar', label: 'Arabic', language: 'ar' },
];

interface SubtitleTrack {
  id: string;
  label: string;
  language: string | null;
}

interface PlayerSettingsProps {
  visible: boolean;
  onClose: () => void;
  quality: string;
  onQualityChange: (q: string) => void;
  playbackRate: number;
  onSpeedChange: (s: number) => void;
  // Subtitle support
  subtitleTrack?: string; // currently active subtitle track id ('off' or language code)
  onSubtitleChange?: (trackId: string) => void;
  availableSubtitles?: SubtitleTrack[];
  // Rotation
  isLandscape?: boolean;
  onRotate?: () => void;
}

export default function PlayerSettings({
  visible, onClose,
  quality, onQualityChange,
  playbackRate, onSpeedChange,
  subtitleTrack = 'off',
  onSubtitleChange,
  availableSubtitles,
  isLandscape = false,
  onRotate,
}: PlayerSettingsProps) {
  const [activeTab, setActiveTab] = useState<'quality' | 'speed' | 'subtitle'>('quality');

  const subtitleTracks = availableSubtitles && availableSubtitles.length > 0
    ? availableSubtitles
    : DEFAULT_SUBTITLE_TRACKS;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handleBar}>
          <View style={styles.handle} />
        </View>

        {/* Rotate Button (top right) */}
        {onRotate && (
          <Pressable style={styles.rotateBtn} onPress={() => { onRotate(); onClose(); }}>
            <Ionicons
              name={isLandscape ? 'phone-portrait-outline' : 'phone-landscape-outline'}
              size={18}
              color={colors.primary}
            />
            <Text style={styles.rotateBtnText}>
              {isLandscape ? 'Portrait' : 'Landscape'}
            </Text>
          </Pressable>
        )}

        {/* Tabs */}
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, activeTab === 'quality' && styles.tabActive]}
            onPress={() => setActiveTab('quality')}
          >
            <Ionicons name="settings-outline" size={16} color={activeTab === 'quality' ? colors.primary : colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'quality' && styles.tabTextActive]}>Quality</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'speed' && styles.tabActive]}
            onPress={() => setActiveTab('speed')}
          >
            <Ionicons name="speedometer-outline" size={16} color={activeTab === 'speed' ? colors.primary : colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'speed' && styles.tabTextActive]}>Speed</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'subtitle' && styles.tabActive]}
            onPress={() => setActiveTab('subtitle')}
          >
            <Ionicons name="text-outline" size={16} color={activeTab === 'subtitle' ? colors.primary : colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'subtitle' && styles.tabTextActive]}>Subtitles</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.content} bounces={false}>

          {/* Quality Tab */}
          {activeTab === 'quality' && (
            <View style={styles.section}>
              {QUALITY_OPTIONS.map(q => {
                const active = quality === q.value;
                return (
                  <Pressable
                    key={q.value}
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => { onQualityChange(q.value); onClose(); }}
                  >
                    <View style={styles.optionLeft}>
                      {active
                        ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        : <Ionicons name="ellipse-outline" size={20} color={colors.textMuted} />
                      }
                      <View>
                        <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{q.label}</Text>
                        <Text style={styles.optionDesc}>{q.desc}</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Speed Tab */}
          {activeTab === 'speed' && (
            <View style={styles.section}>
              <View style={styles.speedGrid}>
                {SPEED_OPTIONS.map(speed => {
                  const active = playbackRate === speed;
                  return (
                    <Pressable
                      key={speed}
                      style={[styles.speedBtn, active && styles.speedBtnActive]}
                      onPress={() => { onSpeedChange(speed); onClose(); }}
                    >
                      <Text style={[styles.speedText, active && styles.speedTextActive]}>
                        {speed === 1 ? 'Normal' : `${speed}x`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Subtitle Tab */}
          {activeTab === 'subtitle' && (
            <View style={styles.section}>
              <Text style={styles.sectionHint}>Select subtitle language</Text>
              {subtitleTracks.map(track => {
                const active = subtitleTrack === track.id;
                return (
                  <Pressable
                    key={track.id}
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => {
                      onSubtitleChange?.(track.id);
                      onClose();
                    }}
                  >
                    <View style={styles.optionLeft}>
                      {active
                        ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        : <Ionicons name="ellipse-outline" size={20} color={colors.textMuted} />
                      }
                      <View>
                        <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                          {track.label}
                        </Text>
                        {track.language && (
                          <Text style={styles.optionDesc}>{track.language.toUpperCase()}</Text>
                        )}
                      </View>
                    </View>
                    {track.id === 'off' && (
                      <Ionicons name="close-circle-outline" size={18} color={colors.textMuted} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}

        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: 40,
    maxHeight: '65%',
  },
  handleBar: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceLighter,
  },
  rotateBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(8,145,178,0.1)',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(8,145,178,0.25)',
  },
  rotateBtnText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceLight,
  },
  tabActive: {
    backgroundColor: 'rgba(8,145,178,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(8,145,178,0.3)',
  },
  tabText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  tabTextActive: {
    color: colors.primary,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  section: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  sectionHint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: 2,
  },
  optionActive: {
    backgroundColor: 'rgba(8,145,178,0.08)',
  },
  optionLocked: {
    opacity: 0.4,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  optionLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  optionLabelActive: {
    color: colors.primary,
  },
  optionDesc: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 1,
  },
  proBadge: {
    backgroundColor: 'rgba(139,92,246,0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm - 2,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
  },
  proBadgeText: {
    color: '#a78bfa',
    fontSize: 9,
    fontWeight: fontWeight.black,
    letterSpacing: 0.5,
  },
  stdBadge: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm - 2,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  stdBadgeText: {
    color: '#60a5fa',
    fontSize: 9,
    fontWeight: fontWeight.black,
    letterSpacing: 0.5,
  },
  speedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  speedBtn: {
    flex: 1,
    minWidth: '28%',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceLight,
  },
  speedBtnActive: {
    backgroundColor: 'rgba(8,145,178,0.15)',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  speedText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  speedTextActive: {
    color: colors.primary,
  },
});
