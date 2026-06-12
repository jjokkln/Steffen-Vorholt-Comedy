import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { deleteEvent } from "@/lib/actions/events";
import { partitionEvents, formatDateLong } from "@/lib/event-helpers";
import type { EventRow } from "@/lib/types";

function EventTable({ items, emptyText }: { items: EventRow[]; emptyText: string }) {
  if (!items.length) return <p>{emptyText}</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Datum</th><th>Show</th><th>Stadt</th><th>Ticketlink</th><th>Status</th><th></th><th></th></tr>
        </thead>
        <tbody>
          {items.map((e) => (
            <tr key={e.id}>
              <td>{formatDateLong(e.date)}</td>
              <td>{e.shows?.name}</td>
              <td>{e.city}</td>
              <td>{e.ticket_url ? "✓" : <span className="status missing">fehlt</span>}</td>
              <td><span className={`status ${e.is_published ? "live" : "draft"}`}>{e.is_published ? "Live" : "Entwurf"}</span></td>
              <td><Link className="btn secondary" href={`/admin/termine/${e.id}`}>Bearbeiten</Link></td>
              <td>
                <form action={deleteEvent.bind(null, e.id)}>
                  <button className="btn secondary" style={{ color: "var(--danger)" }}>Löschen</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminTerminePage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("events").select("*, shows(name, slug, color)").order("date");
  const { upcoming, past } = partitionEvents((data ?? []) as EventRow[]);

  return (
    <>
      <h2>Termine verwalten</h2>
      <div className="actions">
        <Link className="btn primary" href="/admin/termine/new">+ Neuer Termin</Link>
      </div>
      <h3>Kommende ({upcoming.length})</h3>
      <EventTable items={upcoming} emptyText="Keine kommenden Termine — Zeit, welche anzulegen!" />
      <h3 style={{ marginTop: 28 }}>Vergangene ({past.length})</h3>
      <EventTable items={past} emptyText="Noch keine vergangenen Termine." />
    </>
  );
}
