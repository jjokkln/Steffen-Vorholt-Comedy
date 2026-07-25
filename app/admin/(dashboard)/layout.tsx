import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { logout } from "@/lib/actions/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: { absolute: "Mission Control" },
  robots: { index: false, follow: false },
};

const LOGO = "/assets/media/brand/logo_steffen.png";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabase();
  const { count: newInquiries } = await supabase
    .from("inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");

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
          <AdminSidebar newInquiries={newInquiries ?? 0} />
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
