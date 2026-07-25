import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { deleteOffer } from "@/lib/actions/offers";
import type { Offer } from "@/lib/types";
import DeleteButton from "@/components/admin/DeleteButton";

export default async function AdminOffersPage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("offers").select("*").order("sort_order");
  const offers = (data ?? []) as Offer[];

  return (
    <>
      <h2>Angebote / Aktionen</h2>
      <p>Aktuelle Aktionen (z. B. Rettember, Missions Pass), die auf der Angebote-Seite erscheinen.</p>
      <div className="actions">
        <Link className="btn primary" href="/admin/angebote/new">+ Neue Aktion</Link>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Titel</th><th>Code</th><th>Status</th><th></th><th></th></tr>
          </thead>
          <tbody>
            {offers.map((o) => (
              <tr key={o.id}>
                <td>{o.title}</td>
                <td>{o.code || "—"}</td>
                <td><span className={`status ${o.is_active ? "live" : "draft"}`}>{o.is_active ? "Aktiv" : "Inaktiv"}</span></td>
                <td><Link className="btn secondary" href={`/admin/angebote/${o.id}`}>Bearbeiten</Link></td>
                <td>
                  <DeleteButton
                    action={deleteOffer.bind(null, o.id)}
                    confirm={`„${o.title}" wirklich löschen?`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
