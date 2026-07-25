"use client";

import { useActionState } from "react";
import type { Comedian } from "@/lib/types";
import type { FormState } from "@/lib/actions/comedians";
import ImageCropUpload from "@/components/admin/ImageCropUpload";
import Toast from "@/components/admin/Toast";

export default function ComedianForm({
  comedian,
  action,
}: {
  comedian?: Comedian;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form className="card form" action={formAction}>
      <div className="form two">
        <label>
          Name *
          <input name="name" defaultValue={comedian?.name} required />
        </label>
        <label>
          Alter
          <input name="age" type="number" defaultValue={comedian?.age ?? ""} />
        </label>
      </div>
      <label>
        Kurzbeschreibung
        <textarea name="bio" rows={3} defaultValue={comedian?.bio} />
      </label>
      <div className="form two">
        <label>
          Instagram-URL
          <input name="instagram_url" defaultValue={comedian?.instagram_url} placeholder="https://instagram.com/…" />
        </label>
        <label>
          TikTok-URL
          <input name="tiktok_url" defaultValue={comedian?.tiktok_url} placeholder="https://tiktok.com/@…" />
        </label>
      </div>
      <div className="form two">
        <label>
          YouTube-URL
          <input name="youtube_url" defaultValue={comedian?.youtube_url} placeholder="https://youtube.com/@…" />
        </label>
        <label>
          Website-URL
          <input name="website_url" defaultValue={comedian?.website_url} placeholder="https://…" />
        </label>
      </div>
      <ImageCropUpload
        label="Foto"
        name="photo_path"
        aspect={3 / 2}
        frameLabel="Querformat 3:2, z. B. 1200 × 800 px"
        currentPath={comedian?.photo_path}
        uploadPrefix="comedian"
      />
      <label>
        Sortierung
        <input name="sort_order" type="number" defaultValue={comedian?.sort_order ?? 0} />
      </label>
      <label className="checkbox-row">
        <input name="is_active" type="checkbox" defaultChecked={comedian?.is_active ?? true} /> Aktiv (öffentlich sichtbar)
      </label>
      <button className="btn primary" disabled={pending}>
        {pending ? "Speichert…" : comedian ? "Speichern" : "Comedian anlegen"}
      </button>
      {state && !state.ok && <p style={{ color: "var(--danger)", margin: 0 }}>{state.message}</p>}
      {state?.ok && <Toast key={state.at} message={state.message} />}
    </form>
  );
}
