import type { Metadata } from "next";
import AdminShell from "@/components/AdminShell";

export const metadata: Metadata = {
  title: "Admin – Mission Control",
  description: "Admin-Dashboard für Shows, Termine, Ticketlinks und Anfragen.",
};

export default function AdminPage() {
  return (
    <AdminShell
      title="Mission Control."
      lead="Dashboard für Shows, Termine, Ticketlinks, Locations, Comedian-Bewerbungen, Booking-Anfragen und GitHub-CMS-Inhalte."
      active="index"
    >
      <h2>Übersicht</h2>
      <div className="kpis">
        <div className="kpi">
          <strong>3</strong>
          <span>aktive Shows</span>
        </div>
        <div className="kpi">
          <strong>7</strong>
          <span>Brain-Loading-Standorte</span>
        </div>
        <div className="kpi">
          <strong>2</strong>
          <span>neue Bewerbungen</span>
        </div>
        <div className="kpi">
          <strong>1</strong>
          <span>Ticketlink fehlt</span>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Aufgabe</th>
              <th>Bereich</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Zukünftige Termine eintragen</td>
              <td>Termine</td>
              <td>
                <span className="status draft">Offen</span>
              </td>
            </tr>
            <tr>
              <td>Hero-Video ersetzen</td>
              <td>Medien</td>
              <td>
                <span className="status missing">Benötigt</span>
              </td>
            </tr>
            <tr>
              <td>Ticketlinks prüfen</td>
              <td>Tickets</td>
              <td>
                <span className="status draft">Offen</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
