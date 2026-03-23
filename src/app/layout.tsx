import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/src/components/ui/toaster";

export const metadata: Metadata = {
  title: "WildScout — Connect with wildlife lovers",
  description:
    "Discover people, share sightings, and explore nature together. The social platform for wildlife enthusiasts.",
  openGraph: {
    title: "WildScout",
    description: "Connect with wildlife lovers around the world",
    type: "website",
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
