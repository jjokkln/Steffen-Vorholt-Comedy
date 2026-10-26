/**
 * Erkennt Formular-Spam, der die Bestätigungsmail als Verteiler missbraucht.
 *
 * Vom 23. bis 26.10.2026 kamen 418 Anfragen, je eine neue Adresse, gleichmäßig
 * zehn pro Stunde. Name und Nachricht waren ein Kurzlink. Der Zweck war nicht
 * Steffen, sondern die Bestätigung: Sie ging über Steffens Gmail an die fremde
 * Adresse und begann mit „Hi https://…". Die Bremsen je Adresse und je Quelle
 * greifen dagegen nicht — jede Anfrage kam von einer neuen Adresse.
 *
 * Links in der **Nachricht** bleiben erlaubt (ein Veranstalter verlinkt seine
 * Location). Die Nachricht steht seitdem nicht mehr in der Bestätigung, ein
 * Link dort erreicht also nur Steffen. Gesperrt wird, was in die Bestätigung
 * geschrieben wird: Name und die kurzen Felder.
 */
const LINK = /https?:\/\/|www\.|[\w-]+\.[a-z]{2,}\/\S/i;
// Für den Namen strenger, er steht in der Anrede: „Dr. Meier" bleibt erlaubt
// (Leerzeichen nach dem Punkt), „kaufen.shop" nicht.
const DOMAIN = /[\w-]+\.[a-z]{2,}\b/i;

export function siehtNachSpamAus(name: string, kurzfelder: string[]): boolean {
  if (LINK.test(name) || DOMAIN.test(name)) return true;
  return kurzfelder.some((wert) => LINK.test(wert));
}
