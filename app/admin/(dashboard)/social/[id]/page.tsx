import { notFound } from "next/navigation";
import SocialItemForm from "@/components/admin/SocialItemForm";
import { updateSocialItem } from "@/lib/actions/social";
import { createServerSupabase } from "@/lib/supabase/server";
import { socialPlatform } from "@/lib/social";
import type { SocialMediaItem } from "@/lib/types";

export default async function EditSocialItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("social_media_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const item = data as SocialMediaItem;

  return (
    <>
      <h2>{item.title || `${socialPlatform(item.platform).label}-Eintrag`} bearbeiten</h2>
      <SocialItemForm item={item} action={updateSocialItem.bind(null, item.id)} />
    </>
  );
}
