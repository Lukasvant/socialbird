import { createClient } from "@/src/lib/supabase/server";
import { LandingPage } from "@/src/components/landing/landing-page";

async function getWaitlistCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("waitlist")
      .select("*", { count: "exact", head: true });
    return count ?? 0;
  } catch {
    return 0;
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const referralSource =
    typeof params.utm_source === "string" ? params.utm_source : null;
  const waitlistCount = await getWaitlistCount();

  return (
    <LandingPage waitlistCount={waitlistCount} referralSource={referralSource} />
  );
}
