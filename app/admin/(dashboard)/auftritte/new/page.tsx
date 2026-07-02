import AppearanceForm from "@/components/admin/AppearanceForm";
import { createAppearance } from "@/lib/actions/appearances";

export default function NewAppearancePage() {
  return (
    <>
      <h2>Neuer Auftritt</h2>
      <AppearanceForm action={createAppearance} />
    </>
  );
}
