import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Steffen Vorholt – Comedy aus einer anderen Galaxie";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "linear-gradient(170deg,#06070f,#0a0d20)", color: "#fff" }}>
        <div style={{ fontSize: 30, color: "#f5d68a", letterSpacing: 6 }}>LIVE-COMEDY AUS NRW</div>
        <div style={{ fontSize: 84, fontWeight: 800, marginTop: 16 }}>Steffen Vorholt</div>
        <div style={{ fontSize: 40, marginTop: 12, color: "rgba(255,255,255,.78)" }}>Comedy aus einer anderen Galaxie.</div>
        <div style={{ fontSize: 28, marginTop: 48, color: "#7CFF6B" }}>steffenvorholt.de</div>
      </div>
    ),
    size,
  );
}
