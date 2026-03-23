import { redirect, notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { fetchPosts } from "@/src/lib/posts";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { PostGrid } from "@/src/components/profile/post-grid";
import { EditProfileButton } from "@/src/components/profile/edit-profile-button";
import { FollowButton } from "@/src/components/follow-button";
import { MessageButton } from "@/src/components/profile/message-button";
import { MapPin } from "lucide-react";

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
    .select("id, display_name, bio, avatar_url, location_name, interests, allow_dms, created_at")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const isOwnProfile = user.id === id;

  // Fetch posts + follow counts + current user's follow status in parallel
  const [
    { posts },
    { data: followerRows },
    { data: followingRows },
    { data: myFollow },
    { data: theyFollowMe },
  ] = await Promise.all([
    fetchPosts(supabase, { currentUserId: user.id, userId: id, limit: 50 }),
    supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", id),
    supabase.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", id),
    isOwnProfile
      ? Promise.resolve({ data: null })
      : supabase.from("follows").select("follower_id").eq("follower_id", user.id).eq("following_id", id).maybeSingle(),
    isOwnProfile
      ? Promise.resolve({ data: null })
      : supabase.from("follows").select("follower_id").eq("follower_id", id).eq("following_id", user.id).maybeSingle(),
  ]);

  const followerCount = (followerRows as unknown as { count?: number } | null)?.count ?? 0;
  const followingCount = (followingRows as unknown as { count?: number } | null)?.count ?? 0;
  const isFollowing = !isOwnProfile && !!myFollow;
  const isMutual = isFollowing && !!theyFollowMe;

  // Can send DM if: allow_dms='everyone', or allow_dms='mutual_only' and both follow each other
  const canMessage =
    !isOwnProfile &&
    (profile.allow_dms === "everyone" ||
      (profile.allow_dms === "mutual_only" && isMutual));

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
          <Avatar className="h-20 w-20 shrink-0 border-2 border-border">
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
                <span className="font-semibold text-foreground">{posts.length}</span>{" "}
                <span className="text-muted-foreground">posts</span>
              </div>
              <div>
                <span className="font-semibold text-foreground">{followerCount}</span>{" "}
                <span className="text-muted-foreground">followers</span>
              </div>
              <div>
                <span className="font-semibold text-foreground">{followingCount}</span>{" "}
                <span className="text-muted-foreground">following</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
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
            <div className="flex flex-col gap-2">
              <FollowButton
                targetUserId={id}
                currentUserId={user.id}
                initialFollowing={isFollowing}
              />
              {canMessage && <MessageButton targetUserId={id} />}
            </div>
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
