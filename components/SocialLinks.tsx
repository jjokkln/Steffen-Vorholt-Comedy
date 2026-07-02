import type { Comedian } from "@/lib/types";

type SocialSource = Pick<Comedian, "instagram_url" | "tiktok_url" | "youtube_url" | "website_url">;

const PLATFORMS: { key: keyof SocialSource; label: string; icon: string }[] = [
  { key: "instagram_url", label: "Instagram", icon: "Instagram" },
  { key: "tiktok_url", label: "TikTok", icon: "TikTok" },
  { key: "youtube_url", label: "YouTube", icon: "YouTube" },
  { key: "website_url", label: "Website", icon: "Web" },
];

/** Rendert die vorhandenen Social-Media-Links eines Comedians als kleine Chips. */
export default function SocialLinks({ comedian }: { comedian: SocialSource }) {
  const links = PLATFORMS.filter((p) => comedian[p.key]);
  if (!links.length) return null;
  return (
    <div className="social-links">
      {links.map((p) => (
        <a
          key={p.key}
          href={comedian[p.key]}
          target="_blank"
          rel="noopener noreferrer"
          className="social-chip"
        >
          {p.label}
        </a>
      ))}
    </div>
  );
}
