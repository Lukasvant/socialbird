"use client";

import { useState } from "react";
import Image from "next/image";
import { PostModal } from "./post-modal";
import { Camera } from "lucide-react";
import type { PostWithAuthor } from "@/src/types/post";

interface PostGridProps {
  posts: PostWithAuthor[];
  currentUserId: string;
}

export function PostGrid({ posts, currentUserId }: PostGridProps) {
  const [selectedPost, setSelectedPost] = useState<PostWithAuthor | null>(null);

  if (posts.length === 0) {
    return (
      <div className="py-12 text-center">
        <Camera className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No sightings shared yet
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-1">
        {posts.map((post) => (
          <button
            key={post.id}
            onClick={() => setSelectedPost(post)}
            className="group relative aspect-square overflow-hidden rounded-sm bg-muted"
          >
            <Image
              src={post.image_url}
              alt={post.caption ?? "Sighting"}
              fill
              className="object-cover transition-opacity group-hover:opacity-80"
              sizes="(max-width: 640px) 33vw, 200px"
            />
          </button>
        ))}
      </div>

      <PostModal
        post={selectedPost}
        currentUserId={currentUserId}
        open={!!selectedPost}
        onOpenChange={(open) => {
          if (!open) setSelectedPost(null);
        }}
      />
    </>
  );
}
