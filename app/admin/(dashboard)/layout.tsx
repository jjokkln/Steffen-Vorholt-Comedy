import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { logout } from "@/lib/actions/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  title: { absolute: "Mission Control" },
  robots: { index: false, follow: false },
};

const LOGO = "/assets/media/brand/logo_steffen.png";

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
          <AdminSidebar />
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
