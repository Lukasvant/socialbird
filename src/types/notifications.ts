import type { Database } from "./database";

export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export interface NotificationWithActor extends Notification {
  actor: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}
