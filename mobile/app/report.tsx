import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation } from '@apollo/client/react';
import { SUBMIT_REPORT } from '@/lib/graphql';

const categories = ['Broken Stream', 'Wrong Content', 'Audio Issue', 'Subtitle Issue', 'App Bug', 'Other'];

export default function ReportScreen() {
  const router = useRouter();
  const { movieId, movieTitle } = useLocalSearchParams<{ movieId?: string; movieTitle?: string }>();
  const { isAuthenticated } = useAuth();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitReport, { loading }] = useMutation<{ submitReport: { success: boolean, message?: string } }>(SUBMIT_REPORT);

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Ionicons name="flag-outline" size={48} color={colors.textMuted} />
        <Text style={styles.centerTitle}>Report an Issue</Text>
        <Text style={styles.centerSub}>Sign in to submit reports</Text>
        <Pressable style={styles.authBtn} onPress={() => router.push('/auth/login')}>
          <Text style={styles.authBtnText}>Sign In</Text>
        </Pressable>
      </View>
    );
  }

  if (submitted) {
    return (
      <View style={styles.center}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={40} color={colors.success} />
        </View>
        <Text style={styles.centerTitle}>Report Submitted</Text>
        <Text style={styles.centerSub}>Thank you! We'll review your report and take action.</Text>
        <Pressable style={styles.authBtn} onPress={() => router.back()}>
          <Text style={styles.authBtnText}>Done</Text>
        </Pressable>
      </View>
    );
  }

  const handleSubmit = async () => {
    if (!category) { Alert.alert('Error', 'Please select a category'); return; }
    if (!description.trim()) { Alert.alert('Error', 'Please describe the issue'); return; }
    
    try {
      const { data } = await submitReport({
        variables: {
          reason: category,
          description: description,
          movieId: movieId || null
        }
      });
      if (data?.submitReport?.success) {
        setSubmitted(true);
      } else {
        Alert.alert('Error', data?.submitReport?.message || 'Failed to submit report');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An error occurred');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </Pressable>

      <Text style={styles.pageTitle}>Report an Issue</Text>

      {movieTitle && (
        <View style={styles.movieTag}>
          <Ionicons name="film-outline" size={16} color={colors.primary} />
          <Text style={styles.movieTagText}>{movieTitle}</Text>
        </View>
      )}

      {/* Category */}
      <Text style={styles.label}>Category</Text>
      <View style={styles.chipGrid}>
        {categories.map(cat => (
          <Pressable key={cat} onPress={() => setCategory(cat)}
            style={[styles.chip, category === cat && styles.chipActive]}>
            <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
          </Pressable>
        ))}
      </View>

      {/* Description */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Describe the issue in detail..."
        placeholderTextColor={colors.textMuted}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />

      <Pressable style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={loading}>
        <Ionicons name="send" size={18} color="#fff" />
        <Text style={styles.submitBtnText}>{loading ? 'Submitting...' : 'Submit Report'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: 100, paddingTop: 56 },
  center: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.xxxl },
  centerTitle: { color: colors.text, fontSize: fontSize.xxl, fontWeight: fontWeight.bold, marginTop: spacing.lg },
  centerSub: { color: colors.textMuted, fontSize: fontSize.md, marginTop: spacing.sm, textAlign: 'center' },
  authBtn: { marginTop: spacing.xl, paddingHorizontal: 40, paddingVertical: spacing.md, backgroundColor: colors.primary, borderRadius: radius.md },
  authBtnText: { color: '#fff', fontWeight: fontWeight.bold },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(16,185,129,0.1)', justifyContent: 'center', alignItems: 'center' },
  backBtn: { padding: spacing.sm, alignSelf: 'flex-start' },
  pageTitle: { color: colors.text, fontSize: fontSize.xxxl, fontWeight: fontWeight.black, marginTop: spacing.md, marginBottom: spacing.lg },
  movieTag: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: 'rgba(8,145,178,0.08)', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.md, marginBottom: spacing.xxl, alignSelf: 'flex-start' },
  movieTagText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  label: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: fontWeight.bold, marginBottom: spacing.md },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.round, backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  chipTextActive: { color: '#fff' },
  textArea: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, color: colors.text, fontSize: fontSize.md, minHeight: 120, marginBottom: spacing.xxl },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: radius.md },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: fontWeight.bold },
});
