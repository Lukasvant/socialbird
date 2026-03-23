"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { UserCard } from "./user-card";
import { Compass, Loader2, SlidersHorizontal } from "lucide-react";
import type { DiscoverUser } from "@/src/types/discover";

const INTEREST_OPTIONS = [
  { value: "birds", label: "Birds" },
  { value: "mammals", label: "Mammals" },
  { value: "marine", label: "Marine" },
  { value: "reptiles", label: "Reptiles" },
  { value: "insects", label: "Insects" },
  { value: "plants", label: "Plants" },
];

const SORT_OPTIONS = [
  { value: "nearest", label: "Nearest" },
  { value: "followers", label: "Most followers" },
  { value: "recent", label: "Recently joined" },
] as const;

type SortValue = "nearest" | "followers" | "recent";

interface DiscoverClientProps {
  currentUserId: string;
  userLat: number | null;
  userLng: number | null;
  initialUsers: DiscoverUser[];
}

export function DiscoverClient({
  currentUserId,
  userLat,
  userLng,
  initialUsers,
}: DiscoverClientProps) {
  const hasLocation = userLat !== null && userLng !== null;

  const [users, setUsers] = useState(initialUsers);
  const [isLoading, setIsLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filters
  const [radiusKm, setRadiusKm] = useState(100);
  const [interests, setInterests] = useState<string[]>([]);
  const [sort, setSort] = useState<SortValue>(hasLocation ? "nearest" : "followers");

  // Debounce ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (hasLocation) {
        params.set("lat", String(userLat));
        params.set("lng", String(userLng));
        params.set("radius", String(radiusKm * 1000));
      } else {
        params.set("noLocation", "1");
      }
      interests.forEach((i) => params.append("interests", i));
      params.set("sort", sort);
      params.set("limit", "30");

      const res = await fetch(`/api/discover?${params}`);
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, [hasLocation, userLat, userLng, radiusKm, interests, sort]);

  // Re-fetch when filters change (debounced for slider)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchUsers, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchUsers]);

  function toggleInterest(val: string) {
    setInterests((prev) =>
      prev.includes(val) ? prev.filter((i) => i !== val) : [...prev, val]
    );
  }

  return (
    <div>
      {/* ── Filter bar ─────────────────────────────────────────────── */}
      <div className="mb-5 space-y-3">
        {/* Sort tabs */}
        <div className="flex items-center gap-2">
          <div className="flex flex-1 gap-1 rounded-lg border border-border bg-card p-1">
            {SORT_OPTIONS.filter((o) =>
              hasLocation ? true : o.value !== "nearest"
            ).map((o) => (
              <button
                key={o.value}
                onClick={() => setSort(o.value)}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  sort === o.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              filtersOpen || interests.length > 0
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-accent"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {interests.length > 0 && (
              <span className="ml-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                {interests.length}
              </span>
            )}
          </button>
        </div>

        {/* Expanded filters */}
        {filtersOpen && (
          <div className="space-y-4 rounded-xl border border-border bg-card p-4">
            {/* Radius slider (only when user has location) */}
            {hasLocation && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    Search radius
                  </label>
                  <span className="text-sm font-semibold text-primary">
                    {radiusKm} km
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={500}
                  step={10}
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>10 km</span>
                  <span>500 km</span>
                </div>
              </div>
            )}

            {/* Interest checkboxes */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Interests</p>
              <div className="grid grid-cols-3 gap-1.5">
                {INTEREST_OPTIONS.map(({ value, label }) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                      interests.includes(value)
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border text-foreground hover:bg-accent"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={interests.includes(value)}
                      onChange={() => toggleInterest(value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* Reset */}
            {(interests.length > 0 || radiusKm !== 100) && (
              <button
                onClick={() => {
                  setInterests([]);
                  setRadiusKm(100);
                }}
                className="text-xs text-muted-foreground underline hover:text-foreground"
              >
                Reset filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Results ────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Compass className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="mb-1 font-semibold text-foreground">No explorers found</p>
          <p className="text-sm text-muted-foreground">
            {hasLocation
              ? "Try increasing your search radius or adjusting the interest filter."
              : "Be one of the first on WildScout!"}
          </p>
          {hasLocation && radiusKm < 500 && (
            <button
              onClick={() => setRadiusKm(500)}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Search within 500 km
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs text-muted-foreground">
            {users.length} explorer{users.length !== 1 ? "s" : ""} found
            {hasLocation && ` within ${radiusKm} km`}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((u) => (
              <UserCard key={u.id} user={u} currentUserId={currentUserId} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
