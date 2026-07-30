/**
 * HTML-Escaping für die beiden Stellen, an denen im Projekt HTML aus Text zusammengebaut wird:
 * die Rechtstexte aus dem Dashboard (`lib/markdown.ts`) und die Bestätigungsmails
 * (`lib/email-templates.ts`). Beide hatten vorher eine eigene, zeichengleiche Kopie.
 *
 * Bewusst hier und nicht in einer der beiden Dateien: Wer eine Kopie ändert (etwa um `'`
 * mitzunehmen), soll nicht die andere übersehen — bei Escaping ist eine stille Abweichung
 * genau die Art Fehler, die niemand bemerkt, bis sie ausgenutzt wird.
 *
 * `'` wird absichtlich nicht ersetzt: Ausgegeben wird ausschließlich in Elementinhalte und in
 * `href`-Attribute, und die stehen in beiden Aufrufern in doppelten Anführungszeichen.
 */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
