/** Konvention: führender "/" = lokale Datei aus public/, sonst Supabase-Storage-Pfad "bucket/datei". */
export function mediaUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("/")) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${path}`;
}

/**
 * Bild-URL über den Next-/Vercel-Bild-Optimizer, für Stellen, an denen keine
 * `<Image>`-Komponente stehen kann — konkret das `poster`-Attribut von `<video>`.
 *
 * Warum: `poster={mediaUrl(...)}` zieht das Original bei JEDEM Seitenaufruf direkt aus
 * dem Supabase-Storage. Über diese URL holt der Optimizer es einmal pro (Datei, Breite),
 * cached 31 Tage (next.config.ts) und liefert danach WebP aus dem Vercel-Cache aus —
 * Supabase-Egress fällt praktisch nur beim ersten Abruf an.
 *
 * Lokale Dateien aus public/ gehen unverändert durch: die liegen ohnehin auf dem
 * Vercel-CDN, eine Optimizer-Runde würde nur eine Transformation vom Kontingent
 * verbrauchen, ohne Supabase-Egress zu sparen.
 *
 * `width` MUSS eine der Breiten aus `deviceSizes`/`imageSizes` in next.config.ts sein —
 * andere Werte lehnt der Optimizer mit 400 ab.
 */
export function optimizedImageUrl(path: string, width: number, quality = 75): string {
  if (!path) return "";
  if (path.startsWith("/")) return path;
  const src = encodeURIComponent(mediaUrl(path));
  return `/_next/image?url=${src}&w=${width}&q=${quality}`;
}
