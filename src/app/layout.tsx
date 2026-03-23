import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/src/components/ui/toaster";

export const metadata: Metadata = {
  title: {
    default: "WildScout — Connect with wildlife lovers",
    template: "%s — WildScout",
  },
  description:
    "Discover people, share sightings, and explore nature together. The social platform for wildlife enthusiasts.",
  metadataBase: new URL("https://wildscout.app"),
  openGraph: {
    title: "WildScout",
    description: "Connect with wildlife lovers around the world",
    type: "website",
    siteName: "WildScout",
  },
  twitter: {
    card: "summary",
    title: "WildScout",
    description: "Connect with wildlife lovers around the world",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
