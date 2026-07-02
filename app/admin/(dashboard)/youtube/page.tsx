import { createServerSupabase } from "@/lib/supabase/server";
import { addYoutubeVideo, deleteYoutubeVideo } from "@/lib/actions/youtube";
import { youtubeThumbUrl } from "@/lib/youtube";
import type { YoutubeVideo } from "@/lib/types";

export default async function AdminYoutubePage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("youtube_videos")
    .select("*")
    .is("show_id", null)
    .order("sort_order");
  const videos = (data ?? []) as YoutubeVideo[];

  return (
    <>
      <h2>YouTube-Referenzen</h2>
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
              <form action={deleteYoutubeVideo.bind(null, v.id, null)}>
                <button className="btn secondary" style={{ color: "var(--danger)" }}>Löschen</button>
              </form>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
