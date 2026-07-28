"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import BrandLogo from "@/components/BrandLogo";


const LINKS: { href: string; label: string; match?: (p: string) => boolean }[] = [
  { href: "/", label: "Startseite", match: (p) => p === "/" },
  { href: "/shows", label: "Shows", match: (p) => p === "/shows" || p.startsWith("/shows/") },
  { href: "/steffen", label: "Steffen", match: (p) => p === "/steffen" },
  { href: "/kontakt", label: "Booking & Kontakt", match: (p) => p === "/kontakt" },
  { href: "/angebote", label: "Angebote", match: (p) => p === "/angebote" },
  { href: "/galerie", label: "Galerie & Gästebuch", match: (p) => p === "/galerie" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Menü bei Seitenwechsel schließen.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className={`nav${open ? " is-open" : ""}`}>
      <div className="nav-bar">
        <Link className="brand" href="/" onClick={() => setOpen(false)}>
          <BrandLogo />
          <span>Steffen Vorholt</span>
        </Link>
        <button
          type="button"
          className="nav-burger"
          aria-label="Menü öffnen"
          aria-expanded={open}
          aria-controls="nav-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="nav-burger-lines" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>
      <div className="navlinks" id="nav-menu">
        {LINKS.map((link) => {
          const active = link.match ? link.match(pathname) : pathname === link.href;
          return (
            <Link
              key={link.href}
              className={active ? "active" : ""}
              href={link.href}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          );
        })}
        <Link className="ticket" href="/shows#termine" onClick={() => setOpen(false)}>
          🎟 Tickets
        </Link>
      </div>
    </nav>
  );
}
