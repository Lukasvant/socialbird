"use client";

import { useState, useCallback } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import type { OnboardingData } from "./onboarding-wizard";
import { Loader2, MapPin, Search } from "lucide-react";

interface StepLocationProps {
  data: OnboardingData;
  onNext: (updates: Partial<OnboardingData>) => void;
  onBack: () => void;
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

function formatLocationName(result: NominatimResult): string {
  const addr = result.address;
  const city = addr?.city || addr?.town || addr?.village || addr?.county || "";
  return [city, addr?.state, addr?.country].filter(Boolean).join(", ") ||
    result.display_name.split(",").slice(0, 2).join(",").trim();
}

export function StepLocation({ data, onNext, onBack }: StepLocationProps) {
  const [query, setQuery] = useState(data.location_name);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [selected, setSelected] = useState<{
    name: string;
    lat: number;
    lng: number;
  } | null>(
    data.location_name && data.location_lat && data.location_lng
      ? { name: data.location_name, lat: data.location_lat, lng: data.location_lng }
      : null
  );
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const searchLocation = useCallback(async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setSearchError("");
    setResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`,
        { headers: { "Accept-Language": "en" } }
      );
      const data: NominatimResult[] = await res.json();
      setResults(data);
      if (data.length === 0) setSearchError("No locations found. Try a different search.");
    } catch {
      setSearchError("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }, [query]);

  function handleSelect(result: NominatimResult) {
    const name = formatLocationName(result);
    setSelected({ name, lat: parseFloat(result.lat), lng: parseFloat(result.lon) });
    setQuery(name);
    setResults([]);
    setSubmitError("");
  }

  function handleContinue() {
    if (!selected) {
      setSubmitError("Please search and select your location to continue.");
      return;
    }
    onNext({ location_name: selected.name, location_lat: selected.lat, location_lng: selected.lng });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Where are you based?</h2>
        <p className="text-sm text-muted-foreground">
          Your location helps you discover nearby wildlife enthusiasts.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="location-search">City or region</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="location-search"
              placeholder="Search for your city..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected(null);
                setSubmitError("");
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
            disabled={isSearching || !query.trim()}
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Search results */}
      {results.length > 0 && (
        <div className="rounded-lg border border-border bg-background shadow-sm">
          {results.map((result, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(result)}
              className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors first:rounded-t-lg last:rounded-b-lg last:border-0 hover:bg-accent"
            >
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {formatLocationName(result)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {result.display_name.split(",").slice(1, 3).join(",").trim()}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {searchError && <p className="text-sm text-destructive">{searchError}</p>}

      {selected && (
        <div className="flex items-center gap-3 rounded-lg bg-primary/10 px-4 py-3">
          <MapPin className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-primary">Location selected</p>
            <p className="text-sm text-muted-foreground">{selected.name}</p>
          </div>
        </div>
      )}

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button type="button" onClick={handleContinue} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );
}
