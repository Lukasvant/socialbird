import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { DiscoverClient } from "@/src/components/discover/discover-client";
import type { DiscoverUser } from "@/src/types/discover";

export const metadata = { title: "Discover — WildScout" };

export default async function DiscoverPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch current user's location for initial PostGIS query
  const { data: profile } = await supabase
    .from("profiles")
    .select("location_point, location_name")
    .eq("id", user.id)
    .single();

  // Extract lat/lng from PostGIS POINT — Supabase returns it as a GeoJSON or WKB object.
  // The JS client returns geography as an object: { type: "Point", coordinates: [lng, lat] }
  let userLat: number | null = null;
  let userLng: number | null = null;

  const lp = profile?.location_point as unknown;
  if (
    lp &&
    typeof lp === "object" &&
    "coordinates" in (lp as object)
  ) {
    const coords = (lp as { coordinates: [number, number] }).coordinates;
    userLng = coords[0];
    userLat = coords[1];
  }

  // Initial server-side fetch
  let initialUsers: DiscoverUser[] = [];

  if (userLat !== null && userLng !== null) {
    const { data } = await supabase.rpc("discover_users", {
      p_current_user_id: user.id,
      p_lat: userLat,
      p_lng: userLng,
      p_radius_meters: 100_000,
      p_interests: null,
      p_sort: "nearest",
      p_limit: 30,
    });
    initialUsers = (data ?? []) as DiscoverUser[];
  } else {
    // No location → fallback to all users sorted by join date
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, bio, avatar_url, location_name, interests, created_at")
      .eq("is_onboarded", true)
      .neq("id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (profiles && profiles.length > 0) {
      const profileIds = profiles.map((p) => p.id);

      const [{ data: followerRows }, { data: myFollows }] = await Promise.all([
        supabase.from("follows").select("following_id").in("following_id", profileIds),
        supabase.from("follows").select("following_id").eq("follower_id", user.id).in("following_id", profileIds),
      ]);

      const countMap: Record<string, number> = {};
      followerRows?.forEach((r) => {
        countMap[r.following_id] = (countMap[r.following_id] ?? 0) + 1;
      });
      const followingSet = new Set(myFollows?.map((r) => r.following_id) ?? []);

      initialUsers = profiles.map((p) => ({
        id: p.id,
        display_name: p.display_name,
        bio: p.bio,
        avatar_url: p.avatar_url,
        location_name: p.location_name,
        interests: p.interests ?? [],
        follower_count: countMap[p.id] ?? 0,
        distance_meters: null,
        is_following: followingSet.has(p.id),
      }));
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Discover</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {userLat
            ? "Find wildlife enthusiasts near you"
            : "Find wildlife enthusiasts around the world"}
        </p>
      </div>

      <DiscoverClient
        currentUserId={user.id}
        userLat={userLat}
        userLng={userLng}
        initialUsers={initialUsers}
      />
    </div>
  );
}
