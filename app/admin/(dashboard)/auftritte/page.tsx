import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { deleteAppearance } from "@/lib/actions/appearances";
import { formatDateLong } from "@/lib/event-helpers";
import type { Appearance } from "@/lib/types";
import DeleteButton from "@/components/admin/DeleteButton";

const KIND_LABEL: Record<Appearance["kind"], string> = {
  open_mic: "Open Mic",
  guest: "Auftritt",
  gig: "Gig",
  show: "Eigene Show",
};

export default async function AdminAppearancesPage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("appearances").select("*").order("date", { ascending: false, nullsFirst: true });
  const appearances = (data ?? []) as Appearance[];

  return (
    <>
      <h2>Auftritte verwalten</h2>
      <p>Open Mics, Gastauftritte und Gigs für die Comedian-Seite.</p>
      <div className="actions">
        <Link className="btn primary" href="/admin/auftritte/new">+ Neuer Auftritt</Link>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Titel</th><th>Art</th><th>Datum</th><th>Status</th><th></th><th></th></tr>
          </thead>
          <tbody>
            {appearances.map((a) => (
              <tr key={a.id}>
                <td>{a.title}</td>
                <td>{KIND_LABEL[a.kind]}</td>
                <td>{a.date ? formatDateLong(a.date) : "laufend"}</td>
                <td><span className={`status ${a.is_published ? "live" : "draft"}`}>{a.is_published ? "Live" : "Entwurf"}</span></td>
                <td><Link className="btn secondary" href={`/admin/auftritte/${a.id}`}>Bearbeiten</Link></td>
                <td>
                  <DeleteButton
                    action={deleteAppearance.bind(null, a.id)}
                    confirm={`„${a.title}" wirklich löschen?`}
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
