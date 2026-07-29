import { createServerSupabase } from "@/lib/supabase/server";
import { SITE_MEDIA_SLOTS, resolveSiteMedia } from "@/lib/site-media";
import { getStorageUsage } from "@/lib/storage-usage";
import { formatBytes, usageLevel } from "@/lib/storage-format";
import SiteVideoUpload from "@/components/admin/SiteVideoUpload";
import SiteMediaImageUpload from "@/components/admin/SiteMediaImageUpload";

/** Zählt bei jedem Aufruf neu — die Seite ist genau die, auf der man den aktuellen Stand sehen will. */
export const dynamic = "force-dynamic";

export default async function AdminMedienPage() {
  const supabase = await createServerSupabase();
  const [{ data: rows }, usage] = await Promise.all([
    supabase.from("site_media").select("key, file_path"),
    getStorageUsage(),
  ]);

  const values: Record<string, string> = Object.fromEntries(
    (rows ?? []).map((row) => [row.key as string, (row.file_path as string) ?? ""]),
  );
  const level = usageLevel(usage.ratio);
  const percent = Math.round(usage.ratio * 100);

  return (
    <>
      <h2>Videos &amp; Speicher</h2>

      <section className={`card storage-panel is-${level}`}>
        <div className="storage-panel-head">
          <div>
            <h3 style={{ margin: 0 }}>Belegter Speicher</h3>
            <p className="media-slot-where">
              {usage.files} Dateien in {usage.buckets.length} Bereichen · Kontingent{" "}
              {formatBytes(usage.quotaBytes)} — der Datei-Speicher des Supabase-Free-Plans.
              Nicht zu verwechseln mit dem Egress-Kontingent (5 GB ausgelieferte Daten pro
              Monat), das getrennt davon zählt. Einzelne Dateien dürfen maximal 50 MB haben.
            </p>
          </div>
          <strong className="storage-panel-value">
            {formatBytes(usage.bytes)} <span>/ {formatBytes(usage.quotaBytes)}</span>
          </strong>
        </div>

        <div
          className="storage-panel-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.min(100, percent)}
          aria-label="Belegter Speicher"
        >
          <span
            className="storage-panel-fill"
            style={{ width: `${Math.min(100, Math.max(0, usage.ratio * 100))}%` }}
          />
        </div>
        <p className="storage-panel-percent">
          {percent} % belegt · {formatBytes(Math.max(0, usage.quotaBytes - usage.bytes))} frei
        </p>

        {usage.failed.length > 0 && (
          <p style={{ color: "var(--danger)", margin: 0 }}>
            Nicht auslesbar: {usage.failed.join(", ")} — die Summe ist unvollständig.
          </p>
        )}

        <div className="table-wrap" style={{ marginTop: 8 }}>
          <table>
            <thead>
              <tr><th>Bereich</th><th>Dateien</th><th>Größe</th><th>Größte Datei</th></tr>
            </thead>
            <tbody>
              {usage.buckets.map((bucket) => (
                <tr key={bucket.bucket}>
                  <td>{BUCKET_LABELS[bucket.bucket] ?? bucket.bucket}</td>
                  <td>{bucket.files}</td>
                  <td>{formatBytes(bucket.bytes)}</td>
                  <td>
                    {bucket.largest[0]
                      ? `${bucket.largest[0].name} (${formatBytes(bucket.largest[0].bytes)})`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="media-slot-hint" style={{ marginTop: 8 }}>
        Jeder Platz unten gehört zu genau einer Stelle auf der Website. Neue Videos werden vor
        dem Upload im Browser verkleinert; die vorher hinterlegte Datei wird dabei aus dem
        Speicher gelöscht, damit das Kontingent nicht zuläuft. „Leeren" setzt einen Platz auf
        die mitgelieferte Reserve-Datei zurück.
      </p>

      <div className="media-slot-grid">
        {SITE_MEDIA_SLOTS.map((slot) => {
          const ownPath = (values[slot.key] ?? "").trim();
          const effectivePath = resolveSiteMedia(values, slot.key);
          return slot.kind === "video" ? (
            <SiteVideoUpload
              key={slot.key}
              slot={slot}
              ownPath={ownPath}
              effectivePath={effectivePath}
            />
          ) : (
            <SiteMediaImageUpload
              key={slot.key}
              slot={slot}
              ownPath={ownPath}
              effectivePath={effectivePath}
            />
          );
        })}
      </div>
    </>
  );
}

const BUCKET_LABELS: Record<string, string> = {
  media: "Videos & Bilder (media)",
  gallery: "Galerie (gallery)",
  planets: "Planeten & Logos (planets)",
};
