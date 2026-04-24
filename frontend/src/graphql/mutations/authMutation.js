/**
 * Authentication GraphQL Mutations
 */

import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        name
        avatar
        role
        emailVerified
        createdAt
      }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        email
        name
        avatar
        emailVerified
        createdAt
      }
    }
  }
`;

export const GOOGLE_AUTH_MUTATION = gql`
  mutation GoogleAuth($idToken: String!) {
    googleAuth(idToken: $idToken) {
      token
      user {
        id
        email
        name
        avatar
        role
        createdAt
        preferences {
          favoriteGenres
          theme
        }
      }
      isNewUser
    }
  }
`;


export const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      email
      name
      avatar
      bio
      role
      createdAt
      preferences {
        theme
        emailNotifications
        autoPlayTrailers
        favoriteGenres
      }
      stats {
        id
        moviesWatched
        totalWatchTime
        reviewsWritten
        watchlistCount
      }
    }
  }
`;



export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout {
      success
    }
  }
`;

export const VERIFY_EMAIL_MUTATION = gql`
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token) {
      success
      message
    }
  }
`;

export const RESEND_VERIFICATION_MUTATION = gql`
  mutation ResendVerification {
    resendVerification {
      success
      message
    }
  }
`;

export const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
    changePassword(currentPassword: $currentPassword, newPassword: $newPassword) {
      success
      message
    }
  }
`;

export const FORGOT_PASSWORD_MUTATION = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email) {
      success
      message
    }
  }
`;

export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword) {
      success
      message
    }
  }
`;

export const DELETE_ACCOUNT_MUTATION = gql`
  mutation DeleteAccount($password: String!) {
    deleteAccount(password: $password) {
      success
      message
    }
  }
`;

export const UPDATE_AVATAR_MUTATION = gql`
  mutation UpdateAvatar($file: Upload!) {
    updateAvatar(file: $file) {
      id
      avatar
    }
  }
`;



// ─── Promo Code ───────────────────────────────────────
export const APPLY_PROMO_CODE_MUTATION = gql`
  mutation ApplyPromoCode($code: String!) {
    applyPromoCode(code: $code) {
      success
      message
      discountPercent
      plan
    }
  }
`;

// ─── Queries (often used from auth context) ──────────
export const GET_LOGIN_ACTIVITY = gql`
  query LoginActivity($limit: Int) {
    loginActivity(limit: $limit) {
      id
      action
      deviceInfo
      ipAddress
      location
      success
      createdAt
    }
  }
`;

export const GET_PREMIUM_STATS = gql`
  query PremiumSignupStats {
    premiumSignupStats {
      totalPremiumUsers
      remainingSlots
      isEligible
      isActive
    }
  }
`;

// ═══════════════════════════════════════════════════════════
// V2 — Review Interactions
// ═══════════════════════════════════════════════════════════

export const LIKE_REVIEW_MUTATION = gql`
  mutation LikeReview($reviewId: String!, $likeType: String!) {
    likeReview(reviewId: $reviewId, likeType: $likeType) {
      success
      message
    }
  }
`;

export const REPORT_REVIEW_MUTATION = gql`
  mutation ReportReview($reviewId: String!, $reason: String!, $description: String) {
    reportReview(reviewId: $reviewId, reason: $reason, description: $description) {
      success
      message
    }
  }
`;

// ═══════════════════════════════════════════════════════════
// V2 — Watch Party
// ═══════════════════════════════════════════════════════════

export const CREATE_WATCH_PARTY = gql`
  mutation CreateWatchParty($movieboxId: String!, $contentType: String) {
    createWatchParty(movieboxId: $movieboxId, contentType: $contentType)
  }
`;

export const JOIN_WATCH_PARTY = gql`
  mutation JoinWatchParty($roomCode: String!) {
    joinWatchParty(roomCode: $roomCode)
  }
`;

export const END_WATCH_PARTY = gql`
  mutation EndWatchParty($roomCode: String!) {
    endWatchParty(roomCode: $roomCode) {
      success
      message
    }
  }
`;

// ═══════════════════════════════════════════════════════════
// V2 — Family Plan
// ═══════════════════════════════════════════════════════════

export const CREATE_FAMILY_PLAN = gql`
  mutation CreateFamilyPlan {
    createFamilyPlan
  }
`;

export const INVITE_FAMILY_MEMBER = gql`
  mutation InviteFamilyMember($email: String!) {
    inviteFamilyMember(email: $email) {
      success
      message
    }
  }
`;

export const ACCEPT_FAMILY_INVITE = gql`
  mutation AcceptFamilyInvite($token: String!) {
    acceptFamilyInvite(token: $token) {
      success
      message
    }
  }
`;

export const REMOVE_FAMILY_MEMBER = gql`
  mutation RemoveFamilyMember($memberId: String!) {
    removeFamilyMember(memberId: $memberId) {
      success
      message
    }
  }
`;

// ═══════════════════════════════════════════════════════════
// V2 — Layout Preferences & Push Notifications
// ═══════════════════════════════════════════════════════════

export const SAVE_LAYOUT_PREFERENCE = gql`
  mutation SaveLayoutPreference($layoutOrder: [String!]!) {
    saveLayoutPreference(layoutOrder: $layoutOrder) {
      success
      message
    }
  }
`;

export const REGISTER_PUSH_TOKEN = gql`
  mutation RegisterPushToken($fcmToken: String!, $deviceType: String) {
    registerPushToken(fcmToken: $fcmToken, deviceType: $deviceType) {
      success
      message
    }
  }
`;

export const UNREGISTER_PUSH_TOKEN = gql`
  mutation UnregisterPushToken($fcmToken: String!) {
    unregisterPushToken(fcmToken: $fcmToken) {
      success
      message
    }
  }
`;

