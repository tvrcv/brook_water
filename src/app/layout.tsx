import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Brook — water on autopilot",
    template: "%s · Brook",
  },
  description:
    "Brook connects to the irrigation system you already have and decides every night how much water each zone needs — from forecast, soil, sun and your water licence.",
  applicationName: "Brook",
  openGraph: {
    title: "Brook — water on autopilot",
    description: "Smart irrigation control for golf courses, stadiums, factories, stations and campuses.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#07090d",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-ink-950 text-fg">{children}</body>
    </html>
  );
}
