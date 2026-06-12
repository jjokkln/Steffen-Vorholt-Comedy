import type { Metadata } from "next";
import Footer from "@/components/Footer";
import { getLegalContent } from "@/lib/data";
import { renderMarkdown } from "@/lib/markdown";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Impressum – Steffen Vorholt",
  description: "Impressum und Anbieterkennzeichnung von Steffen Vorholt.",
  robots: { index: false },
};

export default async function ImpressumPage() {
  const content = await getLegalContent("impressum");
  return (
    <>
      <section className="container section legal">
        <div className="eyebrow">⚖️ Rechtliches</div>
        <h1>Impressum</h1>
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
      </section>
      <Footer />
    </>
  );
}
