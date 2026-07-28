import { redirect } from "next/navigation";

/**
 * Das Impressum wird zusammen mit Datenschutz und AGB unter /admin/rechtliches/<slug>
 * gepflegt. Diese Route bleibt als Weiterleitung für alte Lesezeichen bestehen.
 */
export default function AdminImpressumRedirect() {
  redirect("/admin/rechtliches/impressum");
}
