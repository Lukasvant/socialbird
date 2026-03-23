import { redirect, notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { ChatView } from "@/src/components/messages/chat-view";
import type { Message } from "@/src/types/messages";

export const metadata = { title: "Chat — WildScout" };

const PAGE_SIZE = 50;

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify the current user is a participant
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, participant_1, participant_2")
    .eq("id", conversationId)
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .maybeSingle();

  if (!conversation) notFound();

  const otherUserId =
    conversation.participant_1 === user.id
      ? conversation.participant_2
      : conversation.participant_1;

  // Fetch the other user's profile and the last PAGE_SIZE messages in parallel
  const [{ data: otherProfile }, { data: messagesData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("id", otherUserId)
      .single(),
    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE + 1),
  ]);

  if (!otherProfile) notFound();

  const raw = (messagesData ?? []) as Message[];
  const hasOlderMessages = raw.length > PAGE_SIZE;
  const messages = raw.slice(0, PAGE_SIZE).reverse();

  return (
    <ChatView
      conversationId={conversationId}
      currentUserId={user.id}
      otherUser={otherProfile}
      initialMessages={messages}
      hasOlderMessages={hasOlderMessages}
    />
  );
}
