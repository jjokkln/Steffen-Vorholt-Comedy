"use client";

import { useActionState, type ReactNode } from "react";
import { submitInquiry, type InquiryFormState } from "@/lib/actions/submit-inquiry";
import type { InquiryType } from "@/lib/types";

export default function ContactForm({
  type,
  title,
  description,
  icon,
  accent,
  submitLabel,
  successMessage,
  hint,
  children,
}: {
  type: InquiryType;
  title: string;
  description?: string;
  icon?: string;
  accent?: "green" | "gold" | "blue";
  submitLabel: string;
  successMessage: string;
  hint?: string;
  children: ReactNode;
}) {
  const [state, action, pending] = useActionState<InquiryFormState | null, FormData>(
    submitInquiry.bind(null, type),
    null,
  );
  const cardClass = `card form contact-card${accent ? ` is-${accent}` : ""}`;

  if (state?.ok) {
    return (
      <div className={cardClass}>
        <h3>📡 Übertragung angekommen!</h3>
        <p>{successMessage}</p>
      </div>
    );
  }

  return (
    <form className={cardClass} action={action}>
      {icon && <span className="contact-card-icon" aria-hidden="true">{icon}</span>}
      <h3>{title}</h3>
      {description && <p className="contact-card-desc">{description}</p>}
      {children}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" style={{ position: "absolute", left: "-9999px" }} aria-hidden="true" />
      {state?.error && <p style={{ color: "var(--danger)" }}>{state.error}</p>}
      <button className="btn primary" disabled={pending}>
        {pending ? "Sendet durchs All..." : submitLabel}
      </button>
      {hint && <p className="contact-card-hint">{hint}</p>}
    </form>
  );
}
