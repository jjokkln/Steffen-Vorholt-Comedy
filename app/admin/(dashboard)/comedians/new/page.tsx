import ComedianForm from "@/components/admin/ComedianForm";
import { createComedian } from "@/lib/actions/comedians";

export default function NewComedianPage() {
  return (
    <>
      <h2>Neuer Comedian</h2>
      <ComedianForm action={createComedian} />
    </>
  );
}
