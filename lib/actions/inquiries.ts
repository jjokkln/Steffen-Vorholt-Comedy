"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import type { InquiryStatus } from "@/lib/types";
import { protokolliere } from "@/lib/audit";

export async function setInquiryStatus(id: string, status: InquiryStatus) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("inquiries").update({ status }).eq("id", id);
  if (error) throw new Error(`Status ändern fehlgeschlagen: ${error.message}`);
  await protokolliere({ aktion: "status_geaendert", objekt: "anfrage", objektId: id, details: { status } });
  revalidatePath("/admin/anfragen");
}

export async function deleteInquiry(id: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("inquiries").delete().eq("id", id);
  if (error) throw new Error(`Anfrage löschen fehlgeschlagen: ${error.message}`);
  // ⚠️ Bewusst ohne Name, Adresse oder Nachricht: Eine gelöschte Anfrage soll
  // gelöscht sein. Das Protokoll hält fest, DASS gelöscht wurde, nicht WAS.
  await protokolliere({ aktion: "geloescht", objekt: "anfrage", objektId: id });
  revalidatePath("/admin/anfragen");
}
