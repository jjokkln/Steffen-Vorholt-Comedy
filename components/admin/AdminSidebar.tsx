"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_NAV = [
  { href: "/admin", label: "Übersicht" },
  { href: "/admin/shows", label: "Shows" },
  { href: "/admin/termine", label: "Termine" },
  { href: "/admin/comedians", label: "Comedians" },
  { href: "/admin/auftritte", label: "Auftritte" },
  { href: "/admin/partner", label: "Partner" },
  { href: "/admin/angebote", label: "Angebote" },
  { href: "/admin/youtube", label: "YouTube" },
  { href: "/admin/anfragen", label: "Anfragen" },
  { href: "/admin/galerie", label: "Galerie & Medien" },
  { href: "/admin/oneliner", label: "One-Liner" },
  { href: "/admin/impressum", label: "Impressum" },
];

function isActive(pathname: string, href: string): boolean {
  // Übersicht nur exakt, sonst auch Unterseiten (z. B. /admin/shows/[id]).
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="sidebar" aria-label="Admin-Navigation">
      <nav aria-label="Bereich wählen">
        {ADMIN_NAV.map((n) => {
          const active = isActive(pathname, n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={active ? "active" : ""}
              aria-current={active ? "page" : undefined}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
