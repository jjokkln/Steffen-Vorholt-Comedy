import { createServerSupabase } from "@/lib/supabase/server";
import { saveLegalPage } from "@/lib/actions/content";

export default async function AdminImpressumPage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("legal_pages").select("content").eq("slug", "impressum").maybeSingle();

  return (
    <>
      <h2>Impressum bearbeiten</h2>
      <p>Format: <code>## Überschrift</code> für Abschnitte, Leerzeile = neuer Absatz. Links werden automatisch erkannt.</p>
      <form className="card form" action={saveLegalPage.bind(null, "impressum")}>
        <textarea name="content" rows={28} defaultValue={data?.content ?? ""} />
        <button className="btn primary">Speichern &amp; veröffentlichen</button>
      </form>
    </>
  );
}
