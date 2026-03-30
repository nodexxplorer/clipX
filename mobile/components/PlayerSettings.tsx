/**
 * Mobile Player Settings Bottom Sheet
 * Quality selector, playback speed, fit mode for the mobile video player.
 */
import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';
import { useSubscription } from '@/hooks/useSubscription';

const QUALITY_OPTIONS = [
  { value: 'auto', label: 'Auto', desc: 'Best for your connection' },
  { value: '4K', label: '4K', desc: 'Ultra HD', tier: 'pro' },
  { value: '1080', label: '1080p', desc: 'Full HD', tier: 'standard' },
  { value: '720', label: '720p', desc: 'HD', tier: 'standard' },
  { value: '480', label: '480p', desc: 'SD' },
  { value: '360', label: '360p', desc: 'Data saver' },
];

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

interface PlayerSettingsProps {
  visible: boolean;
  onClose: () => void;
  quality: string;
  onQualityChange: (q: string) => void;
  playbackRate: number;
  onSpeedChange: (s: number) => void;
}

export default function PlayerSettings({
  visible, onClose,
  quality, onQualityChange,
  playbackRate, onSpeedChange,
}: PlayerSettingsProps) {
  const [activeTab, setActiveTab] = useState<'quality' | 'speed'>('quality');
  const { isQualityAllowed } = useSubscription();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handleBar}>
          <View style={styles.handle} />
        </View>

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
        </View>

        <ScrollView style={styles.content} bounces={false}>
          {activeTab === 'quality' && (
            <View style={styles.section}>
              {QUALITY_OPTIONS.map(q => {
                const locked = q.tier && !isQualityAllowed(q.value);
                const active = quality === q.value;
                return (
                  <Pressable
                    key={q.value}
                    style={[styles.option, active && styles.optionActive, locked && styles.optionLocked]}
                    onPress={() => { if (!locked) { onQualityChange(q.value); onClose(); } }}
                    disabled={!!locked}
                  >
                    <View style={styles.optionLeft}>
                      {active && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                      {!active && !locked && <Ionicons name="ellipse-outline" size={20} color={colors.textMuted} />}
                      {locked && <Ionicons name="lock-closed" size={18} color={colors.warning} />}
                      <View>
                        <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{q.label}</Text>
                        <Text style={styles.optionDesc}>{q.desc}</Text>
                      </View>
                    </View>
                    {q.tier === 'pro' && !locked && (
                      <View style={styles.proBadge}>
                        <Text style={styles.proBadgeText}>PRO</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}

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
    maxHeight: '60%',
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
    fontSize: fontSize.sm,
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
