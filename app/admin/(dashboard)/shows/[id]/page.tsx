import { notFound } from "next/navigation";
import ShowForm from "@/components/admin/ShowForm";
import { updateShow } from "@/lib/actions/shows";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Show } from "@/lib/types";

export default async function EditShowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("shows").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const show = data as Show;
  return (
    <>
      <h2>{show.name} bearbeiten</h2>
      <ShowForm show={show} action={updateShow.bind(null, show.id)} />
    </>
  );
}
