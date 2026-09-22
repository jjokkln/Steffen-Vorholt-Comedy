import type { NextConfig } from "next";

/**
 * Content-Security-Policy.
 *
 * ── Was sie kann und was nicht ─────────────────────────────────────────────
 *
 * `script-src` enthält `'unsafe-inline'`, und das ist eine echte Einschränkung:
 * Gegen eingeschleusten Inline-Code schützt diese Richtlinie nicht. Der saubere
 * Weg wäre eine Nonce je Anfrage — die verlangt aber, dass jede Seite
 * serverseitig gerendert wird, und diese Website ist bis auf die
 * Verwaltungsfläche vollständig statisch (43 vorgerenderte Seiten). Der Tausch
 * wäre: etwas mehr Schutz gegen eine Angriffsart, dafür jede Seite dynamisch,
 * langsamer und teurer im Egress. Für eine Marketing-Seite ohne Nutzerkonten
 * und ohne nutzergenerierte Inhalte ist das der schlechtere Handel.
 *
 * Was sie trotzdem verhindert — und das ist nicht wenig:
 * - **Skripte von fremden Hosts.** Eine eingeschleuste `<script src="…">`-Zeile
 *   auf eine fremde Domain lädt nichts mehr.
 * - **`<base>`-Hijacking** (`base-uri 'self'`): Ohne das kann ein eingeschleustes
 *   `<base href="…">` jeden relativen Link und jedes relative Skript umleiten.
 * - **Formular-Exfiltration** (`form-action 'self'`): Ein umgebogenes
 *   `<form action>` kann Eingaben nicht mehr an Fremde schicken.
 * - **Plugins und Objekte** (`object-src 'none'`).
 * - **Fremde Rahmen** (`frame-src`): Nur die vier Dienste, die nach einer
 *   Einwilligung tatsächlich eingebettet werden.
 *
 * ⚠️ **Drei-Schritt-Regel (Pflichtkern Punkt 4):** Ein neuer Drittanbieter ändert
 * drei Dinge im selben Arbeitsschritt — die technische Stelle, den Consent-Text
 * und die Datenschutzerklärung. Seit dem 22.09.2026 ist diese Liste die vierte:
 * Wer einen Dienst einbettet, ohne ihn hier einzutragen, bekommt eine leere
 * Fläche und eine Meldung in der Browser-Konsole — zum ersten Mal wird etwas
 * sichtbar rot, wenn jemand den Schritt vergisst.
 */
const SUPABASE_ORIGIN = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://insyjxxpeywehwnoazjr.supabase.co";

const CSP = [
  "default-src 'self'",
  // 'unsafe-inline' und 'unsafe-eval': Next.js setzt Inline-Bootstrap-Skripte,
  // das Bootskript des Barrierefreiheits-Panels läuft inline im <head>, und
  // GSAP/three brauchen keine eval — 'unsafe-eval' steht hier nur für den
  // Entwicklungsmodus und ist in Produktion nicht nötig.
  process.env.NODE_ENV === "production"
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // Styles: dieselbe Lage. Inline-Styles stehen in Komponenten und im Panel.
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${SUPABASE_ORIGIN} https://i.ytimg.com https://tile.openstreetmap.org`,
  // Videos kommen aus dem eigenen Supabase-Storage, Standbilder auch als blob:
  // (im Browser aus dem Video gegriffen, siehe lib/video-poster.ts).
  `media-src 'self' blob: ${SUPABASE_ORIGIN}`,
  // Schriften liegen selbst gehostet — auch die zwei Leseschriften des Panels.
  "font-src 'self' data:",
  `connect-src 'self' ${SUPABASE_ORIGIN} https://tile.openstreetmap.org`,
  // Nur die vier Dienste aus dem Consent-Banner. Kein Instagram-Skript, kein
  // Facebook-SDK: eingebettet wird ausschließlich über <iframe>.
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com https://www.instagram.com https://www.tiktok.com https://www.facebook.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

// Nur der eigene Storage-Host darf durch den Bild-Optimizer laufen. Vorher stand hier
// "*.supabase.co" — damit hätte jeder Fremde beliebige Supabase-Projekte über unsere
// /_next/image-Route optimieren (und uns damit Traffic verursachen) können.
const SUPABASE_IMAGE_HOST = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  try {
    return url ? new URL(url).hostname : "*.supabase.co";
  } catch {
    return "*.supabase.co";
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: SUPABASE_IMAGE_HOST,
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // Egress-Bremse: Jede Kombination aus (Quellbild, Breite) zieht das Original genau
    // einmal pro Optimizer-Region aus dem Supabase-Storage. Deshalb (a) lange TTL und
    // (b) so wenig Breiten-Varianten wie möglich.
    // 31 Tage — Dateinamen sind unveränderlich (Zeitstempel + Zufall, upsert:false),
    // ein Bild ändert sich also nie unter derselben URL.
    minimumCacheTTL: 2678400,
    // Statt 8 Standard-Breiten nur 4: Handy, Tablet, Desktop, Retina-Desktop.
    // Halbiert die Zahl der Origin-Abrufe pro Bild.
    deviceSizes: [640, 828, 1200, 1920],
    // Für Bilder mit `sizes`-Angabe (Thumbnails, Planeten, Logos).
    imageSizes: [128, 256, 384],
  },
  // HTML-E-Mail-Vorlagen werden zur Laufzeit per fs.readFileSync gelesen (Server Action
  // submitInquiry) — ohne diesen Hinweis kann Vercels Datei-Tracing sie aus dem
  // Serverless-Bundle ausschließen.
  outputFileTracingIncludes: {
    "/*": ["lib/email-templates/**/*"],
  },
  experimental: {
    // Bilder/Poster laufen über Server-Actions; Videos gehen per Direkt-Upload an Supabase Storage.
    // Hinweis: Auf Vercel gilt zusätzlich ein hartes Plattform-Limit von ~4,5 MB pro Server-Action.
    serverActions: { bodySizeLimit: "25mb" },
  },
  async redirects() {
    return [
      { source: "/kalender", destination: "/shows", permanent: true },
      { source: "/termine", destination: "/shows", permanent: true },
      { source: "/comedian", destination: "/steffen", permanent: true },
      { source: "/steffen-buchen", destination: "/kontakt", permanent: true },
      { source: "/comedians-bewerben", destination: "/kontakt", permanent: true },
      { source: "/archiv", destination: "/", permanent: true },
      { source: "/shows/:slug-termine", destination: "/shows/:slug", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/assets/media/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
