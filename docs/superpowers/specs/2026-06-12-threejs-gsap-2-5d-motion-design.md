# Three.js + GSAP 2.5D Motion Upgrade - Design Spec

**Datum:** 2026-06-12
**Status:** Vom User in Architektur, Dramaturgie und Qualitaetsrahmen freigegeben
**Scope:** Startseite maximal ausarbeiten; wiederverwendbare GSAP-Transitions fuer weitere oeffentliche Seiten vorbereiten

## Ziel

Die Startseite soll sich wie eine zusammenhaengende Comedy-Galaxie anfuehlen, nicht wie eine Reihe einzeln eingeblendeter Sektionen. Die drei bestehenden Show-Planeten bleiben als markentreue 2.5D-Grafiken erhalten, bewegen sich aber in einer echten Three.js-Szene mit Tiefe, Perspektive und scrollgebundener Choreografie.

GSAP steuert die gemeinsame Dramaturgie von WebGL-Canvas und DOM. Der Hero wird auf Desktop fuer 1,5 Viewport-Hoehen angeheftet. Beim Scrollen durchlaufen die Planeten die Phasen **Ankunft -> Orbit -> Portal -> Landung**. Danach uebernehmen leichtere GSAP-Transitions die weiteren Startseitenabschnitte.

## Verbindliche Entscheidungen

1. **2.5D statt echter 3D-Modelle:** Die vorhandenen WebP-Planeten werden als Three.js-Sprites verwendet.
2. **Hybrid-Architektur:** Three.js rendert nur den Hero-Hintergrund und die Planetenwelt. Texte, Links, Buttons und Karten bleiben semantisches HTML.
3. **GSAP als Motion-Orchestrator:** `ScrollTrigger` kontrolliert Scrollfortschritt, Pinning, DOM-Reveals und die Three.js-Szenenparameter.
4. **Kein globaler Smooth-Scroll-Ersatz:** Natives Scrollen bleibt erhalten. ScrollSmoother oder eine eigene Scroll-Engine sind nicht Teil des Scopes.
5. **Desktop intensiv, Mobile reduziert:** Desktop nutzt Pinning und Tiefenflug. Mobile nutzt dieselben visuellen Motive, aber ohne angeheftete Scrollphase.
6. **Startseite zuerst:** Andere Seiten erhalten in dieser Ausbaustufe keine Three.js-Szene. Die GSAP-Transition-Komponente wird jedoch wiederverwendbar gebaut.
7. **Progressive Enhancement:** Ohne WebGL, bei Ladefehlern, bei `Save-Data` oder bei reduzierter Bewegung bleibt eine vollwertige statische Hero-Komposition sichtbar.
8. **Ein Motion-System auf der Startseite:** Die bisherigen Framer-Motion-Wrapper der Startseite werden durch GSAP ersetzt. Wenn danach keine Referenzen verbleiben, werden `framer-motion` und die obsoleten Motion-Komponenten entfernt.

## Nutzererlebnis und Dramaturgie

### 1. Ankunft

- Die statische Hero-Struktur ist sofort sichtbar und bleibt fuer SEO sowie No-JavaScript-Faelle erhalten.
- Nach dem Laden der Texturen blendet die Three.js-Szene ohne Layout-Sprung ein.
- Die Planeten kommen aus unterschiedlichen Z-Ebenen in die Szene.
- Die Headline wird mit einer kontrollierten GSAP-Sequenz aufgebaut; kein hektisches Einzelwort-Flackern.
- Sternenstaub und Planeten reagieren dezent auf die Zeigerposition. Die Zeigerreaktion bleibt der Scrollbewegung untergeordnet.

### 2. Orbit

- Auf Desktop wird der Hero mit `ScrollTrigger` angeheftet.
- Die Planeten durchlaufen unterschiedliche Pfade, Geschwindigkeiten, Skalierungen und Rotationen.
- Nahe Planeten bewegen sich staerker als entfernte Planeten und erzeugen echte Z-Parallaxe.
- Die Sticker-Labels bleiben DOM-Elemente. Ihre Bildschirmposition wird pro Renderframe aus den Three.js-Weltkoordinaten projiziert und direkt per `transform` aktualisiert, ohne React-State pro Frame.

### 3. Portal

- Ab 58 Prozent Scrollfortschritt wird Brain Loading zum visuellen Hauptobjekt.
- Der Planet vergroessert sich, kreuzt die Kamera seitlich und hinterlaesst eine farbige, performante Partikelspur.
- Der Hintergrund verschiebt sich von Violett zu tiefem Blau. Die Headline weicht leicht zur Seite und verliert kontrolliert an Deckkraft.
- Es wird kein schweres Postprocessing oder Bloom-Framework eingesetzt. Glow, Trails und Lichtwellen entstehen mit Sprite-/Point-Materialien, CSS-Verlaeufen und Alpha-Blending.

### 4. Landung

- Zwischen 82 und 100 Prozent Scrollfortschritt bewegen sich die drei Sprites sichtbar in Richtung der folgenden Show-Karten.
- Der Uebergang ist eine optische Uebergabe, kein pixelgenaues Shared-Element-Morphing. Dadurch bleibt die Animation robust gegen responsive Layoutaenderungen.
- Die Sprites blenden aus, waehrend die korrespondierenden Kartenplaneten und Karten zeitversetzt aus der Tiefe aufsteigen.
- Nach dem Ende der Hero-Sequenz wird der Canvas nicht weiter dauerhaft gerendert.

## Weitere Startseiten-Transitions

### Show-Sektion

- Die Sektion uebernimmt die Farbenergie des Portal-Uebergangs.
- Karten erscheinen mit leichtem Z-Versatz, Rotation und gestaffelter Skalierung.
- Die Planetenbilder in den Karten bleiben normale `next/image`-Elemente und erhalten nur GSAP-/CSS-Transforms.

### Termine

- Eine horizontale Lichtspur baut sich beim Eintritt in die Sektion von links nach rechts auf.
- Event-Karten folgen der Spur mit einem kurzen, klaren Stagger.
- Inhalte bleiben auch ohne Animation vollstaendig sichtbar.

### Buzzer

- Beim Eintritt laedt sich ein radialer Energiering um den Buzzer auf.
- Beim Klick bleiben Konfetti und One-Liner erhalten. GSAP ergaenzt einen kurzen, lokal begrenzten Camera-Shake des Buzzer-Containers und einen Energieimpuls.
- Eventhandler, die GSAP-Animationen erzeugen, werden ueber `contextSafe()` gebunden und sauber entfernt.

### Galerie

- Galerieelemente erscheinen als leicht versetzte, schwebende Missionsarchive.
- Rotation, Y-Versatz und Skalierung werden animiert; keine layoutintensiven Eigenschaften.
- Die Transition existiert nur, wenn Galeriedaten vorhanden sind.

### Steffen-Sektion

- Text und Video werden ueber einen weichen Lichtwechsel verbunden.
- Das Video wird aus einem `overflow: hidden`-Rahmen mit Scale- und Translate-Animation sichtbar. Teure Filteranimationen werden vermieden.

## Komponentenarchitektur

### `components/home/HeroScrollExperience.tsx`

Client-Komponente und Besitzerin der Hero-Choreografie.

- Erhaelt serialisierbare Planetendaten aus der bestehenden Supabase-Abfrage:
  - `id`
  - `slug`
  - `name`
  - `color`
  - bereits durch `mediaUrl()` aufgeloeste Bild-URL
- Rendert den semantischen Hero-DOM mit Headline, Text, Links und Proof-Zahlen.
- Rendert die statische Planetenkomposition als sofortige Fallback-Schicht.
- Initialisiert `useGSAP()` mit einem auf den Hero begrenzten Scope.
- Registriert Desktop-, Mobile- und Reduced-Motion-Varianten ueber `gsap.matchMedia()`.
- Besitzt ein stabiles `motionStateRef`, das Scrollfortschritt und Zeigerparallaxe enthaelt.
- Blendet den statischen Fallback erst aus, nachdem die WebGL-Szene alle Texturen erfolgreich geladen und den ersten Frame gerendert hat.

### `components/home/HeroGalaxyScene.tsx`

Client-Komponente fuer Three.js. Three.js wird innerhalb des Effects dynamisch importiert, damit die Bibliothek nicht fuer Server Rendering ausgefuehrt wird und der schwere Szenencode in einem eigenen Client-Chunk bleibt.

- Transparenter `WebGLRenderer` mit `alpha: true`, Antialiasing und `powerPreference: "high-performance"`.
- Perspektivkamera fuer Z-Tiefe und Kamerakreuzungen.
- Ein `THREE.Sprite` pro Show mit `SpriteMaterial`.
- Texturen nutzen `THREE.SRGBColorSpace`, transparente Materialien und deaktiviertes `depthWrite`, um Alpha-Artefakte zu vermeiden.
- Leichtes `Points`-Sternenfeld und begrenzte farbige Trail-Partikel.
- Kein OrbitControls, kein Postprocessing, keine Physik-Engine.
- `ResizeObserver` passt Renderer und Kamera an die reale Hero-Groesse an.
- Ein Renderloop laeuft nur, solange der Hero sichtbar ist und Bewegung erlaubt ist.
- `visibilitychange` und Intersection-Status pausieren die Szene.
- Cleanup entfernt Listener, stoppt den Renderloop und disposed Texturen, Materialien, Geometrien und Renderer.

### `components/home/SectionTransition.tsx`

Wiederverwendbarer Client-Wrapper fuer DOM-Sektionen.

Vorgesehene Varianten:

- `cards`: gestaffelte Karten mit Scale-/Y-/Rotationsbewegung
- `track`: Lichtspur plus nachlaufende Elemente
- `archive`: schwebende Bildstaffelung
- `reveal`: allgemeiner Text-/Medien-Uebergang

Die Komponente:

- nutzt `useGSAP()` mit lokalem Scope;
- animiert nur `transform`, `opacity`, CSS-Variablen und sparsam `clip-path`;
- setzt bei Reduced Motion sofort den Endzustand;
- wirkt nicht ausserhalb ihres Wrappers;
- stellt eine stabile Varianten-API fuer eine spaetere Wiederverwendung auf Shows, Termine und Kontakt bereit; deren Einbindung ist nicht Teil dieses Scopes.

### Pure Motion-Konfiguration

`lib/motion/hero-paths.ts` enthaelt keine React-, GSAP- oder Three.js-Imports.

Es definiert:

- normalisierte Keyframes pro Planet;
- Interpolation fuer Position, Skalierung, Rotation und Opacity;
- Desktop- und Mobile-Szenenkonfiguration;
- Clamping des Fortschritts auf `0..1`;
- Phasengrenzen fuer Ankunft, Orbit, Portal und Landung.

Diese Trennung macht die Scrollpfade deterministisch und direkt testbar.

## Datenfluss

1. `app/page.tsx` bleibt Server Component und laedt Shows, One-Liner, Galerie und Hero-Video wie bisher.
2. Die ersten drei aktiven Shows werden in ein kleines Planet-DTO umgewandelt.
3. `HeroScrollExperience` erhaelt nur serialisierbare Werte.
4. GSAP schreibt den normalisierten Scrollfortschritt in `motionStateRef.current.progress`.
5. `HeroGalaxyScene` liest diesen Wert im Renderloop und berechnet ueber `hero-paths.ts` die aktuellen Sprite-Transforms.
6. Bildschirmpositionen der Sprites werden fuer die DOM-Sticker projiziert.
7. Nach der Hero-Sequenz uebernehmen voneinander unabhaengige `SectionTransition`-Instanzen.

## ScrollTrigger-Konfiguration

### Desktop

- Media Query: `min-width: 901px` und `prefers-reduced-motion: no-preference`.
- `trigger`: Hero-Wrapper.
- `start`: `top top`.
- `end`: dynamisch `+=${Math.round(window.innerHeight * 1.5)}`.
- `pin: true`.
- `scrub: 0.9`.
- `anticipatePin` und `invalidateOnRefresh` werden aktiviert.
- Der Timeline-Fortschritt steuert sowohl DOM als auch Three.js-State.

### Mobile und Tablet

- Kein Pinning.
- Kuerzere Eintrittsanimation beim Sichtbarwerden.
- Geringere Z-Distanzen, weniger Partikel und niedrigeres DPR-Limit.
- Zeigerparallaxe wird fuer Touchgeraete deaktiviert.
- Die Planeten bleiben sichtbar, ohne Scrollen zu blockieren.

### Reduced Motion

- Kein WebGL-Renderloop, kein Pinning und kein Scrubbing.
- Die statische DOM-Komposition bleibt sichtbar.
- Headline, Zahlen und Sektionen erscheinen direkt im Endzustand.
- Bestehende CSS-Daueranimationen inklusive `.dot` und `.sticker` werden ebenfalls deaktiviert.

## Three.js-Szenendetails

### Kamera und Koordinaten

- Perspektivkamera mit einem Field of View von 38 Grad, damit Sprites nicht stark verzerren.
- Szenenpfade arbeiten in normalisierten, responsiven Weltkoordinaten.
- Die Kamera bleibt grundsaetzlich stabil; der Tiefeneindruck entsteht primaer durch Sprite-Z-Positionen und eine kleine Portal-Kamerabewegung.

### Texturen

- Die existierenden Show-Bilder bleiben die Quelle der Wahrheit und kommen weiterhin aus lokalen Medien oder Supabase Storage.
- Das Seitenverhaeltnis jedes Bildes wird nach dem Laden beibehalten.
- Die Szene wird erst als bereit markiert, wenn alle benoetigten Texturen geladen sind.
- Schlaegt eine Textur fehl, bleibt die statische Fallback-Schicht aktiv und die unvollstaendige Szene wird verworfen.

### Renderer-Budget

- Desktop-DPR wird auf `Math.min(window.devicePixelRatio, 1.75)` begrenzt.
- Mobile-DPR wird auf `Math.min(window.devicePixelRatio, 1.25)` begrenzt.
- Das Sternenfeld nutzt maximal 120 Punkte auf Desktop und 48 Punkte auf Mobile.
- Der Portal-Trail nutzt maximal 24 kurzlebige Punkte.
- Es gibt nur drei grosse Show-Sprites und ein kleines Partikelsystem.
- Keine Schattenmaps, keine Echtzeitlichter und keine Postprocessing-Pipeline.

## Paket- und Bestandsmigration

Neue Laufzeitabhaengigkeiten:

- `three`
- `gsap`
- `@gsap/react`

Neue Entwicklungsabhaengigkeit:

- `@types/three`

Nach erfolgreicher Migration der Startseite:

- `MouseParallax`, `WordReveal`, `Reveal` und `Counter` werden entfernt, sofern keine Referenzen verbleiben.
- `framer-motion` wird entfernt, sofern `rg` keine Nutzung mehr findet.
- `Planet.tsx` bleibt fuer Karten und andere statische Inhaltsbilder bestehen.
- Die bisherigen CSS-Float- und Hover-Effekte duerfen fuer Karten bestehen bleiben, muessen aber Reduced Motion vollstaendig respektieren.

## Fehlerfaelle und Fallbacks

### WebGL nicht verfuegbar

Die statische Hero-Komposition bleibt sichtbar. Es erscheint keine Fehlermeldung fuer Besucher.

### WebGL-Kontextverlust

Die Canvas-Schicht wird ausgeblendet, Ressourcen werden freigegeben und der statische Fallback wird wieder eingeblendet.

### Texturfehler

Die Szene startet nicht teilweise. Der statische Hero bleibt bestehen.

### JavaScript deaktiviert

Headline, CTAs, Proof-Zahlen und Planeten-Fallback sind im servergerenderten HTML sichtbar.

### Leere oder unvollstaendige Show-Daten

Nur Shows mit einer nichtleeren Bild-URL werden in die Szene aufgenommen. Mit weniger als drei Planeten wird die Choreografie aus der vorhandenen Anzahl aufgebaut; der Hero bleibt funktionsfaehig.

## Barrierefreiheit

- Canvas und dekorative Partikel erhalten `aria-hidden="true"`.
- Alle Inhalte und CTAs bleiben im DOM und in normaler Tab-Reihenfolge.
- Die Three.js-Szene faengt keine Pointer-Events ab.
- Kein Fokuszustand haengt von Animation oder Canvas ab.
- Pinning wird fuer Reduced Motion und kleine Viewports deaktiviert.
- Kontraste und bestehende semantische Ueberschriften bleiben unveraendert.

## Tests und Verifikation

### Automatisierte Tests, test-first

Neue Tests fuer `lib/motion/hero-paths.ts` werden vor der Implementierung geschrieben:

1. Fortschritt wird auf `0..1` begrenzt.
2. Start- und End-Keyframes liefern exakt ihre definierten Werte.
3. Zwischenwerte werden linear und deterministisch interpoliert.
4. Desktop- und Mobile-Konfiguration liefern unterschiedliche, gueltige Pfade.
5. Ein oder zwei vorhandene Planeten erzeugen weiterhin eine gueltige Szenenkonfiguration.

Bestehende Tests muessen weiterhin vollstaendig gruen bleiben.

### Build- und Codepruefung

- `npm test`
- `npm run build`
- Keine verbliebenen Framer-Motion-Imports, falls die Abhaengigkeit entfernt wird.
- Keine Three.js- oder Browser-API in Server Components.

### Manuelle Browserpruefung

- Desktop: Hero pinnt, scrubbt und gibt sauber an die Show-Sektion ab.
- Mobile: kein Pinning, keine horizontale Ueberbreite, lesbare Planetenkomposition.
- Reduced Motion: keine Daueranimation, kein Pinning, statischer Hero.
- WebGL-Fallback: statische Komposition bleibt voll nutzbar.
- Navigation per Tastatur bleibt waehrend und nach der Pin-Phase korrekt.
- Buzzer, Galerie und Video funktionieren nach der Motion-Migration unveraendert.

### Performance-Ziele

- Lighthouse Performance und SEO weiterhin mindestens 90.
- Kein Cumulative Layout Shift durch Canvas-Initialisierung.
- Die Three.js-Szene laedt nur auf der Startseite.
- Ziel: stabile 60 FPS auf modernen Desktopgeraeten; mobile Variante reduziert Partikel und Renderauflosung.
- Renderer pausiert ausserhalb des Hero-Bereichs und bei verborgenem Dokument.

## Context7-Grundlage

Die technische Richtung wurde gegen aktuelle Dokumentation abgeglichen:

- Three.js: `Sprite`, `SpriteMaterial`, `TextureLoader`, `SRGBColorSpace`, transparenter `WebGLRenderer`, Resize-Handling und `setAnimationLoop`.
- GSAP React: `useGSAP`, lokaler Scope, automatisches Context-Cleanup und `contextSafe`.
- GSAP ScrollTrigger: `pin`, `scrub`, `start`/`end`, responsive `matchMedia`-Setups und transformbasierte Animationen.

Referenzen:

- https://github.com/mrdoob/three.js
- https://github.com/greensock/react
- https://gsap.com/docs/v3/Plugins/ScrollTrigger/

## Nicht im Scope

- Echte 3D-Modelle oder GLTF-Dateien
- WebGPU als Pflichtpfad
- Globale Smooth-Scroll-Bibliothek
- Three.js auf Kalender-, Kontakt-, Admin- oder Rechteseiten
- Physik-Engine, Audio-Reaktivitaet oder Benutzersteuerung der Kamera
- Schweres Postprocessing wie Bloom-, Depth-of-Field- oder Motion-Blur-Pipelines
- Pixelgenaues Shared-Element-Morphing zwischen Canvas-Sprites und Show-Karten
