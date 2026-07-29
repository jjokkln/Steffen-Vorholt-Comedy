"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatBytes, usageLevel } from "@/lib/storage-format";
import type { StorageUsage } from "@/lib/storage-usage";

/** Nach einem Upload auslösen (`window.dispatchEvent`), damit die Leiste neu zählt. */
export const STORAGE_USAGE_REFRESH_EVENT = "storage-usage:refresh";

export function requestStorageUsageRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STORAGE_USAGE_REFRESH_EVENT));
  }
}

/**
 * Speicher-Leiste in der Admin-Topbar: steht auf jeder Seite und zeigt, wie viel vom
 * Storage-Kontingent die hinterlegten Medien schon belegen. Lädt selbst nach dem Rendern
 * (siehe app/api/admin/storage-usage), damit das Zählen der Dateien keine Seite ausbremst.
 */
export default function StorageUsageBar() {
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [failed, setFailed] = useState(false);

  // `fresh` umgeht den 60-Sekunden-Cache der Route — nur nötig, wenn gerade eine Datei
  // dazugekommen oder verschwunden ist. Beim normalen Seitenwechsel im Dashboard darf die
  // Antwort aus dem Cache kommen, sonst zählt jeder Klick alle Storage-Objekte neu durch.
  const load = useCallback(async (fresh = false) => {
    try {
      const response = await fetch("/api/admin/storage-usage", fresh ? { cache: "no-store" } : {});
      if (!response.ok) throw new Error("Abruf fehlgeschlagen");
      setUsage((await response.json()) as StorageUsage);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
    const onRefresh = () => void load(true);
    window.addEventListener(STORAGE_USAGE_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(STORAGE_USAGE_REFRESH_EVENT, onRefresh);
  }, [load]);

  if (failed) return null;

  const ratio = usage ? Math.min(1, Math.max(0, usage.ratio)) : 0;
  const percent = usage ? Math.round(usage.ratio * 100) : 0;
  const level = usageLevel(usage?.ratio ?? 0);

  return (
    <Link
      href="/admin/medien"
      className={`storage-pill is-${level}`}
      title={
        usage
          ? `${usage.files} Dateien · ${formatBytes(usage.bytes)} von ${formatBytes(usage.quotaBytes)} belegt`
          : "Speicherverbrauch wird ermittelt"
      }
    >
      <span className="storage-pill-label">Speicher</span>
      <span className="storage-pill-track" aria-hidden="true">
        <span className="storage-pill-fill" style={{ width: `${ratio * 100}%` }} />
      </span>
      <span className="storage-pill-value">
        {usage ? `${formatBytes(usage.bytes)} / ${formatBytes(usage.quotaBytes)} · ${percent} %` : "…"}
      </span>
    </Link>
  );
}
