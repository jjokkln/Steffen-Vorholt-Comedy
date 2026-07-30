// Relativ und mit Endung importiert: `npm test` läuft über `node --test` mit Type-Stripping
// und kennt den `@/`-Alias nicht (siehe context/troubleshooting.md).
import { escapeHtml } from "./html.ts";

/**
 * Erlaubte Ziele für `[Text](Ziel)`. Alles andere (insbesondere `javascript:`) bleibt
 * unverlinkter Text — der Inhalt kommt aus dem Dashboard und wird als HTML eingesetzt.
 */
const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/|#)/i;

/** Markierung für zwischengeparkte Links: Zeichen aus der Private-Use-Area, kommt in
 *  echten Texten nicht vor und wird vor dem Rendern ohnehin aus der Eingabe entfernt. */
const MARK = String.fromCharCode(0xe000);
const PARKED = new RegExp(`${MARK}(\\d+)${MARK}`, "g");

function anchor(href: string, label: string): string {
  const external = /^https?:/i.test(href);
  const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : "";
  return `<a href="${href}"${attrs}>${label}</a>`;
}

/**
 * Auszeichnungen innerhalb einer Zeile, angewandt auf bereits escapeten Text.
 *
 * Fertige Links werden zwischengeparkt, damit der Auto-Linker die URL in einem
 * `[Text](URL)` nicht ein zweites Mal verlinkt und ein `*` in einer URL nicht als
 * Kursiv-Auszeichnung gelesen wird.
 */
function inline(escaped: string): string {
  const parked: string[] = [];
  const park = (html: string) => `${MARK}${parked.push(html) - 1}${MARK}`;

  let out = escaped.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (match, label: string, href: string) =>
    SAFE_HREF.test(href) ? park(anchor(href, label)) : match,
  );
  out = out.replace(/https?:\/\/[^\s<]+/g, (url) => park(anchor(url, url)));
  out = out
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  return out.replace(PARKED, (_, index: string) => parked[Number(index)]);
}

const BULLET = /^[-*]\s+/;
const NUMBER = /^\d+[.)]\s+/;

function listItems(lines: string[], marker: RegExp): string {
  return lines.map((line) => `<li>${inline(escapeHtml(line.replace(marker, "")))}</li>`).join("\n");
}

function renderBlock(block: string): string {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) return "";

  // Überschrift: die erste Zeile wird zur Überschrift, der Rest des Blocks folgt darunter.
  const heading = lines[0].match(/^(#{2,3})\s+(.+)$/);
  if (heading) {
    const level = heading[1].length;
    const tag = `<h${level}>${inline(escapeHtml(heading[2]))}</h${level}>`;
    const rest = lines.slice(1);
    return rest.length > 0 ? `${tag}\n${renderBlock(rest.join("\n"))}` : tag;
  }

  if (lines.every((line) => BULLET.test(line))) {
    return `<ul>\n${listItems(lines, BULLET)}\n</ul>`;
  }
  if (lines.every((line) => NUMBER.test(line))) {
    return `<ol>\n${listItems(lines, NUMBER)}\n</ol>`;
  }

  return `<p>${inline(escapeHtml(lines.join("\n"))).replace(/\n/g, "<br />")}</p>`;
}

/**
 * Markdown-Teilmenge für die im Dashboard gepflegten Rechtstexte (Impressum,
 * Datenschutz, AGB):
 *
 * - `## Titel` / `### Titel` — Abschnitte
 * - Leerzeile = neuer Absatz, einfacher Zeilenumbruch = `<br />`
 * - `- Punkt` bzw. `1. Punkt` — Listen
 * - `**fett**`, `*kursiv*`
 * - `[Text](https://…)` sowie nackte URLs werden zu Links
 *
 * HTML in der Eingabe wird immer escapet, nie durchgelassen.
 */
export function renderMarkdown(md: string): string {
  return md
    .replace(/\r\n/g, "\n")
    .split(MARK)
    .join("")
    .split(/\n{2,}/)
    .map(renderBlock)
    .filter(Boolean)
    .join("\n");
}
