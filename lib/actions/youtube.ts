"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";
import { revalidatePath } from "next/cache";
import { parseYoutubeId } from "@/lib/youtube";

/**
 * Fügt ein YouTube-Video hinzu. showId === null → globale Referenz
 * (Homepage / Comedian-Seite / Archiv). showId gesetzt → Video einer Show.
 */
export async function addYoutubeVideo(showId: string | null, formData: FormData) {
  const youtubeId = parseYoutubeId(String(formData.get("url") ?? ""));
  if (!youtubeId) throw new Error("Keine gültige YouTube-URL/ID erkannt.");
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("youtube_videos").insert({
    show_id: showId,
    youtube_id: youtubeId,
    title: String(formData.get("title") ?? "").trim(),
    sort_order: Number(formData.get("sort_order") ?? 0),
  });
  if (error) throw new Error(`Video hinzufügen fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  if (showId) revalidatePath(`/admin/shows/${showId}`);
  else revalidatePath("/admin/youtube");
}

export async function deleteYoutubeVideo(id: string, showId: string | null) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("youtube_videos").delete().eq("id", id);
  if (error) throw new Error(`Löschen fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  if (showId) revalidatePath(`/admin/shows/${showId}`);
  else revalidatePath("/admin/youtube");
}
