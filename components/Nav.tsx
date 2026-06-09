"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LOGO = "/assets/media/brand/steffen-vorholt-logo-primary.svg";

export default function Nav() {
  const pathname = usePathname();
  const isShowTermine = /^\/shows\/.+-termine$/.test(pathname);
  const isShowPage =
    pathname === "/shows" || (pathname.startsWith("/shows/") && !isShowTermine);

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
        <Link className={cls(isShowPage)} href="/shows">
          Shows
        </Link>
        <Link className={cls(pathname === "/termine", "ticket")} href="/termine">
          Termine
        </Link>
        <Link className={cls(pathname === "/kalender" || isShowTermine)} href="/kalender">
          Kalender
        </Link>
        <Link className={cls(pathname === "/archiv")} href="/archiv">
          Archiv
        </Link>
        <Link className={cls(pathname === "/comedians-bewerben")} href="/comedians-bewerben">
          Comedians
        </Link>
        <Link className={cls(pathname === "/steffen-buchen")} href="/steffen-buchen">
          Booking
        </Link>
        <Link className={cls(pathname.startsWith("/admin"))} href="/admin">
          Admin
        </Link>
      </div>
    </nav>
  );
}
