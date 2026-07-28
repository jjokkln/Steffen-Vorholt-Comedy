"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { mediaUrl } from "@/lib/media";

/**
 * Bild aus dem Supabase-Storage, ausgeliefert über die Bild-Optimierung von Next/Vercel.
 *
 * Warum es diese Komponente gibt: Ein rohes `<img src={mediaUrl(...)}>` lädt bei JEDEM
 * Seitenaufruf das Original aus dem Storage — bei uns bis zu 7 MB pro Bild. Genau das hat
 * das Cached-Egress-Kontingent gesprengt. Über `next/image` holt der Optimizer das Original
 * einmal, cached die verkleinerte WebP-Variante (31 Tage, siehe next.config.ts) und liefert
 * sie an alle Besucher aus.
 *
 * Die Galerien layouten über eine feste Höhe und eine aus dem Bild folgende Breite
 * (`height:340px; width:auto`). `next/image` kann das ohne bekannte Maße nur mit `fill`,
 * und `fill` braucht einen Container mit Seitenverhältnis. Deshalb lernt der Wrapper das
 * echte Verhältnis beim Laden und setzt es als `aspect-ratio` — das Layout bleibt exakt
 * wie vorher, ohne dass Bildmaße in der Datenbank stehen müssen.
 */
export default function StorageImage({
  path,
  alt,
  sizes,
  className,
  /** Seitenverhältnis, bis das echte bekannt ist (verhindert eine 0-Pixel-Box). */
  fallbackRatio = 4 / 3,
  fit = "contain",
  priority,
  style,
}: {
  path: string;
  alt: string;
  /** Pflicht: die tatsächliche Anzeigebreite. Ohne sie nimmt next/image 100vw an. */
  sizes: string;
  className?: string;
  fallbackRatio?: number;
  fit?: "cover" | "contain";
  priority?: boolean;
  style?: CSSProperties;
}) {
  const [ratio, setRatio] = useState<number | null>(null);

  return (
    <span
      className={className ? `storage-image ${className}` : "storage-image"}
      style={{ aspectRatio: ratio ?? fallbackRatio, ...style }}
    >
      <Image
        src={mediaUrl(path)}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        style={{ objectFit: fit }}
        onLoad={(event) => {
          const img = event.currentTarget;
          if (img.naturalWidth > 0 && img.naturalHeight > 0) {
            setRatio(img.naturalWidth / img.naturalHeight);
          }
        }}
      />
    </span>
  );
}
