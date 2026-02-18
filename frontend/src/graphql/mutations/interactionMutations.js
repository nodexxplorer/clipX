
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