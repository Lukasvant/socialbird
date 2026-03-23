import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/src/types/database";
import type { PostWithAuthor } from "@/src/types/post";

/**
 * Fetch a page of posts with author info, like counts, and current user's like status.
 * Used by both the Server Component (initial load) and the API route (pagination).
 */
export async function fetchPosts(
  supabase: SupabaseClient<Database>,
  opts: {
    currentUserId?: string;
    cursor?: string | null;
    userId?: string | null;
    limit?: number;
  }
): Promise<{ posts: PostWithAuthor[]; nextCursor: string | null }> {
  const limit = opts.limit ?? 12;

  // 1. Fetch posts
  let query = supabase
    .from("posts")
    .select("id, user_id, image_url, caption, sighting_location_name, species_tags, created_at")
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (opts.cursor) query = query.lt("created_at", opts.cursor);
  if (opts.userId) query = query.eq("user_id", opts.userId);

  const { data: rawPosts, error } = await query;
  if (error) throw error;
  if (!rawPosts || rawPosts.length === 0)
    return { posts: [], nextCursor: null };

  const hasMore = rawPosts.length > limit;
  const items = hasMore ? rawPosts.slice(0, limit) : rawPosts;
  const postIds = items.map((p) => p.id);

  // 2. Batch-fetch author profiles
  const uniqueUserIds = [...new Set(items.map((p) => p.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", uniqueUserIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p])
  );

  // 3. Fetch like counts for these posts
  const { data: allLikes } = await supabase
    .from("likes")
    .select("post_id")
    .in("post_id", postIds);

  const likeCountMap: Record<string, number> = {};
  allLikes?.forEach((l) => {
    likeCountMap[l.post_id] = (likeCountMap[l.post_id] ?? 0) + 1;
  });

  // 4. Fetch current user's likes from this batch
  const likedSet = new Set<string>();
  if (opts.currentUserId && postIds.length > 0) {
    const { data: userLikes } = await supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", opts.currentUserId)
      .in("post_id", postIds);
    userLikes?.forEach((l) => likedSet.add(l.post_id));
  }

  // 5. Combine
  const posts: PostWithAuthor[] = items.map((row) => {
    const profile = profileMap.get(row.user_id);
    return {
      id: row.id,
      user_id: row.user_id,
      image_url: row.image_url,
      caption: row.caption,
      sighting_location_name: row.sighting_location_name,
      species_tags: row.species_tags ?? [],
      created_at: row.created_at,
      like_count: likeCountMap[row.id] ?? 0,
      user_liked: likedSet.has(row.id),
      author: profile
        ? {
            id: profile.id,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
          }
        : { id: row.user_id, display_name: "Unknown", avatar_url: null },
    };
  });

  return {
    posts,
    nextCursor: hasMore ? items[items.length - 1].created_at : null,
  };
}
