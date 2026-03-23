"use client";

import { useState, useRef } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { createClient } from "@/src/lib/supabase/client";
import type { OnboardingData } from "./onboarding-wizard";
import { Camera, Loader2, User } from "lucide-react";

interface StepProfileProps {
  userId: string;
  data: OnboardingData;
  onNext: (updates: Partial<OnboardingData>) => void;
}

/** Resize image to a square canvas of `size`×`size`, covering the centre. */
async function resizeImageToSquare(file: File, size: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));

      // Cover: scale so the shortest side fills `size`, then centre-crop
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (size - w) / 2;
      const y = (size - h) / 2;
      ctx.drawImage(img, x, y, w, h);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        },
        "image/jpeg",
        0.85
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function StepProfile({ userId, data, onNext }: StepProfileProps) {
  const [displayName, setDisplayName] = useState(data.display_name);
  const [bio, setBio] = useState(data.bio);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(data.avatar_url);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [formError, setFormError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Guard: 10 MB raw maximum before resize
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image must be under 10 MB.");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    let blob: Blob;
    try {
      // Resize to 400×400 px square before uploading
      blob = await resizeImageToSquare(file, 400);
    } catch {
      setUploadError("Could not process image. Please try a different file.");
      setIsUploading(false);
      return;
    }

    // Enforce 2 MB limit after resize (should virtually never fire)
    if (blob.size > 2 * 1024 * 1024) {
      setUploadError("Resized image is still too large. Please try a smaller file.");
      setIsUploading(false);
      return;
    }

    const supabase = createClient();
    const path = `${userId}/avatar.jpg`;
    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, blob, { contentType: "image/jpeg", upsert: true });

    if (uploadErr) {
      setUploadError("Upload failed. You can continue and add a photo later.");
      setIsUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    // Bust cache so the new avatar renders immediately
    setAvatarUrl(`${publicUrl}?t=${Date.now()}`);
    setIsUploading(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) {
      setFormError("Display name is required.");
      return;
    }
    if (displayName.trim().length > 50) {
      setFormError("Display name must be 50 characters or less.");
      return;
    }
    onNext({ display_name: displayName.trim(), bio: bio.trim(), avatar_url: avatarUrl });
  }

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Tell us about yourself</h2>
        <p className="text-sm text-muted-foreground">
          This is how other wildlife enthusiasts will see you.
        </p>
      </div>

      {/* Avatar upload */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <Avatar className="h-20 w-20 border-2 border-border">
            <AvatarImage src={avatarUrl ?? undefined} alt="Your avatar" />
            <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
              {initials || <User className="h-8 w-8" />}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-colors hover:bg-accent"
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : (
              <Camera className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {isUploading
            ? "Resizing & uploading…"
            : "Click to upload · resized to 400 × 400 px · max 10 MB"}
        </p>
        {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
      </div>

      {/* Display name */}
      <div className="space-y-1.5">
        <Label htmlFor="display-name">
          Display name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="display-name"
          placeholder="e.g. Alex the Birder"
          value={displayName}
          onChange={(e) => { setDisplayName(e.target.value); setFormError(""); }}
          maxLength={50}
        />
        <p className="text-right text-xs text-muted-foreground">{displayName.length}/50</p>
      </div>

      {/* Bio */}
      <div className="space-y-1.5">
        <Label htmlFor="bio">
          Bio{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="bio"
          placeholder="Tell others about your wildlife interests…"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={200}
          rows={3}
          className="resize-none"
        />
        <p className="text-right text-xs text-muted-foreground">{bio.length}/200</p>
      </div>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" className="w-full">
        Continue
      </Button>
    </form>
  );
}
