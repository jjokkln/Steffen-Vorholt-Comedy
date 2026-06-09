import type { Metadata } from "next";
import FakeForm from "@/components/FakeForm";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Als Comedian bewerben – Steffen Vorholt",
  description: "Comedians können sich für Shows und Open Mics bewerben.",
};

export default function ComediansBewerbenPage() {
  return (
    <>
      <header className="container section feature">
        <div>
          <div className="eyebrow">🎭 Comedians</div>
          <h1>Du willst selbst auf die Bühne?</h1>
          <p className="lead">
            Keine Uploads. Einfach Links zu Instagram, TikTok, YouTube oder Video angeben. Bewerbung
            wird per Mail verschickt und im Dashboard gespeichert.
          </p>
        </div>
        <FakeForm message="Bewerbung gespeichert" className="card form">
          <h3>Comedian-Bewerbung</h3>
          <div className="form two">
            <label>
              Name
              <input />
            </label>
            <label>
              Künstlername
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
          <label>
            Instagram / TikTok / YouTube
            <input placeholder="https://..." />
          </label>
          <div className="form two">
            <label>
              Bevorzugte Show
              <select>
                <option>Brain Loading</option>
                <option>Comedy Eiskalt</option>
                <option>Comedy Check-In</option>
              </select>
            </label>
            <label>
              Stadt
              <input />
            </label>
          </div>
          <label>
            Nachricht
            <textarea />
          </label>
          <button className="btn primary">Bewerbung absenden</button>
        </FakeForm>
      </header>

      <Footer />
    </>
  );
}
