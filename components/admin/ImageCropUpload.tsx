"use client";

import { useCallback, useRef, useState } from "react";
import { uploadToStorage } from "@/lib/upload";
import { mediaUrl } from "@/lib/media";

const FRAME_MAX = 320;
const EXPORT_LONG_EDGE = 1920;

function frameSize(aspect: number) {
  if (aspect >= 1) return { w: FRAME_MAX, h: Math.round(FRAME_MAX / aspect) };
  return { w: Math.round(FRAME_MAX * aspect), h: FRAME_MAX };
}

/**
 * Bild-Upload mit Zuschnitt: Nutzer wählt eine Datei, zieht/zoomt sie innerhalb eines
 * festen Ziel-Rahmens (aspect) und lädt erst den fertigen Ausschnitt hoch. Für Bildfelder,
 * die öffentlich mit object-fit:cover in einem festen Format angezeigt werden.
 */
export default function ImageCropUpload({
  label,
  name,
  aspect,
  frameLabel,
  currentPath,
  bucket = "media",
  uploadPrefix,
  disabled,
}: {
  label: string;
  name: string;
  aspect: number; // Breite / Höhe
  frameLabel: string;
  currentPath?: string;
  bucket?: string;
  uploadPrefix: string;
  disabled?: boolean;
}) {
  const [path, setPath] = useState(currentPath ?? "");
  const [rawUrl, setRawUrl] = useState<string | null>(null);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { w: frameW, h: frameH } = frameSize(aspect);
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

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const bs = Math.max(frameW / img.naturalWidth, frameH / img.naturalHeight);
      const dw = img.naturalWidth * bs;
      const dh = img.naturalHeight * bs;
      setImgEl(img);
      setRawUrl(url);
      setScale(1);
      setOffset({ x: (frameW - dw) / 2, y: (frameH - dh) / 2 });
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

  async function applyCrop() {
    if (!imgEl) return;
    setUploading(true);
    setError("");
    try {
      const cropX = -offset.x / (baseScale * scale);
      const cropY = -offset.y / (baseScale * scale);
      const cropW = frameW / (baseScale * scale);
      const cropH = frameH / (baseScale * scale);
      const targetW = aspect >= 1 ? EXPORT_LONG_EDGE : Math.round(EXPORT_LONG_EDGE * aspect);
      const targetH = aspect >= 1 ? Math.round(EXPORT_LONG_EDGE / aspect) : EXPORT_LONG_EDGE;
      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Zuschnitt: Canvas nicht verfügbar.");
      ctx.drawImage(imgEl, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);
      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Zuschnitt fehlgeschlagen."))), "image/jpeg", 0.9),
      );
      const file = new File([blob], `${uploadPrefix}.jpg`, { type: "image/jpeg" });
      const uploadedPath = await uploadToStorage(bucket, uploadPrefix, file);
      setPath(uploadedPath);
      URL.revokeObjectURL(rawUrl!);
      setRawUrl(null);
      setImgEl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function cancelCrop() {
    if (rawUrl) URL.revokeObjectURL(rawUrl);
    setRawUrl(null);
    setImgEl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="image-crop-field">
      <label>
        {label}
        <span className="image-crop-frame-label">🖼️ Ziel-Format: {frameLabel}</span>
      </label>
      <input type="hidden" name={name} value={path} />

      {!rawUrl && (
        <>
          {path && (
            <div className="image-crop-current" style={{ aspectRatio: aspect }}>
              <img src={mediaUrl(path)} alt="" />
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
            style={{ width: frameW, height: frameH }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            <img
              src={rawUrl}
              alt=""
              draggable={false}
              style={{ width: dispW, height: dispH, transform: `translate(${offset.x}px, ${offset.y}px)` }}
            />
          </div>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={scale}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            aria-label="Zoom"
          />
          <div className="image-crop-actions">
            <button type="button" className="btn secondary" onClick={cancelCrop} disabled={uploading}>
              Abbrechen
            </button>
            <button type="button" className="btn primary" onClick={applyCrop} disabled={uploading}>
              {uploading ? "Lädt hoch…" : "Zuschnitt übernehmen"}
            </button>
          </div>
        </div>
      )}

      {error && <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p>}
    </div>
  );
}
