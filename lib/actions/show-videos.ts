"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";
import { revalidatePath } from "next/cache";
import type { VideoOrientation } from "@/lib/types";

/** Speichert ein bereits per Direkt-Upload hochgeladenes Show-Video (nur Metadaten/Pfade). */
export async function addShowVideo(
  showId: string,
  input: { videoPath: string; posterPath?: string; title?: string; orientation?: VideoOrientation; sortOrder?: number },
) {
  if (!input.videoPath) throw new Error("Video-Pfad fehlt.");
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("show_videos").insert({
    show_id: showId,
    video_path: input.videoPath,
    poster_path: input.posterPath ?? "",
    title: (input.title ?? "").trim(),
    orientation: input.orientation === "portrait" ? "portrait" : "landscape",
    sort_order: input.sortOrder ?? 0,
  });
  if (error) throw new Error(`Video speichern fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath(`/admin/shows/${showId}`);
}

/**
 * Trägt das Vorschaubild eines bestehenden Videos nach.
 *
 * Gebraucht für den Altbestand: Bis zum 21.09.2026 konnte ein Video ohne Vorschaubild
 * gespeichert werden, und ohne Vorschaubild bleibt die Kachel auf der Show-Seite leer
 * (Begründung in lib/video-poster.ts). Neue Uploads erzeugen ihr Bild selbst; diese
 * Aktion ist der Weg für alles, was vorher schon in der Datenbank stand.
 */
export async function setShowVideoPoster(id: string, showId: string, posterPath: string) {
  if (!posterPath) throw new Error("Poster-Pfad fehlt.");
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("show_videos").update({ poster_path: posterPath }).eq("id", id);
  if (error) throw new Error(`Vorschaubild speichern fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath(`/admin/shows/${showId}`);
}

/** Ändert das Format (Quer-/Hochformat) eines bestehenden Videos. */
export async function updateShowVideoOrientation(id: string, showId: string, formData: FormData) {
  const supabase = await createServerSupabase();
  const orientation = formData.get("orientation") === "portrait" ? "portrait" : "landscape";
  const { error } = await supabase.from("show_videos").update({ orientation }).eq("id", id);
  if (error) throw new Error(`Format speichern fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath(`/admin/shows/${showId}`);
}

export async function deleteShowVideo(id: string, showId: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("show_videos").delete().eq("id", id);
  if (error) throw new Error(`Löschen fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath(`/admin/shows/${showId}`);
}
