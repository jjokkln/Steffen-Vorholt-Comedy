import NRWMap from "@/components/shows/NRWMap";
import { createServerSupabase } from "@/lib/supabase/server";
import type { EventRow, Show, Venue } from "@/lib/types";

export default async function AdminVenuesPage() {
  const supabase = await createServerSupabase();
  const [{ data: venueRows }, { data: eventRows }, { data: showRows }] = await Promise.all([
    supabase.from("venues").select("id, city, venue, lat, lng, show_id").order("city"),
    supabase.from("events").select("*, shows(name, slug, color)").order("date"),
    supabase.from("shows").select("*").order("sort_order"),
  ]);

  return (
    <>
      <h2>Standorte</h2>
      <p>
        Die Spielorte der NRW-Karte auf der Shows-Seite. Auf „Standorte pflegen" umschalten, in die
        Karte klicken und den Ort eintragen. Über <b>„+ Termine"</b> hängst du dann mehrere Termine
        auf einmal an einen Ort — einzelne Daten oder gleich eine ganze Serie („monatlich × 6").
      </p>
      <div style={{ marginTop: 20 }}>
        <NRWMap
          admin
          venues={(venueRows ?? []) as Venue[]}
          events={(eventRows ?? []) as EventRow[]}
          shows={(showRows ?? []) as Show[]}
        />
      </div>
    </>
  );
}
