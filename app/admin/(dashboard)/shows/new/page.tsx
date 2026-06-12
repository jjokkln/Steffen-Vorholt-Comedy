import ShowForm from "@/components/admin/ShowForm";
import { createShow } from "@/lib/actions/shows";

export default function NewShowPage() {
  return (
    <>
      <h2>Neue Show</h2>
      <ShowForm action={createShow} />
    </>
  );
}
