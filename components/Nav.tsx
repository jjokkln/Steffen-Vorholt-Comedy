"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LOGO = "/assets/media/brand/logo_steffen.png";

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
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className="nav">
      <Link className="brand" href="/">
        <span className="logo">
          <img src={LOGO} alt="" />
        </span>
        <span>Steffen Vorholt</span>
      </Link>
      <div className="navlinks">
        {LINKS.map((link) => {
          const active = link.match ? link.match(pathname) : pathname === link.href;
          return (
            <Link key={link.href} className={active ? "active" : ""} href={link.href}>
              {link.label}
            </Link>
          );
        })}
        <Link className="ticket" href="/shows#termine">
          🎟 Tickets
        </Link>
      </div>
    </nav>
  );
}
