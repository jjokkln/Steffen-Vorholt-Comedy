import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { saveLegalPage } from "@/lib/actions/content";
import { findLegalPage } from "@/lib/legal";

export default async function AdminLegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Nur die bekannten Rechtsseiten sind erreichbar (siehe lib/legal.ts).
  const page = findLegalPage(slug);
  if (!page) notFound();

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("legal_pages")
    .select("content, updated_at")
    .eq("slug", slug)
    .maybeSingle();

  return (
    <>
      <h2>{page.heading} bearbeiten</h2>
      <p>
        Formatierung: <code>## Überschrift</code> für Abschnitte, <code>### Überschrift</code> für
        Unterpunkte, Leerzeile = neuer Absatz. <code>- Punkt</code> am Zeilenanfang ergibt eine
        Aufzählung, <code>**Text**</code> wird fett, <code>*Text*</code> kursiv.{" "}
        <code>[Text](https://…)</code> wird ein Link, nackte Adressen werden automatisch verlinkt.
      </p>
      {data?.updated_at && (
        <p style={{ fontSize: 13 }}>
          Zuletzt gespeichert:{" "}
          {new Date(data.updated_at).toLocaleString("de-DE", { dateStyle: "long", timeStyle: "short" })}
          {" · "}
          <Link href={`/${slug}`} target="_blank">
            Seite ansehen ↗
          </Link>
        </p>
      )}
      <form className="card form" action={saveLegalPage.bind(null, slug)}>
        <textarea name="content" rows={28} defaultValue={data?.content ?? ""} />
        <button className="btn primary">Speichern &amp; veröffentlichen</button>
      </form>
    </>
  );
}
