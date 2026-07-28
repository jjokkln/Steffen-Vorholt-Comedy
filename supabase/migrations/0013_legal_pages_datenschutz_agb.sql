-- Datenschutz und AGB kommen wie das Impressum aus legal_pages und werden im Dashboard
-- unter /admin/rechtliches/<slug> gepflegt.
--
-- Der Datenschutz-Text ist die wortgleiche Übernahme der bisher fest im Code stehenden
-- Seite (app/datenschutz/page.tsx), mit zwei Anpassungen:
--   * Die Platzhalter beim Verantwortlichen sind mit den Angaben aus dem Impressum gefüllt.
--   * Ziffer 6 beschreibt die Medien-Auslieferung neu: Bilder laufen jetzt über die
--     Bild-Optimierung des Hosters, nur noch Videos kommen direkt aus dem Supabase-Storage.
--
-- Der AGB-Text ist ein ENTWURF und ausdrücklich als solcher gekennzeichnet. Er muss vor
-- der Veröffentlichung juristisch geprüft und inhaltlich (Honorar, Fristen, Technik)
-- an die tatsächliche Praxis angepasst werden.

insert into legal_pages (slug, content) values (
  'datenschutz',
  $md$## 1. Verantwortlicher

Verantwortlich für die Datenverarbeitung auf dieser Website ist:
Steffen Vorholt
Further Str 127
41462 Neuss
Deutschland
E-Mail: steffen.vorholt.comedyshows@gmail.com

## 2. Hosting (Vercel)

Diese Website wird bei der Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA, gehostet. Beim Aufruf der Website verarbeitet Vercel als Auftragsverarbeiter technisch notwendige Daten (z. B. IP-Adresse, Datum und Uhrzeit des Zugriffs, abgerufene Seite, User-Agent), um die Auslieferung der Seite zu ermöglichen. Rechtsgrundlage ist unser berechtigtes Interesse an einer sicheren und effizienten Bereitstellung des Angebots (Art. 6 Abs. 1 lit. f DSGVO).

Es kann zu einer Übermittlung von Daten in die USA kommen. Mit Vercel besteht ein Auftragsverarbeitungsvertrag (Data Processing Addendum); die Übermittlung wird auf die Standardvertragsklauseln der EU-Kommission bzw. das EU-US Data Privacy Framework gestützt.

## 3. Server-Logfiles

Der Hosting-Anbieter erhebt und speichert automatisch Informationen in sogenannten Server-Logfiles, die Ihr Browser automatisch übermittelt. Dies sind insbesondere Browsertyp und -version, verwendetes Betriebssystem, Referrer-URL, Hostname des zugreifenden Rechners, Uhrzeit der Serveranfrage und die IP-Adresse. Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. Die Erfassung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO.

## 4. Cookies, Einwilligung und Cookie-Richtlinie

Diese Website setzt **keine** Tracking- oder Marketing-Cookies und bindet **keine** Analyse-Tools (z. B. Google Analytics, Vercel Analytics) ein. Es findet keine Reichweitenmessung und keine Profilbildung statt.

Verwendete Schriftarten (Inter, Space Grotesk) werden beim Erstellen der Website heruntergeladen und von unserem eigenen Server ausgeliefert. Beim Aufruf der Seite gehen dadurch **keine** Anfragen an Google-Server.

Im lokalen Speicher Ihres Browsers (localStorage) legen wir lediglich Ihre Datenschutz-Entscheidung unter dem Schlüssel *sv_consent* ab, damit Sie nicht bei jedem Besuch erneut gefragt werden. Gespeichert werden der Zeitpunkt und die von Ihnen gewählten Kategorien; die Angabe wird nach 180 Tagen automatisch ungültig. Diese Speicherung ist für den von Ihnen gewünschten Dienst unbedingt erforderlich und daher nach § 25 Abs. 2 Nr. 2 TDDDG einwilligungsfrei. Es werden keine Daten an uns oder Dritte übertragen.

Einwilligungspflichtig ist auf dieser Website ausschließlich das Laden externer Medien (siehe Ziffer 8). Rechtsgrundlage hierfür ist Ihre Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO in Verbindung mit § 25 Abs. 1 TDDDG. Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen — über den Link „Datenschutz-Einstellungen" im Fußbereich jeder Seite. Durch den Widerruf wird die Rechtmäßigkeit der bis dahin erfolgten Verarbeitung nicht berührt.

Im Administrationsbereich dieser Website (*/admin*) wird nach dem Login ein technisch notwendiges Sitzungs-Cookie gesetzt. Es dient ausschließlich der Authentifizierung der Betreiberin bzw. des Betreibers und ist für Besucherinnen und Besucher der Website ohne Bedeutung.

## 5. Kontaktaufnahme und Anfrageformulare

Wenn Sie uns über ein Formular (z. B. Booking-Anfrage oder Comedian-Bewerbung) oder per E-Mail kontaktieren, werden die von Ihnen angegebenen Daten (z. B. Name, E-Mail-Adresse, Telefonnummer, Nachrichteninhalt) zur Bearbeitung Ihrer Anfrage gespeichert. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen / Vertragsanbahnung) bzw. Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Beantwortung). Die Daten werden gelöscht, sobald sie für die Zweckerreichung nicht mehr erforderlich sind und keine gesetzlichen Aufbewahrungspflichten entgegenstehen.

Die über die Formulare übermittelten Angaben werden in einer Datenbank der Supabase Inc. gespeichert, die als Auftragsverarbeiter für uns tätig ist. Das genutzte Projekt wird ausschließlich in der Region **EU (Frankfurt am Main, Deutschland)** betrieben; eine Speicherung außerhalb der Europäischen Union findet nicht statt. Es besteht ein Auftragsverarbeitungsvertrag nach Art. 28 DSGVO.

Zusätzlich werden Sie und wir per E-Mail über den Eingang Ihrer Anfrage informiert. Der Versand erfolgt über den E-Mail-Server unseres Anbieters; dabei werden die von Ihnen angegebenen Daten übermittelt.

## 6. Bilder, Videos und Inhalte

Die Fotos dieser Website werden von unserem Hosting-Anbieter (Vercel, siehe Ziffer 2) in optimierter Form ausgeliefert. Ihre IP-Adresse wird dabei nur an diesen Anbieter übermittelt.

Videodateien liegen im Speicherdienst von Supabase (Region EU/Frankfurt) und werden von dort direkt geladen. Dabei wird Ihre IP-Adresse technisch bedingt an diesen Dienst übermittelt, um die Datei ausliefern zu können. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Auslieferung der Website). Die Daten verbleiben innerhalb der EU.

## 7. Externe Ticketdienste

Ticketlinks auf dieser Website führen zu externen Anbietern (u. a. Eventbrite, Rausgegangen). Sobald Sie einem solchen Link folgen, gelten die Datenschutzbestimmungen des jeweiligen Anbieters. Auf die dortige Datenverarbeitung haben wir keinen Einfluss.

## 8. Externe Medien (YouTube) — nur mit Ihrer Einwilligung

Auf einzelnen Seiten binden wir Videos der Plattform YouTube ein. Anbieter ist die Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland; Daten können dabei auch an die Google LLC in den USA übermittelt werden. Grundlage der Übermittlung sind die Standardvertragsklauseln der EU-Kommission bzw. das EU-US Data Privacy Framework.

Wir verwenden den erweiterten Datenschutzmodus (*youtube-nocookie.com*). Darüber hinaus werden die Videos **nicht automatisch geladen**: Solange Sie nicht eingewilligt haben, sehen Sie an ihrer Stelle lediglich einen Platzhalter, der auf unserem eigenen Server liegt. Es wird in diesem Zustand keinerlei Verbindung zu Google aufgebaut — auch keine Vorschaubilder.

Erst wenn Sie ein Video aktiv laden oder YouTube im Einwilligungs-Dialog dauerhaft erlauben, wird die Verbindung hergestellt. Dabei werden insbesondere Ihre IP-Adresse, Informationen über Ihren Browser und Ihr Endgerät sowie die aufgerufene Seite an Google übertragen und Informationen auf Ihrem Endgerät gespeichert bzw. ausgelesen. Sind Sie gleichzeitig bei Google eingeloggt, kann Google den Aufruf Ihrem Konto zuordnen. Rechtsgrundlage ist Ihre Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG. Sie können sie jederzeit über „Datenschutz-Einstellungen" im Fußbereich widerrufen.

Weitere Informationen zum Umgang mit Nutzerdaten finden Sie in der Datenschutzerklärung von Google unter [policies.google.com/privacy](https://policies.google.com/privacy).

Inhalte von Instagram, TikTok oder anderen sozialen Netzwerken werden **nicht** eingebettet. Verweise auf unsere Profile dort sind reine Links — erst durch Anklicken verlassen Sie diese Website.

## 9. Ihre Rechte

Sie haben gegenüber dem Verantwortlichen folgende Rechte hinsichtlich Ihrer personenbezogenen Daten:

- Recht auf Auskunft (Art. 15 DSGVO)
- Recht auf Berichtigung (Art. 16 DSGVO)
- Recht auf Löschung (Art. 17 DSGVO)
- Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)
- Recht auf Datenübertragbarkeit (Art. 20 DSGVO)
- Widerspruchsrecht gegen die Verarbeitung (Art. 21 DSGVO)
- Recht auf Widerruf einer erteilten Einwilligung (Art. 7 Abs. 3 DSGVO)

## 10. Beschwerderecht bei der Aufsichtsbehörde

Ihnen steht ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu. Zuständig ist in der Regel die Aufsichtsbehörde Ihres üblichen Aufenthaltsortes, Ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes.

## 11. SSL- bzw. TLS-Verschlüsselung

Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie an „https://" in der Adresszeile Ihres Browsers.
$md$
) on conflict (slug) do nothing;

insert into legal_pages (slug, content) values (
  'agb',
  $md$## Entwurf — bitte vor der Veröffentlichung prüfen

Dieser Text ist eine Arbeitsgrundlage und **keine Rechtsberatung**. Honorar, Fristen, Technikanforderungen und Ausfallregelungen müssen an die tatsächliche Praxis angepasst und die Klauseln juristisch geprüft werden, bevor die Seite verlinkt wird.

## 1. Geltungsbereich

Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge über Auftritte, Moderationen und sonstige künstlerische Leistungen zwischen

Steffen Vorholt, Further Str 127, 41462 Neuss (nachfolgend „Künstler")

und dem jeweiligen Auftraggeber (nachfolgend „Veranstalter").

Abweichende Bedingungen des Veranstalters werden nur wirksam, wenn der Künstler ihnen ausdrücklich in Textform zustimmt.

## 2. Vertragsschluss

Anfragen über das Kontaktformular dieser Website sind unverbindlich und stellen kein Angebot dar. Ein Vertrag kommt erst durch eine Auftragsbestätigung in Textform (E-Mail genügt) zustande. Darin werden insbesondere Termin, Ort, Auftrittsdauer, Leistungsumfang und Honorar festgehalten.

## 3. Leistungen des Künstlers

Der Künstler erbringt die im Vertrag vereinbarte Leistung persönlich. Inhalt und Ablauf des Programms bestimmt er künstlerisch frei, soweit nichts anderes vereinbart ist.

Ist der Künstler aus einem in seiner Person liegenden Grund verhindert, darf er die Leistung nur mit Zustimmung des Veranstalters durch eine gleichwertige Vertretung erbringen.

## 4. Pflichten des Veranstalters

Der Veranstalter stellt auf eigene Kosten und rechtzeitig zur Verfügung:

- eine geeignete Auftrittsfläche mit ausreichender Beleuchtung
- eine funktionsfähige Tonanlage mit Mikrofon, sofern nicht anders vereinbart
- einen abschließbaren Raum zur Vorbereitung sowie Getränke
- ungehinderten Zugang für Auf- und Abbau

Der Veranstalter ist für alle behördlichen Genehmigungen, die Anmeldung bei der GEMA sowie für die Einhaltung der Vorschriften zum Jugendschutz, Lärmschutz und zur Veranstaltungssicherheit verantwortlich.

## 5. Honorar, Reisekosten und Zahlung

Das Honorar ergibt sich aus der Auftragsbestätigung. Sofern nicht ausdrücklich als Bruttobetrag ausgewiesen, versteht es sich zuzüglich der gesetzlichen Umsatzsteuer.

Reise-, Übernachtungs- und Nebenkosten werden gesondert vereinbart. Die Zahlung ist ohne Abzug innerhalb von 14 Tagen nach Rechnungsstellung fällig, soweit nichts anderes vereinbart ist.

Die Künstlersozialabgabe trägt der Veranstalter, sofern er abgabepflichtig ist.

## 6. Absage durch den Veranstalter

Sagt der Veranstalter einen bestätigten Termin ab, kann der Künstler folgende Ausfallhonorare verlangen:

- bis 60 Tage vor dem Termin: kein Ausfallhonorar
- 59 bis 14 Tage vor dem Termin: 50 Prozent des vereinbarten Honorars
- ab 13 Tagen vor dem Termin: 100 Prozent des vereinbarten Honorars

Bereits entstandene Reise- und Nebenkosten sind in jedem Fall zu erstatten. Dem Veranstalter bleibt der Nachweis vorbehalten, dass ein Schaden nicht oder in geringerer Höhe entstanden ist.

## 7. Verhinderung und höhere Gewalt

Kann der Auftritt aus Gründen, die keine der Parteien zu vertreten hat (insbesondere Krankheit des Künstlers, behördliche Anordnungen, Naturereignisse), nicht stattfinden, entfällt die Leistungspflicht. Ein Honoraranspruch besteht in diesem Fall nicht; bereits geleistete Zahlungen werden zurückerstattet. Die Parteien bemühen sich vorrangig um einen Ersatztermin.

## 8. Bild-, Ton- und Videoaufnahmen

Aufnahmen des Auftritts zu gewerblichen Zwecken oder zur Veröffentlichung bedürfen der vorherigen Zustimmung des Künstlers in Textform. Der Künstler darf eigene Aufnahmen des Auftritts für die Bewerbung seiner Arbeit verwenden, sofern der Veranstalter nicht widerspricht.

Alle Urheber- und Leistungsschutzrechte am Programm bleiben beim Künstler.

## 9. Haftung

Der Künstler haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit. Bei einfacher Fahrlässigkeit haftet er nur für die Verletzung wesentlicher Vertragspflichten und begrenzt auf den vorhersehbaren, vertragstypischen Schaden.

Für die Sicherheit der Veranstaltung und für Schäden, die durch Besucher verursacht werden, haftet der Veranstalter.

## 10. Datenschutz

Für die Verarbeitung personenbezogener Daten im Zusammenhang mit Anfragen und Verträgen gilt die [Datenschutzerklärung](/datenschutz).

## 11. Schlussbestimmungen

Es gilt das Recht der Bundesrepublik Deutschland. Änderungen und Ergänzungen des Vertrages bedürfen der Textform.

Sollte eine Bestimmung dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
$md$
) on conflict (slug) do nothing;
