"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import Lightbox, { type LightboxItem } from "@/components/Lightbox";
import { mediaUrl } from "@/lib/media";
import type { GalleryItem } from "@/lib/types";

export default function HomeGallery({ items }: { items: GalleryItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const lightboxItems: LightboxItem[] = items.map((item) => ({
    type: "image",
    src: mediaUrl(item.image_path),
    alt: item.caption || "Showfoto",
    caption: item.caption,
  }));

  return (
    <>
      <div className="gallery-grid">
        {items.map((item, index) => (
          <figure
            key={item.id}
            style={{ "--rot": `${(index % 3) - 1}deg` } as CSSProperties}
            onClick={() => setOpenIndex(index)}
          >
            <Image
              src={mediaUrl(item.image_path)}
              alt={item.caption || "Showfoto"}
              width={800}
              height={600}
            />
            {item.caption && <figcaption>{item.caption}</figcaption>}
          </figure>
        ))}
      </div>
      {openIndex !== null && (
        <Lightbox
          items={lightboxItems}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onIndexChange={setOpenIndex}
        />
      )}
    </>
  );
}
