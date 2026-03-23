import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { fetchPosts } from "@/src/lib/posts";
import { FeedClient } from "@/src/components/feed/feed-client";
import Link from "next/link";
import { Plus } from "lucide-react";

export const metadata = { title: "Feed — WildScout" };

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { posts, nextCursor } = await fetchPosts(supabase, {
    currentUserId: user.id,
    limit: 12,
  });

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

      <FeedClient
        initialPosts={posts}
        initialNextCursor={nextCursor}
        currentUserId={user.id}
      />
    </div>
  );
}
