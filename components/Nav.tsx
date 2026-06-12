"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LOGO = "/assets/media/brand/steffen-vorholt-logo-primary.svg";

export default function Nav() {
  const pathname = usePathname();
  const cls = (active: boolean, extra = "") =>
    [extra, active ? "active" : ""].filter(Boolean).join(" ");

  return (
    <nav className="nav">
      <Link className="brand" href="/">
        <span className="logo">
          <img src={LOGO} alt="" />
        </span>
        <span>Steffen Vorholt</span>
      </Link>
      <div className="navlinks">
        <Link className={cls(pathname === "/")} href="/">
          Home
        </Link>
        <Link className={cls(pathname === "/shows" || pathname.startsWith("/shows/"))} href="/shows">
          Shows
        </Link>
        <Link className={cls(pathname === "/termine", "ticket")} href="/termine">
          Termine &amp; Kalender
        </Link>
        <Link className={cls(pathname === "/kontakt")} href="/kontakt">
          Kontakt &amp; Bewerbung
        </Link>
      </div>
    </nav>
  );
}
