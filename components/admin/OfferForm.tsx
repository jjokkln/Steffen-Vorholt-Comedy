"use client";

import { useActionState } from "react";
import type { Offer } from "@/lib/types";
import type { FormState } from "@/lib/actions/offers";
import ImageCropUpload from "@/components/admin/ImageCropUpload";
import Toast from "@/components/admin/Toast";

export default function OfferForm({
  offer,
  action,
}: {
  offer?: Offer;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form className="card form" action={formAction}>
      <label>
        Titel *
        <input name="title" defaultValue={offer?.title} placeholder="z. B. Rettember" required />
      </label>
      <label>
        Untertitel
        <input name="subtitle" defaultValue={offer?.subtitle} placeholder="z. B. 5 € Eintritt im November" />
      </label>
      <label>
        Beschreibung
        <textarea name="description" rows={3} defaultValue={offer?.description} />
      </label>
      <div className="form two">
        <label>
          Aktions-Code
          <input name="code" defaultValue={offer?.code} placeholder="z. B. RETTEMBER5" />
        </label>
        <label>
          Gültigkeit / Zeitraum
          <input name="validity" defaultValue={offer?.validity} placeholder="z. B. nur im November 2026" />
        </label>
      </div>
      <label>
        Link (optional, z. B. Ticketanbieter)
        <input name="url" defaultValue={offer?.url} placeholder="https://…" />
      </label>
      <ImageCropUpload
        label="Bild / Poster"
        name="image_path"
        aspect={16 / 9}
        frameLabel="Querformat 16:9, z. B. 1920 × 1080 px"
        currentPath={offer?.image_path}
        uploadPrefix="offer"
      />
      <label>
        Sortierung
        <input name="sort_order" type="number" defaultValue={offer?.sort_order ?? 0} />
      </label>
      <label className="checkbox-row">
        <input name="is_active" type="checkbox" defaultChecked={offer?.is_active ?? true} /> Aktiv (öffentlich sichtbar)
      </label>
      <button className="btn primary" disabled={pending}>
        {pending ? "Speichert…" : offer ? "Speichern" : "Angebot anlegen"}
      </button>
      {state && !state.ok && <p style={{ color: "var(--danger)", margin: 0 }}>{state.message}</p>}
      {state?.ok && <Toast key={state.at} message={state.message} />}
    </form>
  );
}
