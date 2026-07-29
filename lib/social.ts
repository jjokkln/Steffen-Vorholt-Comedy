// Relativ und mit Endung statt "@/lib/youtube": `npm test` läuft über node --test
// mit Type-Stripping und kennt weder den tsconfig-Alias noch endungslose Pfade.
// Type-only-Imports (unten) verschwinden beim Strippen und behalten den Alias.
import { parseYoutubeId, youtubeEmbedUrl } from "./youtube.ts";
import type { SocialMediaItem, SocialPlatformKey } from "@/lib/types";

/**
 * Plattform-Registry für den Social-Media-Abschnitt (Galerie-Seite) — ein Ort für
 * Label, Markenfarbe, Icon-Schlüssel und die datenschutzrechtlich nötige Angabe,
 * wer beim Einbetten die IP-Adresse bekommt.
 *
 * `dataRecipient` landet 1:1 im Einwilligungs-Platzhalter vor dem Embed. Nur
 * Plattformen mit `embed`-Funktion können überhaupt eingebettet werden; alle
 * anderen werden als Kachel verlinkt (ein Klick, kein Fremd-Request).
 */
export type SocialPlatform = {
  key: SocialPlatformKey;
  label: string;
  /** Markenfarbe für Icon-Akzent und Kachel-Verlauf. */
  color: string;
  /** Verantwortlicher Empfänger der Daten beim Einbetten — für den Consent-Text. */
  dataRecipient: string;
  /** Baut die Embed-URL aus der Beitrags-URL. Fehlt sie oder liefert sie null → Link-Kachel. */
  embed?: (url: string) => string | null;
  /** Standard-Ausrichtung für neue Einträge im Admin (Reels/TikToks sind hochkant). */
  defaultOrientation: "landscape" | "portrait";
  /** Erkennung anhand der Host-Namen (Auto-Vorschlag im Admin-Formular). */
  hosts: string[];
};

/** Instagram-Beiträge: /p/<code>/, /reel/<code>/, /tv/<code>/ → offizielles /embed. */
function instagramEmbed(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:[^/]+\/)?(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
  if (!m) return null;
  // "reels" (Plural) ist die App-Variante derselben Ressource, /embed kennt nur "reel".
  const type = m[1] === "reels" ? "reel" : m[1];
  return `https://www.instagram.com/${type}/${m[2]}/embed/`;
}

/** TikTok: /@handle/video/<19-stellige ID>. vm.tiktok.com-Kurzlinks lassen sich nicht auflösen. */
function tiktokEmbed(url: string): string | null {
  const m = url.match(/tiktok\.com\/(?:@[^/]+\/)?(?:video|v)\/(\d{6,})/);
  if (!m) return null;
  return `https://www.tiktok.com/embed/v2/${m[1]}`;
}

/** Facebook-Video-Plugin: erwartet die vollständige Beitrags-URL als Parameter. */
function facebookEmbed(url: string): string | null {
  if (!/facebook\.com\/|fb\.watch\//.test(url)) return null;
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
    url
  )}&show_text=false`;
}

function youtubeEmbed(url: string): string | null {
  const id = parseYoutubeId(url);
  return id ? youtubeEmbedUrl(id) : null;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    key: "youtube",
    label: "YouTube",
    color: "#FF3D3D",
    dataRecipient: "Google Ireland Ltd. / Google LLC, USA",
    embed: youtubeEmbed,
    defaultOrientation: "landscape",
    hosts: ["youtube.com", "youtu.be", "youtube-nocookie.com"],
  },
  {
    key: "instagram",
    label: "Instagram",
    color: "#FF4FD8",
    dataRecipient: "Meta Platforms Ireland Ltd.",
    embed: instagramEmbed,
    defaultOrientation: "portrait",
    hosts: ["instagram.com"],
  },
  {
    key: "tiktok",
    label: "TikTok",
    color: "#5FF5E8",
    dataRecipient: "TikTok Technology Ltd., Irland",
    embed: tiktokEmbed,
    defaultOrientation: "portrait",
    hosts: ["tiktok.com"],
  },
  {
    key: "facebook",
    label: "Facebook",
    color: "#42D9FF",
    dataRecipient: "Meta Platforms Ireland Ltd.",
    embed: facebookEmbed,
    defaultOrientation: "landscape",
    hosts: ["facebook.com", "fb.watch", "fb.com"],
  },
  {
    key: "x",
    label: "X",
    color: "#f7f7ff",
    dataRecipient: "Twitter International Unlimited Company, Irland",
    defaultOrientation: "landscape",
    hosts: ["x.com", "twitter.com"],
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    color: "#42D9FF",
    dataRecipient: "LinkedIn Ireland Unlimited Company",
    defaultOrientation: "landscape",
    hosts: ["linkedin.com"],
  },
  {
    key: "spotify",
    label: "Spotify",
    color: "#7CFF6B",
    dataRecipient: "Spotify AB, Schweden",
    defaultOrientation: "landscape",
    hosts: ["spotify.com", "spoti.fi"],
  },
  {
    key: "website",
    label: "Website",
    color: "#AEEBFF",
    dataRecipient: "dem jeweiligen Anbieter",
    defaultOrientation: "landscape",
    hosts: [],
  },
];

const FALLBACK_PLATFORM = SOCIAL_PLATFORMS[SOCIAL_PLATFORMS.length - 1];

/** Nie undefined: unbekannte/gelöschte Plattform-Schlüssel landen beim Website-Icon. */
export function socialPlatform(key: string): SocialPlatform {
  return SOCIAL_PLATFORMS.find((p) => p.key === key) ?? FALLBACK_PLATFORM;
}

/** Erkennt die Plattform an der URL — Vorauswahl im Admin-Formular. */
export function detectPlatform(url: string): SocialPlatformKey {
  const lower = url.trim().toLowerCase();
  if (!lower) return "youtube";
  const hit = SOCIAL_PLATFORMS.find((p) => p.hosts.some((h) => lower.includes(h)));
  return hit ? hit.key : "website";
}

/**
 * Embed-URL eines Eintrags oder null (→ Link-Kachel). Kanäle werden nie
 * eingebettet, auch wenn die Plattform es könnte: ein Kanal ist ein Verweis.
 */
export function socialEmbedUrl(item: Pick<SocialMediaItem, "platform" | "kind" | "url">): string | null {
  if (item.kind !== "video") return null;
  const platform = socialPlatform(item.platform);
  if (!platform.embed) return null;
  return platform.embed(item.url.trim());
}
