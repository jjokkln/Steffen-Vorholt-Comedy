"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Räumt abgelaufene Protokollzeilen weg: Audit-Log nach 24 Monaten,
 * Einwilligungs-Nachweise nach 36.
 *
 * Warum von Hand und nicht als Cron: Ein Zeitplan für zwei Löschläufe im Jahr
 * wäre ein zusätzliches bewegliches Teil, das lautlos ausfällt. Der Knopf steht
 * auf der Protokollseite, und die Fristen stehen in der Datenschutzerklärung —
 * eine Aufbewahrungsfrist, die niemand ausführt, steht nur auf dem Papier.
 *
 * ⚠️ Die Frist selbst steht in `public.audit_aufraeumen()`, nicht hier. Zwei
 * Zahlen an zwei Orten laufen auseinander; die Datenbank ist die, die löscht.
 */
export async function protokollAufraeumen(): Promise<void> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("audit_aufraeumen");
  if (error) throw new Error(`Aufräumen fehlgeschlagen: ${error.message}`);
  // Rückgabewert `void`, weil die Funktion direkt als `action` eines Formulars
  // hängt — alles andere ist dort ein Typfehler. Die Zahl steht im Server-Log.
  console.info(`[protokoll] ${typeof data === "number" ? data : 0} abgelaufene Einträge gelöscht.`);
  revalidatePath("/admin/protokoll");
}
