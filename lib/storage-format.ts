/**
 * Darstellungs-Helfer für Dateigrößen und Speicherauslastung.
 *
 * Eigene Datei, weil beide Seiten sie brauchen: Server-Komponenten (Medien-Seite) und
 * Client-Komponenten (Speicher-Leiste, Upload-Felder). lib/storage-usage.ts kommt dafür
 * nicht in Frage — das zieht über `next/headers` Server-Code mit.
 */

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** Ampel für die Speicherleiste: ab 70 % gelb, ab 90 % rot. */
export function usageLevel(ratio: number): "ok" | "warn" | "full" {
  if (ratio >= 0.9) return "full";
  if (ratio >= 0.7) return "warn";
  return "ok";
}
