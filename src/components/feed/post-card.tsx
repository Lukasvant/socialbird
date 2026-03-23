"use client";

import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { LikeButton } from "./like-button";
import { MapPin } from "lucide-react";
import { relativeTime } from "@/src/lib/time";
import type { PostWithAuthor } from "@/src/types/post";

interface PostCardProps {
  post: PostWithAuthor;
  currentUserId: string;
}

export function PostCard({ post, currentUserId }: PostCardProps) {
  const initials = post.author.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Author header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Link href={`/profile/${post.author.id}`}>
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={post.author.avatar_url ?? undefined}
              alt={post.author.display_name}
            />
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${post.author.id}`}
            className="block truncate text-sm font-semibold text-foreground hover:underline"
          >
            {post.author.display_name}
          </Link>
          {post.sighting_location_name && (
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              {post.sighting_location_name}
            </p>
          )}
        </div>
        <time className="shrink-0 text-xs text-muted-foreground">
          {relativeTime(post.created_at)}
        </time>
      </div>

      {/* Image */}
      <div className="relative aspect-[4/3] w-full bg-muted">
        <Image
          src={post.image_url}
          alt={post.caption ?? "Wildlife sighting"}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 640px"
        />
      </div>

      {/* Actions + caption */}
      <div className="space-y-2 px-4 py-3">
        <div className="flex items-center gap-4">
          <LikeButton
            postId={post.id}
            currentUserId={currentUserId}
            initialLiked={post.user_liked}
            initialCount={post.like_count}
          />
        </div>

        {post.caption && (
          <p className="text-sm text-foreground">
            <Link
              href={`/profile/${post.author.id}`}
              className="mr-1.5 font-semibold hover:underline"
            >
              {post.author.display_name}
            </Link>
            {post.caption}
          </p>
        )}

        {post.species_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.species_tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
