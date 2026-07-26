"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadToStorage } from "@/lib/upload";
import { addShowVideo } from "@/lib/actions/show-videos";
import ImageCropUpload from "@/components/admin/ImageCropUpload";
import Toast from "@/components/admin/Toast";

export default function ShowVideoUpload({ showId }: { showId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(0);
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");
  const [posterPath, setPosterPath] = useState("");

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
    try {
      const videoPath = await uploadToStorage("media", "show-video", videoFile);
      await addShowVideo(showId, { videoPath, posterPath, title, orientation, sortOrder });
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
        <input name="video" type="file" accept="video/mp4,video/*" required disabled={busy} />
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
      <ImageCropUpload
        label="Vorschaubild (optional, sonst erstes Videobild)"
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
      {error && <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p>}
      {done > 0 && <Toast key={done} message="Video gespeichert!" />}
    </form>
  );
}
