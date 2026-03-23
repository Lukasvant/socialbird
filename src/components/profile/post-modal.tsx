"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { LikeButton } from "@/src/components/feed/like-button";
import { MapPin } from "lucide-react";
import { relativeTime } from "@/src/lib/time";
import type { PostWithAuthor } from "@/src/types/post";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface PostModalProps {
  post: PostWithAuthor | null;
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PostModal({
  post,
  currentUserId,
  open,
  onOpenChange,
}: PostModalProps) {
  if (!post) return null;

  const initials = post.author.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto p-0">
        <VisuallyHidden>
          <DialogTitle>Post by {post.author.display_name}</DialogTitle>
        </VisuallyHidden>

        {/* Image */}
        <div className="relative aspect-[4/3] w-full bg-muted">
          <Image
            src={post.image_url}
            alt={post.caption ?? "Wildlife sighting"}
            fill
            className="object-cover"
            sizes="(max-width: 500px) 100vw, 500px"
          />
        </div>

        <div className="space-y-3 px-5 pb-5 pt-3">
          {/* Author + time */}
          <div className="flex items-center gap-3">
            <Link href={`/profile/${post.author.id}`}>
              <Avatar className="h-8 w-8">
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
                className="text-sm font-semibold text-foreground hover:underline"
              >
                {post.author.display_name}
              </Link>
              <p className="text-xs text-muted-foreground">
                {relativeTime(post.created_at)}
              </p>
            </div>
            <LikeButton
              postId={post.id}
              currentUserId={currentUserId}
              initialLiked={post.user_liked}
              initialCount={post.like_count}
            />
          </div>

          {/* Caption */}
          {post.caption && (
            <p className="text-sm text-foreground">{post.caption}</p>
          )}

          {/* Location */}
          {post.sighting_location_name && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {post.sighting_location_name}
            </p>
          )}

          {/* Tags */}
          {post.species_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.species_tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
