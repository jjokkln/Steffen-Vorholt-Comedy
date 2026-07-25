import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { deleteComedian } from "@/lib/actions/comedians";
import type { Comedian } from "@/lib/types";
import DeleteButton from "@/components/admin/DeleteButton";

export default async function AdminComediansPage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("comedians").select("*").order("sort_order");
  const comedians = (data ?? []) as Comedian[];

  return (
    <>
      <h2>Comedians verwalten</h2>
      <p>Comedy-Kollegen für die Comedian-Seite und als Teilnehmer einzelner Shows.</p>
      <div className="actions">
        <Link className="btn primary" href="/admin/comedians/new">+ Neuer Comedian</Link>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Alter</th><th>Status</th><th></th><th></th></tr>
          </thead>
          <tbody>
            {comedians.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.age ?? "—"}</td>
                <td><span className={`status ${c.is_active ? "live" : "draft"}`}>{c.is_active ? "Aktiv" : "Inaktiv"}</span></td>
                <td><Link className="btn secondary" href={`/admin/comedians/${c.id}`}>Bearbeiten</Link></td>
                <td>
                  <DeleteButton
                    action={deleteComedian.bind(null, c.id)}
                    confirm={`„${c.name}" wirklich löschen? Wird auch aus allen zugeordneten Shows entfernt.`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>⚠️ Löschen entfernt den Comedian auch aus allen zugeordneten Shows.</p>
    </>
  );
}
