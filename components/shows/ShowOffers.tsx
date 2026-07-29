"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { mediaUrl } from "@/lib/media";
import type { Offer } from "@/lib/types";

/** Kacheln sind maximal knapp 560 px breit (zwei Spalten im Container). */
const TILE_SIZES = "(max-width: 900px) 92vw, 560px";

/**
 * Angebots-Sektion einer Show: Promo-Codes, die auf der Ticket-Verkaufsseite des
 * Anbieters eingelöst werden.
 *
 * Das Bild liegt hinter dem Inhalt. Damit der im Admin gewählte Zuschnitt nicht
 * nachträglich noch beschnitten wird, übernimmt die Kachel das Seitenverhältnis des
 * Bildes (gelernt beim Laden, wie in {@link ../media/StorageImage}) — bei Hochformaten
 * begrenzt `.offer-card` die Höhe über CSS.
 */
export default function ShowOffers({ offers, color }: { offers: Offer[]; color: string }) {
  if (offers.length === 0) return null;
  return (
    <div className="offer-grid">
      {offers.map((o) => (
        <OfferCard key={o.id} offer={o} color={color} />
      ))}
    </div>
  );
}

function OfferCard({ offer, color }: { offer: Offer; color: string }) {
  const [ratio, setRatio] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const hasImage = !!offer.image_path;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(offer.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Ohne Clipboard-Recht (z. B. http oder alter Browser) bleibt der Code lesbar daneben stehen.
      setCopied(false);
    }
  }

  return (
    <article
      className={`card offer-card${hasImage ? " has-image" : ""}`}
      // Hochformate bekommen über CSS eine schmalere Kachel, damit sie nicht
      // bildschirmhoch werden — beschnitten wird trotzdem nichts.
      data-orientation={hasImage && ratio !== null && ratio < 1 ? "portrait" : "landscape"}
      style={{ "--accent": color, aspectRatio: hasImage ? (ratio ?? 16 / 9) : undefined } as CSSProperties}
    >
      {hasImage && (
        <div className="offer-bg" aria-hidden="true">
          <Image
            src={mediaUrl(offer.image_path)}
            alt=""
            fill
            sizes={TILE_SIZES}
            style={{ objectFit: "cover" }}
            onLoad={(event) => {
              const img = event.currentTarget;
              if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                setRatio(img.naturalWidth / img.naturalHeight);
              }
            }}
          />
        </div>
      )}
      <div className="offer-body">
        <span className="offer-badge">🎟️ Angebot</span>
        <h3>{offer.title}</h3>
        {offer.subtitle && <p className="offer-subtitle">{offer.subtitle}</p>}
        {offer.description && <p className="offer-text">{offer.description}</p>}
        {offer.code && (
          <div className="offer-code">
            <span className="offer-code-label">Code</span>
            <button type="button" className="offer-code-value" onClick={copyCode} title="Code kopieren">
              <span>{offer.code}</span>
              <span className="offer-code-copy" aria-hidden="true">
                {copied ? "✓" : "⧉"}
              </span>
            </button>
            <span className="offer-code-hint" role="status">
              {copied ? "Kopiert!" : "beim Ticketkauf eingeben"}
            </span>
          </div>
        )}
        {offer.validity && <p className="offer-validity">Gültig: {offer.validity}</p>}
        {offer.url && (
          <a className="btn primary" href={offer.url} target="_blank" rel="noopener noreferrer">
            Tickets mit Code holen
          </a>
        )}
      </div>
    </article>
  );
}
