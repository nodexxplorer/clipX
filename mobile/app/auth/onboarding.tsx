import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, Pressable, StyleSheet, Image, Animated,
    ScrollView, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        icon: 'film-outline' as const,
        title: 'Unlimited Movies & Shows',
        subtitle: 'Stream thousands of movies, TV shows, anime, and documentaries in HD and 4K.',
        gradient: ['#0891b2', '#2563EB'],
    },
    {
        icon: 'cloud-download-outline' as const,
        title: 'Download & Watch Offline',
        subtitle: 'Download your favorites to watch anywhere, anytime — even without internet.',
        gradient: ['#8B5CF6', '#EC4899'],
    },
    {
        icon: 'people-outline' as const,
        title: 'Share with Family',
        subtitle: 'Create profiles and share your plan with up to 5 family members.',
        gradient: ['#F59E0B', '#EF4444'],
    },
    {
        icon: 'sparkles-outline' as const,
        title: 'AI Recommendations',
        subtitle: 'Our AI learns what you love and suggests movies you\'ll actually enjoy.',
        gradient: ['#10B981', '#06B6D4'],
    },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const [currentSlide, setCurrentSlide] = useState(0);
    const scrollRef = useRef<ScrollView>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    const handleNext = () => {
        if (currentSlide < SLIDES.length - 1) {
            const next = currentSlide + 1;
            setCurrentSlide(next);
            scrollRef.current?.scrollTo({ x: next * width, animated: true });
        } else {
            router.replace('/auth/register');
        }
    };

    const handleSkip = () => {
        router.replace('/auth/login');
    };

    const handleScroll = (event: any) => {
        const page = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentSlide(page);
    };

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            {/* Skip button */}
            <Pressable style={styles.skipBtn} onPress={handleSkip}>
                <Text style={styles.skipText}>Skip</Text>
            </Pressable>

            {/* Slides */}
            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                style={styles.slideContainer}
            >
                {SLIDES.map((slide, index) => (
                    <View key={index} style={[styles.slide, { width }]}>
                        <View style={[styles.iconCircle, { backgroundColor: `${slide.gradient[0]}15` }]}>
                            <Ionicons name={slide.icon} size={64} color={slide.gradient[0]} />
                        </View>
                        <Text style={styles.slideTitle}>{slide.title}</Text>
                        <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
                    </View>
                ))}
            </ScrollView>

            {/* Dots */}
            <View style={styles.dotsRow}>
                {SLIDES.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            currentSlide === index && styles.dotActive,
                        ]}
                    />
                ))}
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
                <Pressable style={styles.nextBtn} onPress={handleNext}>
                    <Text style={styles.nextBtnText}>
                        {currentSlide === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                    </Text>
                    <Ionicons
                        name={currentSlide === SLIDES.length - 1 ? 'arrow-forward' : 'chevron-forward'}
                        size={18}
                        color="#fff"
                    />
                </Pressable>

                {currentSlide === SLIDES.length - 1 && (
                    <Pressable style={styles.loginLink} onPress={() => router.push('/auth/login')}>
                        <Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text></Text>
                    </Pressable>
                )}
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    skipBtn: { position: 'absolute', top: 56, right: 24, zIndex: 10, padding: spacing.sm },
    skipText: { color: colors.textMuted, fontSize: fontSize.md, fontWeight: fontWeight.semibold },

    slideContainer: { flex: 1 },
    slide: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    iconCircle: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xxxl },
    slideTitle: { color: colors.text, fontSize: 28, fontWeight: fontWeight.black, textAlign: 'center', marginBottom: spacing.md },
    slideSubtitle: { color: colors.textSecondary, fontSize: fontSize.md, textAlign: 'center', lineHeight: 24, paddingHorizontal: 10 },

    dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: spacing.xl },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
    dotActive: { width: 24, backgroundColor: colors.primary },

    actionsRow: { paddingHorizontal: 40, paddingBottom: 50, alignItems: 'center' },
    nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', paddingVertical: 16, backgroundColor: colors.primary, borderRadius: radius.md },
    nextBtnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: fontWeight.bold },

    loginLink: { marginTop: spacing.lg },
    loginLinkText: { color: colors.textMuted, fontSize: fontSize.sm },
    loginLinkBold: { color: colors.primary, fontWeight: fontWeight.bold },
});
