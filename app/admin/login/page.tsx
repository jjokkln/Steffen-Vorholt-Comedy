import type { Metadata } from "next";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Login – Mission Control", robots: { index: false } };

export default function AdminLoginPage() {
  return (
    <section className="container section">
      <LoginForm />
    </section>
  );
}
