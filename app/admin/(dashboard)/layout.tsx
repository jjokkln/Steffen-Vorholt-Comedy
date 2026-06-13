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
      <header className="container" style={{ paddingBlock: "48px 32px" }}>
        <div className="eyebrow">🛠️ Mission Control</div>
      </header>
      <div className="container" style={{ paddingBottom: "clamp(48px, 6vw, 96px)" }}>
        <div className="admin-layout">
          <aside className="sidebar" aria-label="Admin-Navigation">
            <nav aria-label="Bereich wählen">
              {ADMIN_NAV.map((n) => (
                <Link key={n.href} href={n.href}>
                  {n.label}
                </Link>
              ))}
            </nav>
            <form action={logout} style={{ marginTop: 24 }}>
              <button className="btn secondary" style={{ width: "100%" }}>
                Logout
              </button>
            </form>
          </aside>
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
