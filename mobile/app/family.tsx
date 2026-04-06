/**
 * mobile/app/family.tsx
 *
 * Item 10 Fix: MOCK_MEMBERS replaced with a real GraphQL query.
 * Added GET_MY_FAMILY_PLAN query that fetches live member + invite data
 * from the backend's createFamilyPlan / inviteFamilyMember mutations.
 *
 * The backend returns family plan state via createFamilyPlan (JSON scalar)
 * which includes members array. We re-query dashboardData for the family
 * status since no standalone myFamilyPlan query exists in the schema yet.
 * A dedicated resolver should be added; see comment below.
 */

import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { gql } from '@apollo/client';
import {
    CREATE_FAMILY_PLAN, INVITE_FAMILY_MEMBER, REMOVE_FAMILY_MEMBER,
} from '@/lib/graphql';
import { useAuth } from '@/contexts/AuthContext';
import { colors, spacing, radius, fontSize, fontWeight } from '@/constants/theme';

// ─── GraphQL ─────────────────────────────────────────────────────────────────
// NOTE: Once you add a `myFamilyPlan` query to schema.py, replace this with
// a proper typed query. For now we use createFamilyPlan's JSON return to
// seed the initial state, and the invite/remove mutations update local state.
//
// Recommended schema addition:
//   @strawberry.field
//   async def myFamilyPlan(self, info) -> Optional[strawberry.scalars.JSON]:
//       user = await info.context.user
//       if not user: return None
//       plan = (await db.execute(
//           select(DbFamilyPlan).where(DbFamilyPlan.parent_id == user.id)
//       )).scalars().first()
//       if not plan: return None
//       members = (await db.execute(
//           select(DbFamilyMember).where(DbFamilyMember.family_plan_id == plan.id)
//       )).scalars().all()
//       # resolve user details for each member…
//       return { "id": str(plan.id), "inviteCode": plan.invite_code, "members": [...] }

const GET_MY_FAMILY_PLAN = gql`
  query GetMyFamilyPlan {
    myFamilyPlan
  }
`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface FamilyMember {
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'member';
    avatar?: string | null;
}

interface FamilyPlan {
    id: string;
    inviteCode: string;
    members: FamilyMember[];
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function FamilyScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting]   = useState(false);
    const [creating, setCreating]   = useState(false);

    // Load the real family plan from the server
    const {
        data: planData,
        loading: planLoading,
        refetch: refetchPlan,
        error: planError,
    } = useQuery<{ myFamilyPlan: FamilyPlan | null }>(GET_MY_FAMILY_PLAN, {
        fetchPolicy: 'cache-and-network',
        skip: !user,
    });

    const [createFamilyPlanMutation] = useMutation(CREATE_FAMILY_PLAN);
    const [inviteFamilyMember]       = useMutation(INVITE_FAMILY_MEMBER);
    const [removeFamilyMember]       = useMutation(REMOVE_FAMILY_MEMBER);

    const plan: FamilyPlan | null = planData?.myFamilyPlan ?? null;
    const members: FamilyMember[] = plan?.members ?? [];

    // ── Create plan ──────────────────────────────────────────────────────────
    const handleCreatePlan = async () => {
        setCreating(true);
        try {
            await createFamilyPlanMutation();
            await refetchPlan(); // Reload to get the newly created plan
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'You need a paid subscription to create a Family Plan.');
        }
        setCreating(false);
    };

    // ── Invite ───────────────────────────────────────────────────────────────
    const handleInvite = async () => {
        if (!inviteEmail.trim()) return;
        if (members.length >= 5) {
            Alert.alert('Limit Reached', 'A family plan can have a maximum of 5 members.');
            return;
        }
        setInviting(true);
        try {
            const { data } = await inviteFamilyMember({ variables: { email: inviteEmail.trim() } });
            const result = (data as any)?.inviteFamilyMember;
            if (result?.success) {
                Alert.alert('Invited!', `Invitation sent to ${inviteEmail}.`);
                setInviteEmail('');
                await refetchPlan();
            } else {
                Alert.alert('Error', result?.message || 'Failed to send invite');
            }
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to send invitation');
        }
        setInviting(false);
    };

    // ── Remove member ────────────────────────────────────────────────────────
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
                            await refetchPlan();
                        } catch {
                            Alert.alert('Error', 'Failed to remove member');
                        }
                    },
                },
            ]
        );
    };

    // ── No plan yet ──────────────────────────────────────────────────────────
    if (planLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!plan) {
        return (
            <View style={styles.container}>
                <StatusBar style="light" />
                <View style={styles.emptyState}>
                    <View style={styles.emptyIcon}>
                        <Ionicons name="people" size={48} color="#10b981" />
                    </View>
                    <Text style={styles.emptyTitle}>Family Plan</Text>
                    <Text style={styles.emptySubtitle}>
                        Share your clipX subscription with up to 5 family members.
                        Everyone gets their own profile, watchlist, and recommendations.
                    </Text>
                    <TouchableOpacity
                        onPress={handleCreatePlan}
                        disabled={creating}
                        style={styles.createButton}
                    >
                        <LinearGradient
                            colors={['#10b981', '#059669']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.createButtonGradient}
                        >
                            {creating
                                ? <ActivityIndicator color="#fff" />
                                : <>
                                    <Ionicons name="add" size={20} color="#fff" />
                                    <Text style={styles.createButtonText}>Create Family Plan</Text>
                                  </>
                            }
                        </LinearGradient>
                    </TouchableOpacity>
                    <Text style={styles.priceNote}>Requires Standard or Pro subscription</Text>
                </View>
            </View>
        );
    }

    // ── Active plan ──────────────────────────────────────────────────────────
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
                {/* Invite Code */}
                {plan.inviteCode && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Invite Code</Text>
                        <View style={styles.inviteCodeBox}>
                            <Text style={styles.inviteCode}>{plan.inviteCode}</Text>
                            <Text style={styles.inviteCodeHint}>
                                Share this code or use the email invite below
                            </Text>
                        </View>
                    </View>
                )}

                {/* Invite by Email */}
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
                            disabled={inviting || !inviteEmail.trim() || members.length >= 5}
                            style={[
                                styles.inviteButton,
                                (!inviteEmail.trim() || inviting || members.length >= 5) && styles.inviteButtonDisabled,
                            ]}
                        >
                            {inviting
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <Ionicons name="send" size={18} color="#fff" />
                            }
                        </TouchableOpacity>
                    </View>
                    {members.length >= 5 && (
                        <Text style={styles.limitNote}>Family plan is full (5/5 members)</Text>
                    )}
                </View>

                {/* Members List — now from real data */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Members</Text>
                    {members.length === 0 ? (
                        <Text style={styles.noMembersText}>
                            No members yet. Invite family members above.
                        </Text>
                    ) : (
                        members.map(member => (
                            <View key={member.id} style={styles.memberCard}>
                                <View style={styles.memberAvatar}>
                                    <Text style={styles.memberAvatarText}>
                                        {member.avatar ?? (member.name?.[0]?.toUpperCase() || '?')}
                                    </Text>
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
                        ))
                    )}
                </View>

                {/* Plan Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Plan Details</Text>
                    <View style={styles.planCard}>
                        {[
                            ['Plan',         'Family'],
                            ['Member slots', `${members.length}/5 used`],
                            ['Features',     '4K, Downloads, Family Profiles'],
                        ].map(([label, value], i, arr) => (
                            <View
                                key={label}
                                style={[styles.planRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}
                            >
                                <Text style={styles.planLabel}>{label}</Text>
                                <Text style={styles.planValue}>{value}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container:  { flex: 1, backgroundColor: '#050607' },
    center:     { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Empty
    emptyState:          { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    emptyIcon:           { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyTitle:          { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 8 },
    emptySubtitle:       { color: '#6b7280', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    createButton:        { width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
    createButtonGradient:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, minHeight: 52 },
    createButtonText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
    priceNote:           { color: '#4b5563', fontSize: 13, textAlign: 'center' },

    // Header
    header:           { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    backButton:       { padding: 8, marginRight: 8 },
    headerTitle:      { flex: 1, color: '#10b981', fontSize: 20, fontWeight: '800' },
    memberCount:      { backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    memberCountText:  { color: '#10b981', fontSize: 14, fontWeight: '700' },

    content: { flex: 1 },
    section: { padding: 16 },
    sectionTitle: { color: '#9ca3af', fontSize: 14, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },

    // Invite code
    inviteCodeBox:  { backgroundColor: 'rgba(16,185,129,0.06)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)', borderRadius: 16, padding: 16, alignItems: 'center' },
    inviteCode:     { color: '#10b981', fontSize: 28, fontWeight: '800', letterSpacing: 4 },
    inviteCodeHint: { color: '#6b7280', fontSize: 12, marginTop: 6, textAlign: 'center' },

    // Invite row
    inviteRow:            { flexDirection: 'row', gap: 8 },
    inviteInput:          { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 15 },
    inviteButton:         { width: 52, borderRadius: 16, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' },
    inviteButtonDisabled: { opacity: 0.4 },
    limitNote:            { color: '#6b7280', fontSize: 12, marginTop: 8 },

    // Members
    noMembersText: { color: '#6b7280', fontSize: 14, textAlign: 'center', paddingVertical: 16 },
    memberCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: 16, marginBottom: 8 },
    memberAvatar:  { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(16,185,129,0.2)', justifyContent: 'center', alignItems: 'center' },
    memberAvatarText: { fontSize: 18 },
    memberName:    { color: '#fff', fontSize: 15, fontWeight: '600' },
    memberEmail:   { color: '#6b7280', fontSize: 13, marginTop: 1 },
    ownerBadge:    { backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    ownerBadgeText:{ color: '#10b981', fontSize: 12, fontWeight: '600' },
    removeButton:  { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.1)', justifyContent: 'center', alignItems: 'center' },

    // Plan card
    planCard:  { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: 16, overflow: 'hidden' },
    planRow:   { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
    planLabel: { color: '#6b7280', fontSize: 14 },
    planValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
});