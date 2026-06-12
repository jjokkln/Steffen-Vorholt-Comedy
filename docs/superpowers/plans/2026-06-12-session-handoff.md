# Session-Handoff: Relaunch „Cosmic-Galaxie" fortsetzen (Stand 2026-06-12)

> Diesen Prompt in einer neuen AI-Session verwenden. Arbeitsverzeichnis: `steffen-vorholt-final-multipage`.

---

Setze den Website-Relaunch „Cosmic-Galaxie" fort. Nutze den Skill `superpowers:executing-plans` (oder `superpowers:subagent-driven-development`).

**Zuerst lesen:**
1. `CLAUDE.md` (Projekt-Root) — Supabase-Projekt-URL + MCP-Hinweise
2. `docs/superpowers/plans/2026-06-12-relaunch-00-uebersicht.md` — Master-Plan mit verbindlichen Konventionen
3. `docs/superpowers/plans/2026-06-12-relaunch-01-fundament.md` — Checkbox-Stand Phase 1

**Aktueller Stand (verifiziert):**
- Tasks 1, 3, 4, 5 komplett (Commits auf `main`, 7/7 Tests grün, Build fehlerfrei).
- Task 2 teilweise: `supabase/migrations/0001_init.sql` + `supabase/seed.sql` liegen fertig im Repo, sind aber NOCH NICHT ausgeführt — die Datenbank ist leer (`list_tables` → []).
- Supabase-MCP ist projekt-scoped verbunden und authentifiziert (`.mcp.json`). `get_project_url` → `https://insyjxxpeywehwnoazjr.supabase.co` (verifiziert). Achtung: NIEMALS auf das alte Projekt `unirwufvnfggwmdbkbpu` schreiben.
- `.env.local` ist gefüllt (URL + Anon-Key via MCP geholt).

**Deine nächsten Schritte:**
1. Sicherheitscheck: `get_project_url` via Supabase-MCP → muss `insyjxxpeywehwnoazjr` enthalten.
2. Task 2 abschließen: `supabase/migrations/0001_init.sql` via MCP `apply_migration` ausführen (Name: `init`), danach `supabase/seed.sql` via `execute_sql`. Verifizieren: `list_tables` zeigt 7 Tabellen; `select slug from shows` → 3 Slugs; 2 Events vorhanden.
3. Task 5 Step 5 (Smoke-Check) nachholen: `node --env-file=.env.local -e "fetch(process.env.NEXT_PUBLIC_SUPABASE_URL+'/rest/v1/shows?select=slug',{headers:{apikey:process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}}).then(r=>r.json()).then(console.log)"` → Array mit 3 Slugs.
4. Checkboxen in `2026-06-12-relaunch-01-fundament.md` abhaken (Task 2 Steps 4+5, Task 5 Step 5), committen.
5. 🛑 Beim User (Lenny) bestätigen lassen (Dashboard, geht nicht via MCP): Auth → Sign In/Up → Signups deaktiviert + zwei Accounts angelegt (Steffen + Lenny). Falls noch offen: erinnern, aber Phase 2 blockiert das nicht (Auth wird erst ab Task 11 gebraucht).
6. Phase 2 starten: `docs/superpowers/plans/2026-06-12-relaunch-02-struktur.md` (Tasks 6–10), Task für Task, Konventionen aus dem Master-Plan einhalten (Commit pro Task, `npm run build` + `npm test` grün).

**Wichtige Konventionen (Kurzfassung — Details im Master-Plan):**
- Bild-Pfade: führender `/` = lokal aus `public/`, sonst Supabase-Storage-Pfad → `mediaUrl()` aus `lib/media.ts`.
- Jede Admin-Mutation endet mit `revalidatePublic()` (`lib/revalidate.ts`).
- Kein Status-Feld für Events: vergangen/kommend via `partitionEvents()` (`lib/event-helpers.ts`).
- CSS-Klassen aus `app/globals.css` wiederverwenden, nicht umbenennen. Kein Tailwind.
- Test-Script ist `node --test "tests/**/*.test.*"` (Verzeichnis-Argument bricht auf Node 24).
- Arbeiten auf `main` ist OK.
