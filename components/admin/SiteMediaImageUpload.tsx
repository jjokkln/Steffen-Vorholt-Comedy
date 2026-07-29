"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageCropUpload from "@/components/admin/ImageCropUpload";
import Toast from "@/components/admin/Toast";
import { setSiteMediaPath, clearSiteMediaPath } from "@/lib/actions/site-media";
import { requestStorageUsageRefresh } from "@/components/admin/StorageUsageBar";
import type { SiteMediaSlot } from "@/lib/site-media";

/**
 * Bild-Platz der Website (z. B. das Vorschaubild des Trailers): Zuschnitt und Upload
 * macht ImageCropUpload, hier wird der Pfad nur dem Medien-Platz zugeordnet.
 */
export default function SiteMediaImageUpload({
  slot,
  ownPath,
  effectivePath,
}: {
  slot: SiteMediaSlot;
  ownPath: string;
  effectivePath: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(0);

  async function save(path: string) {
    setBusy(true);
    setError("");
    try {
      await setSiteMediaPath(slot.key, path);
      setDone(Date.now());
      requestStorageUsageRefresh();
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onClear() {
    if (!window.confirm(`„${slot.label}" wirklich leeren? Die hinterlegte Datei wird gelöscht.`)) return;
    setBusy(true);
    setError("");
    try {
      await clearSiteMediaPath(slot.key);
      setDone(Date.now());
      requestStorageUsageRefresh();
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card form media-slot">
      <div className="media-slot-head">
        <div>
          <h3 style={{ margin: 0 }}>{slot.label}</h3>
          <p className="media-slot-where">{slot.where}</p>
        </div>
        {ownPath ? (
          <span className="status live">eigenes Bild</span>
        ) : (
          <span className="status draft">Reserve aktiv</span>
        )}
      </div>

      <ImageCropUpload
        label="Neues Bild"
        name={slot.key}
        aspect={slot.aspect}
        frameLabel="Querformat 16:9 — passend zum Trailer"
        currentPath={effectivePath}
        uploadPrefix={slot.key.replace(/_/g, "-")}
        disabled={busy}
        onUploaded={save}
      />

      <p className="media-slot-path">{effectivePath || "—"}</p>

      {ownPath && (
        <div className="actions">
          <button type="button" className="btn secondary" onClick={onClear} disabled={busy}>
            Leeren
          </button>
        </div>
      )}

      {error && <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p>}
      {done > 0 && <Toast key={done} message={`${slot.label} gespeichert!`} />}
    </div>
  );
}
