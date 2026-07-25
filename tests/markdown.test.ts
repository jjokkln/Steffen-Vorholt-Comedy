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
