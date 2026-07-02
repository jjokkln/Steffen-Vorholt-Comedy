import PartnerForm from "@/components/admin/PartnerForm";
import { createPartner } from "@/lib/actions/partners";

export default function NewPartnerPage() {
  return (
    <>
      <h2>Neuer Partner</h2>
      <PartnerForm action={createPartner} />
    </>
  );
}
