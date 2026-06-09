Erstellt: [Multi-Page Website Blueprint herunterladen](sandbox:/mnt/data/steffen-vorholt-final-multipage-website.zip)

## Medien, die ihr noch braucht

### 1. Steffen-Hauptmedien

| Medium                    | Dateiname                       |
| ------------------------- | ------------------------------- |
| Hero-Bühnenloop, 5–8 Sek. | `steffen-stage-loop-hero.webm`  |
| MP4-Fallback              | `steffen-stage-loop-hero.mp4`   |
| Hero-Fallback-Bild        | `steffen-hero-fallback.webp`    |
| Portrait Hauptseite       | `steffen-portrait-main.webp`    |
| Portrait Booking-Seite    | `steffen-portrait-booking.webp` |
| breites Bühnenbild        | `steffen-stage-wide.webp`       |

Pfad:

```txt
assets/media/steffen/
```

---

### 2. Brand / Logo

| Medium            | Dateiname                          |
| ----------------- | ---------------------------------- |
| Hauptlogo farbig  | `steffen-vorholt-logo-primary.svg` |
| weißes Logo       | `steffen-vorholt-logo-white.svg`   |
| Favicon           | `favicon.svg`                      |
| Social Share Bild | `social-share-default.webp`        |

Pfad:

```txt
assets/media/brand/
```

---

### 3. Brain Loading

| Medium        | Dateiname                       |
| ------------- | ------------------------------- |
| Hero-Bild     | `brain-loading-hero.webp`       |
| Bühnenloop    | `brain-loading-stage-loop.webm` |
| Planet-Grafik | `brain-loading-planet.webp`     |
| Kartenbild    | `brain-loading-card.webp`       |
| Galerie 1–3   | `brain-loading-gallery-01.webp` |

Pfad:

```txt
assets/media/shows/brain-loading/
```

---

### 4. Comedy Eiskalt

| Medium        | Dateiname                                    |
| ------------- | -------------------------------------------- |
| Hero-Bild     | `comedy-eiskalt-hero.webp`                   |
| Locationbild  | `comedy-eiskalt-location-eissportarena.webp` |
| Planet-Grafik | `comedy-eiskalt-planet.webp`                 |
| Kartenbild    | `comedy-eiskalt-card.webp`                   |
| Galerie 1–3   | `comedy-eiskalt-gallery-01.webp`             |

Pfad:

```txt
assets/media/shows/comedy-eiskalt/
```

---

### 5. Comedy Check-In

| Medium               | Dateiname                            |
| -------------------- | ------------------------------------ |
| Hero-Bild            | `comedy-check-in-hero.webp`          |
| Bühnenloop           | `comedy-check-in-stage-loop.webm`    |
| Planet-Grafik        | `comedy-check-in-planet.webp`        |
| Boarding-Pass-Grafik | `comedy-check-in-boarding-pass.webp` |
| Galerie 1–3          | `comedy-check-in-gallery-01.webp`    |

Pfad:

```txt
assets/media/shows/comedy-check-in/
```

---

## Benennungsregeln

```txt
alles-klein-schreiben.webp
keine Leerzeichen
keine Umlaute
keine Sonderzeichen
Wörter mit Bindestrich trennen
Galerien immer mit -01, -02, -03 nummerieren
```

Beispiel:

```txt
steffen-stage-loop-hero.webm
brain-loading-gallery-01.webp
comedy-eiskalt-location-eissportarena.webp
```

## Was ich geändert habe

Der neue Download ist kein Onepager mehr, sondern eine echte Multi-Page-Struktur:

```txt
index.html
shows/index.html
shows/brain-loading.html
shows/comedy-eiskalt.html
shows/comedy-check-in.html
termine.html
archiv.html
comedians-bewerben.html
steffen-buchen.html
admin/index.html
admin/shows.html
admin/termine.html
admin/kalender.html
admin/anfragen.html
admin/cms.html
```

Dazu:

```txt
assets/css/styles.css
assets/js/main.js
assets/data/events.json
docs/media-manifest.md
```

Die Inhalte basieren auf Steffens echter Website: Er positioniert sich dort als Comedian, Moderator und Veranstalter mit dem Comedy-Universum aus Brain Loading, Comedy Eiskalt und Comedy Check-In. ([steffenvorholt.de][1])
Brain Loading nutzt die echten öffentlich genannten Städte/Standorte: Bochum, Dortmund, Dortmund Uni, Düsseldorf, Essen, Köln und Oberhausen. ([steffenvorholt.de][2])
Comedy Eiskalt enthält die echte Location Eissportarena Bergisch Gladbach, Saaler Straße 100, sowie Beginn 20:00 Uhr und Ende 22:15 Uhr. ([steffenvorholt.de][3])

[1]: https://steffenvorholt.de/?utm_source=chatgpt.com "Ich bin Steffen Vorholt Comedian, Moderator und Veranstalter."
[2]: https://steffenvorholt.de/brain-loading/?utm_source=chatgpt.com "Brain Loading"
[3]: https://steffenvorholt.de/comedy-eiskalt-bergisch-gladbach/?utm_source=chatgpt.com "Comedy Eiskalt – Das coolste Comedy Open Mic"
