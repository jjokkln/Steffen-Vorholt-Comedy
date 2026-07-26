"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Programm",
    items: [
      { href: "/admin/shows", label: "Shows" },
      { href: "/admin/termine", label: "Termine" },
      { href: "/admin/comedians", label: "Comedians" },
      { href: "/admin/auftritte", label: "Auftritte" },
    ],
  },
  {
    label: "Vertrieb",
    items: [
      { href: "/admin/angebote", label: "Angebote" },
      { href: "/admin/anfragen", label: "Anfragen" },
      { href: "/admin/partner", label: "Partner" },
    ],
  },
  {
    label: "Website",
    items: [
      { href: "/admin/galerie", label: "Galerie & Medien" },
      { href: "/admin/youtube", label: "YouTube" },
      { href: "/admin/oneliner", label: "One-Liner" },
      { href: "/admin/impressum", label: "Impressum" },
    ],
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
        {NAV_GROUPS.map((group) => (
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
        ))}
      </nav>
    </aside>
  );
}
