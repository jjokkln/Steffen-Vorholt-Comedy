import Footer from "@/components/Footer";
import { getLegalContent } from "@/lib/data";
import { renderMarkdown } from "@/lib/markdown";
import { findLegalPage, type LegalSlug } from "@/lib/legal";

/**
 * Darstellung einer im Dashboard gepflegten Rechtsseite. Impressum, Datenschutz und AGB
 * teilen sich Aufbau und Typografie — der Inhalt kommt aus `legal_pages`.
 */
export default async function LegalPageView({ slug }: { slug: LegalSlug }) {
  const page = findLegalPage(slug)!;
  const content = await getLegalContent(slug);

  return (
    <>
      <section className="container section legal">
        <div className="eyebrow">{page.eyebrow}</div>
        <h1>{page.heading}</h1>
        {content.trim() ? (
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
        ) : (
          <p className="notice">
            Für diese Seite ist noch kein Text hinterlegt. Er wird im Dashboard unter
            „Rechtliches" gepflegt.
          </p>
        )}
      </section>
      <Footer />
    </>
  );
}
