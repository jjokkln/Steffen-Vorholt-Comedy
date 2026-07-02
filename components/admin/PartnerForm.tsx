"use client";

import { useActionState } from "react";
import type { Partner } from "@/lib/types";
import type { FormState } from "@/lib/actions/partners";
import { mediaUrl } from "@/lib/media";
import Toast from "@/components/admin/Toast";

export default function PartnerForm({
  partner,
  action,
}: {
  partner?: Partner;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form className="card form" action={formAction}>
      <label>
        Name *
        <input name="name" defaultValue={partner?.name} required />
      </label>
      <label>
        Beschreibung
        <textarea name="description" rows={2} defaultValue={partner?.description} />
      </label>
      <label>
        Website-URL
        <input name="url" defaultValue={partner?.url} placeholder="https://…" />
      </label>
      <label>
        Logo{" "}
        {partner?.logo_path && (
          <img src={mediaUrl(partner.logo_path)} alt="" style={{ height: 48, objectFit: "contain" }} />
        )}
        <input name="logo" type="file" accept="image/*" />
      </label>
      <label>
        Sortierung
        <input name="sort_order" type="number" defaultValue={partner?.sort_order ?? 0} />
      </label>
      <label style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        <input name="is_active" type="checkbox" defaultChecked={partner?.is_active ?? true} /> Aktiv (öffentlich sichtbar)
      </label>
      <button className="btn primary" disabled={pending}>
        {pending ? "Speichert…" : partner ? "Speichern" : "Partner anlegen"}
      </button>
      {state && !state.ok && <p style={{ color: "var(--danger)", margin: 0 }}>{state.message}</p>}
      {state?.ok && <Toast key={state.at} message={state.message} />}
    </form>
  );
}
