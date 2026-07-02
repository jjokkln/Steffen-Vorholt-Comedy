import { notFound } from "next/navigation";
import PartnerForm from "@/components/admin/PartnerForm";
import { updatePartner } from "@/lib/actions/partners";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Partner } from "@/lib/types";

export default async function EditPartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("partners").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const partner = data as Partner;

  return (
    <>
      <h2>{partner.name} bearbeiten</h2>
      <PartnerForm partner={partner} action={updatePartner.bind(null, partner.id)} />
    </>
  );
}
