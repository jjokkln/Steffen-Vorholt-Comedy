# Phase 3: Admin-Dashboard „Mission Control" — Tasks 11–18

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Voll funktionsfähiges Admin-Dashboard: Login, Shows-/Termine-/Anfragen-/Galerie-/One-Liner-/Impressum-Verwaltung mit sofortiger Live-Schaltung.

**Architecture:** `app/admin/login` (außerhalb) + Route-Group `app/admin/(dashboard)` mit gemeinsamem Layout. Mutationen als Server Actions in `lib/actions/*.ts` („use server"), jede endet mit `revalidatePublic()`. Admin-Seiten lesen über den Cookie-Client (`createServerSupabase`) — dadurch automatisch dynamisch.

**Tech Stack:** Supabase Auth + Storage, Server Actions, `useActionState` nur für Login.

**Konvention für alle Actions:** Pflichtfeld fehlt → `throw new Error("...")` (Admin-MVP, kein Fancy-Error-UI). Datei-Uploads validieren: `file.size > 0`.

---

### Task 11: Login + Auth-Actions

**Files:**
- Create: `lib/actions/auth.ts`, `app/admin/login/page.tsx`, `components/admin/LoginForm.tsx`

- [x] **Step 1: `lib/actions/auth.ts`:**

```ts
"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export async function login(_prev: { error: string } | null, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Login fehlgeschlagen. E-Mail oder Passwort prüfen." };
  redirect("/admin");
}

export async function logout() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
```

- [x] **Step 2: `components/admin/LoginForm.tsx`:**

```tsx
"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/auth";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form className="card form" action={action} style={{ maxWidth: 420, margin: "0 auto" }}>
      <h3>Mission Control – Login</h3>
      <label>
        E-Mail
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label>
        Passwort
        <input name="password" type="password" required autoComplete="current-password" />
      </label>
      {state?.error && <p style={{ color: "var(--danger)" }}>{state.error}</p>}
      <button className="btn primary" disabled={pending}>
        {pending ? "Starte Triebwerke..." : "Einloggen"}
      </button>
    </form>
  );
}
```

- [x] **Step 3: `app/admin/login/page.tsx`:**

```tsx
import type { Metadata } from "next";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Login – Mission Control", robots: { index: false } };

export default function AdminLoginPage() {
  return (
    <section className="container section">
      <LoginForm />
    </section>
  );
}
```

- [x] **Step 4: Verifizieren** — Dev-Server: `/admin` (noch alte Mock-Seite) leitet ohne Session auf `/admin/login`; Login mit dem in Task 2 angelegten Account führt zu `/admin`. Logout wird in Task 12 verdrahtet.

- [x] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Admin-Login mit Supabase Auth"
```

---

### Task 12: Admin-Layout (Route-Group) + alte Mock-Seiten entfernen

**Files:**
- Create: `app/admin/(dashboard)/layout.tsx`
- Move: `app/admin/page.tsx` → wird in Task 18 neu gebaut; vorerst Platzhalter in der Route-Group
- Delete: `components/AdminShell.tsx`, `app/admin/shows/page.tsx`, `app/admin/termine/page.tsx`, `app/admin/kalender/page.tsx`, `app/admin/anfragen/page.tsx`, `app/admin/cms/page.tsx`, `app/admin/page.tsx`

- [x] **Step 1: Alte Mock-Seiten löschen**

```bash
rm components/AdminShell.tsx app/admin/page.tsx
rm -r app/admin/shows app/admin/termine app/admin/kalender app/admin/anfragen app/admin/cms
```

- [x] **Step 2: `app/admin/(dashboard)/layout.tsx`:**

```tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/lib/actions/auth";

const ADMIN_NAV = [
  { href: "/admin", label: "Übersicht" },
  { href: "/admin/shows", label: "Shows" },
  { href: "/admin/termine", label: "Termine" },
  { href: "/admin/anfragen", label: "Anfragen" },
  { href: "/admin/galerie", label: "Galerie & Medien" },
  { href: "/admin/oneliner", label: "One-Liner" },
  { href: "/admin/impressum", label: "Impressum" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="container section" style={{ paddingBlock: "42px" }}>
        <div className="eyebrow">🛠️ Mission Control</div>
      </header>
      <section className="container section" style={{ paddingTop: 0 }}>
        <div className="admin-layout">
          <aside className="sidebar">
            {ADMIN_NAV.map((n) => (
              <Link key={n.href} href={n.href}>
                {n.label}
              </Link>
            ))}
            <form action={logout}>
              <button className="btn secondary" style={{ marginTop: 18, width: "100%" }}>
                Logout
              </button>
            </form>
          </aside>
          <main>{children}</main>
        </div>
      </section>
    </>
  );
}
```

- [x] **Step 3: Platzhalter-Übersicht** — `app/admin/(dashboard)/page.tsx` (wird Task 18 ersetzt):

```tsx
export default function AdminIndexPage() {
  return <h2>Willkommen in Mission Control. Module folgen.</h2>;
}
```

- [x] **Step 4: Build + Sichtprüfung** — `npm run build`; eingeloggt zeigt `/admin` Sidebar + Platzhalter. Logout-Button führt zu `/admin/login`.

- [x] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Admin-Layout mit Sidebar und Logout, Mock-Seiten entfernt"
```

---

### Task 13: Shows-Verwaltung (CRUD + Planet-Upload)

**Files:**
- Create: `lib/actions/shows.ts`, `components/admin/ShowForm.tsx`, `app/admin/(dashboard)/shows/page.tsx`, `app/admin/(dashboard)/shows/new/page.tsx`, `app/admin/(dashboard)/shows/[id]/page.tsx`

- [x] **Step 1: `lib/actions/shows.ts`:**

```ts
"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parsePrinciples(raw: string): { title: string; text: string }[] {
  // Eine Zeile pro Punkt, Format: "Titel :: Text"
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [title, ...rest] = l.split("::");
      return { title: title.trim(), text: rest.join("::").trim() };
    });
}

async function uploadPlanet(supabase: Awaited<ReturnType<typeof createServerSupabase>>, slug: string, file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = file.name.split(".").pop() || "webp";
  const path = `${slug}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("planets").upload(path, file, { contentType: file.type });
  if (error) throw new Error(`Planet-Upload fehlgeschlagen: ${error.message}`);
  return `planets/${path}`;
}

function showFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name ist Pflicht.");
  return {
    name,
    tagline: String(formData.get("tagline") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    format_label: String(formData.get("format_label") ?? "").trim(),
    color: String(formData.get("color") ?? "#7CFF6B"),
    principle_items: parsePrinciples(String(formData.get("principles") ?? "")),
    cities_text: String(formData.get("cities_text") ?? "").trim(),
    sort_order: Number(formData.get("sort_order") ?? 0),
    is_active: formData.get("is_active") === "on",
  };
}

export async function createShow(formData: FormData) {
  const supabase = await createServerSupabase();
  const fields = showFields(formData);
  const slug = slugify(fields.name);
  const planetPath = await uploadPlanet(supabase, slug, formData.get("planet") as File | null);
  const { error } = await supabase.from("shows").insert({
    ...fields,
    slug,
    planet_image_path: planetPath ?? "",
  });
  if (error) throw new Error(`Show anlegen fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  redirect("/admin/shows");
}

export async function updateShow(id: string, formData: FormData) {
  const supabase = await createServerSupabase();
  const fields = showFields(formData);
  const update: Record<string, unknown> = { ...fields };
  const { data: existing } = await supabase.from("shows").select("slug").eq("id", id).single();
  const planetPath = await uploadPlanet(supabase, existing?.slug ?? "show", formData.get("planet") as File | null);
  if (planetPath) update.planet_image_path = planetPath;
  const { error } = await supabase.from("shows").update(update).eq("id", id);
  if (error) throw new Error(`Show speichern fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  redirect("/admin/shows");
}

export async function deleteShow(id: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("shows").delete().eq("id", id);
  if (error) throw new Error(`Show löschen fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  redirect("/admin/shows");
}
```

- [x] **Step 2: `components/admin/ShowForm.tsx`** (Server Component; für „neu" und „bearbeiten"):

```tsx
import type { Show } from "@/lib/types";
import { mediaUrl } from "@/lib/media";

export default function ShowForm({
  show,
  action,
}: {
  show?: Show;
  action: (formData: FormData) => Promise<void>;
}) {
  const principles = (show?.principle_items ?? []).map((p) => `${p.title} :: ${p.text}`).join("\n");
  return (
    <form className="card form" action={action}>
      <div className="form two">
        <label>
          Name *
          <input name="name" defaultValue={show?.name} required />
        </label>
        <label>
          Format-Label (z. B. Impro)
          <input name="format_label" defaultValue={show?.format_label} />
        </label>
      </div>
      <label>
        Tagline (Überschrift der Show-Seite)
        <input name="tagline" defaultValue={show?.tagline} />
      </label>
      <label>
        Beschreibung
        <textarea name="description" rows={5} defaultValue={show?.description} />
      </label>
      <label>
        Show-Prinzip — eine Zeile pro Punkt, Format: Titel :: Text
        <textarea name="principles" rows={4} defaultValue={principles} />
      </label>
      <label>
        Städte &amp; Locations (Freitext)
        <textarea name="cities_text" rows={2} defaultValue={show?.cities_text} />
      </label>
      <div className="form two">
        <label>
          Show-Farbe
          <input name="color" type="color" defaultValue={show?.color ?? "#7CFF6B"} />
        </label>
        <label>
          Sortierung
          <input name="sort_order" type="number" defaultValue={show?.sort_order ?? 0} />
        </label>
      </div>
      <label>
        Planet-Bild (rund, transparenter Hintergrund){" "}
        {show?.planet_image_path && (
          <img src={mediaUrl(show.planet_image_path)} alt="" style={{ width: 64, height: 64 }} />
        )}
        <input name="planet" type="file" accept="image/*" />
      </label>
      <label style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        <input name="is_active" type="checkbox" defaultChecked={show?.is_active ?? true} /> Show ist aktiv (öffentlich sichtbar)
      </label>
      <button className="btn primary">{show ? "Speichern" : "Show anlegen"}</button>
    </form>
  );
}
```

- [x] **Step 3: Seiten anlegen.** `app/admin/(dashboard)/shows/page.tsx`:

```tsx
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { deleteShow } from "@/lib/actions/shows";
import type { Show } from "@/lib/types";

export default async function AdminShowsPage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("shows").select("*").order("sort_order");
  const shows = (data ?? []) as Show[];

  return (
    <>
      <h2>Shows verwalten</h2>
      <div className="actions">
        <Link className="btn primary" href="/admin/shows/new">
          + Neue Show
        </Link>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Slug</th><th>Status</th><th></th><th></th></tr>
          </thead>
          <tbody>
            {shows.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>/shows/{s.slug}</td>
                <td><span className={`status ${s.is_active ? "live" : "draft"}`}>{s.is_active ? "Aktiv" : "Inaktiv"}</span></td>
                <td><Link className="btn secondary" href={`/admin/shows/${s.id}`}>Bearbeiten</Link></td>
                <td>
                  <form action={deleteShow.bind(null, s.id)}>
                    <button className="btn secondary" style={{ color: "var(--danger)" }}>Löschen</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>⚠️ Löschen entfernt auch alle Termine der Show – endgültig.</p>
    </>
  );
}
```

`app/admin/(dashboard)/shows/new/page.tsx`:

```tsx
import ShowForm from "@/components/admin/ShowForm";
import { createShow } from "@/lib/actions/shows";

export default function NewShowPage() {
  return (
    <>
      <h2>Neue Show</h2>
      <ShowForm action={createShow} />
    </>
  );
}
```

`app/admin/(dashboard)/shows/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import ShowForm from "@/components/admin/ShowForm";
import { updateShow } from "@/lib/actions/shows";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Show } from "@/lib/types";

export default async function EditShowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("shows").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const show = data as Show;
  return (
    <>
      <h2>{show.name} bearbeiten</h2>
      <ShowForm show={show} action={updateShow.bind(null, show.id)} />
    </>
  );
}
```

- [x] **Step 4: E2E-Verifikation (manuell, Dev-Server):** Neue Test-Show „Testorbit" mit Planet-Bild anlegen → erscheint unter `/shows` und `/shows/testorbit` mit Bild aus Supabase Storage; bearbeiten; löschen → verschwindet öffentlich. `npm run build` grün.

- [x] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Shows-CRUD im Admin inkl. Planet-Upload und Sofort-Revalidation"
```

---

### Task 14: Termine-Verwaltung

**Files:**
- Create: `lib/actions/events.ts`, `components/admin/EventForm.tsx`, `app/admin/(dashboard)/termine/page.tsx`, `app/admin/(dashboard)/termine/new/page.tsx`, `app/admin/(dashboard)/termine/[id]/page.tsx`

- [x] **Step 1: `lib/actions/events.ts`:**

```ts
"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";

function eventFields(formData: FormData) {
  const show_id = String(formData.get("show_id") ?? "");
  const date = String(formData.get("date") ?? "");
  const city = String(formData.get("city") ?? "").trim();
  if (!show_id || !date || !city) throw new Error("Show, Datum und Stadt sind Pflicht.");
  return {
    show_id,
    date,
    city,
    start_time: String(formData.get("start_time") ?? ""),
    entry_time: String(formData.get("entry_time") ?? ""),
    venue: String(formData.get("venue") ?? "").trim(),
    ticket_url: String(formData.get("ticket_url") ?? "").trim(),
    provider: String(formData.get("provider") ?? "").trim(),
    is_published: formData.get("is_published") === "on",
  };
}

export async function createEvent(formData: FormData) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("events").insert(eventFields(formData));
  if (error) throw new Error(`Termin anlegen fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  redirect("/admin/termine");
}

export async function updateEvent(id: string, formData: FormData) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("events").update(eventFields(formData)).eq("id", id);
  if (error) throw new Error(`Termin speichern fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  redirect("/admin/termine");
}

export async function deleteEvent(id: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw new Error(`Termin löschen fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  redirect("/admin/termine");
}
```

- [x] **Step 2: `components/admin/EventForm.tsx`:**

```tsx
import type { EventRow, Show } from "@/lib/types";

export default function EventForm({
  event,
  shows,
  action,
}: {
  event?: EventRow;
  shows: Show[];
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form className="card form" action={action}>
      <div className="form two">
        <label>
          Show *
          <select name="show_id" defaultValue={event?.show_id} required>
            {shows.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <label>
          Datum *
          <input name="date" type="date" defaultValue={event?.date} required />
        </label>
      </div>
      <div className="form two">
        <label>
          Showbeginn (z. B. 20:00)
          <input name="start_time" defaultValue={event?.start_time} />
        </label>
        <label>
          Einlass (z. B. 19:00)
          <input name="entry_time" defaultValue={event?.entry_time} />
        </label>
      </div>
      <div className="form two">
        <label>
          Stadt *
          <input name="city" defaultValue={event?.city} required />
        </label>
        <label>
          Location / Venue
          <input name="venue" defaultValue={event?.venue} />
        </label>
      </div>
      <div className="form two">
        <label>
          Ticketlink (extern)
          <input name="ticket_url" type="url" placeholder="https://..." defaultValue={event?.ticket_url} />
        </label>
        <label>
          Anbieter (z. B. Eventbrite)
          <input name="provider" defaultValue={event?.provider} />
        </label>
      </div>
      <label style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        <input name="is_published" type="checkbox" defaultChecked={event?.is_published ?? true} /> Veröffentlicht
      </label>
      <button className="btn primary">{event ? "Speichern" : "Termin anlegen"}</button>
    </form>
  );
}
```

- [x] **Step 3: Seiten.** `app/admin/(dashboard)/termine/page.tsx` (Liste, kommend/vergangen getrennt):

```tsx
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { deleteEvent } from "@/lib/actions/events";
import { partitionEvents, formatDateLong } from "@/lib/event-helpers";
import type { EventRow } from "@/lib/types";

function EventTable({ items, emptyText }: { items: EventRow[]; emptyText: string }) {
  if (!items.length) return <p>{emptyText}</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Datum</th><th>Show</th><th>Stadt</th><th>Ticketlink</th><th>Status</th><th></th><th></th></tr>
        </thead>
        <tbody>
          {items.map((e) => (
            <tr key={e.id}>
              <td>{formatDateLong(e.date)}</td>
              <td>{e.shows?.name}</td>
              <td>{e.city}</td>
              <td>{e.ticket_url ? "✓" : <span className="status missing">fehlt</span>}</td>
              <td><span className={`status ${e.is_published ? "live" : "draft"}`}>{e.is_published ? "Live" : "Entwurf"}</span></td>
              <td><Link className="btn secondary" href={`/admin/termine/${e.id}`}>Bearbeiten</Link></td>
              <td>
                <form action={deleteEvent.bind(null, e.id)}>
                  <button className="btn secondary" style={{ color: "var(--danger)" }}>Löschen</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminTerminePage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("events").select("*, shows(name, slug, color)").order("date");
  const { upcoming, past } = partitionEvents((data ?? []) as EventRow[]);

  return (
    <>
      <h2>Termine verwalten</h2>
      <div className="actions">
        <Link className="btn primary" href="/admin/termine/new">+ Neuer Termin</Link>
      </div>
      <h3>Kommende ({upcoming.length})</h3>
      <EventTable items={upcoming} emptyText="Keine kommenden Termine — Zeit, welche anzulegen!" />
      <h3 style={{ marginTop: 28 }}>Vergangene ({past.length})</h3>
      <EventTable items={past} emptyText="Noch keine vergangenen Termine." />
    </>
  );
}
```

`app/admin/(dashboard)/termine/new/page.tsx`:

```tsx
import EventForm from "@/components/admin/EventForm";
import { createEvent } from "@/lib/actions/events";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Show } from "@/lib/types";

export default async function NewEventPage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("shows").select("*").order("sort_order");
  return (
    <>
      <h2>Neuer Termin</h2>
      <EventForm shows={(data ?? []) as Show[]} action={createEvent} />
    </>
  );
}
```

`app/admin/(dashboard)/termine/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import EventForm from "@/components/admin/EventForm";
import { updateEvent } from "@/lib/actions/events";
import { createServerSupabase } from "@/lib/supabase/server";
import type { EventRow, Show } from "@/lib/types";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const [{ data: event }, { data: shows }] = await Promise.all([
    supabase.from("events").select("*").eq("id", id).maybeSingle(),
    supabase.from("shows").select("*").order("sort_order"),
  ]);
  if (!event) notFound();
  return (
    <>
      <h2>Termin bearbeiten</h2>
      <EventForm event={event as EventRow} shows={(shows ?? []) as Show[]} action={updateEvent.bind(null, id)} />
    </>
  );
}
```

- [x] **Step 4: E2E-Verifikation:** Termin in der Zukunft anlegen → erscheint sofort auf `/termine` (Kalender + Liste) und auf der Show-Seite. `npm run build` grün.

- [x] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Termine-CRUD im Admin, Trennung kommend/vergangen"
```

---

### Task 15: Anfragen-Inbox

**Files:**
- Create: `lib/actions/inquiries.ts`, `app/admin/(dashboard)/anfragen/page.tsx`

- [x] **Step 1: `lib/actions/inquiries.ts`:**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import type { InquiryStatus } from "@/lib/types";

export async function setInquiryStatus(id: string, status: InquiryStatus) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("inquiries").update({ status }).eq("id", id);
  if (error) throw new Error(`Status ändern fehlgeschlagen: ${error.message}`);
  revalidatePath("/admin/anfragen");
}

export async function deleteInquiry(id: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("inquiries").delete().eq("id", id);
  if (error) throw new Error(`Anfrage löschen fehlgeschlagen: ${error.message}`);
  revalidatePath("/admin/anfragen");
}
```

- [x] **Step 2: `app/admin/(dashboard)/anfragen/page.tsx`:**

```tsx
import { createServerSupabase } from "@/lib/supabase/server";
import { setInquiryStatus, deleteInquiry } from "@/lib/actions/inquiries";
import type { Inquiry } from "@/lib/types";

const STATUS_LABEL = { new: "Neu", read: "Gelesen", answered: "Beantwortet" } as const;
const STATUS_CLS = { new: "missing", read: "draft", answered: "live" } as const;
const TYPE_LABEL = { booking: "🎤 Booking", comedian: "🎭 Comedian" } as const;

export default async function AdminAnfragenPage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("inquiries").select("*").order("created_at", { ascending: false });
  const inquiries = (data ?? []) as Inquiry[];

  return (
    <>
      <h2>Anfragen ({inquiries.filter((i) => i.status === "new").length} neu)</h2>
      {!inquiries.length && <p>Noch keine Anfragen. Das Universum ist still — noch.</p>}
      {inquiries.map((q) => (
        <details className="card" key={q.id} style={{ marginBottom: 14, padding: 18 }}>
          <summary style={{ cursor: "pointer", fontWeight: 800 }}>
            {TYPE_LABEL[q.type]} · {q.name} · {new Date(q.created_at).toLocaleDateString("de-DE")}{" "}
            <span className={`status ${STATUS_CLS[q.status]}`}>{STATUS_LABEL[q.status]}</span>
          </summary>
          <p>
            <b>E-Mail:</b> <a href={`mailto:${q.email}`}>{q.email}</a>
            {q.phone && <> · <b>Telefon:</b> {q.phone}</>}
          </p>
          {Object.entries(q.payload).map(([k, v]) => v && (
            <p key={k}><b>{k}:</b> {v}</p>
          ))}
          <p style={{ whiteSpace: "pre-wrap" }}>{q.message}</p>
          <div className="actions">
            <form action={setInquiryStatus.bind(null, q.id, "read")}>
              <button className="btn secondary">Gelesen</button>
            </form>
            <form action={setInquiryStatus.bind(null, q.id, "answered")}>
              <button className="btn secondary">Beantwortet</button>
            </form>
            <form action={deleteInquiry.bind(null, q.id)}>
              <button className="btn secondary" style={{ color: "var(--danger)" }}>Löschen</button>
            </form>
          </div>
        </details>
      ))}
    </>
  );
}
```

- [x] **Step 3: Verifikation** — per SQL-Editor eine Test-Anfrage einfügen (`insert into inquiries (type, name, email, message) values ('booking','Test','t@t.de','Hallo');`) → erscheint in der Inbox, Statuswechsel funktioniert. Build grün.

- [x] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: Anfragen-Inbox mit Statusverwaltung"
```

---

### Task 16: Galerie & Medien (inkl. Hero-Video-Tausch)

**Files:**
- Create: `lib/actions/gallery.ts`, `app/admin/(dashboard)/galerie/page.tsx`

- [x] **Step 1: `lib/actions/gallery.ts`:**

```ts
"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";
import { revalidatePath } from "next/cache";

export async function addGalleryItem(formData: FormData) {
  const supabase = await createServerSupabase();
  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) throw new Error("Bild ist Pflicht.");
  const ext = file.name.split(".").pop() || "webp";
  const path = `mission-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from("gallery").upload(path, file, { contentType: file.type });
  if (upErr) throw new Error(`Upload fehlgeschlagen: ${upErr.message}`);
  const { error } = await supabase.from("gallery_items").insert({
    image_path: `gallery/${path}`,
    caption: String(formData.get("caption") ?? "").trim(),
    sort_order: Number(formData.get("sort_order") ?? 0),
  });
  if (error) throw new Error(`Galerie-Eintrag fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath("/admin/galerie");
}

export async function updateGalleryItem(id: string, formData: FormData) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("gallery_items").update({
    caption: String(formData.get("caption") ?? "").trim(),
    sort_order: Number(formData.get("sort_order") ?? 0),
  }).eq("id", id);
  if (error) throw new Error(`Speichern fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath("/admin/galerie");
}

export async function deleteGalleryItem(id: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("gallery_items").delete().eq("id", id);
  if (error) throw new Error(`Löschen fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath("/admin/galerie");
}

export async function replaceHeroVideo(formData: FormData) {
  const supabase = await createServerSupabase();
  const file = formData.get("video") as File | null;
  if (!file || file.size === 0) throw new Error("Video ist Pflicht.");
  const path = `hero-${Date.now()}.mp4`;
  const { error: upErr } = await supabase.storage.from("media").upload(path, file, { contentType: "video/mp4" });
  if (upErr) throw new Error(`Video-Upload fehlgeschlagen: ${upErr.message}`);
  const { error } = await supabase.from("site_media").upsert({ key: "hero_video", file_path: `media/${path}`, updated_at: new Date().toISOString() });
  if (error) throw new Error(`Video speichern fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath("/admin/galerie");
}
```

- [x] **Step 2: `app/admin/(dashboard)/galerie/page.tsx`:**

```tsx
import { createServerSupabase } from "@/lib/supabase/server";
import { addGalleryItem, updateGalleryItem, deleteGalleryItem, replaceHeroVideo } from "@/lib/actions/gallery";
import { mediaUrl } from "@/lib/media";
import type { GalleryItem } from "@/lib/types";

export default async function AdminGaleriePage() {
  const supabase = await createServerSupabase();
  const [{ data: items }, { data: hero }] = await Promise.all([
    supabase.from("gallery_items").select("*").order("sort_order"),
    supabase.from("site_media").select("file_path").eq("key", "hero_video").maybeSingle(),
  ]);

  return (
    <>
      <h2>Galerie „Vergangene Missionen"</h2>
      <form className="card form" action={addGalleryItem}>
        <h3>Neues Foto</h3>
        <label>
          Bild * <input name="image" type="file" accept="image/*" required />
        </label>
        <div className="form two">
          <label>
            Bildunterschrift <input name="caption" placeholder="z. B. Brain Loading, Köln 2025" />
          </label>
          <label>
            Sortierung <input name="sort_order" type="number" defaultValue={0} />
          </label>
        </div>
        <button className="btn primary">Hochladen</button>
      </form>

      <div className="grid-3" style={{ marginTop: 24 }}>
        {((items ?? []) as GalleryItem[]).map((g) => (
          <div className="card" key={g.id} style={{ padding: 14 }}>
            <img src={mediaUrl(g.image_path)} alt={g.caption} style={{ borderRadius: 12, marginBottom: 10 }} />
            <form className="form" action={updateGalleryItem.bind(null, g.id)}>
              <input name="caption" defaultValue={g.caption} />
              <input name="sort_order" type="number" defaultValue={g.sort_order} />
              <div className="actions" style={{ marginTop: 8 }}>
                <button className="btn secondary">Speichern</button>
              </div>
            </form>
            <form action={deleteGalleryItem.bind(null, g.id)}>
              <button className="btn secondary" style={{ color: "var(--danger)", marginTop: 8 }}>Löschen</button>
            </form>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 42 }}>Hero-Video</h2>
      <p>Aktuell: {hero?.file_path ?? "—"}</p>
      <form className="card form" action={replaceHeroVideo}>
        <label>
          Neues Video (MP4, möglichst &lt; 20 MB) <input name="video" type="file" accept="video/mp4" required />
        </label>
        <button className="btn primary">Video ersetzen</button>
      </form>
    </>
  );
}
```

- [x] **Step 3: Verifikation** — Bild hochladen → erscheint im Grid (Storage-URL). Build grün. (Öffentliche Galerie-Sektion kommt in Phase 5, Task 23.)

- [x] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: Galerie- und Medienverwaltung (Fotos + Hero-Video) im Admin"
```

---

### Task 17: One-Liner + Impressum-Editor (+ öffentliche Impressum-Seite aus DB)

**Files:**
- Create: `lib/actions/content.ts`, `app/admin/(dashboard)/oneliner/page.tsx`, `app/admin/(dashboard)/impressum/page.tsx`, `lib/markdown.ts`
- Modify (ersetzen): `app/impressum/page.tsx`
- Test: `tests/markdown.test.ts`

- [x] **Step 1: Failing Test für Mini-Markdown** — `tests/markdown.test.ts` (bewusst kein Paket — wir brauchen nur `##`, Absätze, Links):

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown } from "../lib/markdown.ts";

test("überschriften, absätze, links, escaping", () => {
  const html = renderMarkdown("## Kontakt\n\nMail: https://example.com/x\n\nZeile1\nZeile2 <script>");
  assert.ok(html.includes("<h2>Kontakt</h2>"));
  assert.ok(html.includes('<a href="https://example.com/x"'));
  assert.ok(html.includes("Zeile1<br />Zeile2"));
  assert.ok(!html.includes("<script>"));
});
```

- [x] **Step 2: `npm test`** → FAIL. Dann implementieren — `lib/markdown.ts`:

```ts
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function linkify(s: string): string {
  return s.replace(/https?:\/\/[^\s<]+/g, (url) => `<a href="${url}" target="_blank" rel="noopener">${url}</a>`);
}

/** Minimal-Markdown: ## Überschrift, Leerzeile = neuer Absatz, einfacher Zeilenumbruch = <br />, URLs werden Links. */
export function renderMarkdown(md: string): string {
  return md
    .split(/\n{2,}/)
    .map((block) => {
      const t = block.trim();
      if (!t) return "";
      if (t.startsWith("## ")) return `<h2>${linkify(escapeHtml(t.slice(3)))}</h2>`;
      return `<p>${linkify(escapeHtml(t)).replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");
}
```

`npm test` → PASS.

- [x] **Step 3: `lib/actions/content.ts`:**

```ts
"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";
import { revalidatePath } from "next/cache";

export async function saveLegalPage(slug: string, formData: FormData) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("legal_pages").upsert({
    slug,
    content: String(formData.get("content") ?? ""),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Speichern fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath("/admin/impressum");
}

export async function addOneLiner(formData: FormData) {
  const supabase = await createServerSupabase();
  const text = String(formData.get("text") ?? "").trim();
  if (!text) throw new Error("Text ist Pflicht.");
  const { error } = await supabase.from("one_liners").insert({ text });
  if (error) throw new Error(`Anlegen fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath("/admin/oneliner");
}

export async function toggleOneLiner(id: string, isActive: boolean) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("one_liners").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(`Ändern fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath("/admin/oneliner");
}

export async function deleteOneLiner(id: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("one_liners").delete().eq("id", id);
  if (error) throw new Error(`Löschen fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath("/admin/oneliner");
}
```

- [x] **Step 4: Admin-Seiten.** `app/admin/(dashboard)/oneliner/page.tsx`:

```tsx
import { createServerSupabase } from "@/lib/supabase/server";
import { addOneLiner, toggleOneLiner, deleteOneLiner } from "@/lib/actions/content";
import type { OneLiner } from "@/lib/types";

export default async function AdminOneLinerPage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("one_liners").select("*").order("created_at");
  const liners = (data ?? []) as OneLiner[];

  return (
    <>
      <h2>Buzzer-One-Liner</h2>
      <p>Diese Sprüche spuckt der rote Buzzer auf der Startseite aus.</p>
      <form className="form" action={addOneLiner} style={{ display: "flex", gap: 10 }}>
        <input name="text" placeholder="Neuer One-Liner..." required style={{ flex: 1 }} />
        <button className="btn primary">Hinzufügen</button>
      </form>
      <div className="table-wrap" style={{ marginTop: 18 }}>
        <table>
          <tbody>
            {liners.map((l) => (
              <tr key={l.id}>
                <td>{l.text}</td>
                <td>
                  <form action={toggleOneLiner.bind(null, l.id, !l.is_active)}>
                    <button className="btn secondary">{l.is_active ? "Aktiv ✓" : "Inaktiv"}</button>
                  </form>
                </td>
                <td>
                  <form action={deleteOneLiner.bind(null, l.id)}>
                    <button className="btn secondary" style={{ color: "var(--danger)" }}>Löschen</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
```

`app/admin/(dashboard)/impressum/page.tsx`:

```tsx
import { createServerSupabase } from "@/lib/supabase/server";
import { saveLegalPage } from "@/lib/actions/content";

export default async function AdminImpressumPage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("legal_pages").select("content").eq("slug", "impressum").maybeSingle();

  return (
    <>
      <h2>Impressum bearbeiten</h2>
      <p>Format: <code>## Überschrift</code> für Abschnitte, Leerzeile = neuer Absatz. Links werden automatisch erkannt.</p>
      <form className="card form" action={saveLegalPage.bind(null, "impressum")}>
        <textarea name="content" rows={28} defaultValue={data?.content ?? ""} />
        <button className="btn primary">Speichern &amp; veröffentlichen</button>
      </form>
    </>
  );
}
```

- [x] **Step 5: Öffentliches Impressum aus DB** — `app/impressum/page.tsx` ersetzen:

```tsx
import type { Metadata } from "next";
import Footer from "@/components/Footer";
import { getLegalContent } from "@/lib/data";
import { renderMarkdown } from "@/lib/markdown";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Impressum – Steffen Vorholt",
  description: "Impressum und Anbieterkennzeichnung von Steffen Vorholt.",
  robots: { index: false },
};

export default async function ImpressumPage() {
  const content = await getLegalContent("impressum");
  return (
    <>
      <section className="container section legal">
        <div className="eyebrow">⚖️ Rechtliches</div>
        <h1>Impressum</h1>
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
      </section>
      <Footer />
    </>
  );
}
```

- [x] **Step 6: Verifikation** — Impressum im Admin ändern → öffentliche Seite zeigt Änderung sofort. `npm test` + `npm run build` grün.

- [x] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: One-Liner-Verwaltung und Impressum-Editor (DB-gestützt, Mini-Markdown)"
```

---

### Task 18: Dashboard-Übersicht mit echten KPIs

**Files:**
- Modify (ersetzen): `app/admin/(dashboard)/page.tsx`

- [x] **Step 1: Seite ersetzen:**

```tsx
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { partitionEvents, formatDateLong, todayIso } from "@/lib/event-helpers";
import type { EventRow, Show } from "@/lib/types";

export default async function AdminIndexPage() {
  const supabase = await createServerSupabase();
  const [{ data: events }, { data: shows }, { count: newInquiries }] = await Promise.all([
    supabase.from("events").select("*, shows(name, slug, color)").order("date"),
    supabase.from("shows").select("*"),
    supabase.from("inquiries").select("*", { count: "exact", head: true }).eq("status", "new"),
  ]);
  const { upcoming } = partitionEvents((events ?? []) as EventRow[]);
  const allShows = (shows ?? []) as Show[];
  const showsWithoutUpcoming = allShows.filter(
    (s) => s.is_active && !upcoming.some((e) => e.show_id === s.id),
  );
  const missingTickets = upcoming.filter((e) => !e.ticket_url);

  return (
    <>
      <h2>Übersicht</h2>
      <div className="kpis">
        <div className="kpi">
          <strong>{newInquiries ?? 0}</strong>
          <span>neue Anfragen</span>
        </div>
        <div className="kpi">
          <strong>{upcoming.length}</strong>
          <span>kommende Termine</span>
        </div>
        <div className="kpi">
          <strong>{showsWithoutUpcoming.length}</strong>
          <span>Shows ohne Termin</span>
        </div>
        <div className="kpi">
          <strong>{missingTickets.length}</strong>
          <span>Ticketlinks fehlen</span>
        </div>
      </div>

      <h3 style={{ marginTop: 28 }}>Nächste Termine</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Datum</th><th>Show</th><th>Stadt</th><th>Tickets</th></tr>
          </thead>
          <tbody>
            {upcoming.slice(0, 5).map((e) => (
              <tr key={e.id}>
                <td>{formatDateLong(e.date)}</td>
                <td>{e.shows?.name}</td>
                <td>{e.city}</td>
                <td>{e.ticket_url ? "✓" : <span className="status missing">fehlt</span>}</td>
              </tr>
            ))}
            {!upcoming.length && (
              <tr><td colSpan={4}>Keine kommenden Termine (Stand {formatDateLong(todayIso())}).</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showsWithoutUpcoming.length > 0 && (
        <p style={{ marginTop: 14 }}>
          ⚠️ Ohne kommenden Termin: {showsWithoutUpcoming.map((s) => s.name).join(", ")} —{" "}
          <Link href="/admin/termine/new">jetzt Termin anlegen</Link>.
        </p>
      )}
    </>
  );
}
```

- [x] **Step 2: Verifikation** — KPIs stimmen mit DB-Inhalt überein (Stichprobe: Anfrage auf „neu" setzen → Zähler steigt). Build grün.

- [x] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: Admin-Übersicht mit echten KPIs"
```

---

## Abschluss-Notizen (2026-06-12)

Alle Tasks 11–18 umgesetzt, `npm run build` + `npm test` (11/11) grün. Verifiziert:

- Login mit dem angelegten Account via `signInWithPassword` erfolgreich (nur 1 Account statt 2 — Entscheidung User: reicht).
- RLS als authentifizierter User: Shows-Insert/Update/Delete OK; Anfragen: anon darf nur einfügen (Read liefert 0 Zeilen), Admin liest/ändert/löscht; Storage `gallery`: Admin-Upload + Public-Read (200) + Admin-Delete OK. Testdaten jeweils aufgeräumt.
- Production-Server: alle 7 Admin-Routen ohne Session → 307 auf `/admin/login` (200); öffentliches `/impressum` rendert DB-Inhalt.
- E2E über die Formular-UI (Show mit Planet-Bild anlegen etc.) steht als manuelle Prüfung durch den User aus — Datenpfad und Policies sind verifiziert.
