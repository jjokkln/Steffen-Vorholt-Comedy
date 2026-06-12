insert into public.shows (slug, name, tagline, description, format_label, color, planet_image_path, principle_items, cities_text, sort_order) values
('brain-loading', 'Brain Loading', 'Die Comedy-Improshow, bei der du Regie führst.',
 'Hier trifft klassische Stand-up-Comedy auf einen unvorhersehbaren Impro-Teil. In der ersten Hälfte zeigen Comedians ihr Set. In der zweiten Hälfte entscheidet das Publikum per Buzzer, wie oft Ort, Aktion oder Figur wechseln.',
 'Impro', '#7CFF6B', '/assets/media/shows/brain-loading/brain-loading-planet.webp',
 '[{"title":"Hälfte 1","text":"Comedians aus ganz Deutschland zeigen ihr bestes Set."},{"title":"Buzzer","text":"Ein Zuschauer bekommt das Kommando."},{"title":"Hälfte 2","text":"Impro-Storys wechseln Ort, Aktion oder Figur."}]',
 'Bochum, Dortmund, Dortmund Uni, Düsseldorf, Essen, Köln und Oberhausen — 47 Shows in 7 Locations und 6 Städten.', 1),
('comedy-eiskalt', 'Comedy Eiskalt', 'Brich mit uns das Eis.',
 'Das Open-Mic-Format in der Eissportarena Bergisch Gladbach: roh, direkt und fair für Künstler.',
 'Open Mic', '#AEEBFF', '/assets/media/shows/comedy-eiskalt/comedy-eiskalt-planet.webp',
 '[{"title":"Open Mic","text":"Neue und erfahrene Comedians testen Material."},{"title":"Eissportarena","text":"Comedy an einem Ort, an dem sonst Schlittschuhe quietschen."},{"title":"Fair","text":"Faire Bedingungen und echtes Feedback für Künstler."}]',
 'Bergisch Gladbach — Eissportarena.', 2),
('comedy-check-in', 'Comedy Check-In', 'Boarding in die Comedy-Galaxie.',
 'Captain Steffen und ein wechselnder Co-Pilot steuern das Publikum durch einen besonderen Comedy-Abend.',
 'Boarding-Show', '#FF9F43', '/assets/media/shows/comedy-check-in/comedy-check-in-planet.webp',
 '[{"title":"Boarding","text":"Das Publikum checkt ein, der Captain übernimmt."},{"title":"Co-Pilot","text":"Jede Ausgabe mit wechselndem Co-Piloten."},{"title":"Turbulenzen","text":"Geplant ist nur der Start — der Rest ist Comedy."}]',
 'NRW — wechselnde Locations.', 3);

insert into public.events (show_id, date, start_time, entry_time, city, venue, ticket_url, provider) values
((select id from public.shows where slug = 'brain-loading'), '2026-02-12', '20:00', '19:00', 'Oberhausen', 'Druckluft',
 'https://www.eventbrite.de/e/brain-loading-die-comedy-improshow-in-oberhausen-tickets-1597741952189', 'Eventbrite'),
((select id from public.shows where slug = 'brain-loading'), '2026-04-09', '20:00', '19:00', 'Neuss', 'Further Str. 127',
 'https://t.rausgegangen.de/tickets/brain-loading-63', 'Rausgegangen');

insert into public.one_liners (text) values
('Mein Gehirn lädt noch... 87 %... bitte nicht neu starten.'),
('Ich bin Comedian geworden, weil mein Plan B noch schlechter war.'),
('Applaus ist wie WLAN: Man merkt erst, wie wichtig er ist, wenn er weg ist.'),
('Impro heißt: Wir wissen auch nicht, was gleich passiert. Versprochen.'),
('In Neuss geboren, auf der Bühne zu Hause, im Weltall gebucht.');

insert into public.legal_pages (slug, content) values
('impressum', '## Angaben gemäß § 5 DDG

[Vor- und Nachname]
[Straße und Hausnummer]
[PLZ und Ort]
Deutschland

## Kontakt

Telefon: [Telefonnummer]
E-Mail: [E-Mail-Adresse]

## Umsatzsteuer-ID

Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:
[USt-IdNr. — oder diesen Abschnitt entfernen]

## Redaktionell verantwortlich (§ 18 Abs. 2 MStV)

[Name]
[Anschrift wie oben]

## EU-Streitschlichtung

Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr/. Unsere E-Mail-Adresse finden Sie oben im Impressum.

## Verbraucherstreitbeilegung / Universalschlichtungsstelle

Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.

## Haftung für Inhalte

Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt.

## Haftung für Links

Unser Angebot enthält Links zu externen Websites Dritter (u. a. Ticketanbieter), auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.

## Urheberrecht

Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.');

insert into public.site_media (key, file_path) values
('hero_video', '/assets/media/steffen/steffen-stage-loop-hero.mp4');
