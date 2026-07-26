import type { YoutubeVideo } from "@/lib/types";
import YoutubeEmbed from "@/components/consent/YoutubeEmbed";

/**
 * Responsive YouTube-Galerie. Standardmäßig 4 Videos pro Reihe (data-count
 * steuert das Layout analog zur show-media-grid). Nutzt das datenschutzfreundliche
 * youtube-nocookie-Embed mit Lazy-Loading — geladen wird es aber erst nach
 * Einwilligung (siehe YoutubeEmbed).
 */
export default function YoutubeGallery({ videos }: { videos: YoutubeVideo[] }) {
  if (!videos.length) return null;
  return (
    <div className="youtube-grid" data-count={String(Math.min(videos.length, 4))}>
      {videos.map((v) => (
        <figure key={v.id} className="youtube-item">
          <div className="youtube-frame">
            <YoutubeEmbed youtubeId={v.youtube_id} title={v.title ?? ""} />
          </div>
          {v.title && <figcaption>{v.title}</figcaption>}
        </figure>
      ))}
    </div>
  );
}
