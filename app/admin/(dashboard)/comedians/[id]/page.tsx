import { notFound } from "next/navigation";
import ComedianForm from "@/components/admin/ComedianForm";
import { updateComedian } from "@/lib/actions/comedians";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Comedian } from "@/lib/types";

export default async function EditComedianPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("comedians").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const comedian = data as Comedian;

  return (
    <>
      <h2>{comedian.name} bearbeiten</h2>
      <ComedianForm comedian={comedian} action={updateComedian.bind(null, comedian.id)} />
    </>
  );
}
