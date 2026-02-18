
// frontend/src/graphql/mutations/adminMutations.js
import { gql } from '@apollo/client';

export const ADMIN_LOGIN = gql`
  mutation AdminLogin($input: AdminLoginInput!) {
    adminLogin(input: $input) {
      token
      admin { id email firstName lastName role }
      requiresTwoFactor
      expiresAt
    }
  }
`;

export const ADMIN_LOGOUT = gql`
  mutation AdminLogout {
    adminLogout
  }
`;

export const ADMIN_CHANGE_PASSWORD = gql`
  mutation AdminChangePassword($currentPassword: String!, $newPassword: String!) {
    adminChangePassword(currentPassword: $currentPassword, newPassword: $newPassword)
  }
`;

export const ADMIN_SETUP_2FA = gql`
  mutation AdminSetup2FA {
    adminSetupTwoFactor { secret qrCode }
  }
`;

export const ADMIN_ENABLE_2FA = gql`
  mutation AdminEnable2FA($code: String!) {
    adminEnableTwoFactor(code: $code)
  }
`;

export const ADMIN_CREATE_MOVIE = gql`
  mutation AdminCreateMovie($input: CreateMovieInput!) {
    adminCreateMovie(input: $input) {
      id title posterUrl
    }
  }
`;

export const ADMIN_UPDATE_MOVIE = gql`
  mutation AdminUpdateMovie($id: ID!, $input: UpdateMovieInput!) {
    adminUpdateMovie(id: $id, input: $input) {
      id title posterUrl
    }
  }
`;

export const ADMIN_DELETE_MOVIE = gql`
  mutation AdminDeleteMovie($id: ID!) {
    adminDeleteMovie(id: $id)
  }
`;

export const ADMIN_BULK_IMPORT = gql`
  mutation AdminBulkImport($source: String!, $count: Int!) {
    adminBulkImportMovies(source: $source, count: $count)
  }
`;

export const ADMIN_BAN_USER = gql`
  mutation AdminBanUser($id: ID!, $reason: String!, $duration: Int) {
    adminBanUser(id: $id, reason: $reason, duration: $duration)
  }
`;

export const ADMIN_UNBAN_USER = gql`
  mutation AdminUnbanUser($id: ID!) {
    adminUnbanUser(id: $id)
  }
`;

export const CREATE_BANNER = gql`
  mutation CreateBanner($input: CreateBannerInput!) {
    createBanner(input: $input) {
      id title imageUrl
    }
  }
`;

export const UPDATE_BANNER = gql`
  mutation UpdateBanner($id: ID!, $input: UpdateBannerInput!) {
    updateBanner(id: $id, input: $input) {
      id title imageUrl
    }
  }
`;

export const DELETE_BANNER = gql`
  mutation DeleteBanner($id: ID!) {
    deleteBanner(id: $id)
  }
`;

export const UPDATE_SETTINGS = gql`
  mutation UpdateSettings($inputs: [UpdateSettingsInput!]!) {
    updateSettings(inputs: $inputs) {
      id key value
    }
  }
`;

export const CLEAR_CACHE = gql`
  mutation ClearCache($pattern: String) {
    clearCache(pattern: $pattern)
  }
`;

export const TRIGGER_ML_TRAINING = gql`
  mutation TriggerMLTraining {
    triggerModelTraining
  }
`;