import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { NotificationList } from "@/src/components/notifications/notification-list";
import type { Notification, NotificationWithActor } from "@/src/types/notifications";

export const metadata = { title: "Notifications — WildScout" };

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch notifications
  const { data: rows } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const notifications = (rows ?? []) as Notification[];

  // Batch-fetch actor profiles
  const actorIds = [
    ...new Set(notifications.map((n) => n.actor_id).filter(Boolean) as string[]),
  ];

  const actorMap: Record<string, { id: string; display_name: string; avatar_url: string | null }> =
    {};

  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", actorIds);
    for (const p of profiles ?? []) {
      actorMap[p.id] = p;
    }
  }

  const enriched: NotificationWithActor[] = notifications.map((n) => ({
    ...n,
    actor: n.actor_id ? (actorMap[n.actor_id] ?? null) : null,
  }));

  // Mark all unread as read (fire-and-forget; page is already rendered)
  supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false)
    .then(() => {});

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold text-foreground">Notifications</h1>
      <NotificationList notifications={enriched} />
    </div>
  );
}
