import type { Metadata } from "next";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: { absolute: "Login – Mission Control" },
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    // <main> und die <h1> stehen hier und nicht im Formular: /admin/login liegt
    // ausserhalb des Dashboard-Layouts und hatte deshalb weder Landmark noch
    // Ueberschrift — der Sprunglink aus dem Root-Layout lief hier ins Leere.
    <main id="hauptinhalt" className="container section admin-login">
      <h1>Mission Control</h1>
      <LoginForm />
    </main>
  );
}
