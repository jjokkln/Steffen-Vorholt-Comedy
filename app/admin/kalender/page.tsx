import type { Metadata } from "next";
import AdminShell from "@/components/AdminShell";

export const metadata: Metadata = {
  title: "Admin – Kalender",
  description: "Monats-/Wochenansicht für Shows, Bewerbungen und Bookings.",
};

export default function AdminKalenderPage() {
  return (
    <AdminShell
      title="Kalender"
      lead="Monats-/Wochenansicht für Shows, Bewerbungen und Bookings."
      active="kalender"
    >
      <h2>Kalender</h2>
      <div className="calendar">
        <div className="day">
          <strong>Mo</strong>
        </div>
        <div className="day">
          <strong>Di</strong>
          <span className="mini-event" style={{ color: "var(--ice)" }}>
            Comedy Eiskalt
          </span>
        </div>
        <div className="day">
          <strong>Mi</strong>
        </div>
        <div className="day">
          <strong>Do</strong>
          <span className="mini-event" style={{ color: "var(--green)" }}>
            Brain Loading
          </span>
        </div>
        <div className="day">
          <strong>Fr</strong>
          <span className="mini-event" style={{ color: "var(--orange)" }}>
            Check-In
          </span>
        </div>
        <div className="day">
          <strong>Sa</strong>
          <span className="mini-event" style={{ color: "var(--yellow)" }}>
            Booking
          </span>
        </div>
        <div className="day">
          <strong>So</strong>
        </div>
      </div>
    </AdminShell>
  );
}
