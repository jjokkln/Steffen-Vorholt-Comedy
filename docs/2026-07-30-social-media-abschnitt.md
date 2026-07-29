# Social-Media-Abschnitt auf der Galerie-Seite (30.07.2026)

Branch: `worktree-social-media-galerie` · Migration: `supabase/migrations/0016_social_media_items.sql`

## Was drin ist

Auf `/galerie` gibt es zwischen Galerie und Gästebuch einen Abschnitt **„Social Media"**.
Gepflegt wird er im Admin unter **Website → Social Media** (`/admin/social`).

Zwei Sorten Eintrag:

| Art | Anzeige |
|---|---|
| **Kanal / Profil** | Chip mit Plattform-Icon in der Reihe über den Videos, verlinkt den Kanal. |
| **Video / Beitrag** | Kachel. YouTube, Instagram, TikTok und Facebook laufen als echter Player direkt auf der Seite (nach Cookie-Zustimmung); alles andere wird als anklickbare Kachel verlinkt. |

Unterstützte Plattformen mit eigenem Icon: YouTube, Instagram, TikTok, Facebook, X,
LinkedIn, Spotify, Website. Die Liste steht in [`lib/social.ts`](../lib/social.ts)
(`SOCIAL_PLATFORMS`) — eine weitere Plattform ist ein Frontend-Commit, keine Migration.
Unbekannte Werte in der DB fallen auf das Website-Icon zurück.

**Sichtbarkeit:** Jeder Eintrag hat einen Schalter (`is_active`, in der Liste „Ausblenden /
Einblenden"). Ist kein einziger Eintrag sichtbar, wird der Abschnitt auf der Website gar
nicht gerendert — keine Überschrift, kein leerer Rahmen.

## Noch offen — braucht Lenny

1. **Migration einspielen.** Der Supabase-MCP war in der Session nicht authentifiziert,
   deshalb liegt `0016_social_media_items.sql` nur im Repo. In einer interaktiven Session:
   `apply_migration` auf Projekt-Ref `insyjxxpeywehwnoazjr` (vorher `get_project_url`
   prüfen — das alte Projekt `unirwufvnfggwmdbkbpu` gehört nicht dazu). Danach
   `get_advisors` laufen lassen.
   Solange die Tabelle fehlt, bleibt die Website funktionsfähig: `getActiveSocialMediaItems`
   fängt `PGRST205` ab und liefert eine leere Liste (gleiches Muster wie `getVenues`).

2. **Datenschutzerklärung ergänzen.** Der Text steht in der DB (`legal_pages`), pflegbar
   unter `/admin/rechtliches/datenschutz` — deshalb hier nicht per Migration überschrieben.
   Abschnitt 8 heißt bisher „Externe Medien (YouTube)". Vorschlag: Überschrift auf
   **„8. Externe Medien (YouTube, Instagram, TikTok, Facebook) — nur mit Ihrer Einwilligung"**
   ändern und diesen Absatz hinter den bestehenden YouTube-Teil setzen:

   > Im Abschnitt „Social Media" der Galerie-Seite binden wir zusätzlich Beiträge der
   > Plattformen Instagram und Facebook (Anbieter: Meta Platforms Ireland Limited, Merrion
   > Road, Dublin 4, Irland) sowie TikTok (Anbieter: TikTok Technology Limited, 10 Earlsfort
   > Terrace, Dublin 2, Irland) ein. Es gilt dasselbe Verfahren wie bei YouTube: Ohne Ihre
   > Einwilligung sehen Sie lediglich einen Platzhalter, der auf unserem eigenen Server liegt;
   > es wird keine Verbindung zur jeweiligen Plattform aufgebaut und kein Vorschaubild
   > geladen. Erst wenn Sie einen Beitrag aktiv laden oder externe Medien im
   > Einwilligungs-Dialog dauerhaft erlauben, werden Ihre IP-Adresse, Informationen zu
   > Browser und Endgerät sowie die aufgerufene Seite an den jeweiligen Anbieter übertragen
   > und Informationen auf Ihrem Endgerät gespeichert bzw. ausgelesen; eine Übermittlung in
   > Drittländer ist dabei möglich. Sind Sie zugleich bei der Plattform eingeloggt, kann sie
   > den Aufruf Ihrem Konto zuordnen. Rechtsgrundlage ist Ihre Einwilligung nach Art. 6
   > Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG; Sie können sie jederzeit über
   > „Datenschutz-Einstellungen" im Fußbereich widerrufen.

   Grund: `CONSENT_VERSION` steht jetzt auf `2` (neue Empfänger ⇒ neue Einwilligung), der
   Cookie-Banner nennt die Plattformen bereits. Die Datenschutzerklärung muss mitziehen,
   sonst weicht der Text von der Realität ab.

3. **Erste Einträge anlegen** (Kanal-Links + zwei, drei Clips), damit der Abschnitt sichtbar
   wird. Nötig: die echten Kanal-URLs von Steffen.

## Bedienhinweise

- **Link zuerst einfügen** — Plattform und Format (quer/hochkant) werden daraus erkannt und
  vorausgewählt; die Auswahl lässt sich überschreiben. Unter dem Link steht sofort, ob der
  Beitrag als Player oder als Kachel erscheint.
- **Bei Videos die URL des einzelnen Beitrags** verwenden, nicht die Profil-URL — sonst gibt
  es keinen Player. TikTok-Kurzlinks (`vm.tiktok.com`) enthalten die Video-ID nicht und
  können nicht eingebettet werden.
- **Vorschaubild** braucht nur, was sich nicht einbetten lässt (X, LinkedIn). Ohne Bild zeigt
  die Kachel einen Verlauf in der Plattform-Farbe.
- **Formate möglichst nicht mischen:** Hochkant-Kacheln (9:16) sind rund dreimal so hoch wie
  Querformat. Über die Sortierung gruppieren, sonst entstehen im Raster Lücken.

## Nebenbei aufgefallen (nicht angefasst)

Die YouTube-Galerie auf Startseite/`/steffen` (`.youtube-frame`, 4 Spalten) schneidet den
Einwilligungs-Platzhalter unten ab — bei ~285 px Spaltenbreite passen Text, zwei Buttons und
Link nicht in einen 16:9-Kasten. Im neuen Abschnitt ist das über
`.social-frame[data-orientation="landscape"]:has(.yt-placeholder)` gelöst; dieselbe Zeile
würde `.youtube-frame` ebenfalls heilen. Bewusst nicht mitgeändert, weil an Startseite und
`globals.css` parallel gearbeitet wird.
