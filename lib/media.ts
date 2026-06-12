/** Konvention: führender "/" = lokale Datei aus public/, sonst Supabase-Storage-Pfad "bucket/datei". */
export function mediaUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("/")) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${path}`;
}
