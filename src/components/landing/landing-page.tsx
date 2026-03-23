import { WaitlistForm } from "./waitlist-form";
import {
  MapPin,
  Camera,
  MessageCircle,
  Users,
  Database,
  Shuffle,
  ArrowRight,
} from "lucide-react";

interface LandingPageProps {
  waitlistCount: number;
  referralSource?: string | null;
}

export function LandingPage({ waitlistCount, referralSource }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦅</span>
            <span className="text-xl font-bold text-primary">WildScout</span>
          </div>
          <a
            href="#waitlist-cta"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Join waitlist
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 sm:py-32">
        {/* Background texture */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234a7c59' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Coming soon — join the waitlist
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Connect with wildlife lovers{" "}
            <span className="text-primary">around the world</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Discover people, share sightings, and explore nature together. The
            social platform built specifically for wildlife enthusiasts.
          </p>

          <div className="flex flex-col items-center gap-4">
            <WaitlistForm referralSource={referralSource} size="large" />

            {waitlistCount > 0 && (
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-primary">
                  {waitlistCount.toLocaleString()}
                </span>{" "}
                nature lover{waitlistCount !== 1 ? "s" : ""} already signed up
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="bg-muted/40 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-2xl font-bold text-foreground sm:text-3xl">
            Wildlife enthusiasts deserve better
          </h2>
          <p className="mb-12 text-center text-muted-foreground">
            Current tools leave a huge gap between data and community.
          </p>

          <div className="grid gap-6 sm:grid-cols-3">
            <PainCard
              icon={<Users className="h-6 w-6" />}
              title="Hard to find fellow enthusiasts nearby"
              description="No existing platform lets you discover wildlife lovers in your area. You're birding alone when a community is waiting."
            />
            <PainCard
              icon={<Database className="h-6 w-6" />}
              title="Sighting platforms lack social features"
              description="eBird and iNaturalist are great for data — but there's no feed, no follows, no direct messages, no community."
            />
            <PainCard
              icon={<Shuffle className="h-6 w-6" />}
              title="Generic social media buries nature content"
              description="Your heron sighting gets lost between ads and memes. No species context, no sighting location, no like-minded audience."
            />
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-2xl font-bold text-foreground sm:text-3xl">
            The social layer for wildlife
          </h2>
          <p className="mb-12 text-center text-muted-foreground">
            WildScout bridges the gap between data platforms and generic social
            media.
          </p>

          <div className="grid gap-6 sm:grid-cols-3">
            <FeatureCard
              icon={<MapPin className="h-7 w-7 text-primary" />}
              title="Discover by location"
              description="Find wildlife enthusiasts near you. Filter by distance, interests, and activity. Your local birding community, always a click away."
            />
            <FeatureCard
              icon={<Camera className="h-7 w-7 text-primary" />}
              title="Share sightings"
              description="Post photos with species tags and precise sighting locations. Build your personal wildlife journal, visible to your followers."
            />
            <FeatureCard
              icon={<MessageCircle className="h-7 w-7 text-primary" />}
              title="Connect directly"
              description="Message fellow enthusiasts directly. Mutual follows unlock DMs — organic connections without the spam."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/40 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-2xl font-bold text-foreground sm:text-3xl">
            How WildScout works
          </h2>

          <div className="relative">
            {/* Connector line */}
            <div className="absolute left-8 top-10 hidden h-[calc(100%-80px)] w-0.5 bg-border sm:block" />

            <div className="space-y-8">
              <Step
                number={1}
                title="Create your profile"
                description="Set up your display name, bio, and location. Tell the community what wildlife you love — birds, mammals, reptiles, plants, and more."
              />
              <Step
                number={2}
                title="Discover people"
                description="Browse wildlife lovers near you. Filter by location radius and shared interests. Follow the people whose sightings inspire you."
              />
              <Step
                number={3}
                title="Share & connect"
                description="Post your sightings with photos, species tags, and locations. React to others' posts, and message your mutual connections directly."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        id="waitlist-cta"
        className="bg-primary/5 px-4 py-16 sm:py-24"
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-foreground sm:text-3xl">
            Be the first to know when we launch
          </h2>
          <p className="mb-8 text-muted-foreground">
            We&apos;re building WildScout for wildlife lovers like you. Join the
            waitlist and get early access when we open the doors.
          </p>

          <div className="flex flex-col items-center gap-4">
            <WaitlistForm referralSource={referralSource} size="large" />

            {waitlistCount > 0 && (
              <p className="text-sm text-muted-foreground">
                Join{" "}
                <span className="font-semibold text-primary">
                  {waitlistCount.toLocaleString()}
                </span>{" "}
                others already on the list
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🦅</span>
              <span className="font-bold text-primary">WildScout</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built with ❤️ for wildlife lovers
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <a href="/login" className="hover:text-foreground transition-colors">
                Sign in
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PainCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-6">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
        {icon}
      </div>
      <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
        {icon}
      </div>
      <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-6">
      <div className="relative flex-shrink-0">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-background text-xl font-bold text-primary">
          {number}
        </div>
      </div>
      <div className="pt-3">
        <div className="mb-1 flex items-center gap-2">
          <h3 className="font-semibold text-foreground">{title}</h3>
          {number < 3 && (
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
