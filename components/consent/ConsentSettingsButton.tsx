"use client";

import { useCookieConsent } from "@/components/consent/CookieConsentProvider";

/**
 * Öffnet den Einwilligungs-Dialog erneut. Pflicht nach Art. 7 Abs. 3 DSGVO:
 * Der Widerruf muss so einfach möglich sein wie die Erteilung — deshalb steht
 * dieser Link dauerhaft im Footer, direkt neben Impressum und Datenschutz.
 */
export default function ConsentSettingsButton() {
  const { openSettings } = useCookieConsent();
  return (
    <button type="button" className="consent-settings-link" onClick={openSettings}>
      Datenschutz-Einstellungen
    </button>
  );
}
