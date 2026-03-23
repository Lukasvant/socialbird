import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";

export const metadata = {
  title: "Feed — WildScout",
};

export default async function FeedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, is_onboarded")
    .eq("id", user.id)
    .single();

  if (!profile?.is_onboarded) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 flex items-center gap-2">
          <span className="text-2xl">🦅</span>
          <span className="text-xl font-bold text-primary">WildScout</span>
        </div>
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-3xl mb-4">🎉</p>
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Welcome, {profile.display_name}!
          </h1>
          <p className="text-muted-foreground">
            Your feed is coming soon. Phase 3 will bring posts, likes, and infinite scroll.
          </p>
        </div>
      </div>
    </div>
  );
}
