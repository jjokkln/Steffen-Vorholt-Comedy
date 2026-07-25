import { createServerSupabase } from "@/lib/supabase/server";
import { addGalleryItem, updateGalleryItem, deleteGalleryItem } from "@/lib/actions/gallery";
import { mediaUrl } from "@/lib/media";
import HeroVideoUpload from "@/components/admin/HeroVideoUpload";
import { GALLERY_CATEGORIES, type GalleryItem } from "@/lib/types";
import DeleteButton from "@/components/admin/DeleteButton";

export default async function AdminGaleriePage() {
  const supabase = await createServerSupabase();
  const [{ data: items }, { data: hero }] = await Promise.all([
    supabase.from("gallery_items").select("*").order("sort_order"),
    supabase.from("site_media").select("file_path").eq("key", "hero_video").maybeSingle(),
  ]);

  return (
    <>
      <h2>Galerie „Vergangene Missionen"</h2>
      <form className="card form" action={addGalleryItem}>
        <h3>Neues Foto</h3>
        <label>
          Bild * <input name="image" type="file" accept="image/*" required />
        </label>
        <div className="form two">
          <label>
            Bildunterschrift <input name="caption" placeholder="z. B. Brain Loading, Köln 2025" />
          </label>
          <label>
            Kategorie
            <select name="category" defaultValue="">
              <option value="">— Weitere —</option>
              {GALLERY_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Sortierung <input name="sort_order" type="number" defaultValue={0} />
        </label>
        <button className="btn primary">Hochladen</button>
      </form>

      <div className="grid-3" style={{ marginTop: 24 }}>
        {((items ?? []) as GalleryItem[]).map((g) => (
          <div className="card" key={g.id} style={{ padding: 14 }}>
            <img src={mediaUrl(g.image_path)} alt={g.caption} style={{ borderRadius: 12, marginBottom: 10 }} />
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

      <h2 style={{ marginTop: 42 }}>Hero-Video</h2>
      <HeroVideoUpload current={hero?.file_path ?? ""} />
    </>
  );
}
