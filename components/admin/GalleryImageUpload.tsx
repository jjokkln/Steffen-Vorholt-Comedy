"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addGalleryItem } from "@/lib/actions/gallery";
import { FLEXIBLE_ASPECT_OPTIONS } from "@/lib/aspect";
import { GALLERY_CATEGORIES } from "@/lib/types";
import ImageCropUpload from "@/components/admin/ImageCropUpload";
import Toast from "@/components/admin/Toast";

/** Upload für die Startseiten-Galerie „Vergangene Missionen" — mit derselben Zuschneidefunktion wie überall. */
export default function GalleryImageUpload() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(0);
  const [imagePath, setImagePath] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!imagePath) {
      setError("Bitte zuerst ein Bild hochladen (Zuschnitt übernehmen).");
      return;
    }
    const caption = (form.elements.namedItem("caption") as HTMLInputElement).value;
    const category = (form.elements.namedItem("category") as HTMLSelectElement).value;
    const sortOrder = Number((form.elements.namedItem("sort_order") as HTMLInputElement).value || 0);

    setBusy(true);
    setError("");
    try {
      await addGalleryItem({ imagePath, caption, category, sortOrder });
      setDone(Date.now());
      setImagePath("");
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
      <h3>Neues Foto</h3>
      <ImageCropUpload
        label="Bild * (JPG, PNG, WebP)"
        name="image_path"
        aspectOptions={FLEXIBLE_ASPECT_OPTIONS}
        hint="Die Galerie zeigt jedes Seitenverhältnis vollständig an. Wähle ein Format, wenn du das Bild darauf ausrichten willst — sonst „Original“."
        bucket="gallery"
        uploadPrefix="mission"
        disabled={busy}
        onUploaded={setImagePath}
        resetSignal={done}
      />
      <div className="form two">
        <label>
          Bildunterschrift
          <input name="caption" placeholder="z. B. Brain Loading, Köln 2025" disabled={busy} />
        </label>
        <label>
          Kategorie
          <select name="category" defaultValue="" disabled={busy}>
            <option value="">— Weitere —</option>
            {GALLERY_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Sortierung
        <input name="sort_order" type="number" defaultValue={0} disabled={busy} />
      </label>
      <button className="btn primary" disabled={busy || !imagePath}>
        {busy ? "Speichert…" : "Foto hinzufügen"}
      </button>
      {error && <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p>}
      {done > 0 && <Toast key={done} message="Foto gespeichert!" />}
    </form>
  );
}
