import EventForm from "@/components/admin/EventForm";
import { createEvent } from "@/lib/actions/events";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Show } from "@/lib/types";

export default async function NewEventPage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("shows").select("*").order("sort_order");
  return (
    <>
      <h2>Neuer Termin</h2>
      <EventForm shows={(data ?? []) as Show[]} action={createEvent} />
    </>
  );
}
