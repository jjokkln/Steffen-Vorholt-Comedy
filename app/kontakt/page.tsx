import type { Metadata } from "next";
import FakeForm from "@/components/FakeForm";
import Footer from "@/components/Footer";
import { getActiveShows } from "@/lib/data";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Kontakt & Bewerbung – Steffen Vorholt",
  description:
    "Steffen Vorholt für Events buchen oder dich als Comedian für seine Shows bewerben – ein Formular, zwei Wege.",
};

export default async function KontaktPage() {
  const shows = await getActiveShows();
  return (
    <>
      <header className="container section">
        <div className="eyebrow">📡 Kontakt &amp; Bewerbung</div>
        <h1>Funkkontakt aufnehmen.</h1>
        <p className="lead">
          Du willst Steffen für dein Event buchen? Oder selbst auf eine seiner Bühnen? Beides startet
          hier.
        </p>
      </header>

      <section className="container section" id="buchen">
        <div className="feature">
          <div>
            <div className="eyebrow">🎤 Für Veranstalter</div>
            <h2>Steffen buchen.</h2>
            <p className="lead">Comedy, Moderation oder beides – für Firmenfeiern, Galas und Events.</p>
          </div>
          <FakeForm message="Booking-Anfrage gespeichert" className="card form">
            <h3>Booking-Anfrage</h3>
            <div className="form two">
              <label>
                Name
                <input name="name" required />
              </label>
              <label>
                Firma
                <input name="company" />
              </label>
            </div>
            <div className="form two">
              <label>
                E-Mail
                <input name="email" type="email" required />
              </label>
              <label>
                Telefon
                <input name="phone" />
              </label>
            </div>
            <div className="form two">
              <label>
                Eventart
                <select name="event_type">
                  <option>Firmenfeier</option>
                  <option>Hochzeit</option>
                  <option>Gala</option>
                  <option>Moderation</option>
                  <option>Comedy-Auftritt</option>
                </select>
              </label>
              <label>
                Datum
                <input name="event_date" />
              </label>
            </div>
            <label>
              Nachricht
              <textarea name="message" placeholder="Ort, Gästezahl, Ablauf, gewünschte Leistung..." />
            </label>
            <button className="btn primary">Anfrage senden</button>
          </FakeForm>
        </div>
      </section>

      <section className="container section" id="bewerben">
        <div className="feature">
          <FakeForm message="Bewerbung gespeichert" className="card form">
            <h3>Comedian-Bewerbung</h3>
            <div className="form two">
              <label>
                Name
                <input name="name" required />
              </label>
              <label>
                Künstlername
                <input name="stage_name" />
              </label>
            </div>
            <div className="form two">
              <label>
                E-Mail
                <input name="email" type="email" required />
              </label>
              <label>
                Telefon
                <input name="phone" />
              </label>
            </div>
            <label>
              Instagram / TikTok / YouTube
              <input name="social_link" placeholder="https://..." />
            </label>
            <div className="form two">
              <label>
                Bevorzugte Show
                <select name="preferred_show">
                  {shows.map((s) => (
                    <option key={s.id}>{s.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Stadt
                <input name="city" />
              </label>
            </div>
            <label>
              Nachricht
              <textarea name="message" />
            </label>
            <button className="btn primary">Bewerbung absenden</button>
          </FakeForm>
          <div>
            <div className="eyebrow">🎭 Für Comedians</div>
            <h2>Du willst selbst auf die Bühne?</h2>
            <p className="lead">
              Keine Uploads nötig – schick einfach Links zu Instagram, TikTok oder YouTube. Steffen
              schaut alles persönlich an.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
