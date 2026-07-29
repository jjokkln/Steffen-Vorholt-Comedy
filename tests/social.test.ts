import { test } from "node:test";
import assert from "node:assert/strict";
import { detectPlatform, socialEmbedUrl, socialPlatform } from "../lib/social.ts";

test("detectPlatform erkennt die gängigen Hosts", () => {
  assert.equal(detectPlatform("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "youtube");
  assert.equal(detectPlatform("https://youtu.be/dQw4w9WgXcQ"), "youtube");
  assert.equal(detectPlatform("https://www.instagram.com/reel/CxYz123ab/"), "instagram");
  assert.equal(detectPlatform("https://www.tiktok.com/@steffen/video/7301234567890123456"), "tiktok");
  assert.equal(detectPlatform("https://fb.watch/abc123/"), "facebook");
  assert.equal(detectPlatform("https://x.com/steffen/status/1"), "x");
  assert.equal(detectPlatform("https://open.spotify.com/show/abc"), "spotify");
});

test("detectPlatform fällt bei fremden Hosts auf 'website' zurück", () => {
  assert.equal(detectPlatform("https://steffen-vorholt.de/presse"), "website");
});

test("socialPlatform liefert für unbekannte Schlüssel die Website-Plattform", () => {
  assert.equal(socialPlatform("mastodon").key, "website");
  assert.equal(socialPlatform("youtube").label, "YouTube");
});

test("socialEmbedUrl baut Player-URLs für die einbettbaren Plattformen", () => {
  assert.equal(
    socialEmbedUrl({ platform: "youtube", kind: "video", url: "https://youtu.be/dQw4w9WgXcQ" }),
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
  );
  assert.equal(
    socialEmbedUrl({
      platform: "instagram",
      kind: "video",
      url: "https://www.instagram.com/reel/CxYz123ab/?utm_source=ig_web",
    }),
    "https://www.instagram.com/reel/CxYz123ab/embed/"
  );
  // /reels/ (App-Variante) zeigt auf dieselbe Ressource, /embed kennt nur /reel/.
  assert.equal(
    socialEmbedUrl({
      platform: "instagram",
      kind: "video",
      url: "https://www.instagram.com/reels/CxYz123ab/",
    }),
    "https://www.instagram.com/reel/CxYz123ab/embed/"
  );
  assert.equal(
    socialEmbedUrl({
      platform: "tiktok",
      kind: "video",
      url: "https://www.tiktok.com/@steffen/video/7301234567890123456",
    }),
    "https://www.tiktok.com/embed/v2/7301234567890123456"
  );
  assert.equal(
    socialEmbedUrl({
      platform: "facebook",
      kind: "video",
      url: "https://www.facebook.com/watch/?v=123456",
    }),
    "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fwatch%2F%3Fv%3D123456&show_text=false"
  );
});

test("socialEmbedUrl gibt null zurück, wo es keinen Player geben kann", () => {
  // Kanäle werden grundsätzlich nur verlinkt, nie eingebettet.
  assert.equal(
    socialEmbedUrl({ platform: "youtube", kind: "channel", url: "https://youtube.com/@steffen" }),
    null
  );
  // Plattform ohne Embed-Funktion.
  assert.equal(
    socialEmbedUrl({ platform: "x", kind: "video", url: "https://x.com/steffen/status/1" }),
    null
  );
  // Profil-URL statt Beitrags-URL → kein Player, Fallback ist die Link-Kachel.
  assert.equal(
    socialEmbedUrl({ platform: "instagram", kind: "video", url: "https://instagram.com/steffen" }),
    null
  );
  // vm.tiktok.com-Kurzlinks enthalten die Video-ID nicht.
  assert.equal(
    socialEmbedUrl({ platform: "tiktok", kind: "video", url: "https://vm.tiktok.com/ZGeAbC/" }),
    null
  );
});
