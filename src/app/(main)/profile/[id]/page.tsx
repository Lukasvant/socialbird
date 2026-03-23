import { redirect, notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { fetchPosts } from "@/src/lib/posts";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { PostGrid } from "@/src/components/profile/post-grid";
import { EditProfileButton } from "@/src/components/profile/edit-profile-button";
import { MapPin, UserPlus } from "lucide-react";

export const metadata = { title: "Profile — WildScout" };

const INTEREST_LABELS: Record<string, string> = {
  birds: "Birds",
  mammals: "Mammals",
  marine: "Marine",
  reptiles: "Reptiles",
  insects: "Insects",
  plants: "Plants",
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, display_name, bio, avatar_url, location_name, interests, created_at"
    )
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const isOwnProfile = user.id === id;

  // Fetch this user's posts
  const { posts } = await fetchPosts(supabase, {
    currentUserId: user.id,
    userId: id,
    limit: 50,
  });

  // Placeholder follower/following counts (Phase 4)
  const followerCount = 0;
  const followingCount = 0;

  const initials = profile.display_name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* ── Profile header ──────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20 border-2 border-border">
            <AvatarImage
              src={profile.avatar_url ?? undefined}
              alt={profile.display_name}
            />
            <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-foreground">
              {profile.display_name}
            </h1>
            {profile.location_name && (
              <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {profile.location_name}
              </p>
            )}

            {/* Stats row */}
            <div className="mt-3 flex gap-5 text-sm">
              <div>
                <span className="font-semibold text-foreground">
                  {posts.length}
                </span>{" "}
                <span className="text-muted-foreground">posts</span>
              </div>
              <div>
                <span className="font-semibold text-foreground">
                  {followerCount}
                </span>{" "}
                <span className="text-muted-foreground">followers</span>
              </div>
              <div>
                <span className="font-semibold text-foreground">
                  {followingCount}
                </span>{" "}
                <span className="text-muted-foreground">following</span>
              </div>
            </div>
          </div>

          {/* Action button */}
          {isOwnProfile ? (
            <EditProfileButton
              profile={{
                id: profile.id,
                display_name: profile.display_name,
                bio: profile.bio,
                avatar_url: profile.avatar_url,
                location_name: profile.location_name,
                interests: profile.interests,
              }}
            />
          ) : (
            <button
              disabled
              title="Follow — coming in Phase 4"
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground opacity-60"
            >
              <UserPlus className="h-4 w-4" />
              Follow
            </button>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="mt-4 text-sm text-foreground">{profile.bio}</p>
        )}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.interests.map((interest: string) => (
              <span
                key={interest}
                className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
              >
                {INTEREST_LABELS[interest] ?? interest}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Posts grid ──────────────────────────────────────────────── */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Sightings
        </h2>
        <PostGrid posts={posts} currentUserId={user.id} />
      </div>
    </div>
  );
}
