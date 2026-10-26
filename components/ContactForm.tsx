"use client";

import Link from "next/link";
import { unstable_isUnrecognizedActionError } from "next/navigation";
import { startTransition, useActionState, type FormEvent, type ReactNode } from "react";
import { submitInquiry, type InquiryFormState } from "@/lib/actions/submit-inquiry";

const VERALTET =
  "Die Website wurde gerade aktualisiert. Bitte lade die Seite neu und schick das Formular noch einmal ab – " +
  "am besten kopierst du deine Nachricht vorher.";
const ABGEBROCHEN =
  "Die Übertragung ist abgebrochen. Bitte versuch es gleich noch einmal – " +
  "oder schreib direkt eine E-Mail, die Adresse steht im Impressum.";

/**
 * Ruft die Server Action auf und fängt, was sie nicht selbst als Zustand
 * zurückgibt. Wichtigster Fall: Nach einem Deploy kennt der Server die
 * Action-Id einer noch offenen Seite nicht mehr („Failed to find Server
 * Action"). Ohne diesen Fang landete der Fehler in der Fehlergrenze, und der
 * Besucher sähe statt seines Formulars eine kaputte Seite.
 */
async function absenden(prev: InquiryFormState | null, formData: FormData): Promise<InquiryFormState> {
  try {
    return await submitInquiry(prev, formData);
  } catch (fehler) {
    if (unstable_isUnrecognizedActionError(fehler)) return { ok: false, error: VERALTET, veraltet: true };
    console.error("[kontakt] Absenden fehlgeschlagen:", fehler);
    return { ok: false, error: ABGEBROCHEN };
  }
}
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
  const [state, action, pending] = useActionState<InquiryFormState | null, FormData>(absenden, null);

  // Absichtlich `onSubmit` statt `<form action>`: Mit einer Form-Action leert
  // React das Formular nach jedem Absenden – auch nach einem Fehler, und dann
  // wäre die Nachricht weg. Ohne JavaScript geht der Post an `/kontakt` und
  // bekommt vom Proxy einen Hinweis (proxy.ts); durchkommen würde er ohnehin
  // nicht, BotID verlangt JavaScript.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  }
  const cardClass = `card form contact-card${accent ? ` is-${accent}` : ""}`;

  if (state?.ok) {
    return (
      <div className={cardClass}>
        <h2>📡 Übertragung angekommen!</h2>
        <p>{successMessage}</p>
      </div>
    );
  }

  return (
    <form className={cardClass} method="post" encType="multipart/form-data" onSubmit={onSubmit}>
      {icon && <span className="contact-card-icon" aria-hidden="true">{icon}</span>}
      <h2>{title}</h2>
      {description && <p className="contact-card-desc">{description}</p>}
      <input type="hidden" name="type" value={type} />
      {children}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" style={{ position: "absolute", left: "-9999px" }} aria-hidden="true" />
      {state?.error && (
        <div role="alert">
          <p style={{ color: "var(--danger)" }}>{state.error}</p>
          {state.veraltet && (
            <button type="button" className="btn" onClick={() => window.location.reload()}>
              Seite neu laden
            </button>
          )}
        </div>
      )}
      <button className="btn primary" disabled={pending}>
        {pending ? "Sendet durchs All..." : submitLabel}
      </button>
      {/*
        Art. 13 DSGVO verlangt die Information über die Verarbeitung *bei der Erhebung* —
        ein Link im Fußbereich genügt dafür nicht. Steht hier in der Komponente und nicht auf
        der Kontaktseite, damit kein künftiges Formular ihn versehentlich weglässt.
      */}
      <p className="contact-card-privacy">
        Mit dem Absenden werden deine Angaben zur Bearbeitung der Anfrage gespeichert und per
        E-Mail an Steffen übermittelt. Details und deine Rechte:{" "}
        <Link href="/datenschutz">Datenschutzerklärung</Link>.
      </p>
      {hint && <p className="contact-card-hint">{hint}</p>}
    </form>
  );
}
