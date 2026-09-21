import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_UPLOAD_BYTES,
  explainUploadError,
  isTooLarge,
  plainContentType,
  tooLargeMessage,
} from "../lib/upload-limits.ts";

/**
 * Warum es diese Tests gibt: Ein Upload über 50 MB scheiterte bis zum 21.09.2026 mit
 * dem Rohtext von Supabase, in dem das Wort „groß" nicht vorkam — im Admin stand nur
 * „Fehler beim Upload des Videos". Dass die Übersetzung greift, sieht man nirgends
 * automatisch; sie hat keinen Build-Fehler und keinen roten Test, wenn sie fehlt.
 */

test("die Grenze im Browser entspricht der der Buckets (Migration 0022)", () => {
  assert.equal(MAX_UPLOAD_BYTES, 52_428_800);
});

test("isTooLarge greift erst ÜBER der Grenze, nicht auf ihr", () => {
  assert.equal(isTooLarge({ size: MAX_UPLOAD_BYTES }), false);
  assert.equal(isTooLarge({ size: MAX_UPLOAD_BYTES + 1 }), true);
});

test("die Meldung nennt beide Größen — die echte und die erlaubte", () => {
  const message = tooLargeMessage(120 * 1024 * 1024);
  assert.match(message, /120\.0 MB/);
  assert.match(message, /50\.0 MB/);
  assert.match(message, /groß/);
});

test("413, der Supabase-Text und ein Abbruch ohne Antwort meinen alle dasselbe", () => {
  const big = { size: 120 * 1024 * 1024, type: "video/mp4" };
  const expected = tooLargeMessage(big.size);

  assert.equal(explainUploadError({ statusCode: "413", message: "Payload too large" }, big), expected);
  assert.equal(
    explainUploadError({ message: "The object exceeded the maximum allowed size" }, big),
    expected,
  );
  // Kappt das Gateway die Verbindung, kommt gar keine Storage-Antwort zurück.
  assert.equal(explainUploadError(new TypeError("Failed to fetch"), big), expected);
});

test("ein unerlaubter Typ wird als Typproblem benannt, nicht als Größenproblem", () => {
  const message = explainUploadError(
    { message: "mime type text/plain is not supported" },
    { size: 1024, type: "text/plain" },
  );
  assert.match(message, /Dateiformat/);
  assert.match(message, /text\/plain/);
});

test("alles andere behält den Originaltext, statt ihn zu verschlucken", () => {
  assert.equal(
    explainUploadError({ message: "Bucket not found" }, { size: 1024, type: "image/png" }),
    "Upload fehlgeschlagen: Bucket not found",
  );
});

test("der Codec-Zusatz von MediaRecorder fliegt aus dem Content-Type", () => {
  // Die `allowed_mime_types` der Buckets listen die nackten Typen — mit Zusatz
  // weist der Storage die Datei als unerlaubten Typ ab.
  assert.equal(plainContentType('video/mp4;codecs="avc1.4d002a,mp4a.40.2"'), "video/mp4");
  assert.equal(plainContentType('video/webm;codecs="vp9,opus"'), "video/webm");
  assert.equal(plainContentType("video/mp4"), "video/mp4");
  assert.equal(plainContentType(""), undefined);
});
