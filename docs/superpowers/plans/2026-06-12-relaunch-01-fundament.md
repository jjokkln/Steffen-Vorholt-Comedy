# Phase 1: Fundament (Supabase, Clients, Daten-Layer) — Tasks 1–5

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Supabase-Backend (Schema, RLS, Storage, Seed) + typsicherer Datenzugriffs-Layer, auf dem alle weiteren Phasen aufbauen.

**Architecture:** Zwei Supabase-Clients: cookie-loser Public-Client (statische öffentliche Seiten) und `@supabase/ssr`-Client (Admin). Pure Helper (Datum/Partition) sind framework-frei und getestet.

**Tech Stack:** Supabase, `node --test` mit nativen TS-Imports.

---

### Task 1: Dependencies + Env-Gerüst

**Files:**
- Modify: `package.json` (Scripts: `test`)
- Create: `.env.example`

- [x] **Step 1: Pakete installieren**

```bash
npm install @supabase/supabase-js @supabase/ssr resend framer-motion canvas-confetti
npm install -D @types/canvas-confetti
```

- [x] **Step 2: Test-Script umstellen** — in `package.json` ersetzen:

```json
"test": "node --test tests/"
```

(Der alte Media-Test `tests/media-integration.test.mjs` bleibt vorerst liegen; er wird in Task 28 gelöscht. Falls er bei `node --test tests/` fehlschlägt, weil sich Dateien geändert haben: erst in Task 28 relevant — bis dahin darf er gelöscht werden, sobald er bricht.)

- [x] **Step 3: `.env.example` anlegen**

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
RESEND_API_KEY=
EMAIL_FROM=onboarding@resend.dev
NOTIFICATION_EMAIL=
NEXT_PUBLIC_SITE_URL=https://steffenvorholt.de
```

- [x] **Step 4: Build prüfen** — `npm run build` → Expected: fehlerfrei.

- [x] **Step 5: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: Supabase-, Resend- und Motion-Dependencies + Env-Vorlage"
```

---

### Task 2: Supabase-Projekt, Schema, RLS, Storage, Seed

**Files:**
- Create: `supabase/migrations/0001_init.sql`
- Create: `supabase/seed.sql`

- [ ] **Step 1: 🛑 STOP — User-Input nötig.** Den User (Lenny) bitten: Supabase-Projekt anlegen (Region EU/Frankfurt), dann `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` eintragen. Außerdem in Supabase unter Auth → Sign In/Up: **Signups deaktivieren** und zwei Accounts manuell anlegen (Steffen + Lenny, E-Mail + Passwort). Erst weitermachen, wenn `.env.local` gefüllt ist.

- [ ] **Step 2: Migration schreiben** — `supabase/migrations/0001_init.sql`:

```sql
-- Tabellen
create table public.shows (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text not null default '',
  description text not null default '',
  format_label text not null default '',
  color text not null default '#7CFF6B',
  planet_image_path text not null default '',
  principle_items jsonb not null default '[]',
  cities_text text not null default '',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.shows(id) on delete cascade,
  date date not null,
  start_time text not null default '',
  entry_time text not null default '',
  city text not null,
  venue text not null default '',
  ticket_url text not null default '',
  provider text not null default '',
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('booking','comedian')),
  name text not null,
  email text not null,
  phone text not null default '',
  message text not null default '',
  payload jsonb not null default '{}',
  status text not null default 'new' check (status in ('new','read','answered')),
  created_at timestamptz not null default now()
);

create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  caption text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.one_liners (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.legal_pages (
  slug text primary key,
  content text not null default '',
  updated_at timestamptz not null default now()
);

create table public.site_media (
  key text primary key,
  file_path text not null,
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.shows enable row level security;
alter table public.events enable row level security;
alter table public.inquiries enable row level security;
alter table public.gallery_items enable row level security;
alter table public.one_liners enable row level security;
alter table public.legal_pages enable row level security;
alter table public.site_media enable row level security;

create policy "public read shows" on public.shows for select using (true);
create policy "public read events" on public.events for select using (is_published);
create policy "public insert inquiries" on public.inquiries for insert with check (true);
create policy "public read gallery" on public.gallery_items for select using (true);
create policy "public read one_liners" on public.one_liners for select using (is_active);
create policy "public read legal" on public.legal_pages for select using (true);
create policy "public read site_media" on public.site_media for select using (true);

create policy "admin all shows" on public.shows for all to authenticated using (true) with check (true);
create policy "admin all events" on public.events for all to authenticated using (true) with check (true);
create policy "admin all inquiries" on public.inquiries for all to authenticated using (true) with check (true);
create policy "admin all gallery" on public.gallery_items for all to authenticated using (true) with check (true);
create policy "admin all one_liners" on public.one_liners for all to authenticated using (true) with check (true);
create policy "admin all legal" on public.legal_pages for all to authenticated using (true) with check (true);
create policy "admin all site_media" on public.site_media for all to authenticated using (true) with check (true);

-- Storage-Buckets (öffentlich lesbar, Schreiben nur authentifiziert)
insert into storage.buckets (id, name, public) values
  ('planets','planets', true), ('gallery','gallery', true), ('media','media', true);

create policy "public read media buckets" on storage.objects for select
  using (bucket_id in ('planets','gallery','media'));
create policy "admin insert media buckets" on storage.objects for insert to authenticated
  with check (bucket_id in ('planets','gallery','media'));
create policy "admin update media buckets" on storage.objects for update to authenticated
  using (bucket_id in ('planets','gallery','media'));
create policy "admin delete media buckets" on storage.objects for delete to authenticated
  using (bucket_id in ('planets','gallery','media'));
```

- [ ] **Step 3: Seed schreiben** — `supabase/seed.sql`. Inhalte stammen aus `lib/events.ts`, `app/page.tsx`, `app/shows/*/page.tsx` und `app/impressum/page.tsx` (Bestand). Die beiden Mock-„Termin pflegen"-Events werden NICHT migriert.

```sql
insert into public.shows (slug, name, tagline, description, format_label, color, planet_image_path, principle_items, cities_text, sort_order) values
('brain-loading', 'Brain Loading', 'Die Comedy-Improshow, bei der du Regie führst.',
 'Hier trifft klassische Stand-up-Comedy auf einen unvorhersehbaren Impro-Teil. In der ersten Hälfte zeigen Comedians ihr Set. In der zweiten Hälfte entscheidet das Publikum per Buzzer, wie oft Ort, Aktion oder Figur wechseln.',
 'Impro', '#7CFF6B', '/assets/media/shows/brain-loading/brain-loading-planet.webp',
 '[{"title":"Hälfte 1","text":"Comedians aus ganz Deutschland zeigen ihr bestes Set."},{"title":"Buzzer","text":"Ein Zuschauer bekommt das Kommando."},{"title":"Hälfte 2","text":"Impro-Storys wechseln Ort, Aktion oder Figur."}]',
 'Bochum, Dortmund, Dortmund Uni, Düsseldorf, Essen, Köln und Oberhausen — 47 Shows in 7 Locations und 6 Städten.', 1),
('comedy-eiskalt', 'Comedy Eiskalt', 'Brich mit uns das Eis.',
 'Das Open-Mic-Format in der Eissportarena Bergisch Gladbach: roh, direkt und fair für Künstler.',
 'Open Mic', '#AEEBFF', '/assets/media/shows/comedy-eiskalt/comedy-eiskalt-planet.webp',
 '[{"title":"Open Mic","text":"Neue und erfahrene Comedians testen Material."},{"title":"Eissportarena","text":"Comedy an einem Ort, an dem sonst Schlittschuhe quietschen."},{"title":"Fair","text":"Faire Bedingungen und echtes Feedback für Künstler."}]',
 'Bergisch Gladbach — Eissportarena.', 2),
('comedy-check-in', 'Comedy Check-In', 'Boarding in die Comedy-Galaxie.',
 'Captain Steffen und ein wechselnder Co-Pilot steuern das Publikum durch einen besonderen Comedy-Abend.',
 'Boarding-Show', '#FF9F43', '/assets/media/shows/comedy-check-in/comedy-check-in-planet.webp',
 '[{"title":"Boarding","text":"Das Publikum checkt ein, der Captain übernimmt."},{"title":"Co-Pilot","text":"Jede Ausgabe mit wechselndem Co-Piloten."},{"title":"Turbulenzen","text":"Geplant ist nur der Start — der Rest ist Comedy."}]',
 'NRW — wechselnde Locations.', 3);

insert into public.events (show_id, date, start_time, entry_time, city, venue, ticket_url, provider) values
((select id from public.shows where slug = 'brain-loading'), '2026-02-12', '20:00', '19:00', 'Oberhausen', 'Druckluft',
 'https://www.eventbrite.de/e/brain-loading-die-comedy-improshow-in-oberhausen-tickets-1597741952189', 'Eventbrite'),
((select id from public.shows where slug = 'brain-loading'), '2026-04-09', '20:00', '19:00', 'Neuss', 'Further Str. 127',
 'https://t.rausgegangen.de/tickets/brain-loading-63', 'Rausgegangen');

insert into public.one_liners (text) values
('Mein Gehirn lädt noch... 87 %... bitte nicht neu starten.'),
('Ich bin Comedian geworden, weil mein Plan B noch schlechter war.'),
('Applaus ist wie WLAN: Man merkt erst, wie wichtig er ist, wenn er weg ist.'),
('Impro heißt: Wir wissen auch nicht, was gleich passiert. Versprochen.'),
('In Neuss geboren, auf der Bühne zu Hause, im Weltall gebucht.');

insert into public.legal_pages (slug, content) values
('impressum', '## Angaben gemäß § 5 DDG

[Vor- und Nachname]
[Straße und Hausnummer]
[PLZ und Ort]
Deutschland

## Kontakt

Telefon: [Telefonnummer]
E-Mail: [E-Mail-Adresse]

## Umsatzsteuer-ID

Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:
[USt-IdNr. — oder diesen Abschnitt entfernen]

## Redaktionell verantwortlich (§ 18 Abs. 2 MStV)

[Name]
[Anschrift wie oben]

## EU-Streitschlichtung

Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr/. Unsere E-Mail-Adresse finden Sie oben im Impressum.

## Verbraucherstreitbeilegung / Universalschlichtungsstelle

Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.

## Haftung für Inhalte

Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt.

## Haftung für Links

Unser Angebot enthält Links zu externen Websites Dritter (u. a. Ticketanbieter), auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.

## Urheberrecht

Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.');

insert into public.site_media (key, file_path) values
('hero_video', '/assets/media/steffen/steffen-stage-loop-hero.mp4');
```

- [ ] **Step 4: SQL ausführen** — beide Dateien nacheinander im Supabase SQL-Editor ausführen (oder via `supabase db push`, falls CLI eingerichtet). Expected: keine Fehler; Tabellen + 3 Shows + 2 Events sichtbar im Table Editor.

- [ ] **Step 5: Commit**

```bash
git add supabase/
git commit -m "feat: Supabase-Schema, RLS, Storage-Buckets und Seed-Daten"
```

---

### Task 3: Supabase-Clients, Middleware, Typen

**Files:**
- Create: `lib/supabase/public.ts`, `lib/supabase/server.ts`, `lib/types.ts`, `middleware.ts`

- [ ] **Step 1: Public-Client (cookie-los, für statische öffentliche Seiten)** — `lib/supabase/public.ts`:

```ts
import { createClient } from "@supabase/supabase-js";

export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
```

- [ ] **Step 2: SSR-Client (Admin)** — `lib/supabase/server.ts`:

```ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Components dürfen keine Cookies setzen — Middleware übernimmt den Refresh.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 3: Typen** — `lib/types.ts`:

```ts
export interface Show {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  format_label: string;
  color: string;
  planet_image_path: string;
  principle_items: { title: string; text: string }[];
  cities_text: string;
  sort_order: number;
  is_active: boolean;
}

export interface EventRow {
  id: string;
  show_id: string;
  date: string; // ISO yyyy-mm-dd
  start_time: string;
  entry_time: string;
  city: string;
  venue: string;
  ticket_url: string;
  provider: string;
  is_published: boolean;
  shows?: Pick<Show, "name" | "slug" | "color"> | null; // bei Join
}

export type InquiryType = "booking" | "comedian";
export type InquiryStatus = "new" | "read" | "answered";

export interface Inquiry {
  id: string;
  type: InquiryType;
  name: string;
  email: string;
  phone: string;
  message: string;
  payload: Record<string, string>;
  status: InquiryStatus;
  created_at: string;
}

export interface GalleryItem {
  id: string;
  image_path: string;
  caption: string;
  sort_order: number;
}

export interface OneLiner {
  id: string;
  text: string;
  is_active: boolean;
}
```

- [ ] **Step 4: Middleware (schützt /admin)** — `middleware.ts` (Projekt-Root):

```ts
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isLogin = request.nextUrl.pathname === "/admin/login";

  if (!user && !isLogin) return NextResponse.redirect(new URL("/admin/login", request.url));
  if (user && isLogin) return NextResponse.redirect(new URL("/admin", request.url));
  return response;
}

export const config = { matcher: ["/admin/:path*"] };
```

- [ ] **Step 5: Build prüfen** — `npm run build`. Expected: fehlerfrei (Middleware greift erst, wenn `/admin/login` existiert — Aufruf von `/admin` im Dev-Server leitet ab jetzt auf eine 404 `/admin/login` um; das ist bis Task 11 OK).

- [ ] **Step 6: Commit**

```bash
git add lib/supabase/ lib/types.ts middleware.ts
git commit -m "feat: Supabase-Clients (public/ssr), Auth-Middleware, Typen"
```

---

### Task 4: Pure Event-Helper (TDD)

**Files:**
- Create: `lib/event-helpers.ts`
- Test: `tests/event-helpers.test.ts`

- [ ] **Step 1: Failing Test schreiben** — `tests/event-helpers.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { partitionEvents, formatDay, formatMonth, formatDateLong } from "../lib/event-helpers.ts";

test("partitionEvents trennt und sortiert", () => {
  const events = [
    { date: "2026-04-09" }, // vergangen (heute = 2026-06-12)
    { date: "2026-07-01" },
    { date: "2026-06-20" },
    { date: "2026-02-12" },
  ];
  const { upcoming, past } = partitionEvents(events, "2026-06-12");
  assert.deepEqual(upcoming.map((e) => e.date), ["2026-06-20", "2026-07-01"]); // aufsteigend
  assert.deepEqual(past.map((e) => e.date), ["2026-04-09", "2026-02-12"]); // absteigend
});

test("Event am heutigen Tag zählt als kommend", () => {
  const { upcoming } = partitionEvents([{ date: "2026-06-12" }], "2026-06-12");
  assert.equal(upcoming.length, 1);
});

test("formatDay/formatMonth/formatDateLong deutsch", () => {
  assert.equal(formatDay("2026-04-09"), "09");
  assert.equal(formatMonth("2026-04-09"), "Apr 2026");
  assert.equal(formatDateLong("2026-04-09"), "9. April 2026");
});
```

- [ ] **Step 2: Test laufen lassen** — `npm test` → Expected: FAIL (`Cannot find module '../lib/event-helpers.ts'`).

- [ ] **Step 3: Implementieren** — `lib/event-helpers.ts` (framework-frei, keine Supabase-Imports!):

```ts
const MONTHS_SHORT = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const MONTHS_LONG = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function partitionEvents<T extends { date: string }>(
  events: T[],
  today: string = todayIso(),
): { upcoming: T[]; past: T[] } {
  const upcoming = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = events.filter((e) => e.date < today).sort((a, b) => b.date.localeCompare(a.date));
  return { upcoming, past };
}

export function formatDay(dateIso: string): string {
  return dateIso.slice(8, 10);
}

export function formatMonth(dateIso: string): string {
  return `${MONTHS_SHORT[Number(dateIso.slice(5, 7)) - 1]} ${dateIso.slice(0, 4)}`;
}

export function formatDateLong(dateIso: string): string {
  return `${Number(dateIso.slice(8, 10))}. ${MONTHS_LONG[Number(dateIso.slice(5, 7)) - 1]} ${dateIso.slice(0, 4)}`;
}
```

- [ ] **Step 4: Test laufen lassen** — `npm test` → Expected: PASS (3 Tests).

- [ ] **Step 5: Commit**

```bash
git add lib/event-helpers.ts tests/event-helpers.test.ts
git commit -m "feat: Event-Helper (Partition kommend/vergangen, deutsche Datumsformate) mit Tests"
```

---

### Task 5: Datenzugriffs-Layer + Media-/Revalidate-Helper

**Files:**
- Create: `lib/data.ts`, `lib/media.ts`, `lib/revalidate.ts`
- Test: `tests/media.test.ts`

- [ ] **Step 1: Failing Test für mediaUrl** — `tests/media.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { mediaUrl } from "../lib/media.ts";

test("mediaUrl: lokale Pfade unverändert", () => {
  assert.equal(mediaUrl("/assets/media/x.webp"), "/assets/media/x.webp");
});

test("mediaUrl: Storage-Pfade werden zur Public-URL", () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co";
  assert.equal(mediaUrl("planets/p.webp"), "https://abc.supabase.co/storage/v1/object/public/planets/p.webp");
});

test("mediaUrl: leer bleibt leer", () => {
  assert.equal(mediaUrl(""), "");
});
```

- [ ] **Step 2: `npm test`** → Expected: FAIL (Modul fehlt).

- [ ] **Step 3: Implementieren** — `lib/media.ts`:

```ts
/** Konvention: führender "/" = lokale Datei aus public/, sonst Supabase-Storage-Pfad "bucket/datei". */
export function mediaUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("/")) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${path}`;
}
```

`lib/revalidate.ts`:

```ts
import { revalidatePath } from "next/cache";

/** Nach jeder Admin-Mutation aufrufen: invalidiert alle öffentlichen Seiten. */
export function revalidatePublic() {
  revalidatePath("/", "layout");
}
```

`lib/data.ts` — alle öffentlichen Lesezugriffe (Public-Client). Fehler werfen, damit Build-Fehler sichtbar sind:

```ts
import { createPublicClient } from "@/lib/supabase/public";
import type { EventRow, GalleryItem, OneLiner, Show } from "@/lib/types";

const EVENT_SELECT = "*, shows(name, slug, color)";

export async function getActiveShows(): Promise<Show[]> {
  const { data, error } = await createPublicClient()
    .from("shows").select("*").eq("is_active", true).order("sort_order");
  if (error) throw new Error(`getActiveShows: ${error.message}`);
  return data as Show[];
}

export async function getShowBySlug(slug: string): Promise<Show | null> {
  const { data, error } = await createPublicClient()
    .from("shows").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (error) throw new Error(`getShowBySlug: ${error.message}`);
  return data as Show | null;
}

export async function getPublishedEvents(): Promise<EventRow[]> {
  const { data, error } = await createPublicClient()
    .from("events").select(EVENT_SELECT).eq("is_published", true).order("date");
  if (error) throw new Error(`getPublishedEvents: ${error.message}`);
  return data as EventRow[];
}

export async function getEventsForShowId(showId: string): Promise<EventRow[]> {
  const { data, error } = await createPublicClient()
    .from("events").select(EVENT_SELECT).eq("is_published", true).eq("show_id", showId).order("date");
  if (error) throw new Error(`getEventsForShowId: ${error.message}`);
  return data as EventRow[];
}

export async function getGalleryItems(): Promise<GalleryItem[]> {
  const { data, error } = await createPublicClient()
    .from("gallery_items").select("*").order("sort_order");
  if (error) throw new Error(`getGalleryItems: ${error.message}`);
  return data as GalleryItem[];
}

export async function getActiveOneLiners(): Promise<OneLiner[]> {
  const { data, error } = await createPublicClient()
    .from("one_liners").select("*").eq("is_active", true);
  if (error) throw new Error(`getActiveOneLiners: ${error.message}`);
  return data as OneLiner[];
}

export async function getLegalContent(slug: string): Promise<string> {
  const { data, error } = await createPublicClient()
    .from("legal_pages").select("content").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`getLegalContent: ${error.message}`);
  return data?.content ?? "";
}

export async function getSiteMedia(key: string): Promise<string> {
  const { data, error } = await createPublicClient()
    .from("site_media").select("file_path").eq("key", key).maybeSingle();
  if (error) throw new Error(`getSiteMedia: ${error.message}`);
  return data?.file_path ?? "";
}
```

- [ ] **Step 4: `npm test`** → Expected: PASS. Danach `npm run build` → Expected: fehlerfrei.

- [ ] **Step 5: Smoke-Check gegen echte DB** — `npx tsx -e` steht nicht zur Verfügung; stattdessen kurz im Dev-Server prüfen, sobald Phase 2 die erste Seite umstellt. Alternativ: `node --env-file=.env.local -e "fetch(process.env.NEXT_PUBLIC_SUPABASE_URL+'/rest/v1/shows?select=slug', {headers:{apikey:process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}}).then(r=>r.json()).then(console.log)"` → Expected: Array mit 3 Slugs.

- [ ] **Step 6: Commit**

```bash
git add lib/data.ts lib/media.ts lib/revalidate.ts tests/media.test.ts
git commit -m "feat: Datenzugriffs-Layer, mediaUrl-Konvention, revalidatePublic-Helper"
```
