# Phase 4: Echte Formulare + E-Mail-Benachrichtigung — Task 19

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kontakt-Formulare schreiben in die `inquiries`-Tabelle und benachrichtigen Steffen per Resend-Mail. `FakeForm` verschwindet.

**Architecture:** Eine Server Action `submitInquiry` für beide Formulartypen; bekannte Zusatzfelder wandern in `payload` (jsonb). Honeypot-Feld gegen Spam. E-Mail-Versand darf NIE den Submit blockieren (try/catch, Log).

**Tech Stack:** Server Actions, `useActionState`, Resend SDK.

---

### Task 19: Inquiry-Action, ContactForm, FakeForm entfernen

**Files:**
- Create: `lib/actions/submit-inquiry.ts`, `lib/email.ts`, `components/ContactForm.tsx`
- Modify: `app/kontakt/page.tsx` (FakeForm → ContactForm)
- Delete: `components/FakeForm.tsx`

- [x] **Step 1: `lib/email.ts`:**

```ts
import { Resend } from "resend";
import type { Inquiry } from "@/lib/types";

const TYPE_LABEL = { booking: "Booking-Anfrage", comedian: "Comedian-Bewerbung" } as const;

/** Versand best-effort: Fehler werden geloggt, niemals geworfen. */
export async function sendInquiryNotification(inquiry: Pick<Inquiry, "type" | "name" | "email" | "phone" | "message" | "payload">) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFICATION_EMAIL;
  if (!apiKey || !to) {
    console.warn("[email] RESEND_API_KEY/NOTIFICATION_EMAIL fehlt – Benachrichtigung übersprungen.");
    return;
  }
  const extras = Object.entries(inquiry.payload)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  try {
    await new Resend(apiKey).emails.send({
      from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
      to,
      replyTo: inquiry.email,
      subject: `🛸 Neue ${TYPE_LABEL[inquiry.type]} von ${inquiry.name}`,
      text: `Name: ${inquiry.name}\nE-Mail: ${inquiry.email}\nTelefon: ${inquiry.phone || "—"}\n${extras}\n\nNachricht:\n${inquiry.message}\n\n→ Dashboard: ${process.env.NEXT_PUBLIC_SITE_URL ?? "https://steffenvorholt.de"}/admin/anfragen`,
    });
  } catch (e) {
    console.error("[email] Versand fehlgeschlagen:", e);
  }
}
```

- [x] **Step 2: `lib/actions/submit-inquiry.ts`:**

```ts
"use server";

import { createPublicClient } from "@/lib/supabase/public";
import { sendInquiryNotification } from "@/lib/email";
import type { InquiryType } from "@/lib/types";

export interface InquiryFormState {
  ok: boolean;
  error?: string;
}

const PAYLOAD_KEYS: Record<InquiryType, string[]> = {
  booking: ["company", "event_type", "event_date"],
  comedian: ["stage_name", "social_link", "preferred_show", "city"],
};

export async function submitInquiry(
  type: InquiryType,
  _prev: InquiryFormState | null,
  formData: FormData,
): Promise<InquiryFormState> {
  // Honeypot: echtes Feld ist unsichtbar — Bots füllen es aus.
  if (String(formData.get("website") ?? "")) return { ok: true };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  if (!name || !email) return { ok: false, error: "Name und E-Mail sind Pflicht – sonst können wir nicht zurückfunken." };

  const payload: Record<string, string> = {};
  for (const key of PAYLOAD_KEYS[type]) payload[key] = String(formData.get(key) ?? "").trim();

  const inquiry = { type, name, email, phone: String(formData.get("phone") ?? "").trim(), message, payload };
  const { error } = await createPublicClient().from("inquiries").insert(inquiry);
  if (error) {
    console.error("[inquiry] Insert fehlgeschlagen:", error);
    return { ok: false, error: "Houston, wir haben ein Problem. Bitte später nochmal versuchen." };
  }
  await sendInquiryNotification(inquiry);
  return { ok: true };
}
```

- [x] **Step 3: `components/ContactForm.tsx`** (Client-Wrapper, ersetzt FakeForm 1:1 im Markup):

```tsx
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
```

- [x] **Step 4: `app/kontakt/page.tsx` umstellen** — beide `<FakeForm message="..." className="card form">…<button …>…</button></FakeForm>`-Blöcke ersetzen durch `ContactForm` (inneres Feld-Markup unverändert übernehmen, nur `<h3>` und `<button>` rausziehen):

```tsx
// Import oben ersetzen:
import ContactForm from "@/components/ContactForm";

// Booking-Formular:
<ContactForm
  type="booking"
  title="Booking-Anfrage"
  submitLabel="Anfrage senden"
  successMessage="Deine Anfrage ist gelandet. Steffen meldet sich, sobald er das Mikro aus der Hand legt."
>
  {/* ...alle bisherigen <label>-Felder des Booking-Formulars unverändert... */}
</ContactForm>

// Comedian-Formular:
<ContactForm
  type="comedian"
  title="Comedian-Bewerbung"
  submitLabel="Bewerbung absenden"
  successMessage="Bewerbung empfangen! Steffen schaut sich deine Links persönlich an."
>
  {/* ...alle bisherigen <label>-Felder des Comedian-Formulars unverändert... */}
</ContactForm>
```

Dann:

```bash
rm components/FakeForm.tsx
grep -rn "FakeForm" app components   # Expected: keine Treffer
```

- [x] **Step 5: E2E-Verifikation** — Dev: Booking-Formular absenden → Erfolgs-Card erscheint, Eintrag in `/admin/anfragen` mit Status „Neu", Payload-Felder (Firma, Eventart, Datum) sichtbar. Ohne `RESEND_API_KEY` loggt der Server den Skip-Hinweis; mit Key kommt die Mail an `NOTIFICATION_EMAIL` an. `npm run build` grün.

- [x] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: echte Kontakt-Formulare mit Supabase-Insert und Resend-Benachrichtigung"
```

---

## Abschluss-Notizen (2026-06-12)

Task 19 umgesetzt, Build + Tests (11/11) grün. Anon-Insert-Policy für `inquiries` bereits in Phase 3 verifiziert (Insert OK, Read 0 Zeilen). E-Mail-Versand ungetestet — `RESEND_API_KEY` ist nicht gesetzt (Code loggt Skip-Hinweis und blockiert den Submit nicht). UI-E2E (Formular absenden → Erfolgs-Card → Inbox) steht als manuelle Prüfung aus.
