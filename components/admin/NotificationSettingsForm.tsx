"use client";

import { useActionState } from "react";
import Toast from "@/components/admin/Toast";
import { saveNotificationSettings, sendTestNotification, type FormState } from "@/lib/actions/settings";
import type { NotificationSettings } from "@/lib/settings";

const HINT = { color: "var(--muted)", fontSize: 13, margin: "4px 0 0" } as const;

export default function NotificationSettingsForm({ settings }: { settings: NotificationSettings }) {
  const [state, formAction, pending] = useActionState(saveNotificationSettings, null as FormState);
  const [testState, testAction, testPending] = useActionState(sendTestNotification, null as FormState);

  return (
    <>
      <form className="card form" action={formAction}>
        <label>
          Show-Anfragen &amp; Fragen / Feedback *
          <input
            name="shows"
            type="text"
            defaultValue={settings.shows}
            placeholder="steffen@example.com"
            required
          />
        </label>
        <p style={HINT}>
          Bekommt die Benachrichtigung für „Eine Show buchen" und „Frage &amp; Feedback".
        </p>

        <label>
          Booking-Anfragen (Steffen als Act / Moderation) *
          <input
            name="booking"
            type="text"
            defaultValue={settings.booking}
            placeholder="booking@example.com"
            required
          />
        </label>
        <p style={HINT}>Bekommt die Benachrichtigung für „Steffen buchen".</p>

        <label>
          Zusätzlicher Empfänger für alle Anfragen
          <input name="all" type="text" defaultValue={settings.all} placeholder="optional – leer lassen, wenn nicht gebraucht" />
        </label>
        <p style={HINT}>
          Diese Adresse bekommt jede Anfrage zusätzlich — praktisch für ein Sammelpostfach.
          Mehrere Adressen mit Komma trennen.
        </p>

        <button className="btn primary" disabled={pending}>
          {pending ? "Speichert…" : "Empfänger speichern"}
        </button>
        {state && !state.ok && <p style={{ color: "var(--danger)", margin: 0 }}>{state.message}</p>}
        {state?.ok && <Toast key={state.at} message={state.message} />}
      </form>

      <form className="card form" action={testAction} style={{ marginTop: 18 }}>
        <h3 style={{ margin: 0 }}>Zustellung testen</h3>
        <p style={{ ...HINT, marginTop: 0 }}>
          Schickt eine Testmail an alle oben gespeicherten Adressen. Kommt sie nicht an, bitte auch den
          Spam-Ordner prüfen und den Absender dort als „Kein Spam" markieren.
        </p>
        <button className="btn secondary" disabled={testPending}>
          {testPending ? "Schickt…" : "Testmail senden"}
        </button>
        {testState && !testState.ok && <p style={{ color: "var(--danger)", margin: 0 }}>{testState.message}</p>}
        {testState?.ok && (
          <>
            <p style={{ color: "var(--muted)", margin: 0 }}>{testState.message}</p>
            <Toast key={testState.at} message="Testmail verschickt." />
          </>
        )}
      </form>
    </>
  );
}
