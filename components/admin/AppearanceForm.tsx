"use client";

import { useActionState, useState } from "react";
import type { Appearance } from "@/lib/types";
import type { FormState } from "@/lib/actions/appearances";
import { uploadToStorage } from "@/lib/upload";
import { mediaUrl } from "@/lib/media";
import Toast from "@/components/admin/Toast";

export default function AppearanceForm({
  appearance,
  action,
}: {
  appearance?: Appearance;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [flyerPath, setFlyerPath] = useState(appearance?.flyer_path ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function onFlyerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const path = await uploadToStorage("media", "appearance-flyer", file);
      setFlyerPath(path);
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form className="card form" action={formAction}>
      <label>
        Titel *
        <input name="title" defaultValue={appearance?.title} required placeholder="z. B. Open Mic im Comedy-Keller" />
      </label>
      <div className="form two">
        <label>
          Art
          <select name="kind" defaultValue={appearance?.kind ?? "guest"}>
            <option value="open_mic">Open Mic</option>
            <option value="guest">Auftritt</option>
            <option value="gig">Gig</option>
            <option value="show">Eigene Show</option>
          </select>
        </label>
        <label>
          Datum (leer = regelmäßig/laufend)
          <input name="date" type="date" defaultValue={appearance?.date ?? ""} />
        </label>
      </div>
      <div className="form two">
        <label>
          Veranstalter
          <input name="organizer" defaultValue={appearance?.organizer} />
        </label>
        <label>
          Stadt
          <input name="city" defaultValue={appearance?.city} />
        </label>
      </div>
      <label>
        Location / Venue
        <input name="venue" defaultValue={appearance?.venue} />
      </label>
      <label>
        Info-/Ticket-Link (ein Klick auf die Karte öffnet diese Seite)
        <input name="url" defaultValue={appearance?.url} placeholder="https://…" />
      </label>
      <div className="form two">
        <label>
          Farbe (Akzent der Karte)
          <input name="color" type="color" defaultValue={appearance?.color ?? "#7CFF6B"} />
        </label>
        <label>
          Sortierung
          <input name="sort_order" type="number" defaultValue={appearance?.sort_order ?? 0} />
        </label>
      </div>
      <label>
        Flyer / Bild (erscheint groß auf der Karte)
        <input type="file" accept="image/*" onChange={onFlyerChange} disabled={uploading} />
      </label>
      <input type="hidden" name="flyer_path" value={flyerPath} />
      {uploading && <p style={{ margin: 0, color: "var(--muted)" }}>Lädt Flyer hoch…</p>}
      {uploadError && <p style={{ color: "var(--danger)", margin: 0 }}>{uploadError}</p>}
      {flyerPath && (
        <img
          src={mediaUrl(flyerPath)}
          alt=""
          style={{ width: 140, borderRadius: 12, border: "1px solid var(--line)" }}
        />
      )}
      <label className="checkbox-row">
        <input name="is_published" type="checkbox" defaultChecked={appearance?.is_published ?? true} /> Veröffentlicht
      </label>
      <button className="btn primary" disabled={pending || uploading}>
        {pending ? "Speichert…" : appearance ? "Speichern" : "Auftritt anlegen"}
      </button>
      {state && !state.ok && <p style={{ color: "var(--danger)", margin: 0 }}>{state.message}</p>}
      {state?.ok && <Toast key={state.at} message={state.message} />}
    </form>
  );
}
