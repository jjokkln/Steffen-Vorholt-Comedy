import { notFound } from "next/navigation";
import EventForm from "@/components/admin/EventForm";
import { updateEvent } from "@/lib/actions/events";
import { createServerSupabase } from "@/lib/supabase/server";
import type { EventRow, Show } from "@/lib/types";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const [{ data: event }, { data: shows }] = await Promise.all([
    supabase.from("events").select("*").eq("id", id).maybeSingle(),
    supabase.from("shows").select("*").order("sort_order"),
  ]);
  if (!event) notFound();
  return (
    <>
      <h2>Termin bearbeiten</h2>
      <EventForm event={event as EventRow} shows={(shows ?? []) as Show[]} action={updateEvent.bind(null, id)} />
    </>
  );
}
