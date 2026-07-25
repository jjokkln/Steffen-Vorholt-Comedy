import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { deletePartner } from "@/lib/actions/partners";
import type { Partner } from "@/lib/types";
import DeleteButton from "@/components/admin/DeleteButton";

export default async function AdminPartnersPage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("partners").select("*").order("sort_order");
  const partners = (data ?? []) as Partner[];

  return (
    <>
      <h2>Partner verwalten</h2>
      <p>Veranstalter und Bühnen, die auf der Comedian-Seite erscheinen.</p>
      <div className="actions">
        <Link className="btn primary" href="/admin/partner/new">+ Neuer Partner</Link>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Status</th><th></th><th></th></tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td><span className={`status ${p.is_active ? "live" : "draft"}`}>{p.is_active ? "Aktiv" : "Inaktiv"}</span></td>
                <td><Link className="btn secondary" href={`/admin/partner/${p.id}`}>Bearbeiten</Link></td>
                <td>
                  <DeleteButton
                    action={deletePartner.bind(null, p.id)}
                    confirm={`„${p.name}" wirklich löschen?`}
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
