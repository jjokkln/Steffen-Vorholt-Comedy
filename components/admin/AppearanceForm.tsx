"use client";

import { useActionState } from "react";
import type { Appearance } from "@/lib/types";
import type { FormState } from "@/lib/actions/appearances";
import ImageCropUpload from "@/components/admin/ImageCropUpload";
import Toast from "@/components/admin/Toast";

export default function AppearanceForm({
  appearance,
  action,
}: {
  appearance?: Appearance;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);

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
      <ImageCropUpload
        label="Flyer / Bild (erscheint groß auf der Karte)"
        name="flyer_path"
        aspect={4 / 3}
        frameLabel="Querformat 4:3, z. B. 1200 × 900 px"
        currentPath={appearance?.flyer_path}
        uploadPrefix="appearance-flyer"
      />
      <label className="checkbox-row">
        <input name="is_published" type="checkbox" defaultChecked={appearance?.is_published ?? true} /> Veröffentlicht
      </label>
      <button className="btn primary" disabled={pending}>
        {pending ? "Speichert…" : appearance ? "Speichern" : "Auftritt anlegen"}
      </button>
      {state && !state.ok && <p style={{ color: "var(--danger)", margin: 0 }}>{state.message}</p>}
      {state?.ok && <Toast key={state.at} message={state.message} />}
    </form>
  );
}
