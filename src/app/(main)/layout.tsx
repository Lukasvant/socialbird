import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { AppShell } from "@/src/components/layout/app-shell";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { count: unreadCount }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, avatar_url, is_onboarded")
      .eq("id", user.id)
      .single(),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false),
  ]);

  // Still mid-onboarding — render without AppShell chrome.
  if (!profile?.is_onboarded) {
    return <>{children}</>;
  }

  return (
    <AppShell
      user={{
        id: user.id,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
      }}
      initialUnreadNotifications={unreadCount ?? 0}
    >
      {children}
    </AppShell>
  );
}
