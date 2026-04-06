/**
 * mobile/app/legal.tsx
 *
 * Single screen that covers:
 *  - Terms of Service
 *  - Privacy Policy
 *  - Cookie Policy
 *  - About clipX
 *
 * Reached from profile tab via the "Legal & About" menu item.
 * Add <Stack.Screen name="legal" /> to app/_layout.tsx.
 */

import React, { useState } from 'react';
import {
    View, Text, ScrollView, Pressable, StyleSheet, Linking, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';

// ─── Section content ─────────────────────────────────────────────────────────

const LAST_UPDATED = 'April 2026';
const APP_VERSION  = '1.0.0';
const SUPPORT_EMAIL = 'support@clipx.app';

type SectionId = 'terms' | 'privacy' | 'cookies' | 'about';

interface Section {
    id: SectionId;
    title: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
}

const SECTIONS: Section[] = [
    { id: 'about',   title: 'About clipX',      icon: 'information-circle-outline' },
    { id: 'terms',   title: 'Terms of Service',  icon: 'document-text-outline' },
    { id: 'privacy', title: 'Privacy Policy',    icon: 'shield-checkmark-outline' },
    { id: 'cookies', title: 'Cookie Policy',     icon: 'settings-outline' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
    return <Text style={styles.sectionHeading}>{children}</Text>;
}

function Para({ children }: { children: string }) {
    return <Text style={styles.para}>{children}</Text>;
}

function Bullet({ text }: { text: string }) {
    return (
        <View style={styles.bulletRow}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>{text}</Text>
        </View>
    );
}

// ─── Content views ────────────────────────────────────────────────────────────

function AboutContent() {
    return (
        <>
            <SectionHeading>What is clipX?</SectionHeading>
            <Para>
                clipX is a streaming platform that lets you watch movies and series on any device.
                We focus on a fast, clean experience with offline downloads, personalised recommendations,
                and family sharing built in.
            </Para>

            <SectionHeading>Contact & Support</SectionHeading>
            <Pressable
                style={styles.linkRow}
                onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
            >
                <Ionicons name="mail-outline" size={16} color={colors.primary} />
                <Text style={styles.linkText}>{SUPPORT_EMAIL}</Text>
            </Pressable>

            <SectionHeading>Version</SectionHeading>
            <Para>{`clipX Mobile v${APP_VERSION}`}</Para>

            <SectionHeading>Acknowledgements</SectionHeading>
            <Para>
                Content metadata provided by The Movie Database (TMDB). Streaming content is sourced
                through licensed providers. All trademarks remain property of their respective owners.
            </Para>
        </>
    );
}

function TermsContent() {
    return (
        <>
            <Para>{`Last updated: ${LAST_UPDATED}`}</Para>

            <SectionHeading>1. Acceptance</SectionHeading>
            <Para>
                By downloading or using clipX, you agree to these Terms of Service. If you do not agree,
                please uninstall the app and discontinue use.
            </Para>

            <SectionHeading>2. Eligibility</SectionHeading>
            <Para>
                You must be at least 13 years old to use clipX. Users under 18 should obtain parental
                consent. We reserve the right to verify age upon subscription.
            </Para>

            <SectionHeading>3. Subscriptions & Billing</SectionHeading>
            <Bullet text="Free accounts have access to a limited content library." />
            <Bullet text="Standard (₦3,000/month) and Pro (₦5,000/month) unlock the full library and offline downloads." />
            <Bullet text="Subscriptions auto-renew. Cancel anytime from the Subscription screen." />
            <Bullet text="Refunds are not provided for partial billing periods." />

            <SectionHeading>4. Prohibited Use</SectionHeading>
            <Bullet text="Do not share, record, or redistribute streamed content." />
            <Bullet text="Do not circumvent DRM, stream protection, or subscription gates." />
            <Bullet text="Do not use automated tools or scrapers against the platform." />
            <Bullet text="Do not impersonate other users or clipX staff." />

            <SectionHeading>5. Content Availability</SectionHeading>
            <Para>
                Content availability may change at any time. clipX is not responsible if specific titles
                are removed from the library.
            </Para>

            <SectionHeading>6. Termination</SectionHeading>
            <Para>
                We may suspend or terminate accounts that violate these terms without prior notice.
                You may delete your account at any time from the Security screen.
            </Para>

            <SectionHeading>7. Limitation of Liability</SectionHeading>
            <Para>
                clipX is provided "as is". We are not liable for indirect or consequential damages
                arising from use of the service.
            </Para>

            <SectionHeading>8. Changes</SectionHeading>
            <Para>
                We may update these terms. Continued use after notification constitutes acceptance
                of the updated terms.
            </Para>
        </>
    );
}

function PrivacyContent() {
    return (
        <>
            <Para>{`Last updated: ${LAST_UPDATED}`}</Para>

            <SectionHeading>What We Collect</SectionHeading>
            <Bullet text="Account info: name, email, password (hashed — never stored in plain text)." />
            <Bullet text="Usage data: movies watched, watch progress, search history." />
            <Bullet text="Device info: OS version, device model (for playback optimisation)." />
            <Bullet text="Payment data: handled entirely by Paystack — we never store card numbers." />

            <SectionHeading>How We Use It</SectionHeading>
            <Bullet text="To authenticate you and maintain your session." />
            <Bullet text="To personalise recommendations based on your watch history." />
            <Bullet text="To process subscription payments via Paystack." />
            <Bullet text="To send security alerts and product updates (you can opt out)." />

            <SectionHeading>Data Sharing</SectionHeading>
            <Para>
                We do not sell your personal data. We share data only with:
            </Para>
            <Bullet text="Paystack — payment processing." />
            <Bullet text="Google — OAuth sign-in (if used)." />
            <Bullet text="RevenueCat — subscription management on iOS/Android." />
            <Bullet text="Sentry — anonymised crash reporting." />

            <SectionHeading>Data Retention</SectionHeading>
            <Para>
                Your data is retained for as long as your account is active. On account deletion,
                personal data is removed within 30 days. Watch history may be retained in anonymised
                form for analytics.
            </Para>

            <SectionHeading>Your Rights</SectionHeading>
            <Bullet text="Access: request a copy of all data we hold about you." />
            <Bullet text="Correction: update your profile at any time." />
            <Bullet text="Deletion: delete your account from the Security screen." />
            <Bullet text="Portability: contact support to export your data." />

            <SectionHeading>Security</SectionHeading>
            <Para>
                Passwords are hashed with Argon2. Authentication tokens are stored as signed,
                short-lived JWTs. We use HTTPS for all data in transit.
            </Para>

            <SectionHeading>Contact</SectionHeading>
            <Pressable
                style={styles.linkRow}
                onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Privacy Request`)}
            >
                <Ionicons name="mail-outline" size={16} color={colors.primary} />
                <Text style={styles.linkText}>{SUPPORT_EMAIL}</Text>
            </Pressable>
        </>
    );
}

function CookiesContent() {
    return (
        <>
            <Para>{`Last updated: ${LAST_UPDATED}`}</Para>

            <SectionHeading>About This Policy</SectionHeading>
            <Para>
                The mobile app does not use browser cookies. Instead, it uses Expo SecureStore —
                an encrypted, hardware-backed keychain — to store your authentication token.
                This is more secure than cookies because it is never accessible to other apps
                or to the network.
            </Para>

            <SectionHeading>What We Store Locally</SectionHeading>
            <Bullet text="clipx_token — your encrypted authentication token (SecureStore)." />
            <Bullet text="Download database — an on-device SQLite file tracking your offline downloads." />
            <Bullet text="Watch volume — your last-used player volume (non-sensitive, in-memory only)." />
            <Bullet text="Push notification token — your FCM/APNs token registered with our servers." />

            <SectionHeading>What We Do NOT Store</SectionHeading>
            <Bullet text="Plain-text passwords — ever." />
            <Bullet text="Payment card numbers — Paystack handles this on their servers." />
            <Bullet text="Precise location — we never request location permissions." />

            <SectionHeading>Third-Party SDKs</SectionHeading>
            <Bullet text="RevenueCat — subscription status, device identifiers." />
            <Bullet text="Expo Notifications — push token, no message content stored locally." />
            <Bullet text="Sentry — anonymised crash data, no PII in stack traces." />

            <SectionHeading>Your Choices</SectionHeading>
            <Para>
                You can clear all locally stored data by deleting and reinstalling the app,
                or by deleting your account from the Security screen. Downloads can be managed
                individually from the Downloads tab.
            </Para>
        </>
    );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function LegalScreen() {
    const router  = useRouter();
    const insets  = useSafeAreaInsets();
    // Allow deep-linking to a specific tab: /legal?section=privacy
    const { section } = useLocalSearchParams<{ section?: SectionId }>();
    const [active, setActive] = useState<SectionId>(section ?? 'about');

    const content: Record<SectionId, React.ReactNode> = {
        about:   <AboutContent />,
        terms:   <TermsContent />,
        privacy: <PrivacyContent />,
        cookies: <CookiesContent />,
    };

    const activeSection = SECTIONS.find(s => s.id === active)!;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>{activeSection.title}</Text>
                <View style={{ width: 38 }} />
            </View>

            {/* Tab strip */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabStrip}
                contentContainerStyle={styles.tabContent}
            >
                {SECTIONS.map(s => (
                    <Pressable
                        key={s.id}
                        style={[styles.tab, active === s.id && styles.tabActive]}
                        onPress={() => setActive(s.id)}
                    >
                        <Ionicons
                            name={s.icon}
                            size={14}
                            color={active === s.id ? '#fff' : colors.textMuted}
                        />
                        <Text style={[styles.tabText, active === s.id && styles.tabTextActive]}>
                            {s.title}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>

            {/* Body */}
            <ScrollView
                style={styles.body}
                contentContainerStyle={styles.bodyContent}
                showsVerticalScrollIndicator={false}
            >
                {content[active]}

                {/* Contact footer */}
                <View style={styles.footer}>
                    <Ionicons name="mail-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.footerText}>
                        Questions?{' '}
                        <Text
                            style={styles.footerLink}
                            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
                        >
                            {SUPPORT_EMAIL}
                        </Text>
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container:     { flex: 1, backgroundColor: colors.background },
    header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
    backBtn:       { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center' },
    headerTitle:   { color: colors.text, fontSize: fontSize.lg, fontWeight: fontWeight.bold, flex: 1, textAlign: 'center' },

    tabStrip:      { flexGrow: 0, borderBottomWidth: 0.5, borderBottomColor: colors.border },
    tabContent:    { paddingHorizontal: spacing.xl, gap: spacing.sm, paddingBottom: spacing.sm },
    tab:           { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.round, backgroundColor: colors.surfaceLight },
    tabActive:     { backgroundColor: colors.primary },
    tabText:       { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
    tabTextActive: { color: '#fff' },

    body:          { flex: 1 },
    bodyContent:   { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: 60 },

    sectionHeading: { color: colors.text, fontSize: fontSize.md, fontWeight: fontWeight.bold, marginTop: spacing.xl, marginBottom: spacing.sm },
    para:           { color: colors.textSecondary, fontSize: fontSize.md, lineHeight: 22 },

    bulletRow:     { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
    bulletDot:     { color: colors.primary, fontSize: fontSize.md, lineHeight: 22 },
    bulletText:    { flex: 1, color: colors.textSecondary, fontSize: fontSize.md, lineHeight: 22 },

    linkRow:       { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
    linkText:      { color: colors.primary, fontSize: fontSize.md, textDecorationLine: 'underline' },

    footer:        { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xxxl, paddingTop: spacing.xl, borderTopWidth: 0.5, borderTopColor: colors.border },
    footerText:    { color: colors.textMuted, fontSize: fontSize.sm },
    footerLink:    { color: colors.primary, textDecorationLine: 'underline' },
});