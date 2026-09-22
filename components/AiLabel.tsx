/**
 * Kennzeichnung KI-erzeugter oder KI-bearbeiteter Medien nach Art. 50 EU AI Act
 * (seit dem 2. August 2026 anwendbar).
 *
 * Verwendet werden ausschließlich die **offiziellen EU-Zeichen**, unverändert:
 * <https://digital-strategy.ec.europa.eu/en/policies/eu-icons-labelling-ai-generated-content>.
 * Die Dateien liegen unter `public/assets/ai/` und sind Kopien aus
 * `AI-OS/30_Knowledge/Referenzen/assets/` — nicht umfärben, nicht neu setzen,
 * die englische Bildschrift nicht übersetzen. Hier liegt bewusst nur die
 * `-white`-Fassung (weiße Pille, dunkle Schrift): die Seite ist durchgehend
 * dunkel, `-black` würde auf dem Sternenhimmel verschwinden.
 *
 * Das richtige der drei Zeichen zu wählen ist Pflicht, nicht Geschmack — ein
 * „vollständig generiert" auf einem nur überarbeiteten Foto ist eine
 * Falschangabe und damit schlechter als gar keine Kennzeichnung:
 *
 *   basic      KI war beteiligt; nur zusammen mit einem Textlabel verständlich
 *   generated  vollständig KI-erzeugt, außer dem Prompt kein menschlicher Anteil
 *   modified   menschlicher Inhalt teilweise per KI verändert
 *
 * Bis zum 21.09.2026 stand neben dem Zeichen ein deutscher Klartext („Bild mit
 * KI bearbeitet") auf einem dunklen Chip. Lennys Entscheidung: beides raus, das
 * Zeichen steht allein. Es trägt die Aussage selbst („AI MODIFIED" /
 * "AI GENERATED") und bringt seine eigene weiße Pille mit — der dunkle Grund war
 * eine Pille um eine Pille. Das EU-Nutzertesting spricht für einen
 * begleitenden Text; die Aussage bleibt deshalb im Alt-Text erhalten und ist
 * für Screenreader unverändert vorhanden. Wer den sichtbaren Text zurückholen
 * will, holt `.ai-label`-Grund und Textknoten zusammen zurück, nicht einzeln.
 *
 * Nicht zuständig für: die maschinenlesbare Markierung nach Art. 50 Abs. 2
 * (C2PA/IPTC in der Datei) und die Chatbot-Offenlegung nach Art. 50 Abs. 1
 * (die braucht einen Satz vor der ersten Eingabe, kein Bildzeichen).
 */

/** Seitenverhältnis je Zeichen, direkt aus der `viewBox` der Originaldatei. */
const SIGNS = {
  basic: {
    file: "ai-label-basic-white.svg",
    ratio: 566.93 / 566.93,
    alt: "EU-Kennzeichen: KI war an diesem Inhalt beteiligt",
  },
  generated: {
    file: "ai-label-generated-white.svg",
    ratio: 1789.84 / 566.93,
    alt: "EU-Kennzeichen für vollständig mit KI erzeugte Inhalte",
  },
  modified: {
    file: "ai-label-modified-white.svg",
    ratio: 1700.79 / 566.93,
    alt: "EU-Kennzeichen für mit KI bearbeitete Inhalte",
  },
} as const;

/**
 * Zeichenhöhe in px, muss zu `.ai-label img` in globals.css passen. Bei 16 px war
 * die Versalhöhe des eingesetzten Worts („MODIFIED") auf einem 1×-Display rund
 * 5 px und damit nur noch zu erahnen — 20 px war die Untergrenze, solange der
 * deutsche Text danebenstand. Ohne ihn trägt das Zeichen die Aussage allein,
 * deshalb zunächst 24 px und nach Lennys Sichtprüfung am 21.09.2026 noch einmal
 * 20 % mehr: 29 px.
 */
const SIGN_HEIGHT = 29;

export default function AiLabel({
  sign = "modified",
  className,
}: {
  sign?: keyof typeof SIGNS;
  className?: string;
}) {
  const { file, ratio, alt } = SIGNS[sign];

  return (
    <span className={className ? `ai-label ${className}` : "ai-label"}>
      {/* Bewusst kein next/image: der Optimizer verweigert SVG ohne
          `dangerouslyAllowSVG` (next.config.ts setzt es nicht, und dafür die
          Tür für fremde SVGs zu öffnen wäre der falsche Tausch). Ein 5-KB-
          Vektor hat vom Optimizer ohnehin nichts. Der Alt-Text ist deutsch,
          weil die Bildschrift englisch ist — eine Kennzeichnung, die ein
          Screenreader nicht vorliest, ist keine. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/assets/ai/${file}`} alt={alt} width={Math.round(SIGN_HEIGHT * ratio)} height={SIGN_HEIGHT} />
    </span>
  );
}
