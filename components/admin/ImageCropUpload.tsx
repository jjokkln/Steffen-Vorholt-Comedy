"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { uploadToStorage } from "@/lib/upload";
import { mediaUrl } from "@/lib/media";
import type { AspectOption } from "@/lib/aspect";

const FRAME_MAX = 320;
const EXPORT_LONG_EDGE = 1920;
const EXPORT_LONG_EDGE_TRANSPARENT = 1024;

function frameSize(aspect: number) {
  if (aspect >= 1) return { w: FRAME_MAX, h: Math.round(FRAME_MAX / aspect) };
  return { w: Math.round(FRAME_MAX * aspect), h: FRAME_MAX };
}

/**
 * Kodiert das Canvas möglichst klein: WebP kann Transparenz und ist bei gleicher Qualität
 * rund 30 % kleiner als JPEG und ein Vielfaches kleiner als PNG. `toBlob` liefert bei einem
 * nicht unterstützten Format still PNG zurück — daran erkennen wir den Fehlschlag und
 * nehmen dann das alte Format.
 */
async function encodeCanvas(canvas: HTMLCanvasElement, keepAlpha: boolean): Promise<Blob> {
  const attempts: [string, number][] = [
    ["image/webp", keepAlpha ? 0.95 : 0.86],
    [keepAlpha ? "image/png" : "image/jpeg", 0.9],
  ];
  for (const [mime, quality] of attempts) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, quality));
    if (blob && blob.type === mime) return blob;
  }
  throw new Error("Bild konnte nicht kodiert werden.");
}

/**
 * Bild-Upload mit Zuschnitt: Nutzer wählt eine Datei, zieht/zoomt sie innerhalb eines
 * Ziel-Rahmens und lädt erst den fertigen Ausschnitt hoch.
 *
 * Zwei Betriebsarten:
 * - `aspect`: festes Ziel-Format (Bildfeld wird öffentlich in genau diesem Format angezeigt).
 * - `aspectOptions`: der Redakteur wählt das Format selbst — für Bereiche, deren Anzeige
 *   jedes Seitenverhältnis verträgt (Galerien). Option „Original" lädt unverändert hoch.
 *
 * `transparent` exportiert PNG statt JPEG und erhält so freigestellte Logos/Planeten.
 */
export default function ImageCropUpload({
  label,
  name,
  aspect,
  aspectOptions,
  defaultAspectKey,
  frameLabel,
  hint,
  currentPath,
  bucket = "media",
  uploadPrefix,
  disabled,
  transparent,
  onUploaded,
  resetSignal,
}: {
  label: string;
  name: string;
  /** Festes Ziel-Format (Breite / Höhe). Wird ignoriert, wenn `aspectOptions` gesetzt ist. */
  aspect?: number;
  /** Auswählbare Ziel-Formate statt eines festen. */
  aspectOptions?: AspectOption[];
  defaultAspectKey?: string;
  /** Beschriftung des festen Ziel-Formats (nur ohne `aspectOptions`). */
  frameLabel?: string;
  hint?: string;
  currentPath?: string;
  bucket?: string;
  uploadPrefix: string;
  disabled?: boolean;
  /** PNG-Export mit Transparenz (Logos, Planeten) statt JPEG. */
  transparent?: boolean;
  /** Wird nach erfolgreichem Upload mit dem Storage-Pfad aufgerufen. */
  onUploaded?: (path: string) => void;
  /** Änderung dieses Werts leert das Feld (z. B. nachdem das Formular abgeschickt wurde). */
  resetSignal?: number;
}) {
  const [path, setPath] = useState(currentPath ?? "");
  const [rawUrl, setRawUrl] = useState<string | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [aspectKey, setAspectKey] = useState(
    defaultAspectKey ?? aspectOptions?.[0]?.key ?? "",
  );
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selected = aspectOptions?.find((o) => o.key === aspectKey) ?? null;
  const activeAspect = aspectOptions ? selected?.aspect ?? null : aspect ?? null;
  const cropping = activeAspect !== null;

  // Rahmen für den Zuschnitt; ohne Zuschnitt dient die Box nur der Vorschau.
  const previewAspect = imgEl && imgEl.naturalHeight > 0 ? imgEl.naturalWidth / imgEl.naturalHeight : 1;
  const { w: frameW, h: frameH } = frameSize(activeAspect ?? previewAspect);

  const baseScale = imgEl ? Math.max(frameW / imgEl.naturalWidth, frameH / imgEl.naturalHeight) : 1;
  const dispW = imgEl ? imgEl.naturalWidth * baseScale * scale : 0;
  const dispH = imgEl ? imgEl.naturalHeight * baseScale * scale : 0;

  const clamp = useCallback(
    (x: number, y: number, dw: number, dh: number) => ({
      x: Math.min(0, Math.max(frameW - dw, x)),
      y: Math.min(0, Math.max(frameH - dh, y)),
    }),
    [frameW, frameH],
  );

  // Bild bei Format-Wechsel neu mittig einpassen.
  useEffect(() => {
    if (!imgEl || activeAspect === null) return;
    const { w, h } = frameSize(activeAspect);
    const bs = Math.max(w / imgEl.naturalWidth, h / imgEl.naturalHeight);
    setScale(1);
    setOffset({ x: (w - imgEl.naturalWidth * bs) / 2, y: (h - imgEl.naturalHeight * bs) / 2 });
  }, [imgEl, activeAspect]);

  // Erst ab der ersten Änderung leeren, nicht schon beim ersten Render.
  const resetSeen = useRef(resetSignal);
  useEffect(() => {
    if (resetSignal === undefined || resetSignal === resetSeen.current) return;
    resetSeen.current = resetSignal;
    setPath("");
  }, [resetSignal]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      setImgEl(img);
      setRawFile(file);
      setRawUrl(url);
    };
    img.onerror = () => setError("Bild konnte nicht geladen werden.");
    img.src = url;
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: offset.x, origY: offset.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset(clamp(dragRef.current.origX + dx, dragRef.current.origY + dy, dispW, dispH));
  }
  function onPointerUp() {
    dragRef.current = null;
  }

  function onZoomChange(z: number) {
    if (!imgEl) return;
    const dw = imgEl.naturalWidth * baseScale * z;
    const dh = imgEl.naturalHeight * baseScale * z;
    setScale(z);
    setOffset((o) => clamp(o.x, o.y, dw, dh));
  }

  /**
   * Erzeugt die Upload-Datei — mit Zuschnitt aus dem gewählten Ausschnitt, ohne Zuschnitt
   * aus dem ganzen Bild.
   *
   * Ohne Ziel-Format ging früher die Originaldatei unverändert in den Storage. So sind dort
   * PNGs mit 6–7 MB gelandet, die bei jedem Seitenaufruf über die Leitung mussten. Jetzt wird
   * auch dieser Fall auf {@link EXPORT_LONG_EDGE} verkleinert und neu kodiert.
   */
  async function buildFile(): Promise<File> {
    if (!imgEl || !rawFile) throw new Error("Kein Bild gewählt.");
    // Animierte und vektorbasierte Bilder würde das Canvas auf ein Einzelbild plattmachen.
    if (!cropping && (rawFile.type === "image/gif" || rawFile.type === "image/svg+xml")) {
      return rawFile;
    }

    const source = cropping
      ? {
          x: -offset.x / (baseScale * scale),
          y: -offset.y / (baseScale * scale),
          w: frameW / (baseScale * scale),
          h: frameH / (baseScale * scale),
        }
      : { x: 0, y: 0, w: imgEl.naturalWidth, h: imgEl.naturalHeight };

    const ratio = cropping ? activeAspect! : source.w / source.h;
    // Transparente Bilder (Logos/Planeten) brauchen keine 1920 px.
    const longEdge = transparent ? EXPORT_LONG_EDGE_TRANSPARENT : EXPORT_LONG_EDGE;
    let targetW = ratio >= 1 ? longEdge : Math.round(longEdge * ratio);
    let targetH = ratio >= 1 ? Math.round(longEdge / ratio) : longEdge;
    // Nie über die vorhandene Auflösung hinausrechnen — das macht die Datei nur größer.
    const shrink = Math.min(1, source.w / targetW, source.h / targetH);
    targetW = Math.max(1, Math.round(targetW * shrink));
    targetH = Math.max(1, Math.round(targetH * shrink));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Zuschnitt: Canvas nicht verfügbar.");
    ctx.drawImage(imgEl, source.x, source.y, source.w, source.h, 0, 0, targetW, targetH);

    const blob = await encodeCanvas(canvas, !!transparent);
    const ext = blob.type === "image/webp" ? "webp" : transparent ? "png" : "jpg";
    return new File([blob], `${uploadPrefix}.${ext}`, { type: blob.type });
  }

  async function applyCrop() {
    if (!imgEl || !rawFile) return;
    setUploading(true);
    setError("");
    try {
      const file = await buildFile();
      const uploadedPath = await uploadToStorage(bucket, uploadPrefix, file);
      setPath(uploadedPath);
      onUploaded?.(uploadedPath);
      clearEditor();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function clearEditor() {
    if (rawUrl) URL.revokeObjectURL(rawUrl);
    setRawUrl(null);
    setRawFile(null);
    setImgEl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="image-crop-field">
      <label>
        {label}
        {aspectOptions ? (
          <>
            <span className="image-crop-frame-label">🖼️ Ziel-Format wählen</span>
            <select
              className="image-crop-format"
              value={aspectKey}
              onChange={(e) => setAspectKey(e.target.value)}
              disabled={disabled || uploading}
              aria-label="Ziel-Format"
            >
              {aspectOptions.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </>
        ) : (
          frameLabel && <span className="image-crop-frame-label">🖼️ Ziel-Format: {frameLabel}</span>
        )}
      </label>
      {hint && <p className="image-crop-hint">{hint}</p>}
      <input type="hidden" name={name} value={path} />

      {!rawUrl && (
        <>
          {/* Vorschau über die Bild-Optimierung (220 px statt Original). Ohne Ziel-Format
              braucht `fill` trotzdem ein Seitenverhältnis — 4:3 plus `contain` zeigt das
              Bild vollständig, ohne etwas abzuschneiden. */}
          {path && (
            <div className="image-crop-current" style={{ aspectRatio: activeAspect ?? 4 / 3 }}>
              <Image
                src={mediaUrl(path)}
                alt=""
                fill
                sizes="220px"
                style={{ objectFit: cropping ? "cover" : "contain" }}
              />
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            disabled={disabled || uploading}
          />
        </>
      )}

      {rawUrl && imgEl && (
        <div className="image-crop-editor">
          <div
            className="image-crop-stage"
            style={{ width: frameW, height: frameH, cursor: cropping ? undefined : "default" }}
            onPointerDown={cropping ? onPointerDown : undefined}
            onPointerMove={cropping ? onPointerMove : undefined}
            onPointerUp={cropping ? onPointerUp : undefined}
            onPointerLeave={cropping ? onPointerUp : undefined}
          >
            <img
              src={rawUrl}
              alt=""
              draggable={false}
              style={
                cropping
                  ? { width: dispW, height: dispH, transform: `translate(${offset.x}px, ${offset.y}px)` }
                  : { width: "100%", height: "100%", objectFit: "contain" }
              }
            />
          </div>
          {cropping ? (
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={scale}
              onChange={(e) => onZoomChange(Number(e.target.value))}
              aria-label="Zoom"
            />
          ) : (
            <p className="image-crop-hint">
              Wird im Original-Seitenverhältnis hochgeladen (fürs Web verkleinert) — Format
              oben wählen, um zuzuschneiden.
            </p>
          )}
          <div className="image-crop-actions">
            <button type="button" className="btn secondary" onClick={clearEditor} disabled={uploading}>
              Abbrechen
            </button>
            <button type="button" className="btn primary" onClick={applyCrop} disabled={uploading}>
              {uploading ? "Lädt hoch…" : cropping ? "Zuschnitt übernehmen" : "Bild übernehmen"}
            </button>
          </div>
        </div>
      )}

      {error && <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p>}
    </div>
  );
}
