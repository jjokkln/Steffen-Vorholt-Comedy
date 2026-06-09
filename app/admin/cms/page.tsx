import type { Metadata } from "next";
import AdminShell, { AdminActions } from "@/components/AdminShell";

export const metadata: Metadata = {
  title: "Admin – GitHub-CMS",
  description: "Statische Inhalte werden im Repository gepflegt.",
};

export default function AdminCmsPage() {
  return (
    <AdminShell
      title="GitHub-CMS"
      lead="Statische Inhalte werden im Repository gepflegt."
      active="cms"
    >
      <h2>GitHub-CMS</h2>
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
              <td>/content/shows</td>
              <td>Showtexte</td>
              <td>Git</td>
            </tr>
            <tr>
              <td>/content/pages</td>
              <td>Seitentexte</td>
              <td>Git</td>
            </tr>
            <tr>
              <td>/content/settings</td>
              <td>CTAs/SEO/Social</td>
              <td>Git</td>
            </tr>
          </tbody>
        </table>
      </div>
      <AdminActions />
    </AdminShell>
  );
}
