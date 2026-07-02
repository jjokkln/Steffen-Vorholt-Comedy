import { notFound } from "next/navigation";
import AppearanceForm from "@/components/admin/AppearanceForm";
import { updateAppearance } from "@/lib/actions/appearances";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Appearance } from "@/lib/types";

export default async function EditAppearancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("appearances").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const appearance = data as Appearance;

  return (
    <>
      <h2>{appearance.title} bearbeiten</h2>
      <AppearanceForm appearance={appearance} action={updateAppearance.bind(null, appearance.id)} />
    </>
  );
}
