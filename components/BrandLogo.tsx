import Image from "next/image";

/**
 * Logo im 52-px-Rahmen (`.logo` in globals.css). Läuft über next/image, weil die
 * Quelldatei ein 2000×2479-PNG mit 849 KB ist — als rohes `<img>` lag sie zweimal
 * pro Seitenaufruf (Kopf- und Fußbereich) auf der Leitung.
 */
export default function BrandLogo() {
  return (
    <span className="logo">
      <Image
        src="/assets/media/brand/logo_steffen.png"
        alt=""
        width={52}
        height={52}
        sizes="52px"
        style={{ objectFit: "contain" }}
      />
    </span>
  );
}
