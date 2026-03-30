import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation } from '@apollo/client/react';
import { UPDATE_PROFILE_FULL } from '@/lib/graphql';

export default function PreferencesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [emailNotifications, setEmailNotifications] = useState(user?.preferences?.emailNotifications ?? true);
  const [autoPlayTrailers, setAutoPlayTrailers] = useState(user?.preferences?.autoPlayTrailers ?? true);

  const [updateProfile, { loading }] = useMutation(UPDATE_PROFILE_FULL);

  const handleToggle = async (key: 'emailNotifications' | 'autoPlayTrailers', value: boolean) => {
    try {
      if (key === 'emailNotifications') setEmailNotifications(value);
      if (key === 'autoPlayTrailers') setAutoPlayTrailers(value);

      await updateProfile({
        variables: {
          input: {
            preferences: {
              emailNotifications: key === 'emailNotifications' ? value : emailNotifications,
              autoPlayTrailers: key === 'autoPlayTrailers' ? value : autoPlayTrailers
            }
          }
        }
      });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update preferences');
      // Revert if error
      if (key === 'emailNotifications') setEmailNotifications(!value);
      if (key === 'autoPlayTrailers') setAutoPlayTrailers(!value);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>

      <Text style={styles.pageTitle}>Preferences</Text>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Email Notifications</Text>
              <Text style={styles.settingSub}>Receive updates and recommendations</Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={(val) => handleToggle('emailNotifications', val)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={emailNotifications ? '#fff' : '#f4f3f4'}
              disabled={loading}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Playback</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Autoplay Trailers</Text>
              <Text style={styles.settingSub}>Automatically play trailers while browsing</Text>
            </View>
            <Switch
              value={autoPlayTrailers}
              onValueChange={(val) => handleToggle('autoPlayTrailers', val)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={autoPlayTrailers ? '#fff' : '#f4f3f4'}
              disabled={loading}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 56 },
  backBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, alignSelf: 'flex-start' },
  pageTitle: { color: colors.text, fontSize: fontSize.xxxl, fontWeight: fontWeight.black, marginTop: spacing.sm, marginBottom: spacing.xl, paddingHorizontal: spacing.xl },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  section: { marginBottom: spacing.xxl },
  sectionTitle: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: fontWeight.bold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing.lg },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  settingInfo: { flex: 1, paddingRight: spacing.lg },
  settingLabel: { color: colors.text, fontSize: fontSize.md, fontWeight: fontWeight.medium, marginBottom: 2 },
  settingSub: { color: colors.textMuted, fontSize: fontSize.xs, lineHeight: 18 },
});
