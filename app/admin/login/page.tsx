import type { Metadata } from "next";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: { absolute: "Login – Mission Control" },
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <section className="container section admin-login">
      <LoginForm />
    </section>
  );
}
