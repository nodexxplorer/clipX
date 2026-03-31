import { gql } from '@apollo/client';

// === Movie Fragments ===
export const MOVIE_FRAGMENT = gql`
  fragment MovieFields on Movie {
    id
    title
    overview
    posterPath
    backdropPath
    releaseDate
    voteAverage
    voteCount
    runtime
    popularity
  }
`;

export const MOVIE_WITH_GENRES = gql`
  fragment MovieWithGenres on Movie {
    ...MovieFields
    genres { id name slug }
  }
  ${MOVIE_FRAGMENT}
`;

// === Queries ===
export const GET_HOME_DATA = gql`
  query GetHomePageData($trendingLimit: Int, $popularLimit: Int) {
    trending(limit: $trendingLimit) { ...MovieWithGenres }
    popular(limit: $popularLimit) { ...MovieWithGenres }
    genres { id name slug movieCount }
  }
  ${MOVIE_WITH_GENRES}
`;

export const GET_MOVIE = gql`
  query GetMovie($id: ID!) {
    movie(id: $id) {
      ...MovieWithGenres
      tagline description status trailerUrl
      cast { id name character profileImage }
      seasons { id seasonNumber episodes { id title episodeNumber seasonNumber } }
      recommendations { ...MovieFields }
    }
  }
  ${MOVIE_WITH_GENRES}
  ${MOVIE_FRAGMENT}
`;

export const SEARCH_MOVIES = gql`
  query SearchMovies($query: String!, $limit: Int) {
    searchMovies(query: $query, limit: $limit) {
      items { ...MovieFields genres { id name } }
      totalCount
      hasMore
    }
  }
  ${MOVIE_FRAGMENT}
`;

export const GET_MOVIES = gql`
  query GetMovies($limit: Int, $offset: Int, $sort: String, $filter: MovieFilter) {
    movies(limit: $limit, offset: $offset, sort: $sort, filter: $filter) {
      movies { ...MovieWithGenres }
      total
      hasMore
    }
  }
  ${MOVIE_WITH_GENRES}
`;

export const GET_STREAMING_URL = gql`
  query GetStreamingUrl($movieId: ID!, $season: Int, $episode: Int) {
    streamingUrl(movieId: $movieId, season: $season, episode: $episode)
  }
`;

export const GET_TRENDING = gql`
  query GetTrending($limit: Int) {
    trending(limit: $limit) { ...MovieWithGenres }
  }
  ${MOVIE_WITH_GENRES}
`;

// === User Queries ===
export const GET_ME = gql`
  query GetCurrentUser {
    me {
      id email name avatar bio role createdAt
      preferences { favoriteGenres theme emailNotifications autoPlayTrailers }
      stats { moviesWatched totalWatchTime }
    }
  }
`;

export const GET_WATCHLIST = gql`
  query GetWatchlist {
    watchlist {
      id
      movies { id title description year rating posterUrl genres { name } }
    }
  }
`;

export const GET_DASHBOARD = gql`
  query GetDashboardData {
    dashboardData {
      watchlist { id title posterUrl rating releaseDate }
      recentlyViewed { id title posterUrl rating }
      continueWatching {
        id
        movie { id title backdropUrl posterUrl durationMinutes }
        currentTime duration
      }
      stats { moviesWatched totalWatchTime monthlyWatchTime watchlistCount reviewsWritten }
    }
  }
`;

export const GET_NOTIFICATIONS = gql`
  query GetNotifications {
    notifications { id title message type actionUrl isRead createdAt }
  }
`;

// === Mutations ===
export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password)
  }
`;

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user { id email name avatar role }
    }
  }
`;

export const GOOGLE_AUTH = gql`
  mutation GoogleAuth($idToken: String!) {
    googleAuth(idToken: $idToken) {
      token
      user { id email name avatar role createdAt }
      isNewUser
    }
  }
`;

export const TOGGLE_WATCHLIST = gql`
  mutation ToggleWatchlist($movieId: ID!) {
    toggleWatchlist(movieId: $movieId) {
      added
      message
    }
  }
`;

export const ADD_REVIEW = gql`
  mutation AddReview($movieId: ID!, $content: String!, $rating: Int!) {
    addReview(movieId: $movieId, content: $content, rating: $rating) {
      id content rating createdAt
    }
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($name: String, $bio: String, $avatar: String) {
    updateProfile(name: $name, bio: $bio, avatar: $avatar) {
      id name bio avatar
    }
  }
`;

export const UPDATE_WATCH_PROGRESS = gql`
  mutation UpdateWatchProgress($movieId: ID!, $contentType: String!, $currentTime: Int!, $duration: Int!) {
    updateWatchProgress(movieId: $movieId, contentType: $contentType, currentTime: $currentTime, duration: $duration) {
      success
      message
    }
  }
`;

export const FORGOT_PASSWORD = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email) {
      success
      message
    }
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword) {
      success
      message
    }
  }
`;

export const INITIALIZE_SUBSCRIPTION = gql`
  mutation InitializeSubscription($plan: String!, $billing: String!) {
    initializeSubscription(plan: $plan, billing: $billing)
  }
`;

export const VERIFY_PAYMENT = gql`
  mutation VerifyPayment($reference: String!) {
    verifyPayment(reference: $reference) {
      success
      message
    }
  }
`;

export const CANCEL_SUBSCRIPTION = gql`
  mutation CancelSubscription {
    cancelSubscription {
      success
      message
    }
  }
`;

export const SUBMIT_REPORT = gql`
  mutation SubmitReport($reason: String!, $description: String!, $movieId: String) {
    submitReport(reason: $reason, description: $description, movieId: $movieId) {
      success
      message
    }
  }
`;

export const UPDATE_PROFILE_FULL = gql`
  mutation UpdateProfileFull($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      name
      avatar
      preferences {
        theme
        emailNotifications
        autoPlayTrailers
      }
    }
  }
`;

export const MY_SUBSCRIPTION = gql`
  mutation MySubscription {
    mySubscription
  }
`;



// ─── Account & Security ─────────────────────────────
export const DELETE_ACCOUNT = gql`
  mutation DeleteAccount($password: String) {
    deleteAccount(password: $password) { success message }
  }
`;

export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
    changePassword(currentPassword: $currentPassword, newPassword: $newPassword) { success message }
  }
`;

export const RESEND_VERIFICATION = gql`
  mutation ResendVerification {
    resendVerification { success message }
  }
`;

export const LOGIN_ACTIVITY = gql`
  query LoginActivity($limit: Int) {
    loginActivity(limit: $limit) {
      id action deviceInfo ipAddress location success createdAt
    }
  }
`;

// ─── Promo & Stats ──────────────────────────────────
export const APPLY_PROMO_CODE = gql`
  mutation ApplyPromoCode($code: String!) {
    applyPromoCode(code: $code) { success message discountPercent plan }
  }
`;

export const PREMIUM_STATS = gql`
  query PremiumSignupStats {
    premiumSignupStats { totalPremiumUsers remainingSlots isEligible isActive }
  }
`;

export const MY_PAYMENT_HISTORY = gql`
  mutation MyPaymentHistory { myPaymentHistory }
`;

// ═══════════════════════════════════════════════════════════
// V2 — Review Interactions
// ═══════════════════════════════════════════════════════════

export const LIKE_REVIEW = gql`
  mutation LikeReview($reviewId: String!, $likeType: String!) {
    likeReview(reviewId: $reviewId, likeType: $likeType) {
      success
      message
    }
  }
`;

export const REPORT_REVIEW = gql`
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
