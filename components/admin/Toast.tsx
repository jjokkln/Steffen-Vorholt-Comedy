"use client";

import { useEffect, useState } from "react";

/** Kurze Erfolgs-/Fehlermeldung unten rechts, blendet sich nach ein paar Sekunden aus. */
export default function Toast({ message, tone = "ok" }: { message: string; tone?: "ok" | "err" }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return null;
  return (
    <div className={`toast toast-${tone}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
