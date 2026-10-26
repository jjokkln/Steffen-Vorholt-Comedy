import { initBotId } from "botid/client/core";

/**
 * Vercel BotID: unsichtbare Bot-Erkennung für das Kontaktformular, kein Rätsel
 * für Besucher. Der Browser hängt beim Absenden einen Nachweis an die Anfrage;
 * `checkBotId()` in `lib/actions/submit-inquiry.ts` prüft ihn. Server-Actions
 * gehen als POST an die Seite, auf der das Formular steht.
 *
 * Kein neuer Drittanbieter: BotID läuft bei Vercel, das ohnehin hostet. In der
 * Datenschutzerklärung steht es unter „Schutz vor automatisierten Anfragen".
 */
initBotId({
  protect: [{ path: "/kontakt", method: "POST" }],
});
