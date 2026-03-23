import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { AppShell } from "@/src/components/layout/app-shell";

/**
 * Layout for all authenticated + onboarded pages.
 * The middleware guarantees that by the time this layout renders,
 * the user is signed in and has is_onboarded = true.
 * (Exceptions: /onboarding lives inside (main) but the middleware
 *  redirects there BEFORE this layout tries to assert onboarded status.)
 */
export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, is_onboarded")
    .eq("id", user.id)
    .single();

  // Still mid-onboarding — render without AppShell so the wizard
  // doesn't show the nav chrome.
  if (!profile?.is_onboarded) {
    return <>{children}</>;
  }

  return (
    <AppShell
      user={{
        id: user.id,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
      }}
    >
      {children}
    </AppShell>
  );
}
