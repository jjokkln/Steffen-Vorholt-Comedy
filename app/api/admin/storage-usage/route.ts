import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getStorageUsage } from "@/lib/storage-usage";

/**
 * Speicherverbrauch für die Leiste im Admin. Als Route statt direkt im Layout, weil das
 * Durchzählen aller Storage-Objekte je nach Dateimenge eine Sekunde dauern kann — das
 * darf nicht jeden Seitenaufruf im Dashboard blockieren.
 *
 * Eigene Auth-Prüfung: `proxy.ts` greift nur für `/admin/:path*`, API-Routen nicht.
 */
export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  try {
    const usage = await getStorageUsage();
    return NextResponse.json(usage, {
      // Kurzer Cache: Die Leiste steht auf jeder Admin-Seite, muss aber nicht sekundenaktuell sein.
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
