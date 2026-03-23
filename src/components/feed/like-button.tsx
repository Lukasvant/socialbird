"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";

interface LikeButtonProps {
  postId: string;
  currentUserId: string;
  initialLiked: boolean;
  initialCount: number;
}

export function LikeButton({
  postId,
  currentUserId,
  initialLiked,
  initialCount,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);

    // Optimistic update
    const wasLiked = liked;
    const prevCount = count;
    setLiked(!wasLiked);
    setCount(wasLiked ? prevCount - 1 : prevCount + 1);

    const supabase = createClient();

    const { error } = wasLiked
      ? await supabase
          .from("likes")
          .delete()
          .eq("user_id", currentUserId)
          .eq("post_id", postId)
      : await supabase
          .from("likes")
          .insert({ user_id: currentUserId, post_id: postId });

    if (error) {
      // Revert on failure
      setLiked(wasLiked);
      setCount(prevCount);
    }

    setBusy(false);
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 text-sm transition-colors"
      aria-label={liked ? "Unlike" : "Like"}
    >
      <Heart
        className={`h-5 w-5 transition-colors ${
          liked
            ? "fill-red-500 text-red-500"
            : "text-muted-foreground hover:text-red-400"
        }`}
      />
      {count > 0 && (
        <span
          className={`tabular-nums ${liked ? "text-red-500" : "text-muted-foreground"}`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
