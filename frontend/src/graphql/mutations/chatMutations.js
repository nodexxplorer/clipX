// frontend/src/graphql/mutations/chatMutations.js
import { gql } from '@apollo/client';

export const SEND_CHAT_MESSAGE = gql`
  mutation SendChatMessage($content: String!, $room: String) {
    sendChatMessage(content: $content, room: $room) {
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
