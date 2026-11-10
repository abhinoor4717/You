import type { UserSummary } from "./user";

export const MESSAGE_MAX_LENGTH = 4000;
export const TYPING_TIMEOUT_MS = 4000;

export type Conversation = {
  id: string;
  user_low_uuid: string;
  user_high_uuid: string;
  participant: UserSummary;
  created_at: string;
  updated_at: string;
  last_message: string | null;
};

export type ConversationPage = {
  conversations: Conversation[];
  nextCursor: string | null;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_uuid: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

export type MessagePage = {
  messages: Message[];
  hasMore: boolean;
};
