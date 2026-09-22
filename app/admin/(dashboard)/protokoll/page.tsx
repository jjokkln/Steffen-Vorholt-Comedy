import { createServerSupabase } from "@/lib/supabase/server";
import {
  AKTION_BESCHRIFTUNG,
  OBJEKT_BESCHRIFTUNG,
  type AuditAktion,
  type AuditObjekt,
} from "@/lib/audit";
import { protokollAufraeumen } from "@/lib/actions/protokoll";

/**
 * Das Protokoll — die Antwort auf „wer hat das geändert".
 *
 * Bewusst nur lesend und ohne Filterformular: Bei drei Admin-Konten und einer
 * Handvoll Änderungen pro Woche ist eine Liste der letzten 200 Vorgänge die
 * vollständige Antwort. Ein Filter kommt dazu, wenn jemand einen braucht.
 *
 * Die Zeilen lassen sich weder ändern noch löschen — `audit_logs` hat nur eine
 * SELECT-Policy. Der einzige Weg hinein ist `public.audit_schreiben()`, und der
 * einzige Weg hinaus ist die Aufbewahrungsfrist.
 */

export const dynamic = "force-dynamic";

type Zeile = {
  id: string;
  created_at: string;
  aktion: string;
  objekt: string;
  objekt_id: string;
  bezeichnung: string | null;
  handelnder: string;
  details: Record<string, unknown> | null;
};

function beschriftung(zeile: Zeile): string {
  const objekt = OBJEKT_BESCHRIFTUNG[zeile.objekt as AuditObjekt] ?? zeile.objekt;
  const aktion = AKTION_BESCHRIFTUNG[zeile.aktion as AuditAktion] ?? zeile.aktion;
  return `${objekt} ${aktion}`;
}

export default async function AdminProtokollPage() {
  const supabase = await createServerSupabase();

  const [{ data: eintraege }, { data: nutzer }, { count: einwilligungen }] = await Promise.all([
    supabase
      .from("audit_logs")
      .select("id, created_at, aktion, objekt, objekt_id, bezeichnung, handelnder, details")
      .order("created_at", { ascending: false })
      .limit(200),
    // Nur zum Übersetzen der Id in eine Adresse. `admin_users` ist über die
    // REST-API nicht lesbar (RLS ohne Policy), deshalb bleibt es bei der Id,
    // wenn hier nichts zurückkommt — eine Id ist eine schlechtere Antwort als
    // ein Name, aber eine bessere als ein erfundener Name.
    supabase.auth.getUser(),
    supabase.from("einwilligungen").select("id", { count: "exact", head: true }),
  ]);

  const zeilen = (eintraege ?? []) as Zeile[];
  const ichSelbst = nutzer.user?.id;

  return (
    <>
      <h2>Protokoll</h2>
      <p>
        Jede Änderung über diese Verwaltungsfläche — wer, wann, woran. Die Einträge lassen
        sich nicht bearbeiten und nicht löschen; sie verfallen nach 24 Monaten.
        Einwilligungen von Besuchern werden getrennt nachgewiesen (Art. 7 Abs. 1 DSGVO):
        aktuell <strong>{einwilligungen ?? 0}</strong> gespeicherte Entscheidungen, Frist
        36 Monate.
      </p>

      {zeilen.length === 0 ? (
        <p className="notice">
          Noch keine Einträge. Das Protokoll läuft seit dem 22.09.2026 — alles, was davor
          geändert wurde, ist nicht nachvollziehbar.
        </p>
      ) : (
        <div className="table-wrap" style={{ marginTop: 18 }}>
          <table>
            <thead>
              <tr>
                <th>Wann</th>
                <th>Was</th>
                <th>Woran</th>
                <th>Wer</th>
              </tr>
            </thead>
            <tbody>
              {zeilen.map((z) => (
                <tr key={z.id}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {new Date(z.created_at).toLocaleString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>{beschriftung(z)}</td>
                  <td>
                    {z.bezeichnung ?? <span style={{ color: "var(--muted)" }}>—</span>}
                    {z.details && Object.keys(z.details).length > 0 && (
                      <div style={{ color: "var(--muted)", fontSize: 13 }}>
                        {Object.entries(z.details)
                          .map(([k, v]) => `${k}: ${String(v)}`)
                          .join(" · ")}
                      </div>
                    )}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {z.handelnder === ichSelbst ? "du" : `Konto ${z.handelnder.slice(0, 8)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form action={protokollAufraeumen} style={{ marginTop: 24 }}>
        <button className="btn secondary">Abgelaufene Einträge löschen</button>
        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 8 }}>
          Entfernt Protokollzeilen, die älter als 24 Monate sind, und Einwilligungs-Nachweise
          über 36 Monate. Die Fristen stehen in der Datenschutzerklärung.
        </p>
      </form>
    </>
  );
}
