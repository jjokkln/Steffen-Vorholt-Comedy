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
