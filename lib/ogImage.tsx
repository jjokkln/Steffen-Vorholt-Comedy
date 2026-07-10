import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

// Gemeinsame Share-Karte für Open Graph (WhatsApp/Facebook/LinkedIn) und
// Twitter. Steffens Freisteller macht die Karte deutlich klickstärker als
// reiner Text. Bild wird als data-URI eingebettet (satori kann keine URLs).
export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";
export const ogAlt = "Steffen Vorholt – Comedy aus einer anderen Galaxie";

const steffen = readFileSync(join(process.cwd(), "public/assets/metadada/og-steffen.png"));
const steffenSrc = `data:image/png;base64,${steffen.toString("base64")}`;

export function ogImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          color: "#fff",
          background: "linear-gradient(135deg,#06070f 0%,#0a0d20 55%,#0b0620 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            display: "flex",
            width: 560,
            height: 560,
            right: 90,
            top: -160,
            borderRadius: "50%",
            background: "radial-gradient(circle,rgba(124,255,107,.28),transparent 70%)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: 720,
            padding: "0 0 0 80px",
          }}
        >
          <div style={{ fontSize: 27, color: "#f5d68a", letterSpacing: 6, fontWeight: 700 }}>
            LIVE-COMEDY AUS NRW
          </div>
          <div style={{ fontSize: 94, fontWeight: 800, marginTop: 14, lineHeight: 1 }}>
            Steffen Vorholt
          </div>
          <div style={{ fontSize: 40, marginTop: 18, color: "rgba(255,255,255,.82)" }}>
            Comedy aus einer anderen Galaxie.
          </div>
          <div style={{ fontSize: 26, color: "#7CFF6B", fontWeight: 700, marginTop: 42 }}>
            steffenvorholt.de
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: 48,
            bottom: 0,
            display: "flex",
            height: "100%",
            alignItems: "flex-end",
          }}
        >
          <img src={steffenSrc} height={600} style={{ objectFit: "contain" }} alt="" />
        </div>
      </div>
    ),
    ogSize,
  );
}
