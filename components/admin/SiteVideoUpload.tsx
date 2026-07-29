"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadToStorage } from "@/lib/upload";
import { setSiteMediaPath, clearSiteMediaPath } from "@/lib/actions/site-media";
import { mediaUrl } from "@/lib/media";
import { formatBytes } from "@/lib/storage-format";
import {
  canCompressVideo,
  compressVideo,
  MAX_COMPRESS_SECONDS,
  type CompressResult,
} from "@/lib/video-compress";
import { requestStorageUsageRefresh } from "@/components/admin/StorageUsageBar";
import Toast from "@/components/admin/Toast";
import type { SiteMediaSlot } from "@/lib/site-media";

type Phase = "idle" | "compressing" | "uploading";

/**
 * Ein Video-Upload-Feld für genau einen Medien-Platz der Website (Registry:
 * lib/site-media.ts). Verkleinert die Datei vor dem Upload im Browser, siehe
 * lib/video-compress.ts — deshalb der Direkt-Upload in den Storage und nicht
 * über eine Server-Action (die hat 1 MB Body-Limit).
 */
export default function SiteVideoUpload({
  slot,
  ownPath,
  effectivePath,
}: {
  slot: SiteMediaSlot;
  /** Für diesen Platz gespeicherter Wert ("" = leer, Website nutzt die Reserve). */
  ownPath: string;
  /** Was die Website tatsächlich zeigt (nach Fallback-Kette). */
  effectivePath: string;
}) {
  const router = useRouter();
  const inputId = useId();
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(0);
  const busy = phase !== "idle";

  const longEdge = slot.targetLongEdge ?? 1280;
  const mbps = slot.targetMbps ?? 2.5;
  const compressible = canCompressVideo();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem("video") as HTMLInputElement;
    const compressToggle = form.elements.namedItem("compress") as HTMLInputElement | null;
    const file = input.files?.[0];
    if (!file) return;

    setError("");
    setNote("");
    setProgress(0);

    let upload = file;
    try {
      if (compressible && compressToggle?.checked) {
        setPhase("compressing");
        const result: CompressResult = await compressVideo(file, {
          longEdge,
          mbps,
          onProgress: setProgress,
        });
        upload = result.file;
        setNote(describeResult(result));
      } else {
        setNote(`Unverändert hochgeladen (${formatBytes(file.size)}).`);
      }

      setPhase("uploading");
      const path = await uploadToStorage("media", slot.key.replace(/_/g, "-"), upload);
      await setSiteMediaPath(slot.key, path);

      input.value = "";
      setDone(Date.now());
      requestStorageUsageRefresh();
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPhase("idle");
      setProgress(0);
    }
  }

  async function onClear() {
    if (!window.confirm(`„${slot.label}" wirklich leeren? Die hinterlegte Datei wird gelöscht.`)) return;
    setError("");
    setNote("");
    setPhase("uploading");
    try {
      await clearSiteMediaPath(slot.key);
      setDone(Date.now());
      requestStorageUsageRefresh();
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPhase("idle");
    }
  }

  return (
    <form className="card form media-slot" onSubmit={onSubmit}>
      <div className="media-slot-head">
        <div>
          <h3 style={{ margin: 0 }}>{slot.label}</h3>
          <p className="media-slot-where">{slot.where}</p>
        </div>
        {ownPath ? (
          <span className="status live">eigenes Video</span>
        ) : (
          <span className="status draft">Reserve aktiv</span>
        )}
      </div>

      {effectivePath ? (
        <video
          className="media-slot-preview"
          src={mediaUrl(effectivePath)}
          style={{ aspectRatio: String(slot.aspect) }}
          controls
          preload="metadata"
          playsInline
          muted
        />
      ) : (
        <div className="media-placeholder">Noch kein Video</div>
      )}

      <p className="media-slot-path">{effectivePath || "—"}</p>

      <label htmlFor={inputId}>
        Neues Video (MP4){" "}
        <input id={inputId} name="video" type="file" accept="video/mp4,video/*" required disabled={busy} />
      </label>

      {compressible ? (
        <label className="media-slot-check">
          <input name="compress" type="checkbox" defaultChecked disabled={busy} />
          <span>
            Vor dem Upload verkleinern (max. {longEdge} px lange Kante, ~{mbps} Mbit/s). Läuft in
            Echtzeit im Browser: Der Tab muss offen bleiben, Videos über{" "}
            {Math.round(MAX_COMPRESS_SECONDS / 60)} Minuten werden unverändert hochgeladen. Dateien,
            die schon schlank sind, bleiben wie sie sind.
          </span>
        </label>
      ) : (
        <p className="media-slot-hint">
          Dieser Browser kann Videos nicht vorab verkleinern — die Datei wird unverändert
          hochgeladen. In Chrome, Edge oder Safari klappt das Verkleinern.
        </p>
      )}

      {phase === "compressing" && (
        <div className="media-slot-progress" role="status">
          <span>Verkleinert … {Math.round(progress * 100)} %</span>
          <span className="storage-pill-track">
            <span className="storage-pill-fill" style={{ width: `${progress * 100}%` }} />
          </span>
        </div>
      )}

      <div className="actions">
        <button className="btn primary" disabled={busy}>
          {phase === "compressing" ? "Verkleinert…" : phase === "uploading" ? "Lädt hoch…" : "Video ersetzen"}
        </button>
        {ownPath && (
          <button type="button" className="btn secondary" onClick={onClear} disabled={busy}>
            Leeren
          </button>
        )}
      </div>

      {note && <p className="media-slot-note">{note}</p>}
      {error && <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p>}
      {done > 0 && <Toast key={done} message={`${slot.label} gespeichert!`} />}
    </form>
  );
}

function describeResult(result: CompressResult): string {
  const from = formatBytes(result.originalBytes);
  if (result.skipped) {
    return `Unverändert hochgeladen (${from}) — Grund: ${result.skipped}.`;
  }
  const saved = Math.max(0, Math.round((1 - result.bytes / result.originalBytes) * 100));
  return `Verkleinert: ${from} → ${formatBytes(result.bytes)} (−${saved} %) bei ${result.width}×${result.height}.`;
}
