import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { PostForm } from "@/src/components/post/post-form";

export const metadata = { title: "New Sighting — WildScout" };

export default async function NewPostPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <PostForm userId={user.id} />;
}
