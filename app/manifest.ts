import type { MetadataRoute } from "next";

// Web-App-Manifest → installierbar auf dem Home-Screen (Android/iOS), setzt
// Farben für den PWA-Splash. Icons liegen unter /public/assets/metadada/.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Steffen Vorholt – Comedy",
    short_name: "Steffen Vorholt",
    description:
      "Live-Comedy aus NRW: Impro, Open Mic & Boarding-Comedy mit Steffen Vorholt. Termine, Tickets und Booking.",
    lang: "de",
    start_url: "/",
    display: "standalone",
    background_color: "#050711",
    theme_color: "#050711",
    icons: [
      { src: "/assets/metadada/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/assets/metadada/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/assets/metadada/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
