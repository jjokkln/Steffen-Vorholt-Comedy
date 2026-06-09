import Link from "next/link";
import type { ReactNode } from "react";
import Footer from "@/components/Footer";

const ADMIN_NAV = [
  { key: "index", href: "/admin", label: "Übersicht" },
  { key: "shows", href: "/admin/shows", label: "Shows" },
  { key: "termine", href: "/admin/termine", label: "Termine" },
  { key: "kalender", href: "/admin/kalender", label: "Kalender" },
  { key: "anfragen", href: "/admin/anfragen", label: "Anfragen" },
  { key: "cms", href: "/admin/cms", label: "GitHub-CMS" },
];

export default function AdminShell({
  title,
  lead,
  active,
  children,
}: {
  title: string;
  lead: string;
  active: string;
  children: ReactNode;
}) {
  return (
    <>
      <header className="container section">
        <div className="eyebrow">🛠️ Admin</div>
        <h1>{title}</h1>
        <p className="lead">{lead}</p>
      </header>

      <section className="container section">
        <div className="admin-layout">
          <aside className="sidebar">
            {ADMIN_NAV.map((n) => (
              <Link key={n.key} className={active === n.key ? "active" : ""} href={n.href}>
                {n.label}
              </Link>
            ))}
          </aside>
          <main>{children}</main>
        </div>
      </section>

      <Footer />
    </>
  );
}

export function AdminActions() {
  return (
    <div className="actions">
      <button className="btn primary">Neu anlegen</button>
      <button className="btn secondary">Bearbeiten</button>
    </div>
  );
}
