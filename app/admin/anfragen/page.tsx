import type { Metadata } from "next";
import AdminShell, { AdminActions } from "@/components/AdminShell";

export const metadata: Metadata = {
  title: "Admin – Anfragen",
  description: "Booking-Anfragen und Comedian-Bewerbungen verwalten.",
};

export default function AdminAnfragenPage() {
  return (
    <AdminShell
      title="Anfragen"
      lead="Booking-Anfragen und Comedian-Bewerbungen verwalten."
      active="anfragen"
    >
      <h2>Anfragen</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Info</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Comedian-Bewerbung</td>
              <td>Neu</td>
              <td>Comedy Eiskalt</td>
            </tr>
            <tr>
              <td>Booking</td>
              <td>Rückfrage offen</td>
              <td>Firmenfeier</td>
            </tr>
          </tbody>
        </table>
      </div>
      <AdminActions />
    </AdminShell>
  );
}
