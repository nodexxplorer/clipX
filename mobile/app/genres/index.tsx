import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { gql } from '@apollo/client';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';
import type { Genre } from '@/types';

const GET_GENRES = gql`
  query GetGenres { genres { id name slug movieCount } }
`;

const genreIcons: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
    action: 'flame', adventure: 'compass', animation: 'color-palette',
    comedy: 'happy', crime: 'skull', documentary: 'videocam',
    drama: 'heart', family: 'people', fantasy: 'sparkles',
    horror: 'skull-outline', mystery: 'search', romance: 'heart-circle',
    'science fiction': 'planet', thriller: 'flash', war: 'shield',
    western: 'sunny', music: 'musical-notes', history: 'book',
};

export default function GenresScreen() {
    const router = useRouter();
    const { data, loading } = useQuery<any>(GET_GENRES);
    const genres: Genre[] = data?.genres || [];

    if (loading && !data) {
        return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Genres</Text>
                <View style={{ width: 38 }} />
            </View>

            <FlatList
                data={genres}
                numColumns={2}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.grid}
                columnWrapperStyle={styles.gridRow}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                    const icon = genreIcons[item.name.toLowerCase()] || 'film';
                    return (
                        <Pressable
                            onPress={() => router.push(`/genres/${item.slug}`)}
                            style={styles.genreCard}
                        >
                            <Ionicons name={icon} size={28} color={colors.primary} />
                            <Text style={styles.genreName}>{item.name}</Text>
                            {item.movieCount ? (
                                <Text style={styles.genreCount}>{item.movieCount} titles</Text>
                            ) : null}
                        </Pressable>
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: 56, paddingBottom: spacing.md },
    backBtn: { padding: spacing.sm },
    headerTitle: { flex: 1, color: colors.text, fontSize: fontSize.xxl, fontWeight: fontWeight.black, textAlign: 'center' },
    grid: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
    gridRow: { gap: spacing.md, marginBottom: spacing.md },
    genreCard: {
        flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1,
        borderColor: colors.border, padding: spacing.xl, alignItems: 'center', gap: spacing.sm,
    },
    genreName: { color: colors.text, fontSize: fontSize.md, fontWeight: fontWeight.bold },
    genreCount: { color: colors.textMuted, fontSize: fontSize.xs },
});
