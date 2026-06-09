import type { Metadata } from "next";
import ShowTermine from "@/components/ShowTermine";

export const metadata: Metadata = {
  title: "Comedy Eiskalt Termine – Steffen Vorholt",
  description: "Alle Comedy-Eiskalt-Termine und Ticketlinks.",
};

export default function ComedyEiskaltTerminePage() {
  return (
    <ShowTermine
      show="Comedy Eiskalt"
      slug="comedy-eiskalt"
      colorClass="ice"
      lead="Das Open-Mic-Format in der Eissportarena Bergisch Gladbach. Besucher sehen hier ausschließlich Termine dieser Show."
    />
  );
}
