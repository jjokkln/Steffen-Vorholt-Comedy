"use client";

import { useState } from "react";
import { useCookieConsent } from "@/components/consent/CookieConsentProvider";

/**
 * Einwilligungs-Gate für Social-Media-Embeds (Instagram, TikTok, Facebook, YouTube)
 * — dieselbe „Zwei-Klick-Lösung" wie YoutubeEmbed, nur anbieterunabhängig.
 *
 * Vor der Einwilligung geht kein einziger Request an die Plattform, auch kein
 * Vorschaubild: das würde die IP-Adresse genauso übertragen. Der Platzhalter nennt
 * den konkreten Empfänger (aus SOCIAL_PLATFORMS.dataRecipient), damit die
 * Einwilligung informiert ist (Art. 4 Nr. 11 DSGVO).
 *
 * Die Klassen `.yt-placeholder*` sind bewusst geteilt: identischer Platzhalter,
 * nur ein anderer Anbieter — kein zweites Stylesheet-Set für dieselbe Optik.
 */
export default function SocialEmbed({
  embedUrl,
  platformLabel,
  dataRecipient,
  title,
  fallbackUrl,
}: {
  embedUrl: string;
  platformLabel: string;
  dataRecipient: string;
  title: string;
  /** Direktlink zur Plattform — die Alternative für alle, die nicht einwilligen wollen. */
  fallbackUrl: string;
}) {
  const { categories, save, hydrated } = useCookieConsent();
  const [loadOnce, setLoadOnce] = useState(false);

  const allowed = categories?.externalMedia === true || loadOnce;

  if (!hydrated || !allowed) {
    return (
      <div className="yt-placeholder">
        <div className="yt-placeholder-inner">
          <span className="yt-placeholder-icon" aria-hidden="true">
            ▶
          </span>
          <p className="yt-placeholder-text">
            {title ? `„${title}“` : "Dieser Beitrag"} liegt bei {platformLabel}. Beim Laden werden
            deine IP-Adresse und Geräteinformationen an {dataRecipient} übertragen.
          </p>
          <div className="yt-placeholder-actions">
            <button type="button" className="yt-placeholder-btn" onClick={() => setLoadOnce(true)}>
              Beitrag laden
            </button>
            <button
              type="button"
              className="yt-placeholder-btn"
              onClick={() => save({ externalMedia: true })}
            >
              Externe Medien immer erlauben
            </button>
          </div>
          <a
            className="yt-placeholder-link"
            href={fallbackUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Stattdessen bei {platformLabel} öffnen →
          </a>
        </div>
      </div>
    );
  }

  return (
    <iframe
      src={embedUrl}
      title={title || `${platformLabel}-Beitrag`}
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
      scrolling="no"
    />
  );
}
