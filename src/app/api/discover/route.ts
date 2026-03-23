import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import type { DiscoverUser } from "@/src/types/discover";

/**
 * GET /api/discover
 * Query params:
 *   lat, lng          — user's coordinates (required when user has location)
 *   radius            — metres, default 100 000 (100 km), max 500 000
 *   interests         — repeated param, e.g. ?interests=birds&interests=mammals
 *   sort              — "nearest" | "followers" | "recent"  (default "nearest")
 *   limit             — default 20, max 50
 *   noLocation        — "1" when the caller has no location; skips PostGIS
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const noLocation = sp.get("noLocation") === "1";
  const lat = parseFloat(sp.get("lat") ?? "0");
  const lng = parseFloat(sp.get("lng") ?? "0");
  const radius = Math.min(parseFloat(sp.get("radius") ?? "100000"), 500_000);
  const interests = sp.getAll("interests").filter(Boolean);
  const sort = sp.get("sort") ?? (noLocation ? "followers" : "nearest");
  const limit = Math.min(parseInt(sp.get("limit") ?? "20"), 50);

  // ── Branch: user has a location → use PostGIS RPC ──────────────────
  if (!noLocation && lat !== 0 && lng !== 0) {
    const { data, error } = await supabase.rpc("discover_users", {
      p_current_user_id: user.id,
      p_lat: lat,
      p_lng: lng,
      p_radius_meters: radius,
      p_interests: interests.length > 0 ? interests : null,
      p_sort: sort,
      p_limit: limit,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: (data ?? []) as DiscoverUser[] });
  }

  // ── Fallback: no location → simple profile query ───────────────────
  // Returns onboarded users sorted by follower count or join date.
  // We can't calculate distance, so distance_meters = null.
  let profileQuery = supabase
    .from("profiles")
    .select("id, display_name, bio, avatar_url, location_name, interests, created_at")
    .eq("is_onboarded", true)
    .neq("id", user.id)
    .limit(limit);

  if (interests.length > 0) {
    profileQuery = profileQuery.overlaps("interests", interests);
  }

  if (sort === "recent") {
    profileQuery = profileQuery.order("created_at", { ascending: false });
  } else {
    profileQuery = profileQuery.order("created_at", { ascending: false });
  }

  const { data: profiles, error: profileErr } = await profileQuery;
  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ users: [] });
  }

  const profileIds = profiles.map((p) => p.id);

  // Follower counts for these profiles
  const { data: followerRows } = await supabase
    .from("follows")
    .select("following_id")
    .in("following_id", profileIds);

  const countMap: Record<string, number> = {};
  followerRows?.forEach((r) => {
    countMap[r.following_id] = (countMap[r.following_id] ?? 0) + 1;
  });

  // Current user's follows among these profiles
  const { data: myFollows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id)
    .in("following_id", profileIds);

  const followingSet = new Set(myFollows?.map((r) => r.following_id) ?? []);

  let users: DiscoverUser[] = profiles.map((p) => ({
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

  // Sort by followers client-side when sort = "followers"
  if (sort === "followers") {
    users = users.sort((a, b) => b.follower_count - a.follower_count);
  }

  return NextResponse.json({ users });
}
