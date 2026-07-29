"use client";

import dynamic from "next/dynamic";

/**
 * Leaflet greift beim Import auf `window` zu – die Karte darf deshalb nie im
 * SSR-Durchlauf landen, sonst bricht der Build. `ssr:false` ist nur in Client
 * Components erlaubt, darum dieser Wrapper: die Aufrufer (TermineSection,
 * /admin/standorte) importieren weiterhin einfach NRWMap.
 */
const NRWMapClient = dynamic(() => import("@/components/shows/NRWMapClient"), {
  ssr: false,
  loading: () => <div className="map-placeholder card">🛰️ Karte wird geladen…</div>,
});

export default NRWMapClient;
