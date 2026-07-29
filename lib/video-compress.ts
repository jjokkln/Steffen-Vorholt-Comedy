/**
 * Video-Komprimierung im Browser, bevor die Datei in den Supabase-Storage geht.
 *
 * Warum überhaupt: Das Storage-Kontingent ist endlich (Free-Plan), und ein Video direkt
 * aus dem Handy oder der Schnitt-Software hat leicht 80–300 MB — für ein Bildfeld auf
 * einer Website ist das zwei Größenordnungen zu viel. Nach dem Umkodieren sind es
 * typischerweise 5–25 MB bei praktisch identischer Anzeigequalität.
 *
 * Warum so und nicht mit ffmpeg.wasm: ffmpeg.wasm braucht ~30 MB WebAssembly und
 * `SharedArrayBuffer`, das ginge nur mit COOP/COEP-Headern für die ganze Domain — das
 * würde uns YouTube-Embeds und Karten zerschießen. Der Weg hier kommt ohne jede
 * Dependency aus: Video abspielen → Frames verkleinert auf ein Canvas zeichnen →
 * Canvas-Stream plus Tonspur über `MediaRecorder` neu kodieren.
 *
 * Preis dieses Verfahrens: Es läuft in Echtzeit (ein 60-Sekunden-Video braucht ~60 s)
 * und der Tab muss im Vordergrund bleiben. Deshalb die Obergrenze bei der Laufzeit und
 * die Regel: Wenn irgendetwas schiefgeht oder das Ergebnis nicht kleiner ist, wird
 * unverändert die Originaldatei hochgeladen. Komprimieren ist eine Optimierung,
 * kein Tor, an dem ein Upload scheitern darf.
 */

/** Kandidaten in Wunschreihenfolge: MP4/H.264 spielt überall, WebM ist der Rückfall. */
const MIME_CANDIDATES = [
  'video/mp4;codecs="avc1.4d002a,mp4a.40.2"',
  'video/mp4;codecs="avc1.42E01E,mp4a.40.2"',
  "video/mp4",
  'video/webm;codecs="vp9,opus"',
  'video/webm;codecs="vp8,opus"',
  "video/webm",
];

/** Länger als das komprimiert niemand freiwillig im Browser (Echtzeit-Verfahren). */
export const MAX_COMPRESS_SECONDS = 360;
/** Darunter lohnt das Umkodieren nicht — die Datei ist für Web-Auslieferung schon in Ordnung. */
export const COMPRESS_MIN_BYTES = 3 * 1024 * 1024;
/** Ergebnis muss mindestens 10 % kleiner sein, sonst behalten wir das Original. */
const MIN_GAIN = 0.9;
/**
 * Toleranz beim Vergleich „Bitrate der Quelle" gegen „Zielbitrate": Liegt die Quelle
 * schon auf oder unter dem Ziel, wird NICHT umkodiert.
 *
 * Ohne diese Prüfung passiert genau das Falsche: Der vorhandene Trailer (1080p, aber nur
 * 0,86 Mbit/s) würde mit 2,5 Mbit/s neu kodiert und dabei GRÖSSER — verifiziert am
 * 30.07.2026, Ergebnis „kein Gewinn" nach 61 Sekunden Rechenzeit. Die Prüfung vorab
 * spart die Minute und behält die bessere Datei.
 */
const BITRATE_TOLERANCE = 1.15;
const FALLBACK_FPS = 25;

export type CompressSkipReason =
  | "nicht unterstützt"
  | "schon klein genug"
  | "zu lang"
  | "kein Gewinn"
  | "fehlgeschlagen"
  | "abgeschaltet";

export interface CompressResult {
  /** Die hochzuladende Datei — komprimiert oder (bei `skipped`) das Original. */
  file: File;
  originalBytes: number;
  bytes: number;
  width: number;
  height: number;
  /** Gesetzt, wenn NICHT komprimiert wurde — Grund für die Anzeige im Admin. */
  skipped?: CompressSkipReason;
}

export interface CompressOptions {
  /** Längere Kante des Ergebnisses in Pixeln (kleinere Videos werden nicht hochskaliert). */
  longEdge: number;
  /** Ziel-Videobitrate in Mbit/s. */
  mbps: number;
  /** 0 … 1 während des Umkodierens. */
  onProgress?: (ratio: number) => void;
}

export function pickRecorderMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  return MIME_CANDIDATES.find((mime) => MediaRecorder.isTypeSupported(mime)) ?? "";
}

/** Kann dieser Browser überhaupt umkodieren? Steuert nur den Hinweistext im Admin. */
export function canCompressVideo(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    typeof HTMLCanvasElement.prototype.captureStream === "function" &&
    !!pickRecorderMime()
  );
}

function extensionFor(mime: string): string {
  return mime.startsWith("video/mp4") ? "mp4" : "webm";
}

/** Encoder mögen gerade Kantenlängen (Chroma-Subsampling). */
function evenSize(width: number, height: number, longEdge: number) {
  const scale = Math.min(1, longEdge / Math.max(width, height));
  const round = (value: number) => Math.max(2, Math.round((value * scale) / 2) * 2);
  return { width: round(width), height: round(height) };
}

function loadVideo(file: File): Promise<{ video: HTMLVideoElement; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "auto";
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.src = url;
    const fail = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Video konnte nicht gelesen werden."));
    };
    video.onerror = fail;
    video.onloadedmetadata = () => {
      if (!video.videoWidth || !video.videoHeight || !Number.isFinite(video.duration)) return fail();
      resolve({ video, url });
    };
  });
}

/**
 * Kodiert `file` kleiner und gibt die Datei zum Upload zurück. Wirft nicht: Im Fehlerfall
 * kommt das Original mit gesetztem `skipped` zurück.
 */
export async function compressVideo(file: File, options: CompressOptions): Promise<CompressResult> {
  const originalBytes = file.size;
  const bail = (skipped: CompressSkipReason, size = { width: 0, height: 0 }): CompressResult => ({
    file,
    originalBytes,
    bytes: originalBytes,
    width: size.width,
    height: size.height,
    skipped,
  });

  const mime = pickRecorderMime();
  if (!canCompressVideo()) return bail("nicht unterstützt");

  let url = "";
  let video: HTMLVideoElement | null = null;
  let audioContext: AudioContext | null = null;

  try {
    ({ video, url } = await loadVideo(file));
    const source = { width: video.videoWidth, height: video.videoHeight };

    if (video.duration > MAX_COMPRESS_SECONDS) return bail("zu lang", source);
    if (
      originalBytes < COMPRESS_MIN_BYTES &&
      Math.max(source.width, source.height) <= options.longEdge
    ) {
      return bail("schon klein genug", source);
    }
    // Bitrate der Quelle grob aus Größe und Laufzeit — siehe BITRATE_TOLERANCE.
    const sourceMbps = (originalBytes * 8) / ((video.duration || 1) * 1_000_000);
    if (sourceMbps <= options.mbps * BITRATE_TOLERANCE) return bail("schon klein genug", source);

    const target = evenSize(source.width, source.height, options.longEdge);
    const canvas = document.createElement("canvas");
    canvas.width = target.width;
    canvas.height = target.height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return bail("nicht unterstützt", source);

    const stream = canvas.captureStream(FALLBACK_FPS);

    // Ton über die Web-Audio-API abgreifen statt über `video.captureStream()`: So bleibt
    // die Vorschau lautlos (der Graph wird nie mit `destination` verbunden), während die
    // Tonspur trotzdem vollständig in der Aufnahme landet. `video.muted = true` würde
    // dagegen auch die Aufnahme stumm machen.
    try {
      const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtor) {
        audioContext = new AudioCtor();
        const destination = audioContext.createMediaStreamDestination();
        audioContext.createMediaElementSource(video).connect(destination);
        destination.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
      }
    } catch {
      // Kein Ton abgreifbar (z. B. Video ohne Tonspur) — Bild allein reicht.
    }

    const recorder = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: Math.round(options.mbps * 1_000_000),
      audioBitsPerSecond: 128_000,
    });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    const finished = new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: mime }));
      recorder.onerror = () => reject(new Error("Aufnahme fehlgeschlagen."));
    });

    let drawing = true;
    // Fortschritt nur in Stufen melden: `onProgress` hängt an einem React-State, und ein
    // Re-Render pro Frame würde dem Encoder Rechenzeit wegnehmen.
    let reported = -1;
    const draw = () => {
      if (!drawing || !video) return;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const ratio = Math.min(1, video.currentTime / (video.duration || 1));
      const step = Math.floor(ratio * 50);
      if (step !== reported) {
        reported = step;
        options.onProgress?.(ratio);
      }
    };
    // `requestVideoFrameCallback` liefert genau die tatsächlich dekodierten Frames; der
    // Intervall-Rückfall ist für Browser ohne diese API (dann eben feste 25 fps).
    type FrameCallbackVideo = HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number };
    const frameVideo = video as FrameCallbackVideo;
    let interval = 0;
    if (typeof frameVideo.requestVideoFrameCallback === "function") {
      const step = () => {
        if (!drawing) return;
        draw();
        frameVideo.requestVideoFrameCallback?.(step);
      };
      frameVideo.requestVideoFrameCallback(step);
    } else {
      interval = window.setInterval(draw, Math.round(1000 / FALLBACK_FPS));
    }

    const ended = new Promise<void>((resolve, reject) => {
      video!.onended = () => resolve();
      video!.onerror = () => reject(new Error("Wiedergabe abgebrochen."));
    });

    recorder.start(1000);
    video.currentTime = 0;
    await video.play();
    await ended;

    drawing = false;
    if (interval) window.clearInterval(interval);
    // Ein letzter Tick, damit der Recorder den Schluss noch mitbekommt.
    await new Promise((resolve) => window.setTimeout(resolve, 120));
    recorder.stop();
    const blob = await finished;

    stream.getTracks().forEach((track) => track.stop());
    if (!blob.size || blob.size > originalBytes * MIN_GAIN) return bail("kein Gewinn", source);

    const base = file.name.replace(/\.[^.]+$/, "") || "video";
    const compressed = new File([blob], `${base}-web.${extensionFor(mime)}`, { type: mime });
    options.onProgress?.(1);
    return {
      file: compressed,
      originalBytes,
      bytes: compressed.size,
      width: target.width,
      height: target.height,
    };
  } catch {
    return bail("fehlgeschlagen");
  } finally {
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }
    if (url) URL.revokeObjectURL(url);
    void audioContext?.close().catch(() => {});
  }
}
