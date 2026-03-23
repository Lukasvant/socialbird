import Link from "next/link";
import { Binoculars } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <Binoculars className="mx-auto mb-4 h-14 w-14 text-muted-foreground" />
        <h1 className="mb-2 text-3xl font-bold text-foreground">404</h1>
        <p className="mb-1 text-lg font-semibold text-foreground">
          Nothing to see here
        </p>
        <p className="mb-6 text-sm text-muted-foreground">
          This page doesn&apos;t exist or was moved.
        </p>
        <Link
          href="/feed"
          className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Back to feed
        </Link>
      </div>
    </div>
  );
}
