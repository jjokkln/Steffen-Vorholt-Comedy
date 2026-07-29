import Image from "next/image";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { updateGalleryItem, deleteGalleryItem } from "@/lib/actions/gallery";
import { mediaUrl } from "@/lib/media";
import GalleryImageUpload from "@/components/admin/GalleryImageUpload";
import { GALLERY_CATEGORIES, type GalleryItem } from "@/lib/types";
import DeleteButton from "@/components/admin/DeleteButton";

export default async function AdminGaleriePage() {
  const supabase = await createServerSupabase();
  const { data: items } = await supabase.from("gallery_items").select("*").order("sort_order");

  return (
    <>
      <h2>Galerie „Vergangene Missionen"</h2>
      <GalleryImageUpload />

      <div className="grid-3" style={{ marginTop: 24 }}>
        {((items ?? []) as GalleryItem[]).map((g) => (
          <div className="card" key={g.id} style={{ padding: 14 }}>
            {/* Vorschau über die Bild-Optimierung: vorher lud diese Seite alle
                Galerie-Originale in Vollgröße (mehrere MB pro Foto) — auch das zählt
                auf das Egress-Kontingent. `contain` zeigt das Foto vollständig. */}
            <Image
              src={mediaUrl(g.image_path)}
              alt={g.caption}
              width={480}
              height={360}
              sizes="(max-width: 900px) 92vw, 320px"
              style={{
                width: "100%",
                aspectRatio: "4/3",
                objectFit: "contain",
                background: "rgba(0,0,0,.24)",
                borderRadius: 12,
                marginBottom: 10,
              }}
            />
            <form className="form" action={updateGalleryItem.bind(null, g.id)}>
              <input name="caption" defaultValue={g.caption} />
              <select name="category" defaultValue={g.category ?? ""}>
                <option value="">— Weitere —</option>
                {GALLERY_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
              <input name="sort_order" type="number" defaultValue={g.sort_order} />
              <div className="actions" style={{ marginTop: 8 }}>
                <button className="btn secondary">Speichern</button>
              </div>
            </form>
            <DeleteButton
              action={deleteGalleryItem.bind(null, g.id)}
              confirm="Foto wirklich aus der Galerie löschen?"
              style={{ marginTop: 8 }}
            />
          </div>
        ))}
      </div>

      {/* Videos liegen seit dem Umbau nicht mehr hier: Sie hängen nicht an der Galerie,
          sondern an festen Plätzen der Website und werden zusammen mit dem
          Speicherverbrauch gepflegt. */}
      <p className="media-slot-hint" style={{ marginTop: 32 }}>
        Videos der Website (Trailer, Bühnen-Videos) pflegst du unter{" "}
        <Link href="/admin/medien">Videos &amp; Speicher</Link>.
      </p>
    </>
  );
}
