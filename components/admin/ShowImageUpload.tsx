"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadToStorage } from "@/lib/upload";
import { addShowImage } from "@/lib/actions/show-images";
import Toast from "@/components/admin/Toast";

export default function ShowImageUpload({ showId }: { showId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const imageInput = form.elements.namedItem("image") as HTMLInputElement;
    const altText = (form.elements.namedItem("alt_text") as HTMLInputElement).value;
    const sortOrder = Number((form.elements.namedItem("sort_order") as HTMLInputElement).value || 0);

    const imageFile = imageInput.files?.[0];
    if (!imageFile) return;

    setBusy(true);
    setError("");
    try {
      const imagePath = await uploadToStorage("media", "show-img", imageFile);
      await addShowImage(showId, { imagePath, altText, sortOrder });
      setDone(Date.now());
      setPreview(null);
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
      <label>
        Bild * (JPG, PNG, WebP)
        <input name="image" type="file" accept="image/*" required disabled={busy} onChange={onFileChange} />
      </label>
      {preview && (
        <img
          src={preview}
          alt=""
          style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 12, border: "1px solid var(--line)" }}
        />
      )}
      <div className="form two">
        <label>
          Bildunterschrift
          <input name="alt_text" placeholder="z. B. Bühnenmoment 2025" disabled={busy} />
        </label>
        <label>
          Sortierung
          <input name="sort_order" type="number" defaultValue={0} disabled={busy} />
        </label>
      </div>
      <button className="btn primary" disabled={busy}>
        {busy ? "Lädt hoch…" : "Foto hochladen"}
      </button>
      {error && <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p>}
      {done > 0 && <Toast key={done} message="Foto gespeichert!" />}
    </form>
  );
}
