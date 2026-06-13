import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
  experimental: {
    // Bilder/Poster laufen über Server-Actions; Videos gehen per Direkt-Upload an Supabase Storage.
    // Hinweis: Auf Vercel gilt zusätzlich ein hartes Plattform-Limit von ~4,5 MB pro Server-Action.
    serverActions: { bodySizeLimit: "25mb" },
  },
  async redirects() {
    return [
      { source: "/kalender", destination: "/termine", permanent: true },
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
