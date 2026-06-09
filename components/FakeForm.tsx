"use client";

import { type ReactNode } from "react";

export default function FakeForm({
  message,
  className,
  children,
}: {
  message: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        alert(`${message} – final: Supabase speichern + E-Mail senden.`);
      }}
    >
      {children}
    </form>
  );
}
