import { test } from "node:test";
import assert from "node:assert/strict";
import { mediaUrl } from "../lib/media.ts";

test("mediaUrl: lokale Pfade unverändert", () => {
  assert.equal(mediaUrl("/assets/media/x.webp"), "/assets/media/x.webp");
});

test("mediaUrl: Storage-Pfade werden zur Public-URL", () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co";
  assert.equal(mediaUrl("planets/p.webp"), "https://abc.supabase.co/storage/v1/object/public/planets/p.webp");
});

test("mediaUrl: leer bleibt leer", () => {
  assert.equal(mediaUrl(""), "");
});
