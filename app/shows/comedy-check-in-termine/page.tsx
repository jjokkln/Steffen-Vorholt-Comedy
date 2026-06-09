import type { Metadata } from "next";
import ShowTermine from "@/components/ShowTermine";

export const metadata: Metadata = {
  title: "Comedy Check-In Termine – Steffen Vorholt",
  description: "Alle Comedy-Check-In-Termine und Ticketlinks.",
};

export default function ComedyCheckInTerminePage() {
  return (
    <ShowTermine
      show="Comedy Check-In"
      slug="comedy-check-in"
      colorClass="checkin"
      lead="Dein Boarding in die Comedy-Galaxie mit Captain Steffen und wechselndem Co-Pilot. Besucher sehen hier ausschließlich Termine dieser Show."
    />
  );
}
