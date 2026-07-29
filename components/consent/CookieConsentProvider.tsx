"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Consent-Verwaltung nach § 25 TDDDG / Art. 6 Abs. 1 lit. a DSGVO.
 *
 * Diese Website setzt selbst KEINE Tracking- oder Analyse-Cookies. Einwilligungs-
 * pflichtig ist genau eine Kategorie: "externe Medien" — YouTube-Embeds sowie die
 * Instagram-/TikTok-/Facebook-Beiträge im Social-Media-Abschnitt der Galerie.
 * Deren Einbindung greift auf das Endgerät zu und überträgt die IP-Adresse an
 * Google, Meta bzw. TikTok — ohne Einwilligung nicht zulässig, auch nicht bei
 * youtube-nocookie.com.
 *
 * Adaptiert aus growcore-starter (src/context/CookieConsentContext.tsx), hier
 * ohne Tailwind/GTM und um Kategorien, Versionierung und Widerruf erweitert.
 */

export type ConsentCategories = {
  /** YouTube-Embeds laden dürfen */
  externalMedia: boolean;
};

type StoredConsent = {
  version: number;
  /** Zeitpunkt der Einwilligung — Nachweisbarkeit nach Art. 7 Abs. 1 DSGVO */
  timestamp: number;
  categories: ConsentCategories;
};

// ─────────────────────────────────────────────
// Konstanten
// ─────────────────────────────────────────────

const STORAGE_KEY = "sv_consent";

/**
 * Wird hochgezählt, sobald sich die Kategorien oder die eingesetzten Dienste
 * ändern — dann muss erneut eingewilligt werden.
 *
 * 2 (30.07.2026): Der Social-Media-Abschnitt auf /galerie bettet zusätzlich
 * Instagram, TikTok und Facebook ein. Eine Einwilligung, die nur YouTube kannte,
 * deckt neue Empfänger nicht ab (Art. 4 Nr. 11 DSGVO) — deshalb neu abfragen.
 */
const CONSENT_VERSION = 2;

/** Gültigkeit der Einwilligung; DSK empfiehlt eine erneute Abfrage nach spätestens 12 Monaten. */
const CONSENT_VALIDITY_DAYS = 180;

export const NECESSARY_ONLY: ConsentCategories = { externalMedia: false };
export const ALL_ACCEPTED: ConsentCategories = { externalMedia: true };

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

type CookieConsentContextValue = {
  /** Erteilte Einwilligungen; null = noch keine Entscheidung getroffen */
  categories: ConsentCategories | null;
  /** localStorage wurde gelesen — vorher darf nichts gerendert werden (Hydration-Guard) */
  hydrated: boolean;
  /** Erstabfrage: noch keine Entscheidung vorhanden */
  autoOpen: boolean;
  /** Nutzer hat die Einstellungen selbst wieder geöffnet (Widerruf/Änderung) */
  manualOpen: boolean;
  /** Auswahl speichern und Banner schließen */
  save: (categories: ConsentCategories) => void;
  /** Banner erneut öffnen — für den Widerrufs-Link im Footer (Art. 7 Abs. 3 DSGVO) */
  openSettings: () => void;
  /** Manuell geöffnete Einstellungen ohne Änderung schließen */
  closeSettings: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

// ─────────────────────────────────────────────
// Hilfsfunktionen
// ─────────────────────────────────────────────

/** Liest gespeicherten Consent inkl. Ablauf- und Versionsprüfung. */
function loadConsent(): ConsentCategories | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredConsent;
    if (parsed?.version !== CONSENT_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    const expiresAt = parsed.timestamp + CONSENT_VALIDITY_DAYS * 24 * 60 * 60 * 1000;
    if (Date.now() > expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return { externalMedia: parsed.categories?.externalMedia === true };
  } catch {
    // Kaputte Daten → wie "keine Einwilligung" behandeln
    return null;
  }
}

function persistConsent(categories: ConsentCategories) {
  try {
    const payload: StoredConsent = {
      version: CONSENT_VERSION,
      timestamp: Date.now(),
      categories,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Privater Modus o. Ä. — dann gilt die Entscheidung nur für diese Sitzung.
  }
}

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<ConsentCategories | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  // localStorage ist beim SSR nicht verfügbar — Consent kann erst nach der
  // Hydration gelesen werden. Bis dahin gilt "keine Einwilligung".
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCategories(loadConsent());
    setHydrated(true);
  }, []);

  const save = useCallback((next: ConsentCategories) => {
    setCategories(next);
    persistConsent(next);
    setManualOpen(false);
  }, []);

  const openSettings = useCallback(() => setManualOpen(true), []);
  const closeSettings = useCallback(() => setManualOpen(false), []);

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      categories,
      hydrated,
      autoOpen: hydrated && categories === null,
      manualOpen,
      save,
      openSettings,
      closeSettings,
    }),
    [categories, hydrated, manualOpen, save, openSettings, closeSettings]
  );

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error("useCookieConsent muss innerhalb von CookieConsentProvider verwendet werden");
  }
  return ctx;
}
