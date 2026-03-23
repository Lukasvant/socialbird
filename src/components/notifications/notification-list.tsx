import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { Bell } from "lucide-react";
import { relativeTime } from "@/src/lib/time";
import type { NotificationWithActor } from "@/src/types/notifications";

interface NotificationListProps {
  notifications: NotificationWithActor[];
}

function notificationHref(n: NotificationWithActor): string {
  if (n.type === "new_follower" && n.actor_id) return `/profile/${n.actor_id}`;
  if (n.type === "post_liked" && n.post_id) return `/profile/${n.actor_id}`;
  if (n.type === "new_message" && n.conversation_id)
    return `/messages/${n.conversation_id}`;
  return "/notifications";
}

function notificationText(n: NotificationWithActor): string {
  const name = n.actor?.display_name ?? "Someone";
  if (n.type === "new_follower") return `${name} started following you`;
  if (n.type === "post_liked") return `${name} liked your sighting`;
  if (n.type === "new_message") return `${name} sent you a message`;
  return "";
}

export function NotificationList({ notifications }: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="mb-1 font-semibold text-foreground">No notifications yet</p>
        <p className="text-sm text-muted-foreground">
          Activity from followers and likes will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {notifications.map((n, i) => {
        const initials = (n.actor?.display_name ?? "?")
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return (
          <Link
            key={n.id}
            href={notificationHref(n)}
            className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-accent ${
              i > 0 ? "border-t border-border" : ""
            } ${!n.is_read ? "bg-primary/5" : ""}`}
          >
            {/* Actor avatar */}
            <div className="relative shrink-0">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={n.actor?.avatar_url ?? undefined}
                  alt={n.actor?.display_name ?? ""}
                />
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!n.is_read && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />
              )}
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm ${
                  !n.is_read ? "font-medium text-foreground" : "text-foreground"
                }`}
              >
                {notificationText(n)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {relativeTime(n.created_at)}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
