"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";
import { relativeTime } from "@/src/lib/time";
import type { Message } from "@/src/types/messages";

interface OtherUser {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

interface ChatViewProps {
  conversationId: string;
  currentUserId: string;
  otherUser: OtherUser;
  initialMessages: Message[];
  hasOlderMessages: boolean;
}

export function ChatView({
  conversationId,
  currentUserId,
  otherUser,
  initialMessages,
  hasOlderMessages,
}: ChatViewProps) {
  const supabase = useMemo(() => createClient(), []);

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [canLoadOlder, setCanLoadOlder] = useState(hasOlderMessages);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Initial scroll to bottom (instant) ────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, []);

  // ── Mark messages from other user as read on open ──────────────────
  useEffect(() => {
    supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", currentUserId)
      .eq("is_read", false)
      .then(() => {}); // fire-and-forget
  }, [supabase, conversationId, currentUserId]);

  // ── Realtime subscription ──────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;

          setMessages((prev) => {
            // Deduplicate — might arrive before the send() return
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Scroll to bottom smoothly for new messages
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 50);

          // Mark as read immediately if it's the other person's message
          if (newMsg.sender_id !== currentUserId) {
            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", newMsg.id)
              .then(() => {});
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, conversationId, currentUserId]);

  // ── Load older messages ────────────────────────────────────────────
  const loadOlderMessages = useCallback(async () => {
    if (!canLoadOlder || loadingOlder || messages.length === 0) return;
    setLoadingOlder(true);

    const oldestTimestamp = messages[0].created_at;
    const scrollArea = scrollAreaRef.current;
    const prevScrollHeight = scrollArea?.scrollHeight ?? 0;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .lt("created_at", oldestTimestamp)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data && data.length > 0) {
      const older = [...data].reverse() as Message[];
      setMessages((prev) => [...older, ...prev]);
      setCanLoadOlder(data.length === 20);

      // Restore scroll position so the view doesn't jump to the top
      requestAnimationFrame(() => {
        if (scrollArea) {
          scrollArea.scrollTop =
            scrollArea.scrollHeight - prevScrollHeight;
        }
      });
    } else {
      setCanLoadOlder(false);
    }

    setLoadingOlder(false);
  }, [supabase, conversationId, canLoadOlder, loadingOlder, messages]);

  // ── Auto-resize textarea ───────────────────────────────────────────
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  // ── Send message ───────────────────────────────────────────────────
  async function sendMessage() {
    const content = input.trim();
    if (!content || sending) return;

    setInput("");
    setSending(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
    });

    if (error) {
      // Put content back on failure
      setInput(content);
    }

    setSending(false);
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const otherInitials = otherUser.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    // Full-height flex column:
    // mobile: 100dvh - mobile top bar (3.5rem) - mobile bottom nav (4rem)
    // desktop: 100dvh (the sidebar just shifts the left edge via pl-60)
    <div className="flex h-[calc(100dvh-7.5rem)] flex-col md:h-dvh">
      {/* ── Chat header ──────────────────────────────────────────────── */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-3">
        <Link
          href="/messages"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Link
          href={`/profile/${otherUser.id}`}
          className="flex items-center gap-2.5"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={otherUser.avatar_url ?? undefined}
              alt={otherUser.display_name}
            />
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {otherInitials}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-foreground hover:underline">
            {otherUser.display_name}
          </span>
        </Link>
      </header>

      {/* ── Messages area ────────────────────────────────────────────── */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {/* Load older */}
        {canLoadOlder && (
          <div className="mb-4 text-center">
            <button
              onClick={loadOlderMessages}
              disabled={loadingOlder}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
              {loadingOlder ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : null}
              Load older messages
            </button>
          </div>
        )}

        {/* Empty conversation */}
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No messages yet. Say hi to{" "}
            <span className="font-medium text-foreground">
              {otherUser.display_name}
            </span>
            !
          </p>
        )}

        {/* Message bubbles */}
        <div className="space-y-2">
          {messages.map((msg, i) => {
            const isOwn = msg.sender_id === currentUserId;
            const prevMsg = messages[i - 1];
            const showTimestamp =
              !prevMsg ||
              new Date(msg.created_at).getTime() -
                new Date(prevMsg.created_at).getTime() >
                5 * 60 * 1000; // 5 min gap

            return (
              <div key={msg.id}>
                {showTimestamp && (
                  <p className="my-3 text-center text-xs text-muted-foreground">
                    {relativeTime(msg.created_at)}
                  </p>
                )}
                <div
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      isOwn
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-muted text-foreground"
                    }`}
                  >
                    {/* Preserve newlines */}
                    {msg.content.split("\n").map((line, li) => (
                      <span key={li}>
                        {li > 0 && <br />}
                        {line}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Message input ─────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-border bg-card px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${otherUser.display_name}…`}
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-2.5 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            style={{ maxHeight: "120px" }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
            aria-label="Send"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
          Enter to send &middot; Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
