import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { logout } from "@/lib/actions/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import StorageUsageBar from "@/components/admin/StorageUsageBar";
import { createServerSupabase } from "@/lib/supabase/server";
import BrandLogo from "@/components/BrandLogo";

export const metadata: Metadata = {
  title: { absolute: "Mission Control" },
  robots: { index: false, follow: false },
};


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
          {/* Führt bewusst auf die öffentliche Startseite, nicht auf /admin: der
              Dashboard-Einstieg hängt schon als „Übersicht" in der Sidebar, und
              vom Admin zurück auf die Website gab es vorher gar keinen Weg. */}
          <Link className="brand" href="/" title="Zur Website">
            <BrandLogo />
            <span>Mission Control</span>
          </Link>
          <div className="admin-topbar-actions">
            {/* Speicherstand auf jeder Admin-Seite sichtbar: Das Kontingent ist der
                Engpass beim Hochladen von Videos, und niemand soll das erst merken,
                wenn ein Upload scheitert. Zählt selbst nach dem Rendern. */}
            <StorageUsageBar />
            <form action={logout}>
              <button className="btn secondary admin-logout-btn">Logout</button>
            </form>
          </div>
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
