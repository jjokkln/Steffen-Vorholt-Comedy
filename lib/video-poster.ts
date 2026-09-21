/**
 * Standbild aus einer Videodatei greifen — im Browser, bevor das Video hochgeladen wird.
 *
 * Warum das sein muss: Alle Video-Kacheln der Website laden mit `preload="none"`
 * (Egress, siehe context/troubleshooting.md). Ohne `poster` hat der Browser damit nichts
 * zu malen — die Kachel bleibt eine schwarze Fläche auf dunklem Grund, also praktisch
 * unsichtbar. Genau das ist am 16.09.2026 mit „Brain Loading Trailer" passiert: Das Video
 * wurde ohne Vorschaubild gespeichert und war auf Desktop und iPad nicht zu sehen. Dass
 * es auf dem iPhone erschien, ist kein Gegenbeweis — Safari auf iOS hält sich nicht an
 * `preload="none"` und zieht das erste Bild trotzdem.
 *
 * Das Vorschaubild war bis dahin ein Formularfeld, das man leer lassen konnte. Ein
 * Pflichtfeld wäre die zweitbeste Lösung (der Redakteur müsste erst einen Screenshot
 * machen); besser ist, es gar nicht erst fragen zu müssen.
 *
 * Verfahren wie in lib/video-compress.ts: Objekt-URL → `<video>` → Canvas. Keine
 * Dependency, kein ffmpeg.wasm, kein Server.
 */

/** Sekunde, aus der das Standbild kommt. Bild 0 ist bei vielen Schnitten noch schwarz. */
const POSTER_AT_SECONDS = 1;
/** Längere Kante des Standbilds. Die Kachel ist nie breiter als ~700 px, 1280 reicht satt. */
const POSTER_LONG_EDGE = 1280;
/** Nach diesem Timeout wird aufgegeben — ein Upload darf daran nicht scheitern. */
const TIMEOUT_MS = 15_000;

async function encode(canvas: HTMLCanvasElement): Promise<Blob | null> {
  // WebP zuerst (rund 30 % kleiner als JPEG). `toBlob` liefert bei nicht unterstütztem
  // Format still PNG — daran erkennen wir den Fehlschlag, wie in ImageCropUpload.
  for (const [mime, quality] of [["image/webp", 0.82], ["image/jpeg", 0.85]] as const) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, quality));
    if (blob && blob.type === mime) return blob;
  }
  return null;
}

/**
 * Gibt das Standbild als Datei zurück — oder `null`, wenn es nicht klappt.
 *
 * Wirft nie: Ein fehlendes Vorschaubild ist ärgerlich, ein blockierter Upload wäre
 * schlimmer. Der Aufrufer entscheidet, was er dem Redakteur dazu sagt.
 */
export async function captureVideoPoster(file: File): Promise<File | null> {
  const url = URL.createObjectURL(file);
  try {
    return await posterFromSource(url, file.name);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Dasselbe für ein Video, das schon im Storage liegt — der Nachtrag-Knopf im Admin.
 * Klappt nur, weil die Buckets `access-control-allow-origin: *` senden: mit
 * `crossOrigin="anonymous"` bleibt das Canvas dadurch unverdorben und `toBlob()`
 * liefert ein Bild statt eines Sicherheitsfehlers.
 */
export async function captureRemoteVideoPoster(url: string, name = "video"): Promise<File | null> {
  return posterFromSource(url, name);
}

async function posterFromSource(src: string, name: string): Promise<File | null> {
  if (typeof document === "undefined") return null;

  const url = src;
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";

  try {
    const blob = await new Promise<Blob | null>((resolve) => {
      const timer = window.setTimeout(() => resolve(null), TIMEOUT_MS);
      const finish = (value: Blob | null) => {
        window.clearTimeout(timer);
        resolve(value);
      };

      video.onerror = () => finish(null);
      video.onloadeddata = () => {
        if (!video.videoWidth || !video.videoHeight) return finish(null);
        // Kurze Videos nicht über ihr Ende hinaus suchen.
        const target = Number.isFinite(video.duration)
          ? Math.min(POSTER_AT_SECONDS, Math.max(0, video.duration - 0.1))
          : 0;
        const grabFrame = async () => {
          try {
            const scale = Math.min(1, POSTER_LONG_EDGE / Math.max(video.videoWidth, video.videoHeight));
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(2, Math.round(video.videoWidth * scale));
            canvas.height = Math.max(2, Math.round(video.videoHeight * scale));
            const context = canvas.getContext("2d", { alpha: false });
            if (!context) return finish(null);
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            finish(await encode(canvas));
          } catch {
            finish(null);
          }
        };
        video.onseeked = () => void grabFrame();
        // `currentTime = 0` löst kein `seeked` aus, wenn die Position schon 0 ist —
        // dann direkt greifen, sonst wartet der Upload bis zum Timeout.
        if (target === 0 && video.currentTime === 0) void grabFrame();
        else video.currentTime = target;
      };
      video.src = url;
    });

    if (!blob) return null;
    const base = name.split("/").pop()?.replace(/\.[^.]+$/, "") || "video";
    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    return new File([blob], `${base}-poster.${ext}`, { type: blob.type });
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
  }
}
