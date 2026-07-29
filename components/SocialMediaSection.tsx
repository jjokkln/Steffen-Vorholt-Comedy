import Image from "next/image";
import type { CSSProperties } from "react";
import type { SocialMediaItem } from "@/lib/types";
import { socialEmbedUrl, socialPlatform } from "@/lib/social";
import { mediaUrl } from "@/lib/media";
import SocialIcon from "@/components/SocialIcon";
import SocialEmbed from "@/components/consent/SocialEmbed";

/**
 * Abschnitt „Social Media" der Galerie-Seite.
 *
 * Zwei Sorten Eintrag, gepflegt unter /admin/social:
 * - `channel` → Chip mit Plattform-Icon, verlinkt den Kanal.
 * - `video`   → Kachel. Lässt sich der Beitrag einbetten (YouTube, Instagram,
 *   TikTok, Facebook), steckt hinter dem Einwilligungs-Gate ein echter Player;
 *   sonst eine anklickbare Kachel mit Vorschaubild bzw. Plattform-Verlauf.
 *
 * Ohne aktive Einträge rendert die Komponente `null` — die Galerie-Seite blendet
 * den Abschnitt dann komplett aus (kein leerer Rahmen, keine Überschrift).
 */
export default function SocialMediaSection({ items }: { items: SocialMediaItem[] }) {
  const active = items.filter((i) => i.url.trim());
  if (!active.length) return null;

  const channels = active.filter((i) => i.kind === "channel");
  const videos = active.filter((i) => i.kind === "video");

  return (
    <section className="container section" id="social-media">
      <div className="section-head">
        <div>
          <div className="eyebrow">Kanäle &amp; Clips</div>
          <h2>Social Media.</h2>
        </div>
        <p>Alles, was Steffen zwischen zwei Auftritten ins Netz stellt – an einem Ort.</p>
      </div>

      {channels.length > 0 && (
        <div className="social-channels">
          {channels.map((item) => {
            const platform = socialPlatform(item.platform);
            return (
              <a
                key={item.id}
                className="social-channel"
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ "--brand": platform.color } as CSSProperties}
              >
                <span className="social-channel-icon">
                  <SocialIcon platform={item.platform} size={24} />
                </span>
                <span className="social-channel-text">
                  <strong>{item.title || platform.label}</strong>
                  <span>{item.description || platform.label}</span>
                </span>
                <span className="social-channel-arrow" aria-hidden="true">
                  →
                </span>
              </a>
            );
          })}
        </div>
      )}

      {videos.length > 0 && (
        <div className="social-video-grid">
          {videos.map((item) => {
            const platform = socialPlatform(item.platform);
            const embedUrl = socialEmbedUrl(item);
            return (
              <figure
                key={item.id}
                className="social-item"
                style={{ "--brand": platform.color } as CSSProperties}
              >
                <div className="social-frame" data-orientation={item.orientation}>
                  {embedUrl ? (
                    <SocialEmbed
                      embedUrl={embedUrl}
                      platformLabel={platform.label}
                      dataRecipient={platform.dataRecipient}
                      title={item.title}
                      fallbackUrl={item.url}
                    />
                  ) : (
                    <a
                      className="social-tile"
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.thumbnail_path ? (
                        <Image
                          src={mediaUrl(item.thumbnail_path)}
                          alt={item.title || `${platform.label}-Beitrag`}
                          fill
                          sizes="(max-width: 700px) 90vw, 340px"
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <span className="social-tile-glow" aria-hidden="true" />
                      )}
                      <span className="social-tile-badge">
                        <SocialIcon platform={item.platform} size={18} />
                        Auf {platform.label} ansehen
                      </span>
                    </a>
                  )}
                </div>
                <figcaption>
                  <span className="social-item-platform">
                    <SocialIcon platform={item.platform} size={15} />
                    {platform.label}
                  </span>
                  {item.title && <strong>{item.title}</strong>}
                  {item.description && <p>{item.description}</p>}
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}
    </section>
  );
}
