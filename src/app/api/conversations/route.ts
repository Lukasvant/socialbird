import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

/**
 * POST /api/conversations
 * Body: { targetUserId: string }
 *
 * Finds an existing conversation between the current user and targetUserId,
 * or creates a new one. Enforces participant_1 < participant_2 ordering.
 * Returns { conversationId: string }.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const targetUserId: string | undefined = body?.targetUserId;
  if (!targetUserId || typeof targetUserId !== "string") {
    return NextResponse.json({ error: "targetUserId required" }, { status: 400 });
  }
  if (targetUserId === user.id) {
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
  }

  // Canonical ordering: smaller UUID goes in participant_1
  const [p1, p2] = [user.id, targetUserId].sort() as [string, string];

  // Look for an existing conversation
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("participant_1", p1)
    .eq("participant_2", p2)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ conversationId: existing.id });
  }

  // Create a new one
  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ participant_1: p1, participant_2: p2 })
    .select("id")
    .single();

  if (error) {
    // Handle race-condition duplicate (unique constraint violation)
    if (error.code === "23505") {
      const { data: retry } = await supabase
        .from("conversations")
        .select("id")
        .eq("participant_1", p1)
        .eq("participant_2", p2)
        .maybeSingle();
      if (retry) return NextResponse.json({ conversationId: retry.id });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversationId: created.id }, { status: 201 });
}
