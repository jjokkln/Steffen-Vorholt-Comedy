import Link from "next/link";
import NRWMap from "@/components/shows/NRWMap";
import { createServerSupabase } from "@/lib/supabase/server";
import { deleteEvent } from "@/lib/actions/events";
import { todayIso } from "@/lib/event-helpers";
import type { EventRow, Show, Venue } from "@/lib/types";
import Tabs from "@/components/admin/Tabs";
import EventList from "@/components/admin/EventList";
import VenueList from "@/components/admin/VenueList";

/**
 * „Termine & Orte" — zusammengelegt aus den früheren Bereichen /admin/termine und
 * /admin/standorte (Lennys Entscheidung, 21.09.2026). Beide behandelten dieselbe
 * Sache aus zwei Richtungen, ohne dass irgendwo stand, wie sie zusammenhängen.
 * /admin/standorte leitet deshalb jetzt hierher um.
 */
export default async function AdminTerminePage() {
  const supabase = await createServerSupabase();
  const [{ data: eventRows }, { data: showRows }, { data: venueRows }] = await Promise.all([
    supabase.from("events").select("*, shows(name, slug, color)").order("date"),
    supabase.from("shows").select("*").order("sort_order"),
    supabase.from("venues").select("id, city, venue, lat, lng, show_id").order("city"),
  ]);

  const events = (eventRows ?? []) as EventRow[];
  const shows = (showRows ?? []) as Show[];
  const venues = (venueRows ?? []) as Venue[];

  const today = todayIso();
  const kommende = events.filter((e) => e.date >= today).length;
  const ohneStandort = events.filter((e) => !e.venue_id).length;

  return (
    <>
      <h2>Termine &amp; Orte</h2>
      <p>
        Alles zum Spielplan an einem Ort: die Termine selbst, die Standorte mit ihren Terminen und
        die Karte, auf der die Standorte gepflegt werden.
      </p>
      <div className="actions">
        <Link className="btn primary" href="/admin/termine/new">+ Neuer Termin</Link>
      </div>

      <Tabs
        ariaLabel="Termine und Orte"
        tabs={[
          {
            id: "termine",
            label: "Termine",
            count: kommende,
            content: (
              <EventList events={events} shows={shows} venues={venues} deleteAction={deleteEvent} />
            ),
          },
          {
            id: "orte",
            label: "Orte",
            count: venues.length,
            warn: ohneStandort > 0,
            content: <VenueList venues={venues} events={events} shows={shows} />,
          },
          {
            id: "karte",
            label: "Karte",
            content: (
              <>
                <p>
                  Auf „Standorte pflegen" umschalten, in die Karte klicken und den Ort eintragen.
                  Nur hier angelegte Standorte bekommen einen Marker.
                </p>
                <div style={{ marginTop: 20 }}>
                  <NRWMap admin venues={venues} events={events} shows={shows} />
                </div>
              </>
            ),
          },
        ]}
      />
    </>
  );
}
