"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setShowVideoPoster } from "@/lib/actions/show-videos";
import { uploadToStorage } from "@/lib/upload";
import { captureRemoteVideoPoster } from "@/lib/video-poster";
import { mediaUrl } from "@/lib/media";

/**
 * Nachtrag-Knopf für Videos aus dem Altbestand, die ohne Vorschaubild gespeichert
 * wurden. Ohne Vorschaubild bleibt die Kachel auf der Show-Seite leer — warum,
 * steht in lib/video-poster.ts.
 *
 * Lädt das Video einmal in den Admin-Tab, greift ein Bild aus der ersten Sekunde und
 * hängt es an den Datensatz. Einmal pro Video, von Hand ausgelöst: Der Download kostet
 * Egress, und das soll eine bewusste Entscheidung bleiben, kein Nebeneffekt des
 * Seitenaufrufs.
 */
export default function ShowVideoPosterFix({
  videoId,
  showId,
  videoPath,
}: {
  videoId: string;
  showId: string;
  videoPath: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onClick() {
    setBusy(true);
    setError("");
    try {
      const frame = await captureRemoteVideoPoster(mediaUrl(videoPath), videoPath);
      if (!frame) throw new Error("Aus diesem Video ließ sich kein Bild greifen — bitte eins hochladen.");
      const posterPath = await uploadToStorage("media", "show-poster", frame);
      await setShowVideoPoster(videoId, showId, posterPath);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <p className="media-slot-note" style={{ color: "var(--yellow)" }}>
        Kein Vorschaubild — auf der Show-Seite erscheint statt des Standbilds nur eine
        Platzhalter-Kachel.
      </p>
      <button type="button" className="btn secondary" onClick={onClick} disabled={busy}>
        {busy ? "Erzeugt…" : "Vorschaubild aus dem Video erzeugen"}
      </button>
      {error && <p style={{ color: "var(--danger)", margin: "8px 0 0" }}>{error}</p>}
    </>
  );
}
