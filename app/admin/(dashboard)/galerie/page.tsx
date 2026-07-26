import { createServerSupabase } from "@/lib/supabase/server";
import { updateGalleryItem, deleteGalleryItem } from "@/lib/actions/gallery";
import { mediaUrl } from "@/lib/media";
import GalleryImageUpload from "@/components/admin/GalleryImageUpload";
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
      <GalleryImageUpload />

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
