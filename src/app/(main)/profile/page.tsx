import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";

export const metadata = { title: "Profile — WildScout" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Redirect to the user's own profile — Phase 3 will build /profile/[id]
  redirect(`/profile/${user.id}`);
}
