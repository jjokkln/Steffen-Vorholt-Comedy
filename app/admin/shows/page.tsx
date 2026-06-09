import type { Metadata } from "next";
import AdminShell, { AdminActions } from "@/components/AdminShell";

export const metadata: Metadata = {
  title: "Admin – Shows verwalten",
  description: "Shows anlegen, bearbeiten, archivieren oder löschen.",
};

export default function AdminShowsPage() {
  return (
    <AdminShell
      title="Shows verwalten"
      lead="Shows anlegen, bearbeiten, archivieren oder löschen."
      active="shows"
    >
      <h2>Shows verwalten</h2>
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
              <td>Brain Loading</td>
              <td>Aktiv</td>
              <td>Neon/Glitch</td>
            </tr>
            <tr>
              <td>Comedy Eiskalt</td>
              <td>Aktiv</td>
              <td>Frost/Open Mic</td>
            </tr>
            <tr>
              <td>Comedy Check-In</td>
              <td>Aktiv</td>
              <td>Airport/Captain</td>
            </tr>
          </tbody>
        </table>
      </div>
      <AdminActions />
    </AdminShell>
  );
}
