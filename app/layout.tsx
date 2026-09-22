import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { A11yBootScript, A11yFilterDefs, A11yWidget } from "@growcore/a11y/react";
import "./globals.css";
import Nav from "@/components/Nav";
import GalaxyBackground from "@/components/GalaxyBackground";
import ConstellationCursor from "@/components/ConstellationCursor";
import JsonLd from "@/components/JsonLd";
import { CookieConsentProvider } from "@/components/consent/CookieConsentProvider";
import CookieBanner from "@/components/consent/CookieBanner";
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
      { url: "/assets/media/metadata/icon.svg", type: "image/svg+xml" },
      { url: "/assets/media/metadata/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/assets/media/metadata/apple-icon.png", sizes: "180x180", type: "image/png" }],
    other: [{ rel: "mask-icon", url: "/assets/media/metadata/mask-icon.svg", color: "#7CFF6B" }],
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
    <html lang="de" suppressHydrationWarning>
      <head>
        {/* MUSS in den <head>: setzt die gespeicherten Einstellungen auf <html>,
            waehrend der Browser das HTML parst — also vor dem ersten Paint. In
            einem useEffect waere es zu spaet und jemand mit Hochkontrast saehe
            bei jedem Seitenaufruf einen hellen Blitz. Daher auch
            suppressHydrationWarning oben: der Server kennt diese Attribute nicht. */}
        <A11yBootScript />
      </head>
      <body className={`${inter.variable} ${grotesk.variable}`}>
        <CookieConsentProvider>
          <GalaxyBackground />
          <ConstellationCursor />
          {/* Sprunglink (WCAG 2.4.1): ohne ihn muss ein Tastaturnutzer auf JEDER
              Seite zuerst die komplette Navigation durchtabben. Sichtbar nur bei
              Fokus — die Regel dafür steht in globals.css, nicht als sr-only-Trick,
              der beim Fokus unsichtbar bleiben kann. */}
          <a className="skip-link" href="#hauptinhalt">
            Zum Hauptinhalt springen
          </a>
          <div className="page">
            <Nav />
            {children}
          </div>
          <CookieBanner />
        </CookieConsentProvider>
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        {/* Vercel-Messung, cookielos und ohne Drittanbieter-Request:
            beide Skripte und ihre Datenpunkte laufen über die eigene Domain
            (/_vercel/insights, /_vercel/speed-insights). Kein Zugriff auf das
            Endgerät nach § 25 TDDDG, daher kein Einwilligungs-Gate — der
            Auftragsverarbeiter Vercel gehört aber in die Datenschutzerklärung. */}
        <Analytics />
        <SpeedInsights />
        {/* A11yFilterDefs muss serverseitig gerendert werden: das CSS kann beim
            ersten Paint schon filter: url(#gc-a11y-…) setzen, und ein fehlendes
            Ziel greift ohne Fehlermeldung ins Leere. Der Trigger sitzt unten
            links, das Panel liegt im Top Layer und braucht keinen z-index. */}
        <A11yFilterDefs />
        <A11yWidget statementHref="/barrierefreiheit" />
      </body>
    </html>
  );
}
