import type { ReactNode } from "react";
import { socialPlatform } from "@/lib/social";

/**
 * Plattform-Icons als Inline-SVG.
 *
 * Bewusst keine Icon-Bibliothek und keine Bilddateien: acht Glyphen rechtfertigen
 * kein zusätzliches Paket, und Inline-SVG erbt `currentColor`, skaliert scharf und
 * kostet keinen zusätzlichen Request. `viewBox` ist überall 0 0 24 24.
 *
 * Gefüllte Flächen setzen fill/stroke selbst, alles andere erbt die
 * Kontur-Einstellungen vom <svg>.
 */

const FILLED = { fill: "currentColor", stroke: "none" } as const;

const GLYPHS: Record<string, ReactNode> = {
  // Rundes Rechteck mit ausgestanztem Play-Dreieck (evenodd macht das Loch).
  youtube: (
    <path
      {...FILLED}
      fillRule="evenodd"
      clipRule="evenodd"
      d="M21.6 7.4a2.9 2.9 0 0 0-2-2C17.8 4.9 12 4.9 12 4.9s-5.8 0-7.6.5a2.9 2.9 0 0 0-2 2C2 9.2 2 12 2 12s0 2.8.4 4.6a2.9 2.9 0 0 0 2 2c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.9 2.9 0 0 0 2-2c.4-1.8.4-4.6.4-4.6s0-2.8-.4-4.6ZM10.1 15.4V8.6L16 12l-5.9 3.4Z"
    />
  ),
  instagram: (
    <>
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2" />
      <circle cx="12" cy="12" r="4.1" />
      <circle {...FILLED} cx="17.1" cy="6.9" r="1.25" />
    </>
  ),
  // Note mit Fahne: Stiel rechts, Notenkopf unten links.
  tiktok: (
    <path
      {...FILLED}
      d="M13.1 3h2.9c.25 2 1.4 3.4 3.3 3.8v2.8c-1.1-.05-2.1-.4-3-1v5.7a5.55 5.55 0 1 1-5.55-5.55c.22 0 .43.01.64.04v2.9a2.65 2.65 0 1 0 1.71 2.48V3Z"
    />
  ),
  facebook: (
    <>
      <circle cx="12" cy="12" r="8.9" />
      <path
        {...FILLED}
        d="M13.35 12.4h1.95l.32-2.42h-2.27V8.55c0-.7.2-1.05 1.2-1.05h1.13V5.32c-.2-.03-.87-.09-1.66-.09-1.75 0-2.96 1.03-2.96 2.94v1.81H9.2v2.42h1.86v6.02h2.29V12.4Z"
      />
    </>
  ),
  x: (
    <path
      {...FILLED}
      d="M3 3h4.35l4.62 6.18L17.42 3h3.5l-6.72 7.7L21.6 21h-4.35l-4.9-6.55L6.6 21H3.1l7.02-8.05L3 3Z"
    />
  ),
  linkedin: (
    <>
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="4.2" />
      <circle {...FILLED} cx="7.6" cy="7.9" r="1.3" />
      <path
        {...FILLED}
        d="M6.5 10.6h2.2V18H6.5v-7.4Zm4.1 0h2.1v1.05c.5-.8 1.34-1.24 2.36-1.24 1.85 0 2.84 1.13 2.84 3.25V18h-2.2v-4.1c0-1.1-.42-1.72-1.32-1.72-.94 0-1.58.62-1.58 1.83V18h-2.2v-7.4Z"
      />
    </>
  ),
  spotify: (
    <>
      <circle cx="12" cy="12" r="8.9" />
      <path d="M7.7 9.5c2.7-.75 5.75-.4 8.1.95" />
      <path d="M8.2 12.3c2.15-.6 4.6-.3 6.5.85" />
      <path d="M8.7 15c1.65-.45 3.5-.2 4.9.65" />
    </>
  ),
  website: (
    <>
      <circle cx="12" cy="12" r="8.9" />
      <path d="M3.2 12h17.6" />
      <path d="M12 3.1c2.5 2.4 3.8 5.4 3.8 8.9s-1.3 6.5-3.8 8.9c-2.5-2.4-3.8-5.4-3.8-8.9S9.5 5.5 12 3.1Z" />
    </>
  ),
};

export default function SocialIcon({
  platform,
  size = 22,
  className,
}: {
  platform: string;
  size?: number;
  className?: string;
}) {
  const key = socialPlatform(platform).key;
  return (
    <svg
      className={className ? `social-icon ${className}` : "social-icon"}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {GLYPHS[key] ?? GLYPHS.website}
    </svg>
  );
}
