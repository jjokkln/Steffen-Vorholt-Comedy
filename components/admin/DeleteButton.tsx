"use client";

import { useFormStatus } from "react-dom";
import type { CSSProperties, ReactNode } from "react";

function DeleteSubmit({ label }: { label: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn secondary" style={{ color: "var(--danger)" }} disabled={pending}>
      {pending ? "Löscht…" : label}
    </button>
  );
}

/** Löschen/Entfernen-Button mit Bestätigungsdialog + Pending-State — schützt vor versehentlichem, endgültigem Löschen. */
export default function DeleteButton({
  action,
  confirm: confirmText,
  label = "Löschen",
  style,
}: {
  action: (formData: FormData) => Promise<void>;
  confirm: string;
  label?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <form
      action={action}
      style={style}
      onSubmit={(event) => {
        if (!window.confirm(confirmText)) event.preventDefault();
      }}
    >
      <DeleteSubmit label={label} />
    </form>
  );
}
