import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { fetchPosts } from "@/src/lib/posts";

/**
 * GET /api/posts
 * Query params:
 *   cursor      — ISO timestamp of the last fetched post (pagination)
 *   limit       — number of posts to return (default 12, max 50)
 *   userId      — filter to a single user's posts (profile view)
 *   followedBy  — return posts from users followed by this user ID + own posts
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const cursor = sp.get("cursor");
  const userId = sp.get("userId");
  const followedBy = sp.get("followedBy");
  const limit = Math.min(Number(sp.get("limit") ?? "12"), 50);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let userIds: string[] | null = null;

    if (followedBy) {
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", followedBy);
      const followedIds = follows?.map((f) => f.following_id) ?? [];
      userIds = [...followedIds, followedBy];
    }

    const result = await fetchPosts(supabase, {
      currentUserId: user?.id,
      cursor,
      userId,
      userIds,
      limit,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
