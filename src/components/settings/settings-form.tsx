"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { Loader2, CheckCircle } from "lucide-react";

type DmSetting = "everyone" | "mutual_only" | "nobody";

const DM_OPTIONS: { value: DmSetting; label: string; description: string }[] = [
  {
    value: "everyone",
    label: "Everyone",
    description: "Any WildScout user can message you",
  },
  {
    value: "mutual_only",
    label: "Mutual follows only",
    description: "Only people you both follow each other",
  },
  {
    value: "nobody",
    label: "Nobody",
    description: "Turn off direct messages",
  },
];

interface SettingsFormProps {
  userId: string;
  initialAllowDms: DmSetting;
}

export function SettingsForm({ userId, initialAllowDms }: SettingsFormProps) {
  const router = useRouter();
  const [allowDms, setAllowDms] = useState<DmSetting>(initialAllowDms);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase
      .from("profiles")
      .update({ allow_dms: allowDms, updated_at: new Date().toISOString() })
      .eq("id", userId);
    setSaving(false);
    if (err) {
      setError(err.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {/* DM Privacy */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-1 text-base font-semibold text-foreground">
          Direct message privacy
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Choose who can send you direct messages.
        </p>

        <div className="space-y-2">
          {DM_OPTIONS.map(({ value, label, description }) => (
            <label
              key={value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                allowDms === value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-accent"
              }`}
            >
              <input
                type="radio"
                name="allow_dms"
                value={value}
                checked={allowDms === value}
                onChange={() => setAllowDms(value)}
                className="mt-0.5 accent-primary"
              />
              <div>
                <p
                  className={`text-sm font-medium ${
                    allowDms === value ? "text-primary" : "text-foreground"
                  }`}
                >
                  {label}
                </p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </label>
          ))}
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <CheckCircle className="h-4 w-4" />
          ) : null}
          {saved ? "Saved!" : "Save settings"}
        </button>
      </section>

      {/* Account */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-base font-semibold text-foreground">Account</h2>
        <div className="space-y-3">
          <a
            href="/profile"
            className="block rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Edit profile
          </a>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center rounded-lg border border-destructive/30 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
          >
            Sign out
          </button>
        </div>
      </section>
    </div>
  );
}
