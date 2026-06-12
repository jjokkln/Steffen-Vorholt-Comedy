import { createServerSupabase } from "@/lib/supabase/server";
import { addOneLiner, toggleOneLiner, deleteOneLiner } from "@/lib/actions/content";
import type { OneLiner } from "@/lib/types";

export default async function AdminOneLinerPage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("one_liners").select("*").order("created_at");
  const liners = (data ?? []) as OneLiner[];

  return (
    <>
      <h2>Buzzer-One-Liner</h2>
      <p>Diese Sprüche spuckt der rote Buzzer auf der Startseite aus.</p>
      <form className="form" action={addOneLiner} style={{ display: "flex", gap: 10 }}>
        <input name="text" placeholder="Neuer One-Liner..." required style={{ flex: 1 }} />
        <button className="btn primary">Hinzufügen</button>
      </form>
      <div className="table-wrap" style={{ marginTop: 18 }}>
        <table>
          <tbody>
            {liners.map((l) => (
              <tr key={l.id}>
                <td>{l.text}</td>
                <td>
                  <form action={toggleOneLiner.bind(null, l.id, !l.is_active)}>
                    <button className="btn secondary">{l.is_active ? "Aktiv ✓" : "Inaktiv"}</button>
                  </form>
                </td>
                <td>
                  <form action={deleteOneLiner.bind(null, l.id)}>
                    <button className="btn secondary" style={{ color: "var(--danger)" }}>Löschen</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
