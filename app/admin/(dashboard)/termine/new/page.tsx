import EventForm from "@/components/admin/EventForm";
import { createEvent } from "@/lib/actions/events";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Show, Venue } from "@/lib/types";

export default async function NewEventPage() {
  const supabase = await createServerSupabase();
  const [{ data }, { data: venues }] = await Promise.all([
    supabase.from("shows").select("*").order("sort_order"),
    supabase.from("venues").select("id, city, venue, lat, lng, show_id").order("city"),
  ]);
  return (
    <>
      <h2>Neuer Termin</h2>
      <EventForm shows={(data ?? []) as Show[]} venues={(venues ?? []) as Venue[]} action={createEvent} />
    </>
  );
}
