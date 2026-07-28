import { test } from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown } from "../lib/markdown.ts";

test("überschriften, absätze, links, escaping", () => {
  const html = renderMarkdown("## Kontakt\n\nMail: https://example.com/x\n\nZeile1\nZeile2 <script>");
  assert.ok(html.includes("<h2>Kontakt</h2>"));
  assert.ok(html.includes('<a href="https://example.com/x"'));
  assert.ok(html.includes("Zeile1<br />Zeile2"));
  assert.ok(!html.includes("<script>"));
});

test("CRLF-Zeilenumbrüche (Browser-Textarea) werden wie LF behandelt", () => {
  const html = renderMarkdown("## Kontakt\r\n\r\nZeile1\r\nZeile2\r\n\r\n## Zweiter Abschnitt\r\n\r\nText");
  assert.ok(html.includes("<h2>Kontakt</h2>"));
  assert.ok(html.includes("Zeile1<br />Zeile2"));
  assert.ok(html.includes("<h2>Zweiter Abschnitt</h2>"));
  assert.ok(html.includes("<p>Text</p>"));
});

test("dritte Ebene als h3", () => {
  assert.ok(renderMarkdown("### Unterpunkt").includes("<h3>Unterpunkt</h3>"));
});

test("überschrift und folgetext im selben Block", () => {
  const html = renderMarkdown("## Titel\nDirekt darunter");
  assert.ok(html.includes("<h2>Titel</h2>"));
  assert.ok(html.includes("<p>Direkt darunter</p>"));
});

test("aufzählungen mit - und mit Nummern", () => {
  const bullets = renderMarkdown("- Auskunft\n- Löschung");
  assert.ok(bullets.includes("<ul>"));
  assert.ok(bullets.includes("<li>Auskunft</li>"));
  assert.ok(bullets.includes("<li>Löschung</li>"));

  const numbered = renderMarkdown("1. Erstens\n2. Zweitens");
  assert.ok(numbered.includes("<ol>"));
  assert.ok(numbered.includes("<li>Erstens</li>"));
});

test("ein einzelner Bindestrich-Absatz bleibt Absatz", () => {
  const html = renderMarkdown("Kosten 5 - 10 Euro");
  assert.ok(html.includes("<p>Kosten 5 - 10 Euro</p>"));
  assert.ok(!html.includes("<ul>"));
});

test("fett und kursiv", () => {
  const html = renderMarkdown("Das ist **wichtig** und *nebenbei*.");
  assert.ok(html.includes("<strong>wichtig</strong>"));
  assert.ok(html.includes("<em>nebenbei</em>"));
});

test("benannte Links, extern mit target, intern ohne", () => {
  const extern = renderMarkdown("Siehe [Google](https://policies.google.com/privacy).");
  assert.ok(extern.includes('<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google</a>'));

  const intern = renderMarkdown("Siehe [Impressum](/impressum).");
  assert.ok(intern.includes('<a href="/impressum">Impressum</a>'));
  assert.ok(!intern.includes("target="));
});

test("benannter Link wird nicht zusätzlich auto-verlinkt", () => {
  const html = renderMarkdown("[Datenschutz von Google](https://policies.google.com/privacy)");
  assert.equal(html.match(/<a /g)?.length, 1);
  assert.ok(!html.includes(">https://policies.google.com/privacy</a>"));
});

test("javascript-Links werden nicht verlinkt", () => {
  // Bleibt sichtbarer Text — so merkt der Redakteur, dass das Ziel nicht erlaubt ist.
  const html = renderMarkdown("[klick](javascript:alert(1))");
  assert.ok(!html.includes("<a "));
  assert.ok(!html.includes("href"));
});

test("Anführungszeichen im Linktext brechen das Attribut nicht auf", () => {
  const html = renderMarkdown('[a](https://x.de/" onmouseover="alert(1))');
  assert.ok(!html.includes('onmouseover="alert'));
});

test("mailto- und tel-Links", () => {
  assert.ok(renderMarkdown("[Mail](mailto:a@b.de)").includes('href="mailto:a@b.de"'));
  assert.ok(renderMarkdown("[Anruf](tel:+4912345)").includes('href="tel:+4912345"'));
});
