"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LEGAL_PAGES } from "@/lib/legal";

type NavItem = { href: string; label: string };
type NavGroup = {
  label: string;
  items: NavItem[];
  /** Gruppe ist auf-/zuklappbar und startet zu. Nur „Rechtliches" — siehe unten. */
  collapsible?: boolean;
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Programm",
    items: [
      { href: "/admin/shows", label: "Shows" },
      // Termine und Standorte sind am 21.09.2026 zu einem Bereich mit drei
      // Reitern geworden; /admin/standorte leitet dorthin um.
      { href: "/admin/termine", label: "Termine & Orte" },
      { href: "/admin/comedians", label: "Comedians" },
      { href: "/admin/auftritte", label: "Gastauftritte" },
    ],
  },
  {
    label: "Vertrieb",
    items: [
      { href: "/admin/anfragen", label: "Anfragen" },
      { href: "/admin/partner", label: "Partner" },
    ],
  },
  {
    label: "Website",
    items: [
      // „Galerie" heißt nicht mehr „Galerie & Medien": Videos und Speicher haben mit
      // /admin/medien ihren eigenen Punkt bekommen.
      { href: "/admin/galerie", label: "Galerie" },
      { href: "/admin/medien", label: "Videos & Speicher" },
      // Social Media und YouTube liegen seit dem 21.09.2026 unter /admin/social.
      { href: "/admin/social", label: "Social & YouTube" },
      { href: "/admin/oneliner", label: "One-Liner" },
    ],
  },
  {
    // Zugeklappt, weil diese drei Seiten selten angefasst werden und sonst ein
    // Drittel der Navigationsleiste belegen. Liegt man auf einer davon, klappt
    // sie trotzdem auf — sonst wäre der aktive Punkt unsichtbar.
    label: "Rechtliches",
    collapsible: true,
    items: LEGAL_PAGES.map((page) => ({
      href: `/admin/rechtliches/${page.slug}`,
      label: page.label,
    })),
  },
  {
    label: "System",
    items: [{ href: "/admin/einstellungen", label: "Benachrichtigungen" }],
  },
];

function isActive(pathname: string, href: string): boolean {
  // Übersicht nur exakt, sonst auch Unterseiten (z. B. /admin/shows/[id]).
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Auf- und zuklappbare Gruppe. Die Höhe animiert über `grid-template-rows:
 * 0fr → 1fr` — übernommen aus dem Mega-Menü in corpus-contour-kosmetik. Der
 * Trick daran: Es animiert die echte Höhe, ohne dass irgendwo in JavaScript
 * gemessen werden muss, und funktioniert auch, wenn der Inhalt wächst.
 */
function CollapsibleGroup({ group, pathname }: { group: NavGroup; pathname: string }) {
  const enthaeltAktive = group.items.some((n) => isActive(pathname, n.href));
  const [offen, setOffen] = useState(enthaeltAktive);

  return (
    <div className="sidebar-group">
      <button
        type="button"
        className="sidebar-group-toggle"
        aria-expanded={offen}
        onClick={() => setOffen((v) => !v)}
      >
        <span className="sidebar-group-label">{group.label}</span>
        <span className="sidebar-chevron" aria-hidden="true">{offen ? "▾" : "▸"}</span>
      </button>
      <div className={offen ? "sidebar-collapse offen" : "sidebar-collapse"}>
        <div className="sidebar-collapse-inner">
          {group.items.map((n) => {
            const active = isActive(pathname, n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={active ? "active" : ""}
                aria-current={active ? "page" : undefined}
                // Zugeklappt ist der Link für Maus, Tastatur und Screenreader weg —
                // ein unsichtbarer, aber fokussierbarer Link ist eine Tastaturfalle.
                tabIndex={offen ? undefined : -1}
                aria-hidden={offen ? undefined : true}
              >
                {n.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AdminSidebar({ newInquiries = 0 }: { newInquiries?: number }) {
  const pathname = usePathname();
  const overviewActive = isActive(pathname, "/admin");

  return (
    <aside className="sidebar" aria-label="Admin-Navigation">
      <nav aria-label="Bereich wählen">
        <Link
          href="/admin"
          className={overviewActive ? "active" : ""}
          aria-current={overviewActive ? "page" : undefined}
        >
          Übersicht
        </Link>
        {NAV_GROUPS.map((group) =>
          group.collapsible ? (
            <CollapsibleGroup key={group.label} group={group} pathname={pathname} />
          ) : (
            <div className="sidebar-group" key={group.label}>
              <span className="sidebar-group-label">{group.label}</span>
              {group.items.map((n) => {
                const active = isActive(pathname, n.href);
                const badge = n.href === "/admin/anfragen" && newInquiries > 0 ? newInquiries : null;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={active ? "active" : ""}
                    aria-current={active ? "page" : undefined}
                  >
                    {n.label}
                    {badge !== null && (
                      <span className="sidebar-badge" aria-label={`${badge} neu`}>{badge}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ),
        )}
      </nav>
    </aside>
  );
}
