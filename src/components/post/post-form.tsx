"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Checkbox } from "@/src/components/ui/checkbox";
import { createClient } from "@/src/lib/supabase/client";
import { SPECIES_TAGS } from "@/src/lib/species";
import {
  Camera,
  Loader2,
  MapPin,
  Search,
  X,
  ArrowLeft,
  ImageIcon,
} from "lucide-react";

const MapView = dynamic(() => import("./map-view"), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] animate-pulse rounded-lg bg-muted" />
  ),
});

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

function formatLocationName(r: NominatimResult): string {
  const a = r.address;
  const city = a?.city || a?.town || a?.village || a?.county || "";
  return (
    [city, a?.state, a?.country].filter(Boolean).join(", ") ||
    r.display_name.split(",").slice(0, 2).join(",").trim()
  );
}

export function PostForm({ userId }: { userId: string }) {
  const router = useRouter();

  // Image
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<Blob | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState("");

  // Caption
  const [caption, setCaption] = useState("");

  // Location
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<NominatimResult[]>([]);
  const [locationSearching, setLocationSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    lat: number;
    lng: number;
  } | null>(null);

  // Species tags
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");

  // Submit
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // ── Image handling ──────────────────────────────────────────────────
  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("Please select an image file.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setImageError("Image must be under 20 MB.");
      return;
    }

    setImageError("");

    try {
      // Resize to max 1200px wide — also strips EXIF via canvas re-encode
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: "image/jpeg",
        initialQuality: 0.85,
      });

      setImageFile(compressed);
      setImagePreview(URL.createObjectURL(compressed));
    } catch {
      setImageError("Could not process image. Try a different file.");
    }
  }

  function removeImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setImageError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Location search ─────────────────────────────────────────────────
  const searchLocation = useCallback(async () => {
    if (!locationQuery.trim()) return;
    setLocationSearching(true);
    setLocationResults([]);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          locationQuery
        )}&format=json&addressdetails=1&limit=5`,
        { headers: { "Accept-Language": "en" } }
      );
      const data: NominatimResult[] = await res.json();
      setLocationResults(data);
    } catch {
      // Silently fail
    } finally {
      setLocationSearching(false);
    }
  }, [locationQuery]);

  function selectLocation(result: NominatimResult) {
    const name = formatLocationName(result);
    setSelectedLocation({
      name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    });
    setLocationQuery(name);
    setLocationResults([]);
  }

  // ── Species tags ────────────────────────────────────────────────────
  const filteredTags = SPECIES_TAGS.filter((t) =>
    t.toLowerCase().includes(tagSearch.toLowerCase())
  );

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  // ── Submit ──────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!imageFile) {
      setSubmitError("A photo is required.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const supabase = createClient();

      // Upload image
      const ext = "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("sightings")
        .upload(path, imageFile, { contentType: "image/jpeg", upsert: false });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("sightings").getPublicUrl(path);

      // Insert post
      const { error: insertError } = await supabase.from("posts").insert({
        user_id: userId,
        image_url: publicUrl,
        caption: caption.trim() || null,
        species_tags: selectedTags,
        sighting_location_name: selectedLocation?.name ?? null,
        sighting_location_point: selectedLocation
          ? `POINT(${selectedLocation.lng} ${selectedLocation.lat})`
          : null,
      });

      if (insertError) throw insertError;

      router.push("/feed");
      router.refresh();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong."
      );
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">New Sighting</h1>
      </div>

      <div className="space-y-6">
        {/* ── Photo ──────────────────────────────────────────────────── */}
        <div className="space-y-2">
          <Label>
            Photo <span className="text-destructive">*</span>
          </Label>

          {imagePreview ? (
            <div className="relative overflow-hidden rounded-lg border border-border">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
              <button
                onClick={removeImage}
                className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors hover:border-primary/50 hover:bg-muted"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Click to upload a photo
                </p>
                <p className="text-xs text-muted-foreground">
                  Resized to max 1200 px &middot; EXIF stripped
                </p>
              </div>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          {imageError && (
            <p className="text-sm text-destructive">{imageError}</p>
          )}
        </div>

        {/* ── Caption ────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <Label htmlFor="caption">
            Caption{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="caption"
            placeholder="What did you see?"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={500}
            rows={3}
            className="resize-none"
          />
          <p className="text-right text-xs text-muted-foreground">
            {caption.length}/500
          </p>
        </div>

        {/* ── Location ───────────────────────────────────────────────── */}
        <div className="space-y-2">
          <Label>
            Sighting location{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search for a location..."
                value={locationQuery}
                onChange={(e) => {
                  setLocationQuery(e.target.value);
                  if (selectedLocation) setSelectedLocation(null);
                }}
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
              onClick={searchLocation}
              disabled={locationSearching || !locationQuery.trim()}
            >
              {locationSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Search results */}
          {locationResults.length > 0 && (
            <div className="rounded-lg border border-border bg-background shadow-sm">
              {locationResults.map((result, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectLocation(result)}
                  className="flex w-full items-center gap-3 border-b border-border px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-accent"
                >
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate text-sm text-foreground">
                    {formatLocationName(result)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Map preview */}
          {selectedLocation && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate text-sm font-medium text-primary">
                  {selectedLocation.name}
                </span>
                <button
                  onClick={() => {
                    setSelectedLocation(null);
                    setLocationQuery("");
                  }}
                  className="ml-auto shrink-0 text-primary/70 hover:text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <MapView lat={selectedLocation.lat} lng={selectedLocation.lng} />
            </div>
          )}
        </div>

        {/* ── Species tags ───────────────────────────────────────────── */}
        <div className="space-y-2">
          <Label>
            Species / tags{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>

          {/* Selected tags as chips */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/80"
                >
                  {tag}
                  <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}

          <Input
            placeholder="Search species..."
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
          />

          <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-background p-2">
            {filteredTags.length === 0 ? (
              <p className="py-2 text-center text-sm text-muted-foreground">
                No species match &ldquo;{tagSearch}&rdquo;
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {filteredTags.map((tag) => {
                  const checked = selectedTags.includes(tag);
                  return (
                    <label
                      key={tag}
                      className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent ${
                        checked ? "bg-primary/5 font-medium text-primary" : "text-foreground"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleTag(tag)}
                      />
                      {tag}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Preview summary ────────────────────────────────────────── */}
        {imageFile && (
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Ready to post
            </p>
            <div className="flex items-center gap-3 text-sm text-foreground">
              <ImageIcon className="h-4 w-4 shrink-0 text-primary" />
              <span>1 photo</span>
              {caption && <span>&middot; caption added</span>}
              {selectedLocation && <span>&middot; {selectedLocation.name}</span>}
              {selectedTags.length > 0 && (
                <span>
                  &middot; {selectedTags.length} tag
                  {selectedTags.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        )}

        {submitError && (
          <p className="text-sm text-destructive">{submitError}</p>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!imageFile || isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading…
            </>
          ) : (
            "Post Sighting"
          )}
        </Button>
      </div>
    </div>
  );
}
