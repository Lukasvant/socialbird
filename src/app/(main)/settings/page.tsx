import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { SettingsForm } from "@/src/components/settings/settings-form";

export const metadata = { title: "Settings — WildScout" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, allow_dms")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Settings</h1>
      <SettingsForm
        userId={profile.id}
        initialAllowDms={profile.allow_dms}
      />
    </div>
  );
}
