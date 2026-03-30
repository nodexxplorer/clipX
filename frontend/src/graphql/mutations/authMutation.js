/**
 * Authentication GraphQL Mutations
 */

import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!, $totpCode: String) {
    login(email: $email, password: $password, totpCode: $totpCode)
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

// ─── 2FA Mutations ───────────────────────────────────
export const SETUP_2FA_MUTATION = gql`
  mutation Setup2FA {
    setup2FA {
      secret
      qrUri
      backupCodes
    }
  }
`;

export const VERIFY_2FA_MUTATION = gql`
  mutation Verify2FA($code: String!) {
    verify2FA(code: $code) {
      success
      message
    }
  }
`;

export const DISABLE_2FA_MUTATION = gql`
  mutation Disable2FA($password: String) {
    disable2FA(password: $password) {
      success
      message
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

export const GET_2FA_STATUS = gql`
  query My2FAStatus {
    my2FAStatus
  }
`;