import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { deleteShow } from "@/lib/actions/shows";
import type { Show } from "@/lib/types";
import DeleteButton from "@/components/admin/DeleteButton";

export default async function AdminShowsPage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("shows").select("*").order("sort_order");
  const shows = (data ?? []) as Show[];

  return (
    <>
      <h2>Shows verwalten</h2>
      <div className="actions">
        <Link className="btn primary" href="/admin/shows/new">
          + Neue Show
        </Link>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Slug</th><th>Status</th><th></th><th></th></tr>
          </thead>
          <tbody>
            {shows.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>/shows/{s.slug}</td>
                <td><span className={`status ${s.is_active ? "live" : "draft"}`}>{s.is_active ? "Aktiv" : "Inaktiv"}</span></td>
                <td><Link className="btn secondary" href={`/admin/shows/${s.id}`}>Bearbeiten</Link></td>
                <td>
                  <DeleteButton
                    action={deleteShow.bind(null, s.id)}
                    confirm={`Show „${s.name}" und ALLE zugehörigen Termine unwiderruflich löschen?`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>⚠️ Löschen entfernt auch alle Termine der Show – endgültig.</p>
    </>
  );
}
