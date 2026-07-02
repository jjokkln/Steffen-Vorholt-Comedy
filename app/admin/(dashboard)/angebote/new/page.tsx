import OfferForm from "@/components/admin/OfferForm";
import { createOffer } from "@/lib/actions/offers";

export default function NewOfferPage() {
  return (
    <>
      <h2>Neue Aktion</h2>
      <OfferForm action={createOffer} />
    </>
  );
}
