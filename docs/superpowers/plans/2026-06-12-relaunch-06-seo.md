# Phase 6: SEO-Finish (JSON-LD, Sitemap, OG, Performance, Aufräumen) — Tasks 25–28

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Google Event Rich Results, saubere Indexierung, Social-Share-Bilder, Bild-Performance — und das Repo frei von toten Altlasten.

**Architecture:** JSON-LD als pure, getestete Builder-Funktionen (`lib/jsonld.ts`) + `<JsonLd>`-Renderer. Sitemap/Robots über die Next-Metadata-Konventionen (`app/sitemap.ts`, `app/robots.ts`). OG-Images via `next/og` (`opengraph-image.tsx`).

**Tech Stack:** `next/og`, `next/image`, Schema.org `ComedyEvent`.

---

### Task 25: JSON-LD (TDD) + Einbindung

**Files:**
- Create: `lib/jsonld.ts`, `components/JsonLd.tsx`
- Test: `tests/jsonld.test.ts`
- Modify: `app/page.tsx`, `app/termine/page.tsx`, `app/shows/[slug]/page.tsx`

- [ ] **Step 1: Failing Test** — `tests/jsonld.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { comedyEventJsonLd, personJsonLd, breadcrumbJsonLd } from "../lib/jsonld.ts";

test("comedyEventJsonLd mit Ticketlink", () => {
  const ld = comedyEventJsonLd({
    date: "2026-07-01", start_time: "20:00", city: "Köln", venue: "Club X",
    ticket_url: "https://tickets.example/1", showName: "Brain Loading", slug: "brain-loading",
  });
  assert.equal(ld["@type"], "ComedyEvent");
  assert.equal(ld.name, "Brain Loading – Köln");
  assert.equal(ld.startDate, "2026-07-01T20:00:00");
  assert.equal((ld.offers as { url: string }).url, "https://tickets.example/1");
  assert.equal((ld.performer as { name: string }).name, "Steffen Vorholt");
});

test("comedyEventJsonLd ohne Ticketlink hat keine offers", () => {
  const ld = comedyEventJsonLd({
    date: "2026-07-01", start_time: "", city: "Köln", venue: "",
    ticket_url: "", showName: "Brain Loading", slug: "brain-loading",
  });
  assert.equal(ld.startDate, "2026-07-01");
  assert.ok(!("offers" in ld));
});

test("personJsonLd + breadcrumbJsonLd", () => {
  assert.equal(personJsonLd()["@type"], "Person");
  const bc = breadcrumbJsonLd([{ name: "Shows", path: "/shows" }]);
  assert.equal(bc["@type"], "BreadcrumbList");
});
```

- [ ] **Step 2: `npm test`** → FAIL. Implementieren — `lib/jsonld.ts`:

```ts
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://steffenvorholt.de";

export function personJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Steffen Vorholt",
    jobTitle: "Comedian",
    url: SITE,
    description: "Comedian, Moderator und Veranstalter aus Neuss – Host von Brain Loading, Comedy Eiskalt und Comedy Check-In.",
  };
}

export function comedyEventJsonLd(e: {
  date: string;
  start_time: string;
  city: string;
  venue: string;
  ticket_url: string;
  showName: string;
  slug: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ComedyEvent",
    name: `${e.showName} – ${e.city}`,
    startDate: e.start_time ? `${e.date}T${e.start_time}:00` : e.date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: e.venue || e.city,
      address: { "@type": "PostalAddress", addressLocality: e.city, addressCountry: "DE" },
    },
    performer: { "@type": "Person", name: "Steffen Vorholt" },
    organizer: { "@type": "Person", name: "Steffen Vorholt", url: SITE },
    url: `${SITE}/shows/${e.slug}`,
    ...(e.ticket_url
      ? { offers: { "@type": "Offer", url: e.ticket_url, availability: "https://schema.org/InStock", priceCurrency: "EUR" } }
      : {}),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE}${item.path}`,
    })),
  };
}

/** EventRow + Join → Builder-Input. */
export function eventToJsonLdInput(e: {
  date: string; start_time: string; city: string; venue: string; ticket_url: string;
  shows?: { name: string; slug: string } | null;
}) {
  return {
    date: e.date, start_time: e.start_time, city: e.city, venue: e.venue,
    ticket_url: e.ticket_url, showName: e.shows?.name ?? "", slug: e.shows?.slug ?? "",
  };
}
```

`npm test` → PASS.

- [ ] **Step 3: `components/JsonLd.tsx`:**

```tsx
export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
```

- [ ] **Step 4: Einbinden.**
  - `app/page.tsx`: vor `<Footer />`: `<JsonLd data={personJsonLd()} />`
  - `app/termine/page.tsx`: `<JsonLd data={upcoming.map((e) => comedyEventJsonLd(eventToJsonLdInput(e)))} />`
  - `app/shows/[slug]/page.tsx`: `<JsonLd data={[breadcrumbJsonLd([{ name: "Shows", path: "/shows" }, { name: show.name, path: `/shows/${show.slug}` }]), ...upcoming.map((e) => comedyEventJsonLd(eventToJsonLdInput(e)))]} />`

- [ ] **Step 5: Verifikation** — Dev: Quelltext von `/termine` enthält `application/ld+json` mit `ComedyEvent`. Stichprobe in https://search.google.com/test/rich-results (sobald deployed). Build + Tests grün.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: JSON-LD (ComedyEvent, Person, Breadcrumbs) mit Tests"
```

---

### Task 26: Metadata-Basis, Sitemap, Robots

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/sitemap.ts`, `app/robots.ts`

- [ ] **Step 1: `app/layout.tsx`** — bestehendes `metadata`-Export erweitern (Felder ergänzen, vorhandene behalten):

```ts
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://steffenvorholt.de"),
  alternates: { canonical: "./" },
  openGraph: {
    siteName: "Steffen Vorholt Comedy",
    locale: "de_DE",
    type: "website",
  },
  // ...bestehende Felder (title/description) bleiben
};
```

- [ ] **Step 2: `app/sitemap.ts`:**

```ts
import type { MetadataRoute } from "next";
import { getActiveShows } from "@/lib/data";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://steffenvorholt.de";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const shows = await getActiveShows();
  return [
    { url: SITE, priority: 1, changeFrequency: "weekly" },
    { url: `${SITE}/shows`, changeFrequency: "weekly" },
    { url: `${SITE}/termine`, changeFrequency: "daily" },
    { url: `${SITE}/kontakt`, changeFrequency: "monthly" },
    ...shows.map((s) => ({ url: `${SITE}/shows/${s.slug}`, changeFrequency: "weekly" as const })),
  ];
}
```

- [ ] **Step 3: `app/robots.ts`:**

```ts
import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://steffenvorholt.de";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin"] }],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
```

- [ ] **Step 4: Verifikation** — Dev: `/sitemap.xml` listet alle Routen inkl. Show-Slugs, `/robots.txt` sperrt `/admin`. Build grün.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: metadataBase, Canonicals, dynamische Sitemap und robots.txt"
```

---

### Task 27: OG-Images (Default + pro Show)

**Files:**
- Create: `app/opengraph-image.tsx`, `app/shows/[slug]/opengraph-image.tsx`

- [ ] **Step 1: Default** — `app/opengraph-image.tsx`:

```tsx
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Steffen Vorholt – Comedy aus einer anderen Galaxie";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "linear-gradient(170deg,#06070f,#0a0d20)", color: "#fff" }}>
        <div style={{ fontSize: 30, color: "#f5d68a", letterSpacing: 6 }}>LIVE-COMEDY AUS NRW</div>
        <div style={{ fontSize: 84, fontWeight: 800, marginTop: 16 }}>Steffen Vorholt</div>
        <div style={{ fontSize: 40, marginTop: 12, color: "rgba(255,255,255,.78)" }}>Comedy aus einer anderen Galaxie.</div>
        <div style={{ fontSize: 28, marginTop: 48, color: "#7CFF6B" }}>steffenvorholt.de</div>
      </div>
    ),
    size,
  );
}
```

- [ ] **Step 2: Pro Show** — `app/shows/[slug]/opengraph-image.tsx`:

```tsx
import { ImageResponse } from "next/og";
import { getShowBySlug } from "@/lib/data";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Show von Steffen Vorholt";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const show = await getShowBySlug(slug);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "linear-gradient(170deg,#06070f,#0a0d20)", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div style={{ width: 150, height: 150, borderRadius: 9999, background: show?.color ?? "#7CFF6B", boxShadow: `0 0 80px ${show?.color ?? "#7CFF6B"}` }} />
          <div style={{ fontSize: 72, fontWeight: 800 }}>{show?.name ?? "Steffen Vorholt"}</div>
        </div>
        <div style={{ fontSize: 38, marginTop: 28, color: "rgba(255,255,255,.78)" }}>{show?.tagline ?? ""}</div>
        <div style={{ fontSize: 28, marginTop: 44, color: "#f5d68a" }}>steffenvorholt.de · Comedy von Steffen Vorholt</div>
      </div>
    ),
    size,
  );
}
```

- [ ] **Step 3: Verifikation** — Dev: `http://localhost:3000/shows/brain-loading/opengraph-image` liefert PNG mit Show-Farbe. Build grün.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: generierte OG-Images (Default + pro Show)"
```

---

### Task 28: next/image, Aufräumen, Schlussverifikation

**Files:**
- Modify: `next.config.ts`, `components/Planet.tsx`, `app/page.tsx` (Galerie), `app/shows/page.tsx`, `app/shows/[slug]/page.tsx`, `README.md`
- Delete: `lib/events.ts`, `tests/media-integration.test.mjs`, `components/ShowTermine.tsx` (falls nicht mehr referenziert)

- [ ] **Step 1: `next.config.ts`** — ergänzen:

```ts
images: {
  remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
},
```

- [ ] **Step 2: `<img>` → `next/image`** in: `components/Planet.tsx` (`<Image className="planet" src={...} alt={alt} width={size} height={size} />`), Galerie auf `app/page.tsx` (`<Image src={...} alt={...} width={800} height={600} style={{ width: "100%", height: 220, objectFit: "cover" }} />`), Show-Bilder auf `app/shows/page.tsx` und `app/shows/[slug]/page.tsx`. Das Nav-/Footer-Logo (SVG) bleibt `<img>`.

- [ ] **Step 3: Altlasten löschen**

```bash
rm lib/events.ts tests/media-integration.test.mjs
grep -rn "lib/events\b\|@/lib/events\"" app components lib   # Expected: keine Treffer
grep -rln "ShowTermine" app components || rm components/ShowTermine.tsx
```

- [ ] **Step 4: README aktualisieren** — Abschnitte: Stack (Next.js + Supabase + Resend), Setup (`npm i`, `.env.local` nach `.env.example`, Supabase-Migrationen ausführen), Admin (`/admin`, Accounts via Supabase), Befehle (`dev`, `build`, `test`).

- [ ] **Step 5: Schlussverifikation (Definition of Done aus dem Master-Plan):**

```bash
npm test && npm run build
```

Dann Production-Build lokal starten (`npm run start`) und manuell prüfen:
1. E2E-Admin-Flow: Login → Show anlegen (Planet-Upload) → `/shows/<slug>` live → Termin anlegen → Kalender + Startseite zeigen ihn → Anfrage absenden → Inbox + Mail → Impressum ändern → öffentlich sichtbar.
2. Redirects: `/kalender`, `/archiv`, `/steffen-buchen`, `/comedians-bewerben`, `/shows/brain-loading-termine`.
3. Lighthouse auf `/` (DevTools, Mobile): Performance ≥ 90, SEO ≥ 90 — sonst größte Posten fixen (typisch: Bildgrößen, Video-Preload `preload="none"` setzen).
4. macOS „Reduce Motion" an → Ticker/Planeten/Sternschnuppe stehen still.
5. Rich-Results-Test für `/termine` (nach Deploy).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: next/image, Altlasten entfernt, README – Relaunch komplett"
```
