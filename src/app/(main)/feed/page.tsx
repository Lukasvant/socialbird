import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { fetchPosts } from "@/src/lib/posts";
import { FeedClient } from "@/src/components/feed/feed-client";
import { UserCard } from "@/src/components/discover/user-card";
import { Compass, Plus } from "lucide-react";
import type { DiscoverUser } from "@/src/types/discover";

export const metadata = { title: "Feed — WildScout" };

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 1. Get IDs of users this user follows
  const { data: follows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followedIds = follows?.map((f) => f.following_id) ?? [];
  const feedUserIds = [...followedIds, user.id];

  // 2. Fetch feed posts (followed + own)
  const { posts, nextCursor } = await fetchPosts(supabase, {
    currentUserId: user.id,
    userIds: feedUserIds,
    limit: 12,
  });

  // 3. Build suggested users for empty state
  //    (only fetched when the user follows nobody)
  let suggestedUsers: DiscoverUser[] = [];

  if (followedIds.length === 0) {
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("interests, location_point")
      .eq("id", user.id)
      .single();

    const interests: string[] = userProfile?.interests ?? [];

    // Try PostGIS suggestion first if the user has a location
    const lp = userProfile?.location_point as unknown;
    let userLat: number | null = null;
    let userLng: number | null = null;

    if (lp && typeof lp === "object" && "coordinates" in (lp as object)) {
      const coords = (lp as { coordinates: [number, number] }).coordinates;
      userLng = coords[0];
      userLat = coords[1];
    }

    if (userLat !== null && userLng !== null) {
      const { data: nearby } = await supabase.rpc("discover_users", {
        p_current_user_id: user.id,
        p_lat: userLat,
        p_lng: userLng,
        p_radius_meters: 500_000, // wide radius for suggestions
        p_interests: interests.length > 0 ? interests : null,
        p_sort: "nearest",
        p_limit: 3,
      });
      suggestedUsers = (nearby ?? []) as DiscoverUser[];
    }

    // Fallback: just most-recently joined users
    if (suggestedUsers.length === 0) {
      const { data: recent } = await supabase
        .from("profiles")
        .select("id, display_name, bio, avatar_url, location_name, interests")
        .eq("is_onboarded", true)
        .neq("id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      suggestedUsers = (recent ?? []).map((p) => ({
        id: p.id,
        display_name: p.display_name,
        bio: p.bio,
        avatar_url: p.avatar_url,
        location_name: p.location_name,
        interests: p.interests ?? [],
        follower_count: 0,
        distance_meters: null,
        is_following: false,
      }));
    }
  }

  const isEmpty = posts.length === 0 && followedIds.length === 0;

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Feed</h1>
        <Link
          href="/post/new"
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Post
        </Link>
      </div>

      {isEmpty ? (
        /* ── Empty feed with suggested users ────────────────────── */
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Compass className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
            <h2 className="mb-1 font-semibold text-foreground">
              Your feed is empty
            </h2>
            <p className="mb-5 text-sm text-muted-foreground">
              Follow other wildlife enthusiasts to see their sightings here.
            </p>
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Compass className="h-4 w-4" />
              Discover people
            </Link>
          </div>

          {suggestedUsers.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Suggested for you
              </h3>
              <div className="space-y-3">
                {suggestedUsers.map((u) => (
                  <UserCard key={u.id} user={u} currentUserId={user.id} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <FeedClient
          initialPosts={posts}
          initialNextCursor={nextCursor}
          currentUserId={user.id}
          followedBy={user.id}
        />
      )}
    </div>
  );
}
