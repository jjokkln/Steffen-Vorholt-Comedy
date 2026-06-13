# Captain-Video vollständig in den Rahmen einpassen

## Ziel

Das Video im Abschnitt „Der Captain“ soll vollständig innerhalb des bestehenden
Hochformat-Rahmens sichtbar sein. Der Rahmen, sein Seitenverhältnis und seine
Abmessungen bleiben unverändert.

## Darstellung

- Das Video nutzt die gesamte verfügbare Rahmenfläche als Begrenzung.
- Das Seitenverhältnis des Videos bleibt erhalten.
- Kein Teil des Videos wird abgeschnitten oder herangezoomt.
- Falls Video und Rahmen geringfügig unterschiedliche Seitenverhältnisse haben,
  bleiben die freien Flächen schwarz.
- Wiedergabeschaltfläche, Rundung und Rahmenlinie bleiben unverändert.

## Umsetzung

Die Video-Darstellung wird über `width: 100%`, `height: 100%` und
`object-fit: contain` festgelegt. Eine spezifische CSS-Regel für das Captain-Video
stellt sicher, dass allgemeinere Video-Regeln diese Einpassung nicht überschreiben.

## Prüfung

Ein Regressionstest prüft die für die vollständige Einpassung erforderlichen
Styles. Anschließend werden Tests und Produktions-Build ausgeführt. Die Startseite
wird zusätzlich im Browser kontrolliert, um vollständige Sichtbarkeit ohne
Beschnitt zu bestätigen.
