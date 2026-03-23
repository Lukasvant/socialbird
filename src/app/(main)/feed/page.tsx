import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { Compass } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Feed — WildScout" };

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, is_onboarded")
    .eq("id", user.id)
    .single();

  if (!profile?.is_onboarded) redirect("/onboarding");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Empty state — Phase 3 will replace this with real posts */}
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <Compass className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <h2 className="mb-1 text-lg font-semibold text-foreground">
          Your feed is empty
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Follow other wildlife enthusiasts to see their sightings here.
        </p>
        <Link
          href="/discover"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Discover people
        </Link>
      </div>
    </div>
  );
}
