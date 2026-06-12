# Steffen Vorholt Comedy — Projekt-Kontext

Next.js 16 (App Router, TypeScript, plain CSS — KEIN Tailwind) Marketing-Website für Comedian Steffen Vorholt, mit Supabase-Admin-Dashboard. Deployment: Vercel.

## Supabase (verbindlich)

- **Offizielle Project-URL dieser Website:** `https://insyjxxpeywehwnoazjr.supabase.co`
- **Project-Ref:** `insyjxxpeywehwnoazjr` (Region EU/Frankfurt)
- **MCP-Zugriff besteht:** Supabase-MCP-Server ist projekt-scoped in `.mcp.json` registriert (`https://mcp.supabase.com/mcp?project_ref=insyjxxpeywehwnoazjr`) und authentifiziert. Schema-Änderungen via `apply_migration`, Abfragen via `execute_sql`, Keys via `get_publishable_keys`.
- Keys/Env stehen in `.env.local` (gitignored, Vorlage: `.env.example`). Keine Keys in den Code oder in Docs committen.
- ⚠️ Es existiert ein ÄLTERES Supabase-Projekt (`unirwufvnfggwmdbkbpu`) aus einer früheren Session — das gehört NICHT zu dieser Website. Vor Schreibzugriffen via MCP immer `get_project_url` prüfen: muss `insyjxxpeywehwnoazjr` sein.

## Laufender Relaunch („Cosmic-Galaxie")

- Spec: `docs/superpowers/specs/2026-06-12-website-relaunch-cosmic-galaxie-design.md`
- Master-Plan: `docs/superpowers/plans/2026-06-12-relaunch-00-uebersicht.md` (6 Phasen, 28 Tasks, Checkbox-Tracking in den Phasen-Dateien)
- Konventionen (Media-Pfade, Revalidation, Show-Farben, Event-Partition, CSS-Klassen, Commits pro Task) stehen verbindlich im Master-Plan.

## Befehle

- Build: `npm run build` (muss nach jedem Task fehlerfrei sein)
- Tests: `npm test` (`node --test "tests/**/*.test.*"` — Verzeichnis-Argument funktioniert auf Node 24 nicht)
