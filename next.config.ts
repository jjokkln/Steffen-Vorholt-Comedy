import type { NextConfig } from "next";

const securityHeaders = [
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
