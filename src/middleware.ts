import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase requires a middleware to refresh the session on every request.
 * Without this, Server Components may see an expired session even when
 * the browser still has a valid refresh token.
 *
 * https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // This call is required — it refreshes the session cookie if it has expired.
  // Do NOT remove or short-circuit this.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match everything except static files, images, and the favicon.
     * The session refresh must run for all authenticated routes.
     */
    "/((?!_next/static|_next/image|favicon\\.svg|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg)$).*)",
  ],
};
