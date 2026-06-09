import type { Metadata } from "next";
import AdminShell, { AdminActions } from "@/components/AdminShell";

export const metadata: Metadata = {
  title: "Admin – Termine verwalten",
  description: "Termine, Städte, Locations und externe Ticketlinks pflegen.",
};

export default function AdminTerminePage() {
  return (
    <AdminShell
      title="Termine verwalten"
      lead="Termine, Städte, Locations und externe Ticketlinks pflegen."
      active="termine"
    >
      <h2>Termine verwalten</h2>
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
              <td>Brain Loading Oberhausen</td>
              <td>Archiv</td>
              <td>Eventbrite</td>
            </tr>
            <tr>
              <td>Comedy Eiskalt</td>
              <td>Entwurf</td>
              <td>Ticketlink fehlt</td>
            </tr>
          </tbody>
        </table>
      </div>
      <AdminActions />
    </AdminShell>
  );
}
