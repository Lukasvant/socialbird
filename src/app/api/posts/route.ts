import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { fetchPosts } from "@/src/lib/posts";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const userId = searchParams.get("userId");
  const limit = Math.min(Number(searchParams.get("limit") ?? "12"), 50);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const result = await fetchPosts(supabase, {
      currentUserId: user?.id,
      cursor,
      userId,
      limit,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
