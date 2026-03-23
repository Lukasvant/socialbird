"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PostCard } from "./post-card";
import { Loader2 } from "lucide-react";
import type { PostWithAuthor } from "@/src/types/post";

interface FeedClientProps {
  initialPosts: PostWithAuthor[];
  initialNextCursor: string | null;
  currentUserId: string;
}

export function FeedClient({
  initialPosts,
  initialNextCursor,
  currentUserId,
}: FeedClientProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoading) return;
    setIsLoading(true);

    try {
      const params = new URLSearchParams({ cursor: nextCursor, limit: "12" });
      const res = await fetch(`/api/posts?${params}`);
      const data = await res.json();

      if (data.posts) {
        setPosts((prev) => [...prev, ...data.posts]);
        setNextCursor(data.nextCursor);
      }
    } catch {
      // Silently fail — user can scroll again to retry
    } finally {
      setIsLoading(false);
    }
  }, [nextCursor, isLoading]);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <p className="mb-1 text-lg font-semibold text-foreground">
          No sightings yet
        </p>
        <p className="text-sm text-muted-foreground">
          Be the first to share a wildlife sighting!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} currentUserId={currentUserId} />
      ))}

      {/* Sentinel for infinite scroll */}
      <div ref={bottomRef} className="py-4 text-center">
        {isLoading && (
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
        )}
        {!nextCursor && posts.length > 0 && (
          <p className="text-xs text-muted-foreground">
            You&apos;ve reached the end
          </p>
        )}
      </div>
    </div>
  );
}
