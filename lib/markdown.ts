function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function linkify(s: string): string {
  return s.replace(/https?:\/\/[^\s<]+/g, (url) => `<a href="${url}" target="_blank" rel="noopener">${url}</a>`);
}

/** Minimal-Markdown: ## Überschrift, Leerzeile = neuer Absatz, einfacher Zeilenumbruch = <br />, URLs werden Links. */
export function renderMarkdown(md: string): string {
  return md
    .split(/\n{2,}/)
    .map((block) => {
      const t = block.trim();
      if (!t) return "";
      if (t.startsWith("## ")) return `<h2>${linkify(escapeHtml(t.slice(3)))}</h2>`;
      return `<p>${linkify(escapeHtml(t)).replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");
}
