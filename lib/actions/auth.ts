"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { anfragendeQuelle, bremseGreift, fehlversuchZaehlen, zuruecksetzen } from "@/lib/bremse";

/**
 * Anmeldung an der Verwaltungsfläche.
 *
 * ── Warum hier eine eigene Bremse sitzt ────────────────────────────────────
 *
 * GoTrue hat eine eingebaute (gemessen am 21.09.2026: 429 ab dem 38. Fehlversuch
 * aus einer IP), aber sie greift ins Leere: `signInWithPassword` läuft in dieser
 * Server Action auf Vercel, also sieht GoTrue **Vercels** IP. Die eingebaute
 * Bremse trifft damit entweder niemanden oder alle drei Admin-Konten gemeinsam.
 * Die Quell-IP muss die Server Action deshalb selbst mitgeben
 * (Regel auth-haertung, Punkt 5).
 *
 * Zwei Eimer, weil sie gegen Verschiedenes schützen (Punkt 1 derselben Regel):
 * Je Konto hindert niemanden daran, viele Adressen mit je wenigen Versuchen
 * durchzuprobieren; je Quelle allein träfe bei einem geteilten Anschluss die
 * Falschen.
 */
export async function login(_prev: { error: string } | null, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const quelle = await anfragendeQuelle();

  // Vorabprüfung: liest, zählt NICHT. Zählte sie mit, verbrauchte jeder
  // erfolgreiche Login Budget (Regel auth-haertung, Punkt 3.2).
  if ((await bremseGreift("login_quelle", quelle)) || (await bremseGreift("login_konto", email))) {
    // Dieselbe Meldung wie bei falschem Passwort — mit einer eigenen („zu viele
    // Versuche") verriete das Formular, dass eine Grenze gefunden wurde, und
    // bei welcher Adresse sie greift.
    return { error: "Login fehlgeschlagen. E-Mail oder Passwort prüfen." };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Nur Fehlversuche zählen. Beide Eimer, weil beide Grenzen greifen sollen.
    await fehlversuchZaehlen("login_quelle", quelle);
    await fehlversuchZaehlen("login_konto", email);
    return { error: "Login fehlgeschlagen. E-Mail oder Passwort prüfen." };
  }

  // Bei Erfolg zurücksetzen, damit eine vertippte Eingabe kein Budget kostet.
  await zuruecksetzen("login_quelle", quelle);
  await zuruecksetzen("login_konto", email);

  redirect("/admin");
}

export async function logout() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
