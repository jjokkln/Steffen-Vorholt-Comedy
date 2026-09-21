import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { deleteSocialItem, toggleSocialItem } from "@/lib/actions/social";
import { addYoutubeVideo, deleteYoutubeVideo } from "@/lib/actions/youtube";
import { socialEmbedUrl, socialPlatform } from "@/lib/social";
import { youtubeThumbUrl } from "@/lib/youtube";
import type { SocialMediaItem, YoutubeVideo } from "@/lib/types";
import DeleteButton from "@/components/admin/DeleteButton";
import SocialIcon from "@/components/SocialIcon";
import Tabs from "@/components/admin/Tabs";

/**
 * „Social & YouTube" — am 21.09.2026 aus den beiden Bereichen /admin/social und
 * /admin/youtube zusammengelegt. Beide pflegen fremde Videos für dieselbe Seite,
 * standen aber an zwei Stellen. /admin/youtube leitet jetzt hierher um.
 *
 * Die Tabellen bleiben getrennt: `social_media_items` beschreibt Beiträge und
 * Kanäle mit Plattform und Ausrichtung, `youtube_videos` sind die Referenzvideos
 * der Startseite. Zusammengelegt ist die Oberfläche, nicht das Datenmodell.
 */

export default async function AdminSocialPage() {
  const supabase = await createServerSupabase();
  const [{ data: socialData }, { data: videoData }] = await Promise.all([
    supabase.from("social_media_items").select("*").order("sort_order"),
    supabase.from("youtube_videos").select("*").is("show_id", null).order("sort_order"),
  ]);
  const items = (socialData ?? []) as SocialMediaItem[];
  const videos = (videoData ?? []) as YoutubeVideo[];
  const visible = items.filter((i) => i.is_active).length;

  const socialTab = (
    <>
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

  const youtubeTab = (
    <>
      <p>
        Diese Videos erscheinen als 4er-Galerie auf der Startseite und der Comedian-Seite sowie im
        Archiv unten auf der Shows-Seite. Videos einzelner Shows pflegst du direkt auf der jeweiligen
        Show-Bearbeiten-Seite.
      </p>

      <form className="card form" action={addYoutubeVideo.bind(null, null)}>
        <h3>Neues Video</h3>
        <label>
          YouTube-URL oder Video-ID *
          <input name="url" placeholder="https://www.youtube.com/watch?v=…" required />
        </label>
        <div className="form two">
          <label>
            Titel
            <input name="title" placeholder="z. B. Best of 2025" />
          </label>
          <label>
            Sortierung
            <input name="sort_order" type="number" defaultValue={0} />
          </label>
        </div>
        <button className="btn primary">Video hinzufügen</button>
      </form>

      {videos.length > 0 && (
        <div className="grid-3" style={{ marginTop: 24 }}>
          {videos.map((v) => (
            <div className="card" key={v.id} style={{ padding: 14 }}>
              <img
                src={youtubeThumbUrl(v.youtube_id)}
                alt={v.title || v.youtube_id}
                style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 12, marginBottom: 10 }}
              />
              {v.title && <p style={{ margin: "0 0 8px", fontWeight: 850, fontSize: 13 }}>{v.title}</p>}
              <p style={{ margin: "0 0 8px", fontSize: 12, color: "var(--muted)" }}>ID: {v.youtube_id}</p>
              <DeleteButton
                action={deleteYoutubeVideo.bind(null, v.id, null)}
                confirm={`Video „${v.title || v.youtube_id}" wirklich löschen?`}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <>
      <h2>Social &amp; YouTube</h2>
      <Tabs
        ariaLabel="Social Media und YouTube"
        tabs={[
          { id: "social", label: "Social Media", count: items.length, content: socialTab },
          { id: "youtube", label: "YouTube-Referenzen", count: videos.length, content: youtubeTab },
        ]}
      />
    </>
  );
}
