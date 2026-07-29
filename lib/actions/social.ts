"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";
import { SOCIAL_PLATFORMS } from "@/lib/social";
import type { SocialItemKind, VideoOrientation } from "@/lib/types";

export type FormState = { ok: boolean; message: string; at: number } | null;

const KINDS: SocialItemKind[] = ["video", "channel"];
const ORIENTATIONS: VideoOrientation[] = ["landscape", "portrait"];

function socialFields(formData: FormData) {
  const url = String(formData.get("url") ?? "").trim();
  if (!/^https?:\/\/\S+$/.test(url)) {
    throw new Error("Bitte eine vollständige Link-Adresse angeben (mit https://).");
  }

  const platform = String(formData.get("platform") ?? "");
  if (!SOCIAL_PLATFORMS.some((p) => p.key === platform)) {
    throw new Error("Unbekannte Plattform.");
  }

  const kind = String(formData.get("kind") ?? "") as SocialItemKind;
  if (!KINDS.includes(kind)) throw new Error("Unbekannte Art des Eintrags.");

  const orientation = String(formData.get("orientation") ?? "landscape") as VideoOrientation;
  if (!ORIENTATIONS.includes(orientation)) throw new Error("Unbekanntes Format.");

  return {
    platform,
    kind,
    url,
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    thumbnail_path: String(formData.get("thumbnail_path") ?? "").trim(),
    orientation,
    sort_order: Number(formData.get("sort_order") ?? 0),
    is_active: formData.get("is_active") === "on",
  };
}

export async function createSocialItem(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createServerSupabase();
  try {
    const { error } = await supabase.from("social_media_items").insert(socialFields(formData));
    if (error) throw new Error(error.message);
  } catch (err) {
    return { ok: false, message: `Anlegen fehlgeschlagen: ${(err as Error).message}`, at: Date.now() };
  }
  revalidatePublic();
  redirect("/admin/social");
}

export async function updateSocialItem(
  id: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createServerSupabase();
  try {
    const { error } = await supabase
      .from("social_media_items")
      .update(socialFields(formData))
      .eq("id", id);
    if (error) throw new Error(error.message);
  } catch (err) {
    return { ok: false, message: `Speichern fehlgeschlagen: ${(err as Error).message}`, at: Date.now() };
  }
  revalidatePublic();
  revalidatePath("/admin/social");
  return { ok: true, message: "Gespeichert!", at: Date.now() };
}

export async function deleteSocialItem(id: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("social_media_items").delete().eq("id", id);
  if (error) throw new Error(`Löschen fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath("/admin/social");
}

/**
 * Sichtbarkeit direkt aus der Liste umschalten — der häufigste Griff im Alltag
 * („Video kurz ausblenden") soll nicht über das Bearbeiten-Formular laufen.
 */
export async function toggleSocialItem(id: string, nextActive: boolean) {
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("social_media_items")
    .update({ is_active: nextActive })
    .eq("id", id);
  if (error) throw new Error(`Umschalten fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath("/admin/social");
}
