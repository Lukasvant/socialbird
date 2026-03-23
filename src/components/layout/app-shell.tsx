"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import {
  Home,
  Compass,
  MessageCircle,
  User,
  Plus,
  LogOut,
} from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";
import { useRouter } from "next/navigation";

interface NavUser {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

interface AppShellProps {
  user: NavUser;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/feed",     label: "Feed",     icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/profile",  label: "Profile",  icon: User },
] as const;

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const initials = user.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex min-h-screen bg-background">
      {/*
       * ── DESKTOP SIDEBAR ──────────────────────────────────────────────
       * Hidden on mobile (< md). Fixed left column, full height.
       */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-card md:flex">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-5">
          <span className="text-2xl">🦅</span>
          <span className="text-lg font-bold text-primary">WildScout</span>
        </div>

        {/* Nav links */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {label}
              </Link>
            );
          })}

          {/* New Post */}
          <Link
            href="/post/new"
            className="mt-2 flex items-center gap-3 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-5 w-5 shrink-0" />
            New Sighting
          </Link>
        </nav>

        {/* User footer */}
        <div className="shrink-0 border-t border-border p-3">
          <div className="flex items-center gap-3">
            <Link href="/profile" className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={user.avatar_url ?? undefined} alt={user.display_name} />
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-sm font-medium text-foreground">
                {user.display_name}
              </span>
            </Link>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/*
       * ── MAIN CONTENT ─────────────────────────────────────────────────
       * On desktop: offset by sidebar width.
       * On mobile: full width with bottom padding for nav bar.
       */}
      <main className="flex min-h-screen w-full flex-col md:pl-60">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xl">🦅</span>
            <span className="font-bold text-primary">WildScout</span>
          </div>
          <Link
            href="/post/new"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <Plus className="h-5 w-5" />
          </Link>
        </header>

        {/* Page content */}
        <div className="flex-1 pb-16 md:pb-0">{children}</div>
      </main>

      {/*
       * ── MOBILE BOTTOM NAV ────────────────────────────────────────────
       * Fixed bottom bar, only visible on mobile (< md).
       */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card md:hidden">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
