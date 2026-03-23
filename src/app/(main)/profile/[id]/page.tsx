import { redirect, notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { MapPin } from "lucide-react";

export const metadata = { title: "Profile — WildScout" };

const INTEREST_LABELS: Record<string, string> = {
  birds: "🦜 Birds",
  mammals: "🦊 Mammals",
  marine: "🐋 Marine",
  reptiles: "🦎 Reptiles",
  insects: "🦋 Insects",
  plants: "🌿 Plants",
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio, avatar_url, location_name, interests, created_at")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const isOwnProfile = user.id === id;
  const initials = profile.display_name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-xl border border-border bg-card p-6">
        {/* Avatar + name */}
        <div className="mb-4 flex items-start gap-4">
          <Avatar className="h-16 w-16 border-2 border-border">
            <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.display_name} />
            <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">{profile.display_name}</h1>
            {profile.location_name && (
              <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {profile.location_name}
              </p>
            )}
          </div>
          {isOwnProfile && (
            <a
              href="/settings/profile"
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Edit profile
            </a>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="mb-4 text-sm text-foreground">{profile.bio}</p>
        )}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest: string) => (
              <span
                key={interest}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                {INTEREST_LABELS[interest] ?? interest}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Posts placeholder — Phase 3 */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Posts coming in Phase 3.
      </p>
    </div>
  );
}
