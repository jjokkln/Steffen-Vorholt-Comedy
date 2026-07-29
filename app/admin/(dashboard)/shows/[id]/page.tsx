import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ShowForm from "@/components/admin/ShowForm";
import EventForm from "@/components/admin/EventForm";
import ShowVideoUpload from "@/components/admin/ShowVideoUpload";
import ShowImageUpload from "@/components/admin/ShowImageUpload";
import OfferForm from "@/components/admin/OfferForm";
import { updateShow } from "@/lib/actions/shows";
import {
  assignOfferToShow,
  createShowOffer,
  deleteOffer,
  setOfferActive,
  updateOffer,
} from "@/lib/actions/offers";
import { createShowEvent, deleteShowEvent } from "@/lib/actions/events";
import { deleteShowVideo, updateShowVideoOrientation } from "@/lib/actions/show-videos";
import { deleteShowImage } from "@/lib/actions/show-images";
import { addShowComedian, removeShowComedian } from "@/lib/actions/show-comedians";
import { addYoutubeVideo, deleteYoutubeVideo } from "@/lib/actions/youtube";
import { createServerSupabase } from "@/lib/supabase/server";
import DeleteButton from "@/components/admin/DeleteButton";
import { partitionEvents, formatDateLong } from "@/lib/event-helpers";
import { mediaUrl } from "@/lib/media";
import { youtubeThumbUrl } from "@/lib/youtube";
import type {
  Comedian,
  EventRow,
  Offer,
  Show,
  ShowComedian,
  ShowImage,
  ShowVideo,
  Venue,
  YoutubeVideo,
} from "@/lib/types";

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
                <DeleteButton
                  action={deleteShowEvent.bind(null, e.id, showId)}
                  confirm={`Termin am ${formatDateLong(e.date)} in ${e.city} wirklich löschen?`}
                />
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
    { data: venueRows },
    { data: offerRows },
    { data: showRows },
  ] = await Promise.all([
    supabase.from("shows").select("*").eq("id", id).maybeSingle(),
    supabase.from("show_videos").select("*").eq("show_id", id).order("sort_order"),
    supabase.from("show_images").select("*").eq("show_id", id).order("sort_order"),
    supabase.from("comedians").select("*").order("sort_order"),
    supabase.from("show_comedians").select("*, comedians(*)").eq("show_id", id).order("sort_order"),
    supabase.from("youtube_videos").select("*").eq("show_id", id).order("sort_order"),
    supabase.from("events").select("*").eq("show_id", id).order("date"),
    supabase.from("venues").select("id, city, venue, lat, lng, show_id").order("city"),
    // Alle Angebote, nicht nur die dieser Show: der Zuordnungs-Block braucht auch die
    // unzugeordneten (Altbestand der früheren /angebote-Seite) und die anderer Shows.
    supabase.from("offers").select("*").order("sort_order"),
    supabase.from("shows").select("id, name").order("sort_order"),
  ]);
  if (!data) notFound();
  const show = data as Show;
  const videos = (videoRows ?? []) as ShowVideo[];
  const images = (imageRows ?? []) as ShowImage[];
  const allComedians = (comedianRows ?? []) as Comedian[];
  const participants = (participantRows ?? []) as ShowComedian[];
  const youtubeVideos = (youtubeRows ?? []) as YoutubeVideo[];
  const { upcoming: upcomingEvents, past: pastEvents } = partitionEvents((eventRows ?? []) as EventRow[]);
  const venues = (venueRows ?? []) as Venue[];
  const allOffers = (offerRows ?? []) as Offer[];
  const allShows = (showRows ?? []) as Pick<Show, "id" | "name">[];
  const offers = allOffers.filter((o) => o.show_id === show.id);
  // Zuordenbar: Altbestand ohne Show zuerst, danach die Angebote der anderen Shows.
  const assignableOffers = [
    ...allOffers.filter((o) => !o.show_id),
    ...allOffers.filter((o) => o.show_id && o.show_id !== show.id),
  ];
  const showNames = new Map(allShows.map((s) => [s.id, s.name]));

  return (
    <>
      <h2>{show.name} bearbeiten</h2>
      <ShowForm show={show} action={updateShow.bind(null, show.id)} />

      <details className="admin-collapsible">
        <summary>
          <span className="admin-collapsible-title">Termine dieser Show ({upcomingEvents.length + pastEvents.length})</span>
          <span className="admin-collapsible-chevron">▾</span>
        </summary>
        <div className="admin-collapsible-body">
          <p>Termine erscheinen im Kalender und in der Terminliste auf der Website. Hier direkt für „{show.name}“ anlegen.</p>
          <EventForm lockedShowId={show.id} venues={venues} action={createShowEvent.bind(null, show.id)} />

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
        </div>
      </details>

      <details className="admin-collapsible">
        <summary>
          <span className="admin-collapsible-title">Angebote &amp; Promo-Codes ({offers.length})</span>
          <span className="admin-collapsible-chevron">▾</span>
        </summary>
        <div className="admin-collapsible-body">
          <p>
            Rabatt-Codes zu dieser Show. Sie erscheinen als eigene Sektion auf der Show-Seite und
            werden von den Gästen beim Ticketkauf beim jeweiligen Anbieter eingelöst. „Anzeigen" /
            „Ausblenden" schaltet ein Angebot ohne Löschen aus der Show-Seite heraus.
          </p>

          {offers.length > 0 && (
            <>
              <h3>Angebote dieser Show ({offers.length})</h3>
              {offers.map((o) => (
                <details className="admin-collapsible is-nested" key={o.id}>
                  <summary>
                    <span className="admin-collapsible-title">
                      {o.title}
                      {o.code && ` · ${o.code}`}
                    </span>
                    <span className={`status ${o.is_active ? "live" : "draft"}`}>
                      {o.is_active ? "Wird angezeigt" : "Ausgeblendet"}
                    </span>
                    <span className="admin-collapsible-chevron">▾</span>
                  </summary>
                  <div className="admin-collapsible-body">
                    <div className="actions">
                      {/* Ein-Klick-Schalter neben dem Formular. Das `key` unten hängt an
                          `is_active`, damit das Formular nach dem Schalten neu mountet und
                          seine Checkbox nicht den alten Stand zurückschreibt. */}
                      <form action={setOfferActive.bind(null, o.id, show.id, !o.is_active)}>
                        <button className="btn secondary">
                          {o.is_active ? "Ausblenden" : "Anzeigen"}
                        </button>
                      </form>
                      <DeleteButton
                        action={deleteOffer.bind(null, o.id, show.id)}
                        confirm={`Angebot „${o.title}“ wirklich löschen?`}
                      />
                    </div>
                    <OfferForm
                      key={`${o.id}-${o.is_active}-${o.show_id}`}
                      offer={o}
                      action={updateOffer.bind(null, o.id, show.id)}
                      shows={allShows}
                      currentShowId={show.id}
                    />
                  </div>
                </details>
              ))}
            </>
          )}

          {assignableOffers.length > 0 && (
            <>
              <h3 style={{ marginTop: 28 }}>Bestehende Aktionen zuordnen</h3>
              <p>
                Aktionen, die noch keiner oder einer anderen Show gehören. Zuordnen hängt sie an „
                {show.name}" — die frühere Show verliert sie dabei.
              </p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Aktion</th>
                      <th>Code</th>
                      <th>Gehört zurzeit zu</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignableOffers.map((o) => (
                      <tr key={o.id}>
                        <td>{o.title}</td>
                        <td>{o.code || "—"}</td>
                        <td>
                          {o.show_id ? (
                            showNames.get(o.show_id) ?? "einer anderen Show"
                          ) : (
                            <span className="status draft">keiner Show</span>
                          )}
                        </td>
                        <td>
                          <form action={assignOfferToShow.bind(null, o.id, show.id, show.id)}>
                            <button className="btn secondary">Dieser Show zuordnen</button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <h3 style={{ marginTop: 28 }}>Neues Angebot</h3>
          <OfferForm
            action={createShowOffer.bind(null, show.id)}
            shows={allShows}
            currentShowId={show.id}
          />
        </div>
      </details>

      <details className="admin-collapsible">
        <summary>
          <span className="admin-collapsible-title">Fotos dieser Show ({images.length})</span>
          <span className="admin-collapsible-chevron">▾</span>
        </summary>
        <div className="admin-collapsible-body">
          <p>Erscheinen in der Mediengalerie auf der Show-Seite.</p>
          <ShowImageUpload showId={show.id} />

          {images.length > 0 && (
            <div className="grid-3" style={{ marginTop: 24 }}>
              {images.map((img) => (
                <div className="card" key={img.id} style={{ padding: 14 }}>
                  <Image
                    src={mediaUrl(img.image_path)}
                    alt={img.alt_text || ""}
                    width={640}
                    height={360}
                    sizes="(max-width: 900px) 92vw, 320px"
                    style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 12, marginBottom: 10 }}
                  />
                  <span className="badge" style={{ marginBottom: 8, display: "inline-block" }}>
                    {img.category === "location" ? "Location" : "Show"}
                  </span>
                  {img.alt_text && <p style={{ margin: "0 0 8px", fontWeight: 850, fontSize: 13 }}>{img.alt_text}</p>}
                  <DeleteButton action={deleteShowImage.bind(null, img.id, show.id)} confirm="Foto wirklich löschen?" />
                </div>
              ))}
            </div>
          )}
        </div>
      </details>

      <details className="admin-collapsible">
        <summary>
          <span className="admin-collapsible-title">Videos dieser Show ({videos.length})</span>
          <span className="admin-collapsible-chevron">▾</span>
        </summary>
        <div className="admin-collapsible-body">
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
                      preload={v.poster_path ? "none" : "metadata"}
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
                    <DeleteButton
                      action={deleteShowVideo.bind(null, v.id, show.id)}
                      confirm="Video wirklich löschen?"
                      style={{ marginTop: 8 }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </details>

      <details className="admin-collapsible">
        <summary>
          <span className="admin-collapsible-title">Teilnehmer dieser Show ({participants.length})</span>
          <span className="admin-collapsible-chevron">▾</span>
        </summary>
        <div className="admin-collapsible-body">
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
                    <Image
                      src={mediaUrl(sc.comedians.photo_path)}
                      alt={sc.comedians?.name || ""}
                      width={400}
                      height={400}
                      sizes="(max-width: 900px) 92vw, 320px"
                      style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 12, marginBottom: 10 }}
                    />
                  )}
                  <p style={{ margin: "0 0 4px", fontWeight: 850 }}>{sc.comedians?.name}</p>
                  {sc.role && <p style={{ margin: "0 0 8px", fontSize: 13 }}>{sc.role}</p>}
                  <DeleteButton
                    action={removeShowComedian.bind(null, sc.id, show.id)}
                    confirm={`„${sc.comedians?.name}" aus dieser Show entfernen?`}
                    label="Entfernen"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </details>

      <details className="admin-collapsible">
        <summary>
          <span className="admin-collapsible-title">YouTube-Videos dieser Show ({youtubeVideos.length})</span>
          <span className="admin-collapsible-chevron">▾</span>
        </summary>
        <div className="admin-collapsible-body">
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
                  <DeleteButton
                    action={deleteYoutubeVideo.bind(null, v.id, show.id)}
                    confirm={`Video „${v.title || v.youtube_id}" wirklich löschen?`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </details>
    </>
  );
}
