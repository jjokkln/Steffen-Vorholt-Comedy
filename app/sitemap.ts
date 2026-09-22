import type { MetadataRoute } from "next";
import { getActiveShows } from "@/lib/data";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://steffenvorholt.de";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const shows = await getActiveShows();
  return [
    { url: SITE, priority: 1, changeFrequency: "weekly" },
    { url: `${SITE}/shows`, changeFrequency: "daily" },
    { url: `${SITE}/steffen`, changeFrequency: "monthly" },
    { url: `${SITE}/galerie`, changeFrequency: "monthly" },
    { url: `${SITE}/kontakt`, changeFrequency: "monthly" },
    // Anders als Impressum, Datenschutz und AGB (noindex, bewusst nicht hier):
    // Die Erklärung zur Barrierefreiheit soll gefunden werden — auch von jemandem,
    // der über die Suche nach dem Meldeweg sucht statt über den Fußbereich.
    { url: `${SITE}/barrierefreiheit`, changeFrequency: "yearly" },
    ...shows.map((s) => ({ url: `${SITE}/shows/${s.slug}`, changeFrequency: "weekly" as const })),
  ];
}
