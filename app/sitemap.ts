import type { MetadataRoute } from "next";
import { getActiveShows } from "@/lib/data";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://steffenvorholt.de";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const shows = await getActiveShows();
  return [
    { url: SITE, priority: 1, changeFrequency: "weekly" },
    { url: `${SITE}/shows`, changeFrequency: "daily" },
    { url: `${SITE}/steffen`, changeFrequency: "monthly" },
    { url: `${SITE}/angebote`, changeFrequency: "weekly" },
    { url: `${SITE}/galerie`, changeFrequency: "monthly" },
    { url: `${SITE}/kontakt`, changeFrequency: "monthly" },
    ...shows.map((s) => ({ url: `${SITE}/shows/${s.slug}`, changeFrequency: "weekly" as const })),
  ];
}
