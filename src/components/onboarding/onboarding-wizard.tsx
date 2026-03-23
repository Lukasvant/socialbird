"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/src/components/ui/progress";
import { StepProfile } from "./step-profile";
import { StepLocation } from "./step-location";
import { StepInterests } from "./step-interests";
import { createClient } from "@/src/lib/supabase/client";

export interface OnboardingData {
  display_name: string;
  bio: string;
  avatar_url: string | null;
  location_name: string;
  location_lat?: number;
  location_lng?: number;
  interests: string[];
}

interface OnboardingWizardProps {
  userId: string;
  initialData: Omit<OnboardingData, "location_lat" | "location_lng">;
}

const STEPS = ["Profile", "Location", "Interests"];

export function OnboardingWizard({ userId, initialData }: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    ...initialData,
    location_lat: undefined,
    location_lng: undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  function handleNext(updates: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...updates }));
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }

  async function handleComplete(updates: Partial<OnboardingData>) {
    const finalData = { ...data, ...updates };
    setIsSubmitting(true);
    setError("");

    const supabase = createClient();

    const updatePayload: Record<string, unknown> = {
      display_name: finalData.display_name,
      bio: finalData.bio || null,
      avatar_url: finalData.avatar_url || null,
      location_name: finalData.location_name || null,
      interests: finalData.interests,
      is_onboarded: true,
      updated_at: new Date().toISOString(),
    };

    if (finalData.location_lat && finalData.location_lng) {
      updatePayload.location_point = `POINT(${finalData.location_lng} ${finalData.location_lat})`;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", userId);

    if (updateError) {
      setError("Failed to save your profile. Please try again.");
      setIsSubmitting(false);
      return;
    }

    router.push("/feed");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      {/* Step indicator */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            Step {currentStep + 1} of {STEPS.length}:{" "}
            <span className="text-primary">{STEPS[currentStep]}</span>
          </span>
          <span className="text-muted-foreground">
            {Math.round(progress)}% complete
          </span>
        </div>
        <Progress value={progress} />

        <div className="mt-3 flex gap-2">
          {STEPS.map((step, index) => (
            <div key={step} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`h-1.5 w-full rounded-full transition-colors ${
                  index <= currentStep ? "bg-primary" : "bg-border"
                }`}
              />
              <span
                className={`text-xs ${
                  index === currentStep
                    ? "font-medium text-primary"
                    : index < currentStep
                      ? "text-muted-foreground"
                      : "text-muted-foreground/50"
                }`}
              >
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      {currentStep === 0 && (
        <StepProfile
          userId={userId}
          data={data}
          onNext={handleNext}
        />
      )}
      {currentStep === 1 && (
        <StepLocation
          data={data}
          onNext={handleNext}
          onBack={() => setCurrentStep(0)}
        />
      )}
      {currentStep === 2 && (
        <StepInterests
          data={data}
          onComplete={handleComplete}
          onBack={() => setCurrentStep(1)}
          isSubmitting={isSubmitting}
        />
      )}

      {error && (
        <p className="mt-3 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
