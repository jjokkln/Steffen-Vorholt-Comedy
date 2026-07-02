import { notFound } from "next/navigation";
import OfferForm from "@/components/admin/OfferForm";
import { updateOffer } from "@/lib/actions/offers";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Offer } from "@/lib/types";

export default async function EditOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("offers").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const offer = data as Offer;

  return (
    <>
      <h2>{offer.title} bearbeiten</h2>
      <OfferForm offer={offer} action={updateOffer.bind(null, offer.id)} />
    </>
  );
}
