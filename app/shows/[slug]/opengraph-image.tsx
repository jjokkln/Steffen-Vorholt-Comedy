import { ImageResponse } from "next/og";
import { getShowBySlug } from "@/lib/data";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Show von Steffen Vorholt";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const show = await getShowBySlug(slug);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "linear-gradient(170deg,#06070f,#0a0d20)", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div style={{ width: 150, height: 150, borderRadius: 9999, background: show?.color ?? "#7CFF6B", boxShadow: `0 0 80px ${show?.color ?? "#7CFF6B"}` }} />
          <div style={{ fontSize: 72, fontWeight: 800 }}>{show?.name ?? "Steffen Vorholt"}</div>
        </div>
        <div style={{ fontSize: 38, marginTop: 28, color: "rgba(255,255,255,.78)" }}>{show?.tagline ?? ""}</div>
        <div style={{ fontSize: 28, marginTop: 44, color: "#f5d68a" }}>steffenvorholt.de · Comedy von Steffen Vorholt</div>
      </div>
    ),
    size,
  );
}
