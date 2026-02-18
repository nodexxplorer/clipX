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
        createdAt
        preferences {
          favoriteGenres
          theme
        }
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
        id
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