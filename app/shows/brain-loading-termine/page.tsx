import type { Metadata } from "next";
import ShowTermine from "@/components/ShowTermine";

export const metadata: Metadata = {
  title: "Brain Loading Termine – Steffen Vorholt",
  description: "Alle Brain-Loading-Termine, Städte und Ticketlinks auf einer Seite.",
};

export default function BrainLoadingTerminePage() {
  return (
    <ShowTermine
      show="Brain Loading"
      slug="brain-loading"
      colorClass="brain"
      lead="Die Impro-Comedyshow mit Buzzer, Publikumsvorschlägen und spontanen Story-Wechseln. Besucher sehen hier ausschließlich Termine dieser Show."
    />
  );
}
