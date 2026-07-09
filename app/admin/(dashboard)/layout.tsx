import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/lib/actions/auth";

const LOGO = "/assets/media/brand/logo_steffen.png";

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

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="admin-topbar">
        <div className="container admin-topbar-inner">
          <Link className="brand" href="/admin">
            <span className="logo">
              <img src={LOGO} alt="" />
            </span>
            <span>Mission Control</span>
          </Link>
          <form action={logout}>
            <button className="btn secondary admin-logout-btn">Logout</button>
          </form>
        </div>
      </header>
      <div className="container" style={{ paddingBlock: "32px clamp(48px, 6vw, 96px)" }}>
        <div className="admin-layout">
          <aside className="sidebar" aria-label="Admin-Navigation">
            <nav aria-label="Bereich wählen">
              {ADMIN_NAV.map((n) => (
                <Link key={n.href} href={n.href}>
                  {n.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
