"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Image from "next/image";
import { mediaUrl } from "@/lib/media";
import { GALLERY_CATEGORIES, type GalleryItem } from "@/lib/types";

export default function GalleryFilter({ items }: { items: GalleryItem[] }) {
  const [filter, setFilter] = useState<string>("alle");

  const visible = useMemo(
    () => (filter === "alle" ? items : items.filter((g) => g.category === filter)),
    [items, filter],
  );

  return (
    <>
      <div className="filters" role="tablist" aria-label="Galerie filtern">
        <button
          type="button"
          role="tab"
          aria-selected={filter === "alle"}
          className={`chip${filter === "alle" ? " active" : ""}`}
          onClick={() => setFilter("alle")}
        >
          Alle
        </button>
        {GALLERY_CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            role="tab"
            aria-selected={filter === c.key}
            className={`chip${filter === c.key ? " active" : ""}`}
            onClick={() => setFilter(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="gallery-grid" style={{ marginTop: 20 }}>
        {visible.map((item, index) => (
          <figure key={item.id} style={{ "--rot": `${(index % 3) - 1}deg` } as CSSProperties}>
            <Image
              src={mediaUrl(item.image_path)}
              alt={item.caption || "Showfoto"}
              width={800}
              height={600}
              style={{ width: "100%", height: 220, objectFit: "cover" }}
            />
            {item.caption && <figcaption>{item.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </>
  );
}
