# Website-Relaunch „Cosmic-Galaxie" — Master-Plan (Übersicht)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Steffen-Vorholt-Comedy-Website zu einer hochwertigen, verspielten, SEO-optimierten Marketing-Website mit echtem Supabase-Admin-Dashboard ausbauen.

**Spec:** `docs/superpowers/specs/2026-06-12-website-relaunch-cosmic-galaxie-design.md` — VOR Beginn vollständig lesen.

**Architecture:** Next.js 16 App Router (bestehend). Öffentliche Seiten bleiben statisch (ISR, `revalidate = 3600`) und lesen über einen cookie-losen Supabase-Public-Client; Admin-Bereich (`/admin`) nutzt `@supabase/ssr` mit Cookie-Auth und Server Actions, die nach jeder Mutation `revalidatePath("/", "layout")` aufrufen → Änderungen sofort live. Shows sind vollständig dynamisch (`/shows/[slug]`).

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase (`@supabase/supabase-js`, `@supabase/ssr`), Resend, framer-motion, canvas-confetti, plain CSS (`app/globals.css`, KEIN Tailwind), Tests via `node --test` (natives TS-Type-Stripping, Node ≥ 24).

---

## Phasen (in dieser Reihenfolge ausführen)

| # | Plan-Datei | Inhalt | Tasks |
|---|---|---|---|
| 1 | `2026-06-12-relaunch-01-fundament.md` | Dependencies, Supabase-Schema + Seed, Clients, Middleware, Datenzugriffs-Layer | 1–5 |
| 2 | `2026-06-12-relaunch-02-struktur.md` | Redirects, Nav/Footer, Kalender-Neubau, Seiten-Merges `/termine` + `/kontakt`, dynamische `/shows/[slug]`, Archiv löschen | 6–10 |
| 3 | `2026-06-12-relaunch-03-admin.md` | Login, Admin-Layout, CRUD für Shows/Termine/Anfragen/Galerie/One-Liner/Impressum, KPI-Übersicht | 11–18 |
| 4 | `2026-06-12-relaunch-04-formulare.md` | Echte Kontakt-Formulare, Inquiry-Action, Resend-Mail | 19 |
| 5 | `2026-06-12-relaunch-05-redesign.md` | Fonts, Design-Tokens, Ticker, Planeten, Motion, Buzzer, neue Startseite, 404, Microcopy | 20–24 |
| 6 | `2026-06-12-relaunch-06-seo.md` | JSON-LD, Sitemap, Robots, Metadata, OG-Images, next/image, Aufräumen | 25–28 |

## Verbindliche Konventionen (gelten für ALLE Tasks)

1. **Sprache:** UI-Texte Deutsch. Code/Commits Englisch-Deutsch gemischt wie bisher im Repo.
2. **Pfad-Konvention für Bilder:** Beginnt ein gespeicherter Pfad mit `/` → lokale Datei aus `public/`. Sonst ist es ein Supabase-Storage-Pfad (`bucket/datei.webp`) → URL via `mediaUrl()` aus `lib/media.ts` (Task 5). Niemals anders auflösen.
3. **Revalidation:** Jede Admin-Mutation endet mit `revalidatePath("/", "layout")` (Helper `revalidatePublic()` aus Task 5).
4. **Show-Farben:** `shows.color` ist Hex (z. B. `#7CFF6B`) und wird per Inline-Style gesetzt, nicht über CSS-Klassen.
5. **Events:** Es gibt KEIN Status-Feld für vergangen/kommend. `date < heute` = vergangen, berechnet via `partitionEvents()` (Task 4).
6. **CSS:** Bestehende Klassen aus `app/globals.css` wiederverwenden (`.card`, `.btn`, `.form`, `.table-wrap`, `.kpis`, `.status`, `.admin-layout`, `.sidebar` …). Neue Klassen nur ergänzen, vorhandene nicht umbenennen.
7. **Commits:** Nach jedem Task committen (Git-Befehl steht im jeweiligen Task). Branch: auf `main` arbeiten ist OK, wenn kein Worktree gewünscht.
8. **Verifikation:** `npm run build` muss nach JEDEM Task fehlerfrei sein. `npm test` nach jedem Task mit Test-Schritten.
9. **Env-Variablen** (`.env.local`, niemals committen):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `RESEND_API_KEY` (optional in Dev — Code muss ohne funktionieren)
   - `EMAIL_FROM` (Default im Code: `onboarding@resend.dev`), `NOTIFICATION_EMAIL`
   - `NEXT_PUBLIC_SITE_URL` (Default im Code: `https://steffenvorholt.de`)
10. **User-Interaktion:** Task 2 enthält einen STOP-Punkt (Supabase-Projekt + Keys vom User). Sonst autonom arbeiten.

## Definition of Done (Gesamt)

- [ ] Alle 28 Tasks abgehakt, `npm run build` + `npm test` grün
- [ ] Manuelle E2E-Prüfung: Login → Show anlegen (mit Planet-Upload) → Unterseite live → Termin anlegen → erscheint in Kalender + Startseite → Anfrage absenden → Inbox + Mail
- [ ] Lighthouse (Chrome DevTools, Production-Build): Performance ≥ 90, SEO ≥ 90
- [ ] `prefers-reduced-motion` deaktiviert Dauer-Animationen
