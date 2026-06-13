"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadToStorage } from "@/lib/upload";
import { setHeroVideoPath } from "@/lib/actions/gallery";
import Toast from "@/components/admin/Toast";

export default function HeroVideoUpload({ current }: { current: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("video") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const path = await uploadToStorage("media", "hero", file);
      await setHeroVideoPath(path);
      setDone(Date.now());
      input.value = "";
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card form" onSubmit={onSubmit}>
      <p style={{ margin: 0 }}>Aktuell: {current || "—"}</p>
      <label>
        Neues Video (MP4){" "}
        <input name="video" type="file" accept="video/mp4,video/*" required disabled={busy} />
      </label>
      <button className="btn primary" disabled={busy}>
        {busy ? "Lädt hoch…" : "Video ersetzen"}
      </button>
      {error && <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p>}
      {done > 0 && <Toast key={done} message="Hero-Video gespeichert!" />}
    </form>
  );
}
