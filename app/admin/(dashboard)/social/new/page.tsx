import SocialItemForm from "@/components/admin/SocialItemForm";
import { createSocialItem } from "@/lib/actions/social";

export default function NewSocialItemPage() {
  return (
    <>
      <h2>Neuer Social-Media-Eintrag</h2>
      <SocialItemForm action={createSocialItem} />
    </>
  );
}
