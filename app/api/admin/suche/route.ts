import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatDateLong } from "@/lib/event-helpers";

/**
 * Die Suche hinter der Leiste in der Admin-Topbar. Sucht über die Bestände, die
 * man tatsächlich sucht — Termine, Standorte, Shows, Anfragen, Partner,
 * Comedians, Gastauftritte. Die Bereiche selbst findet die Leiste clientseitig,
 * dafür braucht es keinen Server.
 *
 * ⚠️ Eigene Auth-Prüfung, nicht nur `proxy.ts`: Der Proxy greift für
 * `/admin/:path*`, API-Routen liegen unter `/api/` und laufen an ihm vorbei.
 * Ohne diese vier Zeilen wäre das hier ein offener Lesezugang zu Anfragen —
 * inklusive Namen und Mailadressen. (Pflichtkern Punkt 9.)
 */

export type SucheTreffer = {
  gruppe: string;
  titel: string;
  zusatz?: string;
  href: string;
};

/** Pro Gruppe, damit eine ergiebige Gruppe die anderen nicht verdrängt. */
const PRO_GRUPPE = 5;

export async function GET(request: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const q = (new URL(request.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ treffer: [] });

  // PostgREST-Sonderzeichen entschärfen: Komma trennt in `or()` die Bedingungen,
  // Klammern gruppieren sie. Ein Suchwort mit Komma würde die Abfrage sonst
  // zerlegen statt sie zu filtern.
  const safe = q.replace(/[,()*\\]/g, " ").trim();
  if (!safe) return NextResponse.json({ treffer: [] });
  const like = `%${safe}%`;

  const [events, venues, shows, inquiries, partners, comedians, appearances] = await Promise.all([
    supabase
      .from("events")
      .select("id, date, city, venue, shows(name)")
      .or(`city.ilike.${like},venue.ilike.${like}`)
      .order("date", { ascending: false })
      .limit(PRO_GRUPPE),
    supabase
      .from("venues")
      .select("id, city, venue")
      .or(`city.ilike.${like},venue.ilike.${like}`)
      .limit(PRO_GRUPPE),
    supabase.from("shows").select("id, name, tagline").ilike("name", like).limit(PRO_GRUPPE),
    supabase
      .from("inquiries")
      .select("id, name, email, type, status, created_at")
      .or(`name.ilike.${like},email.ilike.${like}`)
      .order("created_at", { ascending: false })
      .limit(PRO_GRUPPE),
    supabase.from("partners").select("id, name").ilike("name", like).limit(PRO_GRUPPE),
    supabase.from("comedians").select("id, name").ilike("name", like).limit(PRO_GRUPPE),
    supabase
      .from("appearances")
      .select("id, title, city, venue, date")
      .or(`title.ilike.${like},city.ilike.${like},venue.ilike.${like}`)
      .order("date", { ascending: false, nullsFirst: true })
      .limit(PRO_GRUPPE),
  ]);

  const treffer: SucheTreffer[] = [];

  for (const e of events.data ?? []) {
    const show = (e.shows as { name?: string } | { name?: string }[] | null) ?? null;
    const showName = Array.isArray(show) ? show[0]?.name : show?.name;
    treffer.push({
      gruppe: "Termine",
      titel: `${formatDateLong(e.date as string)} · ${showName ?? "Ohne Show"}`,
      zusatz: [e.city, e.venue].filter(Boolean).join(" · "),
      href: `/admin/termine/${e.id}`,
    });
  }
  for (const v of venues.data ?? []) {
    treffer.push({ gruppe: "Standorte", titel: `${v.city} · ${v.venue}`, href: "/admin/termine" });
  }
  for (const s of shows.data ?? []) {
    treffer.push({ gruppe: "Shows", titel: s.name as string, zusatz: (s.tagline as string) || undefined, href: `/admin/shows/${s.id}` });
  }
  for (const i of inquiries.data ?? []) {
    treffer.push({
      gruppe: "Anfragen",
      titel: i.name as string,
      // Bewusst ohne Mailadresse in der Vorschau: Die Leiste steht offen im
      // Bild, auch wenn gerade jemand mitschaut. Zum Beantworten reicht der Klick.
      zusatz: i.status === "new" ? "neu" : undefined,
      href: "/admin/anfragen",
    });
  }
  for (const p of partners.data ?? []) {
    treffer.push({ gruppe: "Partner", titel: p.name as string, href: `/admin/partner/${p.id}` });
  }
  for (const c of comedians.data ?? []) {
    treffer.push({ gruppe: "Comedians", titel: c.name as string, href: `/admin/comedians/${c.id}` });
  }
  for (const a of appearances.data ?? []) {
    treffer.push({
      gruppe: "Gastauftritte",
      titel: a.title as string,
      zusatz: [a.date ? formatDateLong(a.date as string) : null, a.city].filter(Boolean).join(" · ") || undefined,
      href: `/admin/auftritte/${a.id}`,
    });
  }

  return NextResponse.json({ treffer });
}
