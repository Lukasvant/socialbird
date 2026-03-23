import type { Database } from "./database";

export type Message = Database["public"]["Tables"]["messages"]["Row"];

export type ConversationListItem = {
  conversation_id: string;
  other_user_id: string;
  other_display_name: string;
  other_avatar_url: string | null;
  last_message_content: string | null;
  last_message_at: string;
  last_message_sender_id: string | null;
  unread_count: number;
};
