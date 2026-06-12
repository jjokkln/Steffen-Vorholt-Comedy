"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import type { InquiryStatus } from "@/lib/types";

export async function setInquiryStatus(id: string, status: InquiryStatus) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("inquiries").update({ status }).eq("id", id);
  if (error) throw new Error(`Status ändern fehlgeschlagen: ${error.message}`);
  revalidatePath("/admin/anfragen");
}

export async function deleteInquiry(id: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("inquiries").delete().eq("id", id);
  if (error) throw new Error(`Anfrage löschen fehlgeschlagen: ${error.message}`);
  revalidatePath("/admin/anfragen");
}
