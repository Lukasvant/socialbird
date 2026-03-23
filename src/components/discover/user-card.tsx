"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { FollowButton } from "@/src/components/follow-button";
import { MapPin, Users } from "lucide-react";
import type { DiscoverUser } from "@/src/types/discover";

const INTEREST_LABELS: Record<string, string> = {
  birds: "Birds",
  mammals: "Mammals",
  marine: "Marine",
  reptiles: "Reptiles",
  insects: "Insects",
  plants: "Plants",
};

function formatDistance(metres: number | null): string | null {
  if (metres === null) return null;
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(0)} km`;
}

interface UserCardProps {
  user: DiscoverUser;
  currentUserId: string;
}

export function UserCard({ user, currentUserId }: UserCardProps) {
  const initials = user.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const dist = formatDistance(user.distance_meters);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm">
      {/* Top row: avatar + name + follow button */}
      <div className="flex items-start gap-3">
        <Link href={`/profile/${user.id}`} className="shrink-0">
          <Avatar className="h-11 w-11 border border-border">
            <AvatarImage src={user.avatar_url ?? undefined} alt={user.display_name} />
            <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${user.id}`}
            className="block truncate font-semibold text-foreground hover:underline"
          >
            {user.display_name}
          </Link>

          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {dist && (
              <span className="flex items-center gap-0.5">
                <MapPin className="h-3 w-3" />
                {dist}
              </span>
            )}
            {user.location_name && !dist && (
              <span className="flex items-center gap-0.5">
                <MapPin className="h-3 w-3" />
                {user.location_name}
              </span>
            )}
            <span className="flex items-center gap-0.5">
              <Users className="h-3 w-3" />
              {user.follower_count} followers
            </span>
          </div>
        </div>

        <FollowButton
          targetUserId={user.id}
          currentUserId={currentUserId}
          initialFollowing={user.is_following}
          size="sm"
          className="shrink-0"
        />
      </div>

      {/* Bio snippet */}
      {user.bio && (
        <p className="line-clamp-2 text-sm text-muted-foreground">{user.bio}</p>
      )}

      {/* Interest badges */}
      {user.interests.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {user.interests.slice(0, 4).map((interest) => (
            <span
              key={interest}
              className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
            >
              {INTEREST_LABELS[interest] ?? interest}
            </span>
          ))}
          {user.interests.length > 4 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              +{user.interests.length - 4}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
