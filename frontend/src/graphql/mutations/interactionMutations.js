
// src/graphql/mutations/interactionMutations.js
import { gql } from '@apollo/client';

export const TRACK_INTERACTION = gql`
  mutation TrackInteraction($input: InteractionInput!) {
    trackInteraction(input: $input) {
      success
      message
    }
  }
`;

export const UPDATE_PREFERENCES = gql`
  mutation UpdatePreferences($preferences: PreferencesInput!) {
    updatePreferences(preferences: $preferences) {
      success
      preferences {
        favoriteGenres
        preferredLanguages
        contentRating
      }
    }
  }
`;

// Backwards-compatible aliases expected by other modules
export const RECORD_INTERACTION = TRACK_INTERACTION;

export const RECORD_WATCH_PROGRESS = gql`
  mutation RecordWatchProgress($movieId: ID!, $currentTime: Int!, $duration: Int!) {
    recordWatchProgress(movieId: $movieId, currentTime: $currentTime, duration: $duration) {
      success
      message
    }
  }
`;

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id) {
      success
      message
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead {
      success
      message
    }
  }
`;

export const DELETE_NOTIFICATION = gql`
  mutation DeleteNotification($id: ID!) {
    deleteNotification(id: $id) {
      success
      message
    }
  }
`;

export const ADD_REVIEW = gql`
  mutation AddReview($content: String!, $rating: Float!, $movieboxId: String, $isFeatured: Boolean) {
    addReview(content: $content, rating: $rating, movieboxId: $movieboxId, isFeatured: $isFeatured) {
      success
      message
    }
  }
`;

export const SUBMIT_REPORT = gql`
  mutation SubmitReport($reason: String!, $description: String!, $movieboxId: String) {
    submitReport(reason: $reason, description: $description, movieboxId: $movieboxId) {
      success
      message
    }
  }
`;