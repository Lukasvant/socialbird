"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { createClient } from "@/src/lib/supabase/client";
import { CheckCircle, Loader2 } from "lucide-react";

interface WaitlistFormProps {
  referralSource?: string | null;
  size?: "default" | "large";
}

export function WaitlistForm({
  referralSource,
  size = "default",
}: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "duplicate" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const isLarge = size === "large";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMessage("Please enter a valid email address.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    const supabase = createClient();

    const utmParams =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const utmSource =
      referralSource ||
      utmParams?.get("utm_source") ||
      utmParams?.get("ref") ||
      null;

    const { error } = await supabase.from("waitlist").insert({
      email: trimmed,
      referral_source: utmSource,
    });

    if (!error) {
      setStatus("success");
      setEmail("");
      return;
    }

    // Unique constraint violation = duplicate email
    if (
      error.code === "23505" ||
      error.message?.toLowerCase().includes("unique")
    ) {
      setStatus("duplicate");
      return;
    }

    setStatus("error");
    setErrorMessage("Something went wrong. Please try again.");
  }

  if (status === "success") {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-primary/10 px-5 py-4 text-primary">
        <CheckCircle className="h-5 w-5 shrink-0" />
        <p className={isLarge ? "text-base font-medium" : "text-sm font-medium"}>
          You&apos;re in! We&apos;ll email you when we launch.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={`flex flex-col gap-3 sm:flex-row ${isLarge ? "sm:max-w-md" : "sm:max-w-sm"} ${isLarge ? "" : ""}`}
      >
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          disabled={status === "loading"}
          className={`flex-1 border-border bg-background ${isLarge ? "h-12 text-base" : ""}`}
          required
        />
        <Button
          type="submit"
          disabled={status === "loading"}
          className={`shrink-0 bg-primary hover:bg-primary/90 ${isLarge ? "h-12 px-6 text-base" : ""}`}
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Joining...
            </>
          ) : (
            "Join the waitlist"
          )}
        </Button>
      </div>

      {status === "duplicate" && (
        <p className="mt-2 text-sm text-amber-700">
          You&apos;re already on the list! We&apos;ll notify you at launch.
        </p>
      )}
      {status === "error" && (
        <p className="mt-2 text-sm text-destructive">{errorMessage}</p>
      )}
    </form>
  );
}
