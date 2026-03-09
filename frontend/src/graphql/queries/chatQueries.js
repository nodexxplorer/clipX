// frontend/src/graphql/queries/chatQueries.js
import { gql } from '@apollo/client';

export const GET_CHAT_MESSAGES = gql`
  query GetChatMessages($room: String, $limit: Int, $before: String) {
    chatMessages(room: $room, limit: $limit, before: $before) {
      id
      userId
      userName
      userAvatar
      room
      content
      createdAt
    }
  }
`;
