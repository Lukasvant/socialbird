import { SignupForm } from "@/src/components/auth/signup-form";
import Link from "next/link";

export const metadata = {
  title: "Create account — WildScout",
};

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">🦅</span>
            <span className="text-2xl font-bold text-primary">WildScout</span>
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            Join WildScout
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your account and start discovering
          </p>
        </div>

        <SignupForm />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
