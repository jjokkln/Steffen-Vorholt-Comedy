import Link from "next/link";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <section className="container section" style={{ textAlign: "center", minHeight: "60vh" }}>
        <div className="eyebrow">🛸 404 – Signal verloren</div>
        <h1>
          Diese Seite ist auf einem <em className="gradient" style={{ fontStyle: "italic" }}>anderen Planeten</em> gelandet.
        </h1>
        <p className="lead" style={{ margin: "18px auto 0" }}>
          Entweder hat sich der Link vertippt – oder Steffen hat die Seite in der zweiten Hälfte
          weggebuzzert. Kommt vor.
        </p>
        <div className="actions" style={{ justifyContent: "center" }}>
          <Link className="btn primary" href="/">
            🚀 Zurück zur Erde
          </Link>
          <Link className="btn secondary" href="/termine">
            Direkt zu den Tickets
          </Link>
        </div>
      </section>
      <Footer />
    </>
  );
}
