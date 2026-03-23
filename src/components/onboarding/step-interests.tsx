"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import type { OnboardingData } from "./onboarding-wizard";
import { Loader2 } from "lucide-react";

interface StepInterestsProps {
  data: OnboardingData;
  onComplete: (updates: Partial<OnboardingData>) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

const INTEREST_OPTIONS = [
  { id: "birds", label: "Birds", emoji: "🦜" },
  { id: "mammals", label: "Mammals", emoji: "🦊" },
  { id: "marine", label: "Marine life", emoji: "🐋" },
  { id: "reptiles", label: "Reptiles", emoji: "🦎" },
  { id: "insects", label: "Insects", emoji: "🦋" },
  { id: "plants", label: "Plants", emoji: "🌿" },
];

export function StepInterests({
  data,
  onComplete,
  onBack,
  isSubmitting,
}: StepInterestsProps) {
  const [selected, setSelected] = useState<string[]>(data.interests);
  const [error, setError] = useState("");

  function toggleInterest(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
    setError("");
  }

  function handleComplete() {
    if (selected.length === 0) {
      setError("Please select at least one interest.");
      return;
    }
    onComplete({ interests: selected });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          What wildlife interests you?
        </h2>
        <p className="text-sm text-muted-foreground">
          Select all that apply. This helps us connect you with like-minded
          enthusiasts.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {INTEREST_OPTIONS.map((option) => {
          const isSelected = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggleInterest(option.id)}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 transition-all ${
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-accent"
              }`}
            >
              <span className="text-3xl">{option.emoji}</span>
              <span className="text-sm font-medium">{option.label}</span>
              {isSelected && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          {selected.length} interest{selected.length !== 1 ? "s" : ""} selected
        </p>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handleComplete}
          disabled={isSubmitting || selected.length === 0}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Complete setup"
          )}
        </Button>
      </div>
    </div>
  );
}
