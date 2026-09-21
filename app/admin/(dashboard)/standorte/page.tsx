import { redirect } from "next/navigation";

/**
 * Standorte sind am 21.09.2026 in „Termine & Orte" aufgegangen. Die Route bleibt
 * als Weiterleitung bestehen: Lesezeichen und alte Links sollen nicht ins Leere
 * laufen.
 */
export default function AdminVenuesPage() {
  redirect("/admin/termine");
}
