import type { Metadata } from "next";
import FakeForm from "@/components/FakeForm";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Steffen buchen – Steffen Vorholt",
  description: "Steffen Vorholt für Moderation, Comedy und Events buchen.",
};

export default function SteffenBuchenPage() {
  return (
    <>
      <header className="container section feature">
        <FakeForm message="Booking-Anfrage gespeichert" className="card form">
          <h3>Steffen buchen</h3>
          <div className="form two">
            <label>
              Name
              <input />
            </label>
            <label>
              Firma
              <input />
            </label>
          </div>
          <div className="form two">
            <label>
              E-Mail
              <input />
            </label>
            <label>
              Telefon
              <input />
            </label>
          </div>
          <div className="form two">
            <label>
              Eventart
              <select>
                <option>Firmenfeier</option>
                <option>Hochzeit</option>
                <option>Gala</option>
                <option>Moderation</option>
                <option>Comedy-Auftritt</option>
              </select>
            </label>
            <label>
              Datum
              <input />
            </label>
          </div>
          <label>
            Nachricht
            <textarea placeholder="Ort, Gästezahl, Ablauf, gewünschte Leistung..." />
          </label>
          <button className="btn primary">Anfrage senden</button>
        </FakeForm>
        <div>
          <div className="eyebrow">🎤 Booking</div>
          <h1>Comedy, Moderation & Events.</h1>
          <p className="lead">
            Booking ist sekundär zur Ticketstrecke, aber professionell integriert: Anfrage per Mail
            und Speicherung im Dashboard.
          </p>
        </div>
      </header>

      <Footer />
    </>
  );
}
