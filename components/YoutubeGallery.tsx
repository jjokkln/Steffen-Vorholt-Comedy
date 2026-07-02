import type { YoutubeVideo } from "@/lib/types";
import { youtubeEmbedUrl } from "@/lib/youtube";

/**
 * Responsive YouTube-Galerie. Standardmäßig 4 Videos pro Reihe (data-count
 * steuert das Layout analog zur show-media-grid). Nutzt das datenschutzfreundliche
 * youtube-nocookie-Embed mit Lazy-Loading.
 */
export default function YoutubeGallery({ videos }: { videos: YoutubeVideo[] }) {
  if (!videos.length) return null;
  return (
    <div className="youtube-grid" data-count={String(Math.min(videos.length, 4))}>
      {videos.map((v) => (
        <figure key={v.id} className="youtube-item">
          <div className="youtube-frame">
            <iframe
              src={youtubeEmbedUrl(v.youtube_id)}
              title={v.title || "YouTube-Video"}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          {v.title && <figcaption>{v.title}</figcaption>}
        </figure>
      ))}
    </div>
  );
}
