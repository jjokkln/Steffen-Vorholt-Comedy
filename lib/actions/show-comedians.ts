"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";
import { revalidatePath } from "next/cache";

export async function addShowComedian(showId: string, formData: FormData) {
  const comedianId = String(formData.get("comedian_id") ?? "").trim();
  if (!comedianId) throw new Error("Kein Comedian gewählt.");
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("show_comedians").insert({
    show_id: showId,
    comedian_id: comedianId,
    role: String(formData.get("role") ?? "").trim(),
    sort_order: Number(formData.get("sort_order") ?? 0),
  });
  if (error) throw new Error(`Teilnehmer hinzufügen fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath(`/admin/shows/${showId}`);
}

export async function removeShowComedian(id: string, showId: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("show_comedians").delete().eq("id", id);
  if (error) throw new Error(`Entfernen fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath(`/admin/shows/${showId}`);
}
