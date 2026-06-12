import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { partitionEvents, formatDateLong, todayIso } from "@/lib/event-helpers";
import type { EventRow, Show } from "@/lib/types";

export default async function AdminIndexPage() {
  const supabase = await createServerSupabase();
  const [{ data: events }, { data: shows }, { count: newInquiries }] = await Promise.all([
    supabase.from("events").select("*, shows(name, slug, color)").order("date"),
    supabase.from("shows").select("*"),
    supabase.from("inquiries").select("*", { count: "exact", head: true }).eq("status", "new"),
  ]);
  const { upcoming } = partitionEvents((events ?? []) as EventRow[]);
  const allShows = (shows ?? []) as Show[];
  const showsWithoutUpcoming = allShows.filter(
    (s) => s.is_active && !upcoming.some((e) => e.show_id === s.id),
  );
  const missingTickets = upcoming.filter((e) => !e.ticket_url);

  return (
    <>
      <h2>Übersicht</h2>
      <div className="kpis">
        <div className="kpi">
          <strong>{newInquiries ?? 0}</strong>
          <span>neue Anfragen</span>
        </div>
        <div className="kpi">
          <strong>{upcoming.length}</strong>
          <span>kommende Termine</span>
        </div>
        <div className="kpi">
          <strong>{showsWithoutUpcoming.length}</strong>
          <span>Shows ohne Termin</span>
        </div>
        <div className="kpi">
          <strong>{missingTickets.length}</strong>
          <span>Ticketlinks fehlen</span>
        </div>
      </div>

      <h3 style={{ marginTop: 28 }}>Nächste Termine</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Datum</th><th>Show</th><th>Stadt</th><th>Tickets</th></tr>
          </thead>
          <tbody>
            {upcoming.slice(0, 5).map((e) => (
              <tr key={e.id}>
                <td>{formatDateLong(e.date)}</td>
                <td>{e.shows?.name}</td>
                <td>{e.city}</td>
                <td>{e.ticket_url ? "✓" : <span className="status missing">fehlt</span>}</td>
              </tr>
            ))}
            {!upcoming.length && (
              <tr><td colSpan={4}>Keine kommenden Termine (Stand {formatDateLong(todayIso())}).</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showsWithoutUpcoming.length > 0 && (
        <p style={{ marginTop: 14 }}>
          ⚠️ Ohne kommenden Termin: {showsWithoutUpcoming.map((s) => s.name).join(", ")} —{" "}
          <Link href="/admin/termine/new">jetzt Termin anlegen</Link>.
        </p>
      )}
    </>
  );
}
