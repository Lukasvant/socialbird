import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { ConversationList } from "@/src/components/messages/conversation-list";
import type { ConversationListItem } from "@/src/types/messages";

export const metadata = { title: "Messages — WildScout" };

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.rpc("get_conversation_list", {
    p_user_id: user.id,
  });

  const conversations = (data ?? []) as ConversationListItem[];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold text-foreground">Messages</h1>
      <ConversationList conversations={conversations} currentUserId={user.id} />
    </div>
  );
}
