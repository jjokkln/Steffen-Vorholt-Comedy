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
    // Karten-Hälfte, keine eigene Karte — die Karte gehört dem Paar aus Video und
    // Vorschaubild (app/admin/(dashboard)/medien/page.tsx).
    <div className="form media-slot-part">
      <p className="media-slot-part-label">
        Vorschaubild
        {ownPath ? (
          <span className="status live">eigenes</span>
        ) : (
          <span className="status draft">Reserve</span>
        )}
      </p>

      <ImageCropUpload
        label="Neues Bild"
        name={slot.key}
        aspect={slot.aspect}
        // Aus dem Platz abgeleitet, nicht fest verdrahtet: Hier stand bis 30.07.2026
        // "Querformat 16:9 — passend zum Trailer", auch über den 4:5-Postern der
        // Bühnen-Videos. Der Zuschnittrahmen war korrekt, nur die Beschriftung log.
        frameLabel={`${describeAspect(slot.aspect)} — passend zum Videoformat`}
        currentPath={effectivePath}
        uploadPrefix={slot.key.replace(/_/g, "-")}
        disabled={busy}
        onUploaded={save}
      />

      <p className="media-slot-where">{slot.where}</p>
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

/**
 * „Hochformat 4:5" statt „0.8" — benennt das Seitenverhältnis so, wie es im Zuschnitt-
 * dialog auch dasteht. Nur die im Projekt vorkommenden Formate; alles andere wird als
 * gerundetes Verhältnis ausgegeben, statt zu raten.
 */
function describeAspect(aspect: number): string {
  const known: [number, string][] = [
    [16 / 9, "Querformat 16:9"],
    [4 / 5, "Hochformat 4:5"],
    [9 / 16, "Hochformat 9:16"],
    [1, "Quadratisch 1:1"],
  ];
  const hit = known.find(([value]) => Math.abs(value - aspect) < 0.01);
  if (hit) return hit[1];
  return aspect >= 1 ? `Querformat ${aspect.toFixed(2)}:1` : `Hochformat 1:${(1 / aspect).toFixed(2)}`;
}
