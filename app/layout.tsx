import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import GalaxyBackground from "@/components/GalaxyBackground";
import ConstellationCursor from "@/components/ConstellationCursor";
import JsonLd from "@/components/JsonLd";
import { organizationJsonLd, websiteJsonLd } from "@/lib/jsonld";

const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });

const SITE_NAME = "Steffen Vorholt";
const DEFAULT_TITLE = "Steffen Vorholt – Comedy aus einer anderen Galaxie";
const DEFAULT_DESCRIPTION =
  "Live-Comedy aus NRW: Impro, Open Mic & Boarding-Comedy mit Steffen Vorholt. Termine, Tickets sichern und Steffen für dein Event buchen.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://steffenvorholt.de"),
  title: { default: DEFAULT_TITLE, template: "%s · Steffen Vorholt" },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "entertainment",
  keywords: [
    "Steffen Vorholt",
    "Comedian",
    "Comedy NRW",
    "Live-Comedy",
    "Impro-Comedy",
    "Open Mic",
    "Comedian buchen",
    "Comedy Show buchen",
    "Comedy Recklinghausen",
    "Brain Loading",
    "Comedy Eiskalt",
    "Doppel-Comedy",
  ],
  alternates: { canonical: "./" },
  openGraph: {
    siteName: "Steffen Vorholt Comedy",
    locale: "de_DE",
    type: "website",
    url: "./",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  icons: {
    icon: [
      { url: "/assets/metadada/icon.svg", type: "image/svg+xml" },
      { url: "/assets/metadada/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/assets/metadada/apple-icon.png", sizes: "180x180", type: "image/png" }],
    other: [{ rel: "mask-icon", url: "/assets/metadada/mask-icon.svg", color: "#7CFF6B" }],
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  themeColor: "#050711",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body className={`${inter.variable} ${grotesk.variable}`}>
        <GalaxyBackground />
        <ConstellationCursor />
        <div className="page">
          <Nav />
          {children}
        </div>
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      </body>
    </html>
  );
}
