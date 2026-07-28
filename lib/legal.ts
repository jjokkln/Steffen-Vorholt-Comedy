/**
 * Die im Dashboard pflegbaren Rechtstexte. Eine Liste für alles: öffentliche Seite,
 * Admin-Editor, Sidebar-Navigation und die Slug-Prüfung in der Server-Action.
 *
 * Der Inhalt steht in der Tabelle `legal_pages` (Spalte `content`, Markdown-Teilmenge
 * nach lib/markdown.ts). Eine neue Rechtsseite braucht: Eintrag hier, Zeile in
 * `legal_pages` und eine öffentliche Route `app/<slug>/page.tsx`.
 */
export const LEGAL_PAGES = [
  {
    slug: "impressum",
    /** Beschriftung im Dashboard und im Fußbereich. */
    label: "Impressum",
    heading: "Impressum",
    eyebrow: "⚖️ Rechtliches",
    description: "Impressum und Anbieterkennzeichnung von Steffen Vorholt.",
  },
  {
    slug: "datenschutz",
    label: "Datenschutz",
    heading: "Datenschutzerklärung",
    eyebrow: "🔒 Datenschutz",
    description: "Datenschutzerklärung gemäß DSGVO für die Website von Steffen Vorholt.",
  },
  {
    slug: "agb",
    label: "AGB",
    heading: "Allgemeine Geschäftsbedingungen",
    eyebrow: "📄 AGB",
    description: "Allgemeine Geschäftsbedingungen für Auftritte und Buchungen von Steffen Vorholt.",
  },
] as const;

export type LegalPage = (typeof LEGAL_PAGES)[number];
export type LegalSlug = LegalPage["slug"];

export function findLegalPage(slug: string): LegalPage | undefined {
  return LEGAL_PAGES.find((page) => page.slug === slug);
}

export function isLegalSlug(slug: string): slug is LegalSlug {
  return LEGAL_PAGES.some((page) => page.slug === slug);
}
