"use client";

import { useActionState } from "react";
import type { Show } from "@/lib/types";
import type { FormState } from "@/lib/actions/shows";
import { mediaUrl } from "@/lib/media";
import ImageCropUpload from "@/components/admin/ImageCropUpload";
import Toast from "@/components/admin/Toast";

export default function ShowForm({
  show,
  action,
}: {
  show?: Show;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const principles = (show?.principle_items ?? []).map((p) => `${p.title} :: ${p.text}`).join("\n");
  return (
    <form className="card form" action={formAction}>
      <div className="form two">
        <label>
          Name *
          <input name="name" defaultValue={show?.name} required />
        </label>
        <label>
          Format-Label (z. B. Impro)
          <input name="format_label" defaultValue={show?.format_label} />
        </label>
      </div>
      <label>
        Tagline (Überschrift der Show-Seite)
        <input name="tagline" defaultValue={show?.tagline} />
      </label>
      <label>
        Beschreibung
        <textarea name="description" rows={5} defaultValue={show?.description} />
      </label>
      <label>
        Aktions-/Hinweistext (optional, z. B. „Mit Code GALAXIE5 zahlst du nur 5 €")
        <input name="hint_text" defaultValue={show?.hint_text} placeholder="Kleiner Hinweis auf der Show-Seite" />
      </label>
      <label>
        Show-Prinzip — eine Zeile pro Punkt, Format: Titel :: Text
        <textarea name="principles" rows={4} defaultValue={principles} />
      </label>
      <label>
        Städte &amp; Locations (Freitext)
        <textarea name="cities_text" rows={2} defaultValue={show?.cities_text} />
      </label>
      <div className="form two">
        <label>
          Show-Farbe (Kalender, Legende &amp; Akzente)
          <input name="color" type="color" defaultValue={show?.color ?? "#7CFF6B"} />
        </label>
        <label>
          Sortierung
          <input name="sort_order" type="number" defaultValue={show?.sort_order ?? 0} />
        </label>
      </div>
      <label>
        Planet-Bild (rund, transparenter Hintergrund) — wird nicht zugeschnitten. Empfehlung: quadratisch (1:1),
        mind. 800&times;800 px, PNG mit transparentem Hintergrund.{" "}
        {show?.planet_image_path && (
          <img src={mediaUrl(show.planet_image_path)} alt="" style={{ width: 64, height: 64 }} />
        )}
        <input name="planet" type="file" accept="image/*" />
      </label>
      <ImageCropUpload
        label="Titelbild — erscheint groß in der Hero-Section der Show-Subpage"
        name="header_image_path"
        aspect={4 / 5}
        frameLabel="Hochformat 4:5, z. B. 1536 × 1920 px"
        currentPath={show?.header_image_path}
        uploadPrefix="header"
      />
      <ImageCropUpload
        label="Hintergrundbild — liegt hinter der ganzen Show-Seite, am besten ruhiges Motiv"
        name="background_image_path"
        aspect={16 / 9}
        frameLabel="Querformat 16:9, z. B. 1920 × 1080 px"
        currentPath={show?.background_image_path}
        uploadPrefix="bg"
      />
      <label className="checkbox-row">
        <input name="is_active" type="checkbox" defaultChecked={show?.is_active ?? true} /> Show ist aktiv (öffentlich sichtbar)
      </label>
      <button className="btn primary" disabled={pending}>
        {pending ? "Speichert…" : show ? "Speichern" : "Show anlegen"}
      </button>
      {state && !state.ok && <p style={{ color: "var(--danger)", margin: 0 }}>{state.message}</p>}
      {state?.ok && <Toast key={state.at} message={state.message} />}
    </form>
  );
}
