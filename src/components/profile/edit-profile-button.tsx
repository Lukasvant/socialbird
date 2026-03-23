"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { createClient } from "@/src/lib/supabase/client";
import { Camera, Loader2, MapPin, Search, User } from "lucide-react";

interface ProfileData {
  id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  location_name: string | null;
  interests: string[];
}

const INTEREST_OPTIONS = [
  { value: "birds", label: "Birds" },
  { value: "mammals", label: "Mammals" },
  { value: "marine", label: "Marine" },
  { value: "reptiles", label: "Reptiles" },
  { value: "insects", label: "Insects" },
  { value: "plants", label: "Plants" },
];

/** Resize avatar to 400x400 using canvas. */
async function resizeAvatar(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      const scale = Math.max(400 / img.width, 400 / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (400 - w) / 2, (400 - h) / 2, w, h);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
        "image/jpeg",
        0.85
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

export function EditProfileButton({ profile }: { profile: ProfileData }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [locationName, setLocationName] = useState(profile.location_name ?? "");
  const [interests, setInterests] = useState<string[]>(profile.interests);

  // Avatar upload
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Location search
  const [locQuery, setLocQuery] = useState(profile.location_name ?? "");
  const [locResults, setLocResults] = useState<NominatimResult[]>([]);
  const [locSearching, setLocSearching] = useState(false);
  const [locLat, setLocLat] = useState<number | null>(null);
  const [locLng, setLocLng] = useState<number | null>(null);

  // Submit
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const blob = await resizeAvatar(file);
      const supabase = createClient();
      const path = `${profile.id}/avatar.jpg`;
      await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(`${publicUrl}?t=${Date.now()}`);
    } catch {
      // Silently fail
    } finally {
      setUploading(false);
    }
  }

  async function searchLocation() {
    if (!locQuery.trim()) return;
    setLocSearching(true);
    setLocResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locQuery)}&format=json&addressdetails=1&limit=5`,
        { headers: { "Accept-Language": "en" } }
      );
      setLocResults(await res.json());
    } catch {
      // Silently fail
    } finally {
      setLocSearching(false);
    }
  }

  function selectLocation(r: NominatimResult) {
    const a = r.address;
    const city = a?.city || a?.town || a?.village || a?.county || "";
    const name =
      [city, a?.state, a?.country].filter(Boolean).join(", ") ||
      r.display_name.split(",").slice(0, 2).join(",").trim();
    setLocationName(name);
    setLocQuery(name);
    setLocLat(parseFloat(r.lat));
    setLocLng(parseFloat(r.lon));
    setLocResults([]);
  }

  function toggleInterest(value: string) {
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value]
    );
  }

  async function handleSave() {
    if (!displayName.trim()) {
      setError("Display name is required.");
      return;
    }
    setSaving(true);
    setError("");

    const supabase = createClient();
    const updates: Record<string, unknown> = {
      display_name: displayName.trim(),
      bio: bio.trim() || null,
      avatar_url: avatarUrl,
      location_name: locationName || null,
      interests,
      updated_at: new Date().toISOString(),
    };

    if (locLat !== null && locLng !== null) {
      updates.location_point = `POINT(${locLng} ${locLat})`;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profile.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setOpen(false);
    router.refresh();
  }

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent">
          Edit profile
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <Avatar className="h-16 w-16 border-2 border-border">
                <AvatarImage src={avatarUrl ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                  {initials || <User className="h-6 w-6" />}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-accent"
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
          </div>

          {/* Display name */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Display name</Label>
            <Input
              id="edit-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-bio">Bio</Label>
            <Textarea
              id="edit-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              rows={3}
              className="resize-none"
            />
            <p className="text-right text-xs text-muted-foreground">
              {bio.length}/200
            </p>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label>Location</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search location..."
                  value={locQuery}
                  onChange={(e) => setLocQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      searchLocation();
                    }
                  }}
                  className="pl-9"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={searchLocation}
                disabled={locSearching}
              >
                {locSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            {locResults.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-border">
                {locResults.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectLocation(r)}
                    className="flex w-full items-center gap-2 border-b border-border px-3 py-2 text-left text-sm last:border-0 hover:bg-accent"
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="truncate">{r.display_name.split(",").slice(0, 3).join(",")}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Interests */}
          <div className="space-y-2">
            <Label>Interests</Label>
            <div className="grid grid-cols-2 gap-2">
              {INTEREST_OPTIONS.map(({ value, label }) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                    interests.includes(value)
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-foreground hover:bg-accent"
                  }`}
                >
                  <Checkbox
                    checked={interests.includes(value)}
                    onCheckedChange={() => toggleInterest(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
