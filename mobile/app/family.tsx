/**
 * Mobile Family Plan Management Screen
 * Invite/remove members, manage family dashboard
 */

import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import {
    CREATE_FAMILY_PLAN,
    INVITE_FAMILY_MEMBER,
    REMOVE_FAMILY_MEMBER,
} from '../lib/graphql';

// Placeholder — in production this would come from a GraphQL query
const MOCK_MEMBERS = [
    { id: '1', name: 'You (Owner)', email: 'owner@email.com', role: 'owner', avatar: '👑' },
];

export default function FamilyScreen() {
    const router = useRouter();
    const [hasPlan, setHasPlan] = useState(false);
    const [members, setMembers] = useState(MOCK_MEMBERS);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);

    const [createFamilyPlan] = useMutation(CREATE_FAMILY_PLAN);
    const [inviteFamilyMember] = useMutation(INVITE_FAMILY_MEMBER);
    const [removeFamilyMember] = useMutation(REMOVE_FAMILY_MEMBER);

    const handleCreatePlan = async () => {
        try {
            await createFamilyPlan();
            setHasPlan(true);
        } catch (err) {
            Alert.alert('Error', 'You need a Family subscription tier to create a Family Plan.');
        }
    };

    const handleInvite = async () => {
        if (!inviteEmail.trim()) return;
        setInviting(true);
        try {
            const result = await inviteFamilyMember({ variables: { email: inviteEmail.trim() } });
            const data = result?.data as any;
            if (data?.inviteFamilyMember?.success) {
                Alert.alert('Invited!', `Invitation sent to ${inviteEmail}`);
                setInviteEmail('');
            } else {
                Alert.alert('Error', data?.inviteFamilyMember?.message || 'Failed to send invite');
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to send invitation');
        }
        setInviting(false);
    };

    const handleRemove = (memberId: string, memberName: string) => {
        Alert.alert(
            'Remove Member',
            `Remove ${memberName} from your family plan?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove', style: 'destructive',
                    onPress: async () => {
                        try {
                            await removeFamilyMember({ variables: { memberId } });
                            setMembers(prev => prev.filter(m => m.id !== memberId));
                        } catch (err) {
                            Alert.alert('Error', 'Failed to remove member');
                        }
                    },
                },
            ]
        );
    };

    if (!hasPlan) {
        return (
            <View style={styles.container}>
                <StatusBar style="light" />
                <View style={styles.emptyState}>
                    <View style={styles.emptyIcon}>
                        <Ionicons name="people" size={48} color="#10b981" />
                    </View>
                    <Text style={styles.emptyTitle}>Family Plan</Text>
                    <Text style={styles.emptySubtitle}>
                        Share your clipX subscription with up to 5 family members. Everyone gets their own profile, watchlist, and recommendations.
                    </Text>
                    <TouchableOpacity onPress={handleCreatePlan} style={styles.createButton}>
                        <LinearGradient
                            colors={['#10b981', '#059669']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.createButtonGradient}
                        >
                            <Ionicons name="add" size={20} color="#fff" />
                            <Text style={styles.createButtonText}>Create Family Plan</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <Text style={styles.priceNote}>Requires Family tier (₦12,000/month)</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={22} color="#9ca3af" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Family Plan</Text>
                <View style={styles.memberCount}>
                    <Text style={styles.memberCountText}>{members.length}/5</Text>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Invite Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Invite Member</Text>
                    <View style={styles.inviteRow}>
                        <TextInput
                            style={styles.inviteInput}
                            value={inviteEmail}
                            onChangeText={setInviteEmail}
                            placeholder="Enter email address"
                            placeholderTextColor="#4b5563"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <TouchableOpacity
                            onPress={handleInvite}
                            disabled={inviting || !inviteEmail.trim()}
                            style={[styles.inviteButton, (!inviteEmail.trim() || inviting) && styles.inviteButtonDisabled]}
                        >
                            <Ionicons name="send" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Members List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Members</Text>
                    {members.map((member) => (
                        <View key={member.id} style={styles.memberCard}>
                            <View style={styles.memberAvatar}>
                                <Text style={styles.memberAvatarText}>{member.avatar || member.name[0]}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.memberName}>{member.name}</Text>
                                <Text style={styles.memberEmail}>{member.email}</Text>
                            </View>
                            {member.role === 'owner' ? (
                                <View style={styles.ownerBadge}>
                                    <Text style={styles.ownerBadgeText}>Owner</Text>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => handleRemove(member.id, member.name)}
                                    style={styles.removeButton}
                                >
                                    <Ionicons name="close" size={18} color="#ef4444" />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </View>

                {/* Plan Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Plan Details</Text>
                    <View style={styles.planCard}>
                        <View style={styles.planRow}>
                            <Text style={styles.planLabel}>Plan</Text>
                            <Text style={styles.planValue}>Family</Text>
                        </View>
                        <View style={styles.planRow}>
                            <Text style={styles.planLabel}>Price</Text>
                            <Text style={styles.planValue}>₦12,000/month</Text>
                        </View>
                        <View style={styles.planRow}>
                            <Text style={styles.planLabel}>Member slots</Text>
                            <Text style={styles.planValue}>{members.length}/5 used</Text>
                        </View>
                        <View style={[styles.planRow, { borderBottomWidth: 0 }]}>
                            <Text style={styles.planLabel}>Features</Text>
                            <Text style={styles.planValue}>4K, Downloads, Zero Ads</Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050607' },

    // Empty state
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    emptyIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 8 },
    emptySubtitle: { color: '#6b7280', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    createButton: { width: '100%', borderRadius: 16, overflow: 'hidden' },
    createButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16 },
    createButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    priceNote: { color: '#4b5563', fontSize: 13, marginTop: 12 },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    backButton: { padding: 8, marginRight: 8 },
    headerTitle: { flex: 1, color: '#10b981', fontSize: 20, fontWeight: '800' },
    memberCount: { backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    memberCountText: { color: '#10b981', fontSize: 14, fontWeight: '700' },

    content: { flex: 1 },

    // Sections
    section: { padding: 16 },
    sectionTitle: { color: '#9ca3af', fontSize: 14, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },

    // Invite
    inviteRow: { flexDirection: 'row', gap: 8 },
    inviteInput: {
        flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 15,
    },
    inviteButton: { width: 52, borderRadius: 16, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' },
    inviteButtonDisabled: { opacity: 0.4 },

    // Member card
    memberCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
        backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16, marginBottom: 8,
    },
    memberAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(16,185,129,0.2)', justifyContent: 'center', alignItems: 'center' },
    memberAvatarText: { fontSize: 18 },
    memberName: { color: '#fff', fontSize: 15, fontWeight: '600' },
    memberEmail: { color: '#6b7280', fontSize: 13, marginTop: 1 },
    ownerBadge: { backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    ownerBadgeText: { color: '#10b981', fontSize: 12, fontWeight: '600' },
    removeButton: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.1)', justifyContent: 'center', alignItems: 'center' },

    // Plan card
    planCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: 16, overflow: 'hidden' },
    planRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
    planLabel: { color: '#6b7280', fontSize: 14 },
    planValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
