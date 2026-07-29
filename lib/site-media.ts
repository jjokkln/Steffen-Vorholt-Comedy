/**
 * Registry aller pflegbaren Medien-Plätze der Website (Tabelle `site_media`).
 *
 * Eine Zeile hier = ein Upload-Feld im Admin unter „Videos & Speicher" und genau eine
 * Stelle auf der öffentlichen Website. Neuer Platz? Hier eintragen, Migration für den
 * Startwert schreiben, an der Zielstelle `resolveSiteMedia()` benutzen — mehr nicht.
 *
 * Bewusst frei von Server-Code, damit die Liste auch in Client-Komponenten (Upload-Felder)
 * importiert werden kann.
 */

export type SiteMediaKind = "video" | "image";

export interface SiteMediaSlot {
  key: string;
  label: string;
  /** Wo genau erscheint das auf der Website? Steht als Hilfetext im Admin. */
  where: string;
  kind: SiteMediaKind;
  /** Seitenverhältnis der öffentlichen Anzeige (Breite / Höhe) — steuert Zuschnitt und Vorschau. */
  aspect: number;
  /**
   * Ziel für die Komprimierung im Browser (nur `kind: "video"`): längere Kante in Pixeln
   * und Video-Bitrate in Mbit/s. Großzügiger für vollflächige Videos, sparsamer für kleine
   * Bildfelder — dort sieht niemand den Unterschied, aber das 5-GB-Kontingent schon.
   */
  targetLongEdge?: number;
  targetMbps?: number;
  /** Wird benutzt, solange dieser Platz leer ist (Kette, endet bei `localFallback`). */
  fallbackKey?: string;
  /** Letzte Reserve: Datei aus public/, damit die Seite nie ohne Video dasteht. */
  localFallback?: string;
}

export const SITE_MEDIA_SLOTS: SiteMediaSlot[] = [
  {
    key: "home_trailer_video",
    label: "Trailer (Startseite)",
    where: "Startseite, vollflächig direkt unter dem Hero — mit Ton zum Einschalten.",
    kind: "video",
    aspect: 16 / 9,
    targetLongEdge: 1920,
    targetMbps: 4,
    localFallback: "/assets/media/steffen/steffen-trailer.mp4",
  },
  {
    key: "home_trailer_poster",
    label: "Vorschaubild des Trailers",
    where:
      "Standbild, das vor dem Abspielen des Trailers zu sehen ist. Ohne Vorschaubild bleibt die Fläche schwarz.",
    kind: "image",
    aspect: 16 / 9,
    localFallback: "/assets/media/steffen/steffen-trailer-poster.webp",
  },
  {
    key: "home_portrait_video",
    label: "Bühnen-Video (Startseite)",
    where: "Startseite, im Abschnitt „Steffen Vorholt.“ neben dem Text.",
    kind: "video",
    aspect: 4 / 5,
    targetLongEdge: 1280,
    targetMbps: 2.5,
    // Vor Migration 0018 hieß dieser Platz `hero_video` — Kette hält alte Umgebungen lauffähig.
    fallbackKey: "hero_video",
    localFallback: "/assets/media/steffen/steffen-stage-loop-hero.mp4",
  },
  {
    key: "home_portrait_poster",
    label: "Vorschaubild des Bühnen-Videos (Startseite)",
    where:
      "Standbild, das vor dem Abspielen des Bühnen-Videos zu sehen ist. Ohne Vorschaubild bleibt die Fläche schwarz, bis das Video geladen ist.",
    kind: "image",
    aspect: 4 / 5,
  },
  {
    key: "steffen_portrait_video",
    label: "Bühnen-Video (Über Steffen)",
    where: "Seite „Über Steffen“, neben dem Text. Leer = das Video der Startseite wird gezeigt.",
    kind: "video",
    aspect: 4 / 5,
    targetLongEdge: 1280,
    targetMbps: 2.5,
    fallbackKey: "home_portrait_video",
  },
  {
    key: "steffen_portrait_poster",
    label: "Vorschaubild des Bühnen-Videos (Über Steffen)",
    where:
      "Standbild für das Bühnen-Video auf „Über Steffen“. Leer = das Vorschaubild der Startseite wird gezeigt.",
    kind: "image",
    aspect: 4 / 5,
    fallbackKey: "home_portrait_poster",
  },
];

export function siteMediaSlot(key: string): SiteMediaSlot | undefined {
  return SITE_MEDIA_SLOTS.find((s) => s.key === key);
}

/**
 * Löst einen Platz gegen die geladenen `site_media`-Werte auf und folgt dabei der
 * Fallback-Kette (eigener Wert → `fallbackKey` → … → `localFallback` → "").
 * Gibt einen Rohpfad zurück; für die URL noch durch `mediaUrl()` schicken.
 */
export function resolveSiteMedia(values: Record<string, string>, key: string): string {
  const seen = new Set<string>();
  let current: string | undefined = key;
  // Erst die ganze Kette nach einem gepflegten Wert absuchen, lokale Dateien sind
  // nur die Reserve: sonst würde ein leerer Platz mit `localFallback` die Kette
  // abschneiden, bevor der alte Schlüssel (z. B. `hero_video`) geprüft wurde.
  let localFallback = "";

  while (current && !seen.has(current)) {
    seen.add(current);
    const value = (values[current] ?? "").trim();
    if (value) return value;
    const slot = siteMediaSlot(current);
    if (!localFallback && slot?.localFallback) localFallback = slot.localFallback;
    current = slot?.fallbackKey;
  }
  return localFallback;
}
