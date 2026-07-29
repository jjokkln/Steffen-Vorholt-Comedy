"use client";

import { useActionState, useState } from "react";
import type { SocialItemKind, SocialMediaItem } from "@/lib/types";
import { SOCIAL_ITEM_KINDS } from "@/lib/types";
import type { FormState } from "@/lib/actions/social";
import { SOCIAL_PLATFORMS, detectPlatform, socialEmbedUrl, socialPlatform } from "@/lib/social";
import { VIDEO_POSTER_ASPECT_OPTIONS } from "@/lib/aspect";
import ImageCropUpload from "@/components/admin/ImageCropUpload";
import SocialIcon from "@/components/SocialIcon";
import Toast from "@/components/admin/Toast";

/**
 * Formular für einen Social-Media-Eintrag der Galerie-Seite.
 *
 * Der Zustand liegt bewusst im Client: Beim Einfügen der URL wird die Plattform
 * erkannt (und mit ihr das übliche Format), und es wird sofort angezeigt, ob der
 * Beitrag direkt eingebettet werden kann oder als verlinkte Kachel erscheint —
 * genau die Frage, die man sonst erst nach dem Speichern auf der Website sieht.
 */
export default function SocialItemForm({
  item,
  action,
}: {
  item?: SocialMediaItem;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  const [url, setUrl] = useState(item?.url ?? "");
  const [platform, setPlatform] = useState<string>(item?.platform ?? "youtube");
  const [kind, setKind] = useState<SocialItemKind>(item?.kind ?? "video");
  const [orientation, setOrientation] = useState(item?.orientation ?? "landscape");
  // Nur beim Anlegen darf die URL Plattform/Format überschreiben — bei einem
  // bestehenden Eintrag hat Steffens Auswahl Vorrang.
  const [autoDetect, setAutoDetect] = useState(!item);

  const current = socialPlatform(platform);
  const embedUrl = socialEmbedUrl({ platform, kind, url });
  const embeddable = Boolean(current.embed) && kind === "video";

  function onUrlChange(next: string) {
    setUrl(next);
    if (!autoDetect || !next.trim()) return;
    const detected = detectPlatform(next);
    setPlatform(detected);
    setOrientation(socialPlatform(detected).defaultOrientation);
  }

  function onPlatformChange(next: string) {
    setAutoDetect(false);
    setPlatform(next);
    setOrientation(socialPlatform(next).defaultOrientation);
  }

  return (
    <form className="card form" action={formAction}>
      <label>
        Link *
        <input
          name="url"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://www.instagram.com/reel/…"
          required
        />
        <small>
          Bei einem Video/Beitrag der Link zum Beitrag, bei einem Kanal der Link zum Profil.
        </small>
      </label>

      <div className="form two">
        <label>
          Plattform *
          <select name="platform" value={platform} onChange={(e) => onPlatformChange(e.target.value)}>
            {SOCIAL_PLATFORMS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Art *
          <select
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as SocialItemKind)}
          >
            {SOCIAL_ITEM_KINDS.map((k) => (
              <option key={k.key} value={k.key}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p
        className="social-form-status"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          margin: 0,
          fontSize: 13,
          color: "var(--muted)",
        }}
      >
        <span style={{ color: current.color, display: "grid", placeItems: "center" }}>
          <SocialIcon platform={platform} size={20} />
        </span>
        {kind === "channel"
          ? `Erscheint als ${current.label}-Kanal-Chip über den Videos.`
          : embedUrl
            ? `Wird direkt auf der Seite abgespielt (nach Cookie-Zustimmung).`
            : embeddable
              ? `Aus diesem Link lässt sich kein ${current.label}-Player bauen — bitte den Link zum einzelnen Beitrag verwenden, sonst erscheint eine verlinkte Kachel.`
              : `${current.label} lässt sich nicht einbetten: erscheint als anklickbare Kachel mit Vorschaubild.`}
      </p>

      <label>
        Titel
        <input
          name="title"
          defaultValue={item?.title}
          placeholder={kind === "channel" ? "z. B. Steffens YouTube-Kanal" : "z. B. Best of Open Mic"}
        />
      </label>

      <label>
        Kurzbeschreibung
        <textarea
          name="description"
          rows={2}
          defaultValue={item?.description}
          placeholder="Ein Satz – steht unter der Kachel bzw. neben dem Kanalnamen."
        />
      </label>

      {kind === "video" ? (
        <div className="form two">
          <label>
            Format
            <select
              name="orientation"
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as typeof orientation)}
            >
              <option value="landscape">Querformat 16:9</option>
              <option value="portrait">Hochformat 9:16 (Reel / Short)</option>
            </select>
          </label>
          <label>
            Sortierung
            <input name="sort_order" type="number" defaultValue={item?.sort_order ?? 0} />
          </label>
        </div>
      ) : (
        <>
          {/* Kanäle haben kein Format — der Wert muss trotzdem mitgesendet werden,
              weil die Spalte NOT NULL ist und die Action ihn prüft. */}
          <input type="hidden" name="orientation" value="landscape" />
          <label>
            Sortierung
            <input name="sort_order" type="number" defaultValue={item?.sort_order ?? 0} />
          </label>
        </>
      )}

      {kind === "video" && (
        <ImageCropUpload
          label="Vorschaubild (optional)"
          name="thumbnail_path"
          aspectOptions={VIDEO_POSTER_ASPECT_OPTIONS}
          defaultAspectKey={orientation === "portrait" ? "9-16" : "16-9"}
          hint="Wird nur bei Beiträgen gebraucht, die sich nicht einbetten lassen. Ohne Bild zeigt die Kachel einen Farbverlauf in der Plattform-Farbe."
          currentPath={item?.thumbnail_path}
          uploadPrefix="social"
        />
      )}

      <label className="checkbox-row">
        <input name="is_active" type="checkbox" defaultChecked={item?.is_active ?? true} /> Sichtbar
        auf der Galerie-Seite
      </label>
      <small style={{ color: "var(--muted)" }}>
        Ist kein einziger Eintrag sichtbar, verschwindet der ganze Abschnitt „Social Media“ von der
        Galerie-Seite.
      </small>

      <button className="btn primary" disabled={pending}>
        {pending ? "Speichert…" : item ? "Speichern" : "Eintrag anlegen"}
      </button>
      {state && !state.ok && <p style={{ color: "var(--danger)", margin: 0 }}>{state.message}</p>}
      {state?.ok && <Toast key={state.at} message={state.message} />}
    </form>
  );
}
