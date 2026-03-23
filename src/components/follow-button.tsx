"use client";

import { useState } from "react";
import { UserCheck, UserPlus, Loader2 } from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";
import { cn } from "@/src/lib/utils";

interface FollowButtonProps {
  targetUserId: string;
  currentUserId: string;
  initialFollowing: boolean;
  /** Called after the optimistic state changes (useful for parent count updates) */
  onFollowChange?: (isFollowing: boolean) => void;
  size?: "sm" | "default";
  className?: string;
}

export function FollowButton({
  targetUserId,
  currentUserId,
  initialFollowing,
  onFollowChange,
  size = "default",
  className,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);

    // Optimistic
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    onFollowChange?.(!wasFollowing);

    const supabase = createClient();
    const { error } = wasFollowing
      ? await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", targetUserId)
      : await supabase.from("follows").insert({
          follower_id: currentUserId,
          following_id: targetUserId,
        });

    if (error) {
      // Revert on failure
      setFollowing(wasFollowing);
      onFollowChange?.(wasFollowing);
    }

    setBusy(false);
  }

  const isSmall = size === "sm";

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md font-medium transition-colors disabled:opacity-70",
        isSmall
          ? "px-2.5 py-1 text-xs"
          : "px-3 py-1.5 text-sm",
        following
          ? "border border-border bg-background text-foreground hover:border-destructive hover:text-destructive"
          : "bg-primary text-primary-foreground hover:bg-primary/90",
        className
      )}
    >
      {busy ? (
        <Loader2 className={cn("animate-spin", isSmall ? "h-3 w-3" : "h-4 w-4")} />
      ) : following ? (
        <UserCheck className={cn(isSmall ? "h-3 w-3" : "h-4 w-4")} />
      ) : (
        <UserPlus className={cn(isSmall ? "h-3 w-3" : "h-4 w-4")} />
      )}
      {following ? "Following" : "Follow"}
    </button>
  );
}
