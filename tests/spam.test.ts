import { test } from "node:test";
import assert from "node:assert/strict";
import { siehtNachSpamAus } from "../lib/spam.ts";

test("echte Anfragen gehen durch, auch mit Titel oder Domain im Firmennamen", () => {
  assert.equal(siehtNachSpamAus("Anna Meier", ["Comedy Eiskalt", "Neuss"]), false);
  assert.equal(siehtNachSpamAus("Dr. Frau Muster", ["kneipe.de GmbH", "Firmenfeier"]), false);
});

test("der Spam vom 23.–26.10.2026 wird erkannt", () => {
  assert.ok(siehtNachSpamAus("https://search.app/8GARRZZqoExympKw5", []));
  assert.ok(siehtNachSpamAus("share.google/31lQ2qNMBNhWVFazT", []));
  assert.ok(siehtNachSpamAus("kaufen.shop", []));
  assert.ok(siehtNachSpamAus("Anna", ["www.kaufen.shop"]));
  assert.ok(siehtNachSpamAus("Anna", ["https://x.y/z"]));
});
