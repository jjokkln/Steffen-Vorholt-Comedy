import { notFound } from "next/navigation";
import ShowForm from "@/components/admin/ShowForm";
import ShowVideoUpload from "@/components/admin/ShowVideoUpload";
import ShowImageUpload from "@/components/admin/ShowImageUpload";
import { updateShow } from "@/lib/actions/shows";
import { deleteShowVideo, updateShowVideoOrientation } from "@/lib/actions/show-videos";
import { deleteShowImage } from "@/lib/actions/show-images";
import { createServerSupabase } from "@/lib/supabase/server";
import { mediaUrl } from "@/lib/media";
import type { Show, ShowImage, ShowVideo } from "@/lib/types";

export default async function EditShowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const [{ data }, { data: videoRows }, { data: imageRows }] = await Promise.all([
    supabase.from("shows").select("*").eq("id", id).maybeSingle(),
    supabase.from("show_videos").select("*").eq("show_id", id).order("sort_order"),
    supabase.from("show_images").select("*").eq("show_id", id).order("sort_order"),
  ]);
  if (!data) notFound();
  const show = data as Show;
  const videos = (videoRows ?? []) as ShowVideo[];
  const images = (imageRows ?? []) as ShowImage[];

  return (
    <>
      <h2>{show.name} bearbeiten</h2>
      <ShowForm show={show} action={updateShow.bind(null, show.id)} />

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
    </>
  );
}
