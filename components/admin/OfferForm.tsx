"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Offer } from "@/lib/types";
import type { FormState } from "@/lib/actions/offers";
import { FLEXIBLE_ASPECT_OPTIONS } from "@/lib/aspect";
import ImageCropUpload from "@/components/admin/ImageCropUpload";
import Toast from "@/components/admin/Toast";

/**
 * Angebot / Promo-Code einer Show. Wird direkt in der Show-Bearbeitung verwendet —
 * einmal als Anlege-Formular (ohne `offer`) und je vorhandenem Angebot als Bearbeiten-Formular.
 */
export default function OfferForm({
  offer,
  action,
}: {
  offer?: Offer;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const isNew = !offer;
  // Nach dem Anlegen leert sich das Formular, damit das nächste Angebot nicht auf
  // den Resten des vorherigen aufsetzt. Beim Bearbeiten bleiben die Werte stehen.
  const [resetSignal, setResetSignal] = useState(0);
  useEffect(() => {
    if (!isNew || !state?.ok) return;
    formRef.current?.reset();
    setResetSignal(state.at);
    router.refresh();
  }, [isNew, state?.ok, state?.at, router]);

  return (
    <form ref={formRef} className="card form" action={formAction}>
      <label>
        Name *
        <input name="title" defaultValue={offer?.title} placeholder="z. B. Rettember" required />
      </label>
      <label>
        Untertitel
        <input name="subtitle" defaultValue={offer?.subtitle} placeholder="z. B. 5 € Eintritt im November" />
      </label>
      <label>
        Beschreibung
        <textarea
          name="description"
          rows={3}
          defaultValue={offer?.description}
          placeholder="Kurz erklärt: Was bringt der Code und für wen gilt er?"
        />
      </label>
      <div className="form two">
        <label>
          Rabatt-Code
          <input name="code" defaultValue={offer?.code} placeholder="z. B. RETTEMBER5" />
        </label>
        <label>
          Gültigkeit / Zeitraum
          <input name="validity" defaultValue={offer?.validity} placeholder="z. B. nur im November 2026" />
        </label>
      </div>
      <label>
        Link zur Ticketseite (optional)
        <input name="url" defaultValue={offer?.url} placeholder="https://…" />
      </label>
      <ImageCropUpload
        label="Bild (liegt hinter dem Angebot)"
        name="image_path"
        aspectOptions={FLEXIBLE_ASPECT_OPTIONS}
        defaultAspectKey="16-9"
        hint="Die Angebots-Kachel richtet sich nach dem gewählten Format und schneidet nichts ab. Empfehlung: mind. 1600 px auf der langen Seite."
        currentPath={offer?.image_path}
        uploadPrefix="offer"
        disabled={pending}
        resetSignal={resetSignal}
      />
      <div className="form two">
        <label>
          Sortierung
          <input name="sort_order" type="number" defaultValue={offer?.sort_order ?? 0} />
        </label>
        <label className="checkbox-row">
          <input name="is_active" type="checkbox" defaultChecked={offer?.is_active ?? true} /> Aktiv (auf der
          Show-Seite sichtbar)
        </label>
      </div>
      <button className="btn primary" disabled={pending}>
        {pending ? "Speichert…" : offer ? "Speichern" : "Angebot anlegen"}
      </button>
      {state && !state.ok && <p style={{ color: "var(--danger)", margin: 0 }}>{state.message}</p>}
      {state?.ok && <Toast key={state.at} message={state.message} />}
    </form>
  );
}
