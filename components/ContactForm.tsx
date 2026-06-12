"use client";

import { useActionState, type ReactNode } from "react";
import { submitInquiry, type InquiryFormState } from "@/lib/actions/submit-inquiry";
import type { InquiryType } from "@/lib/types";

export default function ContactForm({
  type,
  title,
  submitLabel,
  successMessage,
  children,
}: {
  type: InquiryType;
  title: string;
  submitLabel: string;
  successMessage: string;
  children: ReactNode;
}) {
  const [state, action, pending] = useActionState<InquiryFormState | null, FormData>(
    submitInquiry.bind(null, type),
    null,
  );

  if (state?.ok) {
    return (
      <div className="card form">
        <h3>📡 Übertragung angekommen!</h3>
        <p>{successMessage}</p>
      </div>
    );
  }

  return (
    <form className="card form" action={action}>
      <h3>{title}</h3>
      {children}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" style={{ position: "absolute", left: "-9999px" }} aria-hidden="true" />
      {state?.error && <p style={{ color: "var(--danger)" }}>{state.error}</p>}
      <button className="btn primary" disabled={pending}>
        {pending ? "Sendet durchs All..." : submitLabel}
      </button>
    </form>
  );
}
