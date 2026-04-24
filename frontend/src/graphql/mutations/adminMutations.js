// frontend/src/graphql/mutations/adminMutations.js
import { gql } from '@apollo/client';

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

export const ADMIN_SEND_NOTIFICATION = gql`
  mutation AdminSendNotification($title: String!, $message: String!, $userId: ID, $notifType: String) {
    adminSendNotification(title: $title, message: $message, userId: $userId, notifType: $notifType) {
      success
      message
    }
  }
`;

export const ADMIN_UPDATE_USER_ROLE = gql`
  mutation AdminUpdateUserRole($id: ID!, $role: String!) {
    adminUpdateUserRole(id: $id, role: $role) {
      success
      message
    }
  }
`;

export const ADMIN_DELETE_USER = gql`
  mutation AdminDeleteUser($id: ID!) {
    adminDeleteUser(id: $id) {
      success
      message
    }
  }
`;

export const UPDATE_REPORT_STATUS = gql`
  mutation UpdateReportStatus($id: ID!, $status: String!) {
    updateReportStatus(id: $id, status: $status) {
      success
      message
    }
  }
`;

export const EXPORT_REVENUE_CSV = gql`
  query ExportRevenueCsv($days: Int) {
    revenueExportCsv(days: $days)
  }
`;

export const ADMIN_SET_MOVIE_TIMESTAMPS = gql`
  mutation AdminSetMovieTimestamps($movieId: ID!, $introStart: Float, $introEnd: Float, $creditsStart: Float, $recapEnd: Float) {
    adminSetMovieTimestamps(movieId: $movieId, introStart: $introStart, introEnd: $introEnd, creditsStart: $creditsStart, recapEnd: $recapEnd) {
      success
      message
    }
  }
`;

export const LOG_SEARCH = gql`
  mutation LogSearch($query: String!, $resultCount: Int) {
    logSearch(query: $query, resultCount: $resultCount) {
      success
      message
    }
  }
`;

export const ADMIN_CREATE_MOVIE = gql`
  mutation AdminCreateMovie($input: MovieInput!) {
    adminCreateMovie(input: $input) {
      id
      title
      posterUrl
    }
  }
`;