import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { Compass } from "lucide-react";
import { relativeTime } from "@/src/lib/time";
import type { ConversationListItem } from "@/src/types/messages";

interface ConversationListProps {
  conversations: ConversationListItem[];
  currentUserId: string;
}

export function ConversationList({
  conversations,
  currentUserId,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <Compass className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="mb-1 font-semibold text-foreground">No conversations yet</p>
        <p className="mb-5 text-sm text-muted-foreground">
          Find people to connect with!
        </p>
        <Link
          href="/discover"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Discover people
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {conversations.map((conv, i) => {
        const initials = conv.other_display_name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        const isUnread = conv.unread_count > 0;
        const lastMsgPreview = conv.last_message_content
          ? conv.last_message_content.length > 60
            ? `${conv.last_message_content.slice(0, 60)}…`
            : conv.last_message_content
          : null;
        const isMine = conv.last_message_sender_id === currentUserId;

        return (
          <Link
            key={conv.conversation_id}
            href={`/messages/${conv.conversation_id}`}
            className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-accent ${
              i > 0 ? "border-t border-border" : ""
            }`}
          >
            {/* Avatar with unread dot */}
            <div className="relative shrink-0">
              <Avatar className="h-11 w-11">
                <AvatarImage
                  src={conv.other_avatar_url ?? undefined}
                  alt={conv.other_display_name}
                />
                <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {isUnread && (
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-card bg-primary" />
              )}
            </div>

            {/* Name + last message */}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={`truncate text-sm ${
                    isUnread
                      ? "font-bold text-foreground"
                      : "font-medium text-foreground"
                  }`}
                >
                  {conv.other_display_name}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {relativeTime(conv.last_message_at)}
                </span>
              </div>
              {lastMsgPreview && (
                <p
                  className={`truncate text-sm ${
                    isUnread
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {isMine && (
                    <span className="text-muted-foreground">You: </span>
                  )}
                  {lastMsgPreview}
                </p>
              )}
            </div>

            {/* Unread badge */}
            {isUnread && (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {conv.unread_count > 99 ? "99+" : conv.unread_count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
