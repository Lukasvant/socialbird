import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { OnboardingWizard } from "@/src/components/onboarding/onboarding-wizard";

export const metadata = {
  title: "Set up your profile — WildScout",
};

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_onboarded, display_name, bio, avatar_url, location_name, interests")
    .eq("id", user.id)
    .single();

  if (profile?.is_onboarded) {
    redirect("/feed");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mb-2 text-3xl">🦅</div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome to WildScout
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Let&apos;s set up your profile in 3 quick steps
          </p>
        </div>
        <OnboardingWizard
          userId={user.id}
          initialData={{
            display_name: profile?.display_name ?? "",
            bio: profile?.bio ?? "",
            avatar_url: profile?.avatar_url ?? null,
            location_name: profile?.location_name ?? "",
            interests: profile?.interests ?? [],
          }}
        />
      </div>
    </div>
  );
}
