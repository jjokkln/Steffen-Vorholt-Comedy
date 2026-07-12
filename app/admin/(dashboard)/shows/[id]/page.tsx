import Link from "next/link";
import { notFound } from "next/navigation";
import ShowForm from "@/components/admin/ShowForm";
import EventForm from "@/components/admin/EventForm";
import ShowVideoUpload from "@/components/admin/ShowVideoUpload";
import ShowImageUpload from "@/components/admin/ShowImageUpload";
import { updateShow } from "@/lib/actions/shows";
import { createShowEvent, deleteShowEvent } from "@/lib/actions/events";
import { deleteShowVideo, updateShowVideoOrientation } from "@/lib/actions/show-videos";
import { deleteShowImage } from "@/lib/actions/show-images";
import { addShowComedian, removeShowComedian } from "@/lib/actions/show-comedians";
import { addYoutubeVideo, deleteYoutubeVideo } from "@/lib/actions/youtube";
import { createServerSupabase } from "@/lib/supabase/server";
import { partitionEvents, formatDateLong } from "@/lib/event-helpers";
import { mediaUrl } from "@/lib/media";
import { youtubeThumbUrl } from "@/lib/youtube";
import type { Comedian, EventRow, Show, ShowComedian, ShowImage, ShowVideo, YoutubeVideo } from "@/lib/types";

function ShowEventTable({
  items,
  showId,
  emptyText,
}: {
  items: EventRow[];
  showId: string;
  emptyText: string;
}) {
  if (!items.length) return <p>{emptyText}</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Datum</th><th>Stadt</th><th>Location</th><th>Status</th><th></th><th></th></tr>
        </thead>
        <tbody>
          {items.map((e) => (
            <tr key={e.id}>
              <td>{formatDateLong(e.date)}</td>
              <td>{e.city}</td>
              <td>{e.venue || "—"}</td>
              <td><span className={`status ${e.is_published ? "live" : "draft"}`}>{e.is_published ? "Live" : "Entwurf"}</span></td>
              <td><Link className="btn secondary" href={`/admin/termine/${e.id}`}>Bearbeiten</Link></td>
              <td>
                <form action={deleteShowEvent.bind(null, e.id, showId)}>
                  <button className="btn secondary" style={{ color: "var(--danger)" }}>Löschen</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function EditShowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const [
    { data },
    { data: videoRows },
    { data: imageRows },
    { data: comedianRows },
    { data: participantRows },
    { data: youtubeRows },
    { data: eventRows },
  ] = await Promise.all([
    supabase.from("shows").select("*").eq("id", id).maybeSingle(),
    supabase.from("show_videos").select("*").eq("show_id", id).order("sort_order"),
    supabase.from("show_images").select("*").eq("show_id", id).order("sort_order"),
    supabase.from("comedians").select("*").order("sort_order"),
    supabase.from("show_comedians").select("*, comedians(*)").eq("show_id", id).order("sort_order"),
    supabase.from("youtube_videos").select("*").eq("show_id", id).order("sort_order"),
    supabase.from("events").select("*").eq("show_id", id).order("date"),
  ]);
  if (!data) notFound();
  const show = data as Show;
  const videos = (videoRows ?? []) as ShowVideo[];
  const images = (imageRows ?? []) as ShowImage[];
  const allComedians = (comedianRows ?? []) as Comedian[];
  const participants = (participantRows ?? []) as ShowComedian[];
  const youtubeVideos = (youtubeRows ?? []) as YoutubeVideo[];
  const { upcoming: upcomingEvents, past: pastEvents } = partitionEvents((eventRows ?? []) as EventRow[]);

  return (
    <>
      <h2>{show.name} bearbeiten</h2>
      <ShowForm show={show} action={updateShow.bind(null, show.id)} />

      <h2 style={{ marginTop: 42 }}>Termine dieser Show</h2>
      <p>Termine erscheinen im Kalender und in der Terminliste auf der Website. Hier direkt für „{show.name}“ anlegen.</p>
      <EventForm lockedShowId={show.id} action={createShowEvent.bind(null, show.id)} />

      {upcomingEvents.length === 0 && pastEvents.length === 0 ? (
        <p style={{ marginTop: 16 }}>Noch keine Termine für diese Show.</p>
      ) : (
        <>
          <h3 style={{ marginTop: 24 }}>Kommende ({upcomingEvents.length})</h3>
          <ShowEventTable items={upcomingEvents} showId={show.id} emptyText="Keine kommenden Termine." />
          <h3 style={{ marginTop: 20 }}>Vergangene ({pastEvents.length})</h3>
          <ShowEventTable items={pastEvents} showId={show.id} emptyText="Keine vergangenen Termine." />
        </>
      )}

      <h2 style={{ marginTop: 42 }}>Fotos dieser Show</h2>
      <p>Erscheinen in der Mediengalerie auf der Show-Seite.</p>
      <ShowImageUpload showId={show.id} />

      {images.length > 0 && (
        <div className="grid-3" style={{ marginTop: 24 }}>
          {images.map((img) => (
            <div className="card" key={img.id} style={{ padding: 14 }}>
              <img
                src={mediaUrl(img.image_path)}
                alt={img.alt_text || ""}
                style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 12, marginBottom: 10 }}
              />
              <span className="badge" style={{ marginBottom: 8, display: "inline-block" }}>
                {img.category === "location" ? "Location" : "Show"}
              </span>
              {img.alt_text && <p style={{ margin: "0 0 8px", fontWeight: 850, fontSize: 13 }}>{img.alt_text}</p>}
              <form action={deleteShowImage.bind(null, img.id, show.id)}>
                <button className="btn secondary" style={{ color: "var(--danger)" }}>Löschen</button>
              </form>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ marginTop: 42 }}>Videos dieser Show</h2>
      <p>Werden in der Mediengalerie auf der Show-Seite angezeigt.</p>
      <ShowVideoUpload showId={show.id} />

      {videos.length > 0 && (
        <div className="grid-3" style={{ marginTop: 24 }}>
          {videos.map((v) => {
            const isPortrait = v.orientation === "portrait";
            return (
              <div className="card" key={v.id} style={{ padding: 14 }}>
                <video
                  src={mediaUrl(v.video_path)}
                  poster={v.poster_path ? mediaUrl(v.poster_path) : undefined}
                  controls
                  preload="metadata"
                  style={{
                    borderRadius: 12,
                    marginBottom: 10,
                    width: "100%",
                    aspectRatio: isPortrait ? "9 / 16" : "16 / 9",
                    objectFit: "cover",
                    background: "#000",
                    maxWidth: isPortrait ? 220 : undefined,
                  }}
                />
                {v.title && <p style={{ margin: "0 0 8px", fontWeight: 850 }}>{v.title}</p>}
                <form className="form" action={updateShowVideoOrientation.bind(null, v.id, show.id)}>
                  <label>
                    Format
                    <select name="orientation" defaultValue={v.orientation ?? "landscape"}>
                      <option value="landscape">Querformat (16:9)</option>
                      <option value="portrait">Hochformat (9:16)</option>
                    </select>
                  </label>
                  <button className="btn secondary">Format übernehmen</button>
                </form>
                <form action={deleteShowVideo.bind(null, v.id, show.id)} style={{ marginTop: 8 }}>
                  <button className="btn secondary" style={{ color: "var(--danger)" }}>Löschen</button>
                </form>
              </div>
            );
          })}
        </div>
      )}

      <h2 style={{ marginTop: 42 }}>Teilnehmer dieser Show</h2>
      <p>Comedians, die in dieser Show auftreten – erscheinen mit Social-Links auf der Show-Seite.</p>
      {allComedians.length === 0 ? (
        <p>Lege zuerst unter „Comedians" Personen an, um sie hier zuzuordnen.</p>
      ) : (
        <form className="card form" action={addShowComedian.bind(null, show.id)}>
          <div className="form two">
            <label>
              Comedian
              <select name="comedian_id" required defaultValue="">
                <option value="" disabled>Bitte wählen…</option>
                {allComedians.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label>
              Rolle (optional)
              <input name="role" placeholder="z. B. Special Guest" />
            </label>
          </div>
          <label>
            Sortierung
            <input name="sort_order" type="number" defaultValue={0} />
          </label>
          <button className="btn primary">Teilnehmer hinzufügen</button>
        </form>
      )}

      {participants.length > 0 && (
        <div className="grid-3" style={{ marginTop: 24 }}>
          {participants.map((sc) => (
            <div className="card" key={sc.id} style={{ padding: 14 }}>
              {sc.comedians?.photo_path && (
                <img
                  src={mediaUrl(sc.comedians.photo_path)}
                  alt={sc.comedians?.name || ""}
                  style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 12, marginBottom: 10 }}
                />
              )}
              <p style={{ margin: "0 0 4px", fontWeight: 850 }}>{sc.comedians?.name}</p>
              {sc.role && <p style={{ margin: "0 0 8px", fontSize: 13 }}>{sc.role}</p>}
              <form action={removeShowComedian.bind(null, sc.id, show.id)}>
                <button className="btn secondary" style={{ color: "var(--danger)" }}>Entfernen</button>
              </form>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ marginTop: 42 }}>YouTube-Videos dieser Show</h2>
      <p>Erscheinen als Video-Galerie auf der Show-Seite.</p>
      <form className="card form" action={addYoutubeVideo.bind(null, show.id)}>
        <label>
          YouTube-URL oder Video-ID *
          <input name="url" placeholder="https://www.youtube.com/watch?v=…" required />
        </label>
        <div className="form two">
          <label>
            Titel
            <input name="title" />
          </label>
          <label>
            Sortierung
            <input name="sort_order" type="number" defaultValue={0} />
          </label>
        </div>
        <button className="btn primary">Video hinzufügen</button>
      </form>

      {youtubeVideos.length > 0 && (
        <div className="grid-3" style={{ marginTop: 24 }}>
          {youtubeVideos.map((v) => (
            <div className="card" key={v.id} style={{ padding: 14 }}>
              <img
                src={youtubeThumbUrl(v.youtube_id)}
                alt={v.title || v.youtube_id}
                style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 12, marginBottom: 10 }}
              />
              {v.title && <p style={{ margin: "0 0 8px", fontWeight: 850, fontSize: 13 }}>{v.title}</p>}
              <form action={deleteYoutubeVideo.bind(null, v.id, show.id)}>
                <button className="btn secondary" style={{ color: "var(--danger)" }}>Löschen</button>
              </form>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
