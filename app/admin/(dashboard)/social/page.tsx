import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { deleteSocialItem, toggleSocialItem } from "@/lib/actions/social";
import { socialEmbedUrl, socialPlatform } from "@/lib/social";
import type { SocialMediaItem } from "@/lib/types";
import DeleteButton from "@/components/admin/DeleteButton";
import SocialIcon from "@/components/SocialIcon";

export default async function AdminSocialPage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("social_media_items").select("*").order("sort_order");
  const items = (data ?? []) as SocialMediaItem[];
  const visible = items.filter((i) => i.is_active).length;

  return (
    <>
      <h2>Social Media</h2>
      <p>
        Diese Einträge bilden den Abschnitt „Social Media“ auf der{" "}
        <Link href="/galerie#social-media" style={{ textDecoration: "underline" }}>
          Galerie-Seite
        </Link>
        . Videos von YouTube, Instagram, TikTok und Facebook werden direkt auf der Seite abgespielt
        (nach Cookie-Zustimmung), alles andere erscheint als anklickbare Kachel. Kanäle stehen als
        Chip-Reihe darüber.
      </p>
      <p style={{ color: visible === 0 ? "var(--danger)" : "var(--muted)" }}>
        {visible === 0
          ? "Momentan ist kein Eintrag sichtbar — der Abschnitt erscheint deshalb gar nicht auf der Website."
          : `${visible} von ${items.length} Einträgen sind öffentlich sichtbar.`}
      </p>

      <div className="actions">
        <Link className="btn primary" href="/admin/social/new">
          + Neuer Eintrag
        </Link>
      </div>

      {items.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Plattform</th>
                <th>Titel</th>
                <th>Art</th>
                <th>Anzeige</th>
                <th>Status</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const platform = socialPlatform(item.platform);
                const embeds = Boolean(socialEmbedUrl(item));
                return (
                  <tr key={item.id}>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          color: platform.color,
                          fontWeight: 900,
                        }}
                      >
                        <SocialIcon platform={item.platform} size={18} />
                        {platform.label}
                      </span>
                    </td>
                    <td>
                      {item.title || <span style={{ color: "var(--muted)" }}>ohne Titel</span>}
                      <br />
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 12, color: "var(--muted)", textDecoration: "underline" }}
                      >
                        Link öffnen
                      </a>
                    </td>
                    <td>{item.kind === "channel" ? "Kanal" : "Video / Beitrag"}</td>
                    <td style={{ fontSize: 13, color: "var(--muted)" }}>
                      {item.kind === "channel"
                        ? "Chip"
                        : embeds
                          ? `Player · ${item.orientation === "portrait" ? "hochkant" : "quer"}`
                          : "verlinkte Kachel"}
                    </td>
                    <td>
                      <span className={`status ${item.is_active ? "live" : "draft"}`}>
                        {item.is_active ? "Sichtbar" : "Ausgeblendet"}
                      </span>
                    </td>
                    <td>
                      <form action={toggleSocialItem.bind(null, item.id, !item.is_active)}>
                        <button className="btn secondary">
                          {item.is_active ? "Ausblenden" : "Einblenden"}
                        </button>
                      </form>
                    </td>
                    <td style={{ display: "flex", gap: 8 }}>
                      <Link className="btn secondary" href={`/admin/social/${item.id}`}>
                        Bearbeiten
                      </Link>
                      <DeleteButton
                        action={deleteSocialItem.bind(null, item.id)}
                        confirm={`Eintrag „${item.title || item.url}“ wirklich löschen?`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
