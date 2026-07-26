"use client";

import { useState } from "react";
import { useCookieConsent } from "@/components/consent/CookieConsentProvider";
import { youtubeEmbedUrl } from "@/lib/youtube";

/**
 * YouTube-Embed mit Einwilligungs-Gate („Zwei-Klick-Lösung").
 *
 * Ohne Einwilligung wird kein Request an Google ausgelöst — auch kein Thumbnail
 * von i.ytimg.com, denn das würde die IP-Adresse ebenso übertragen. Stattdessen
 * steht dort ein Platzhalter im Seiten-Design mit zwei Optionen:
 * nur dieses Video laden, oder YouTube dauerhaft erlauben.
 */
export default function YoutubeEmbed({
  youtubeId,
  title,
}: {
  youtubeId: string;
  title: string;
}) {
  const { categories, save, hydrated } = useCookieConsent();
  const [loadOnce, setLoadOnce] = useState(false);

  const allowed = categories?.externalMedia === true || loadOnce;

  // Vor der Hydration ist der Consent unbekannt → nichts von Google laden.
  if (!hydrated || !allowed) {
    return (
      <div className="yt-placeholder">
        <div className="yt-placeholder-inner">
          <span className="yt-placeholder-icon" aria-hidden="true">
            ▶
          </span>
          <p className="yt-placeholder-text">
            {title ? `„${title}“` : "Dieses Video"} liegt bei YouTube. Beim Laden werden deine
            IP-Adresse und Geräteinformationen an Google übertragen.
          </p>
          <div className="yt-placeholder-actions">
            <button type="button" className="yt-placeholder-btn" onClick={() => setLoadOnce(true)}>
              Video laden
            </button>
            <button
              type="button"
              className="yt-placeholder-btn"
              onClick={() => save({ externalMedia: true })}
            >
              YouTube immer erlauben
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <iframe
      src={youtubeEmbedUrl(youtubeId)}
      title={title || "YouTube-Video"}
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  );
}
