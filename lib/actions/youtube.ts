"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";
import { revalidatePath } from "next/cache";
import { parseYoutubeId } from "@/lib/youtube";
import { protokolliere } from "@/lib/audit";

/**
 * Fügt ein YouTube-Video hinzu. showId === null → globale Referenz
 * (Homepage / Comedian-Seite / Archiv). showId gesetzt → Video einer Show.
 */
export async function addYoutubeVideo(showId: string | null, formData: FormData) {
  const youtubeId = parseYoutubeId(String(formData.get("url") ?? ""));
  if (!youtubeId) throw new Error("Keine gültige YouTube-URL/ID erkannt.");
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("youtube_videos").insert({
    show_id: showId,
    youtube_id: youtubeId,
    title: String(formData.get("title") ?? "").trim(),
    sort_order: Number(formData.get("sort_order") ?? 0),
  }).select("id").single();
  if (error) throw new Error(`Video hinzufügen fehlgeschlagen: ${error.message}`);
  await protokolliere({
    aktion: "angelegt",
    objekt: "youtube_referenz",
    objektId: data.id as string,
    bezeichnung: String(formData.get("title") ?? "") || youtubeId,
    details: { show: showId ?? "global", youtube_id: youtubeId },
  });
  revalidatePublic();
  if (showId) revalidatePath(`/admin/shows/${showId}`);
  else revalidatePath("/admin/youtube");
}

export async function deleteYoutubeVideo(id: string, showId: string | null) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("youtube_videos").delete().eq("id", id);
  if (error) throw new Error(`Löschen fehlgeschlagen: ${error.message}`);
  await protokolliere({
    aktion: "geloescht",
    objekt: "youtube_referenz",
    objektId: id,
    details: { show: showId ?? "global" },
  });
  revalidatePublic();
  if (showId) revalidatePath(`/admin/shows/${showId}`);
  else revalidatePath("/admin/youtube");
}
