"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/auth";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form className="card form" action={action} style={{ maxWidth: 420, margin: "0 auto" }}>
      <h3>Mission Control – Login</h3>
      <label>
        E-Mail
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label>
        Passwort
        <input name="password" type="password" required autoComplete="current-password" />
      </label>
      {state?.error && <p style={{ color: "var(--danger)" }}>{state.error}</p>}
      <button className="btn primary" disabled={pending}>
        {pending ? "Starte Triebwerke..." : "Einloggen"}
      </button>
    </form>
  );
}
