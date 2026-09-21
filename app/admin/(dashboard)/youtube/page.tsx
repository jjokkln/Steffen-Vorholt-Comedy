import { redirect } from "next/navigation";

/**
 * YouTube-Referenzen sind am 21.09.2026 in „Social & YouTube" aufgegangen.
 * Weiterleitung, damit Lesezeichen und alte Links nicht ins Leere laufen.
 */
export default function AdminYoutubePage() {
  redirect("/admin/social");
}
