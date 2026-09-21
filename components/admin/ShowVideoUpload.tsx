"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isTooLarge, tooLargeMessage, uploadToStorage } from "@/lib/upload";
import { captureVideoPoster } from "@/lib/video-poster";
import { addShowVideo } from "@/lib/actions/show-videos";
import ImageCropUpload from "@/components/admin/ImageCropUpload";
import Toast from "@/components/admin/Toast";

export default function ShowVideoUpload({ showId }: { showId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(0);
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");
  const [posterPath, setPosterPath] = useState("");

  /**
   * Sofort bei der Auswahl melden, nicht erst nach dem Upload-Versuch: Eine zu große
   * Datei läuft sonst erst minutenlang durchs Netz und scheitert dann.
   */
  function onFilePicked(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError(file && isTooLarge(file) ? tooLargeMessage(file.size) : "");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const videoInput = form.elements.namedItem("video") as HTMLInputElement;
    const title = (form.elements.namedItem("title") as HTMLInputElement).value;
    const sortOrder = Number((form.elements.namedItem("sort_order") as HTMLInputElement).value || 0);

    const videoFile = videoInput.files?.[0];
    if (!videoFile) return;

    setBusy(true);
    setError("");
    setNote("");
    try {
      // Standbild VOR dem Video besorgen: Ohne Vorschaubild bleibt die Kachel auf der
      // Show-Seite eine unsichtbare schwarze Fläche (Begründung in lib/video-poster.ts).
      // Bis zum 21.09.2026 war das Feld einfach optional — genau so ist „Brain Loading
      // Trailer" ohne Vorschaubild in der Datenbank gelandet.
      let poster = posterPath;
      let posterFromVideo = false;
      if (!poster) {
        const frame = await captureVideoPoster(videoFile);
        if (frame) {
          poster = await uploadToStorage("media", "show-poster", frame);
          posterFromVideo = true;
        }
      }

      const videoPath = await uploadToStorage("media", "show-video", videoFile);
      await addShowVideo(showId, { videoPath, posterPath: poster, title, orientation, sortOrder });
      setNote(
        poster
          ? posterFromVideo
            ? "Vorschaubild automatisch aus dem Video erzeugt — du kannst es jederzeit durch ein eigenes ersetzen."
            : ""
          : "Achtung: Es konnte kein Vorschaubild erzeugt werden. Lade eins hoch, sonst bleibt die Kachel auf der Show-Seite leer.",
      );
      setDone(Date.now());
      setPosterPath("");
      setOrientation("landscape");
      form.reset();
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card form" onSubmit={onSubmit}>
      <h3>Neues Video</h3>
      <label>
        Video * (MP4){" "}
        <input
          name="video"
          type="file"
          accept="video/mp4,video/*"
          required
          disabled={busy}
          onChange={onFilePicked}
        />
      </label>
      <label>
        Format{" "}
        <select
          name="orientation"
          value={orientation}
          onChange={(e) => setOrientation(e.target.value === "portrait" ? "portrait" : "landscape")}
          disabled={busy}
        >
          <option value="landscape">Querformat (16:9)</option>
          <option value="portrait">Hochformat (9:16)</option>
        </select>
      </label>
      {/* Das Feld bleibt optional, aber nicht mehr folgenlos: Bleibt es leer, greift
          `captureVideoPoster()` beim Absenden ein Bild aus dem Video. Grund ist der
          alte Zusatz „sonst erstes Videobild", der seit `preload="none"` (30.07.2026)
          nicht mehr stimmte — der Browser zeigt von allein kein erstes Videobild, die
          Kachel blieb schwarz. Jetzt liefern wir das Bild selbst. */}
      <ImageCropUpload
        label="Vorschaubild"
        hint={
          "Wird auf der Show-Seite gezeigt, bis jemand auf Play drückt. Lässt du es leer, " +
          "wird automatisch ein Bild aus der ersten Sekunde des Videos genommen — das " +
          "Video selbst wird zum Datensparen erst beim Klick geladen."
        }
        name="poster_path"
        aspect={orientation === "portrait" ? 9 / 16 : 16 / 9}
        frameLabel={
          orientation === "portrait"
            ? "Hochformat 9:16 — passend zum Videoformat"
            : "Querformat 16:9 — passend zum Videoformat"
        }
        uploadPrefix="show-poster"
        disabled={busy}
        onUploaded={setPosterPath}
        resetSignal={done}
      />
      <div className="form two">
        <label>
          Titel <input name="title" placeholder="z. B. Trailer 2025" disabled={busy} />
        </label>
        <label>
          Sortierung <input name="sort_order" type="number" defaultValue={0} disabled={busy} />
        </label>
      </div>
      <button className="btn primary" disabled={busy}>
        {busy ? "Lädt hoch…" : "Video hochladen"}
      </button>
      {note && <p className="media-slot-note">{note}</p>}
      {error && <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p>}
      {done > 0 && <Toast key={done} message="Video gespeichert!" />}
    </form>
  );
}
