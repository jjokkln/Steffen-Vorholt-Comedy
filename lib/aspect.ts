/**
 * Ziel-Seitenverhältnisse für die Zuschneidefunktion im Admin.
 * Ein Ort für alle Formate, damit Crop-Rahmen (Admin) und Anzeige (Website) nicht auseinanderlaufen.
 */

/** A4 hoch (210 × 297 mm) — Format der Show-Titelbilder, damit Plakate/Flyer unbeschnitten passen. */
export const A4_PORTRAIT = 210 / 297;

export type AspectOption = { key: string; label: string; aspect: number | null };

/**
 * Formate für Upload-Bereiche, deren Anzeige jedes Seitenverhältnis verträgt
 * (Galerien zeigen mit object-fit:contain). „Original" lädt die Datei unverändert hoch.
 */
export const FLEXIBLE_ASPECT_OPTIONS: AspectOption[] = [
  { key: "original", label: "Original — kein Zuschnitt", aspect: null },
  { key: "16-9", label: "Querformat 16:9", aspect: 16 / 9 },
  { key: "3-2", label: "Querformat 3:2", aspect: 3 / 2 },
  { key: "4-3", label: "Querformat 4:3", aspect: 4 / 3 },
  { key: "1-1", label: "Quadratisch 1:1", aspect: 1 },
  { key: "4-5", label: "Hochformat 4:5", aspect: 4 / 5 },
  { key: "a4", label: "A4 hoch (210:297)", aspect: A4_PORTRAIT },
  { key: "9-16", label: "Hochformat 9:16", aspect: 9 / 16 },
];

/** Formate für freigestellte Grafiken (Logos, Planeten): quadratisch oder unverändert. */
export const TRANSPARENT_ASPECT_OPTIONS: AspectOption[] = [
  { key: "original", label: "Original — kein Zuschnitt", aspect: null },
  { key: "1-1", label: "Quadratisch 1:1", aspect: 1 },
  { key: "16-9", label: "Querformat 16:9", aspect: 16 / 9 },
  { key: "3-1", label: "Breites Banner 3:1", aspect: 3 },
];

/** Vorschaubilder von Videos folgen dem Videoformat. */
export const VIDEO_POSTER_ASPECT_OPTIONS: AspectOption[] = [
  { key: "16-9", label: "Querformat 16:9", aspect: 16 / 9 },
  { key: "9-16", label: "Hochformat 9:16", aspect: 9 / 16 },
  { key: "original", label: "Original — kein Zuschnitt", aspect: null },
];
