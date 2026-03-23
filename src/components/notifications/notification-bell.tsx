"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";

interface NotificationBellProps {
  userId: string;
  initialCount: number;
  /** Extra classes applied to the wrapping element */
  className?: string;
  /** "sidebar" renders a full nav-link row; "mobile" renders an icon tab */
  variant: "sidebar" | "mobile";
}

export function NotificationBell({
  userId,
  initialCount,
  className = "",
  variant,
}: NotificationBellProps) {
  const pathname = usePathname();
  const [count, setCount] = useState(initialCount);

  // Clear badge when visiting the notifications page
  useEffect(() => {
    if (pathname === "/notifications") {
      setCount(0);
    }
  }, [pathname]);

  // Realtime: increment count on new notification INSERT
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notif-bell:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Only increment if we're not on the notifications page
          setCount((prev) =>
            window.location.pathname === "/notifications" ? 0 : prev + 1
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const isActive =
    pathname === "/notifications" || pathname.startsWith("/notifications/");

  const badge =
    count > 0 ? (
      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold leading-none text-destructive-foreground">
        {count > 99 ? "99+" : count}
      </span>
    ) : null;

  if (variant === "sidebar") {
    return (
      <Link
        href="/notifications"
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? "bg-primary/10 text-primary"
            : "text-foreground hover:bg-accent hover:text-accent-foreground"
        } ${className}`}
      >
        <span className="relative shrink-0">
          <Bell className="h-5 w-5" />
          {badge}
        </span>
        Notifications
      </Link>
    );
  }

  // mobile bottom-nav tab
  return (
    <Link
      href="/notifications"
      className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
      } ${className}`}
    >
      <span className="relative">
        <Bell className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
        {badge}
      </span>
      Alerts
    </Link>
  );
}
