"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import {
  ALL_ACCEPTED,
  NECESSARY_ONLY,
  useCookieConsent,
} from "@/components/consent/CookieConsentProvider";
import { LEGAL_PAGES } from "@/lib/legal";

/**
 * Vollflächiger Einwilligungs-Dialog.
 *
 * Erfüllte Anforderungen (§ 25 TDDDG, Art. 4 Nr. 11, 6, 7 DSGVO):
 * - Opt-in: YouTube-Embeds werden erst nach aktiver Zustimmung geladen.
 * - Ablehnen ist genauso einfach wie Zustimmen — beide Buttons sind gleich groß,
 *   gleich prominent und auf derselben Ebene. Kein Dark Pattern, keine Vorauswahl.
 * - Transparenz vor der Entscheidung: aufklappbare Liste aller Dienste.
 * - Widerruf jederzeit über den Footer-Link (siehe ConsentSettingsButton).
 * - Impressum und Datenschutz bleiben trotz Blocker jederzeit erreichbar:
 *   Direktlinks im Dialog + auf den Rechtsseiten wird nicht geblockt (§ 5 DDG
 *   verlangt eine unmittelbar erreichbare Anbieterkennzeichnung).
 */

/** Auf diesen Pfaden wird die Erstabfrage unterdrückt (Rechtsseiten + interner Admin-Bereich). */
const UNBLOCKED_ROUTES = [...LEGAL_PAGES.map((page) => `/${page.slug}`), "/admin"];

export default function CookieBanner() {
  const { autoOpen, manualOpen, categories, save, closeSettings } = useCookieConsent();
  const pathname = usePathname() ?? "/";
  const dialogRef = useRef<HTMLDivElement>(null);

  const onLegalRoute = UNBLOCKED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Erstabfrage nur außerhalb der Rechtsseiten; manuell geöffnet immer.
  const open = manualOpen || (autoOpen && !onLegalRoute);

  // Scroll sperren, solange der Dialog offen ist
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Fokus in den Dialog setzen und dort halten
  useEffect(() => {
    if (!open) return;
    const node = dialogRef.current;
    if (!node) return;

    const focusables = () =>
      Array.from(
        node.querySelectorAll<HTMLElement>(
          'button, a[href], summary, input, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null);

    focusables()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      // Escape darf die Erstabfrage nicht wegdrücken — es muss eine Entscheidung
      // getroffen werden. Manuell geöffnete Einstellungen dürfen abgebrochen werden.
      if (event.key === "Escape") {
        if (manualOpen) {
          event.preventDefault();
          closeSettings();
        }
        return;
      }
      if (event.key !== "Tab") return;

      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, manualOpen, closeSettings]);

  const acceptAll = useCallback(() => save(ALL_ACCEPTED), [save]);
  const rejectAll = useCallback(() => save(NECESSARY_ONLY), [save]);

  if (!open) return null;

  const alreadyDecided = categories !== null;

  return (
    <div className="consent-overlay" role="presentation">
      <div
        ref={dialogRef}
        className="consent-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
        aria-describedby="consent-text"
      >
        <div className="consent-orb" aria-hidden="true" />

        <div className="eyebrow">🔒 Datenschutz</div>
        <h2 id="consent-title" className="consent-title">
          Kurz halt, <span className="gradient">bevor&apos;s losgeht.</span>
        </h2>

        <p id="consent-text" className="consent-text">
          Diese Seite kommt ohne Tracking, ohne Werbe-Cookies und ohne Analyse-Tools aus. Was wir
          brauchen, ist deine Zustimmung für eine einzige Sache: die eingebetteten Videos von
          YouTube, Instagram, TikTok und Facebook. Sobald so ein Beitrag geladen wird, geht deine
          IP-Adresse an die jeweilige Plattform.
        </p>

        <details className="consent-details">
          <summary>Was hier genau passiert</summary>
          <ul className="consent-list">
            <li>
              <strong>Technisch notwendig — immer aktiv.</strong> Auslieferung der Seite über Vercel
              (Region Frankfurt), Inhalte und Formulare über Supabase (Region Frankfurt), Schriften
              werden von unserem eigenen Server geladen. Keine Cookies, kein Profil, kein Tracking.
            </li>
            <li>
              {/*
                Die Karte auf /shows lädt Kartenausschnitte von tile.openstreetmap.org und
                überträgt dabei die IP-Adresse. Das gehört hier genannt, sonst ist die Liste
                unvollständig — und die Aussage „nur Vercel und Supabase" wäre unwahr.
                Ausführlich in der Datenschutzerklärung, Ziffer 13.
              */}
              <strong>Karte der Spielorte.</strong> Auf „Shows &amp; Termine" kommt das
              Kartenmaterial von der OpenStreetMap Foundation (Vereinigtes Königreich). Dabei wird
              deine IP-Adresse übertragen — Cookies setzt der Dienst nicht, Profile bildet er
              nicht. Wer keine Karte laden will: Alle Termine stehen auf derselben Seite auch als
              Liste und im Kalender.
            </li>
            <li>
              <strong>Externe Medien — nur mit deiner Zustimmung.</strong> Eingebettete Videos und
              Beiträge von YouTube (Google Ireland Ltd. / Google LLC, USA), Instagram und Facebook
              (Meta Platforms Ireland Ltd.) sowie TikTok (TikTok Technology Ltd., Irland). Beim Laden
              werden IP-Adresse und Geräteinformationen an die jeweilige Plattform übertragen und
              Daten auf deinem Gerät gespeichert. Ohne Zustimmung zeigen wir statt des Beitrags eine
              Vorschau — du kannst jeden Beitrag dann trotzdem einzeln per Klick laden.
            </li>
          </ul>
          <p className="consent-note">
            Deine Entscheidung speichern wir 180 Tage lokal in deinem Browser. Du kannst sie
            jederzeit über „Datenschutz-Einstellungen“ im Footer ändern.
          </p>
        </details>

        {/*
          DSGVO Art. 7 / EDPB-Cookie-Banner-Taskforce:
          Beide Buttons sind bewusst identisch dimensioniert und gleich auffällig.
          Kein hervorgehobenes „Alles akzeptieren“ neben einem grauen Mini-Link.
        */}
        <div className="consent-actions">
          <button type="button" className="consent-btn consent-btn-reject" onClick={rejectAll}>
            Nur Notwendige
          </button>
          <button type="button" className="consent-btn consent-btn-accept" onClick={acceptAll}>
            Alle akzeptieren
          </button>
        </div>

        {alreadyDecided && manualOpen && (
          <button type="button" className="consent-cancel" onClick={closeSettings}>
            Abbrechen und Auswahl behalten
          </button>
        )}

        <p className="consent-links">
          <Link href="/datenschutz">Datenschutzerklärung</Link>
          <span aria-hidden="true"> · </span>
          <Link href="/impressum">Impressum</Link>
        </p>
      </div>
    </div>
  );
}
