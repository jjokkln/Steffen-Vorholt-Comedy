import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";
import { getActiveShows } from "@/lib/data";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Booking & Kontakt",
  description:
    "Eine Show buchen, Steffen selbst buchen oder einfach eine Frage stellen – drei Wege, ein Funkkontakt.",
};

export default async function KontaktPage() {
  const shows = await getActiveShows();
  return (
    <>
      <header className="container section">
        <div className="eyebrow">📡 Booking &amp; Kontakt</div>
        <h1>Funkkontakt aufnehmen.</h1>
        <p className="lead">
          Du willst eine Show buchen, Steffen selbst auf deine Bühne holen oder hast einfach eine
          Frage? Wähl deinen Kanal.
        </p>
      </header>

      <section className="container section contact-grid">
        {/* 1) Eine Show buchen → Show-Postfach */}
        <div id="booking-show">
          <ContactForm
            type="booking_show"
            icon="🎟️"
            accent="green"
            title="Eine Show buchen."
            description="Hol dir Comedy Eiskalt, Doppel Comedy oder Brain Loading auf deine Bühne. Auf Wunsch schickt Steffen dir vorab einen Videoausschnitt."
            submitLabel="Anfrage senden"
            successMessage="Deine Show-Anfrage ist gelandet. Steffen meldet sich, sobald er das Mikro aus der Hand legt."
            hint="→ Landet direkt im Show-Postfach"
          >
            <div className="form two">
              <label>
                Name
                <input name="name" required maxLength={120} />
              </label>
              <label>
                E-Mail
                <input name="email" type="email" required maxLength={254} />
              </label>
            </div>
            <div className="form two">
              <label>
                Telefon
                <input name="phone" maxLength={40} />
              </label>
              <label>
                Show
                <select name="show">
                  {shows.map((s) => (
                    <option key={s.id}>{s.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form two">
              <label>
                Wunschdatum
                <input name="event_date" maxLength={200} />
              </label>
              <label>
                Stadt / Location
                <input name="city" maxLength={200} />
              </label>
            </div>
            <label>
              Vorab ein Beispielvideo?
              {/*
                Klarstellung vom 30.07.2026: Gemeint ist ein Ausschnitt aus Steffens Show, den er
                dem Interessenten vor der Buchung schickt — KEINE Aufnahme der Veranstaltung des
                Anfragenden. „Video auf Anfrage" war in beide Richtungen lesbar, und die
                Bestätigungsmail versprach sogar „ein Video von deiner Show".
              */}
              <span className="field-hint">
                Steffen schickt dir per E-Mail einen Ausschnitt aus der Show, damit du vor der
                Buchung siehst, was auf deine Bühne kommt.
              </span>
              <select name="video_requested">
                <option value="">Nein, danke</option>
                <option value="ja">Ja, bitte einen Ausschnitt schicken</option>
              </select>
            </label>
            <label>
              Nachricht
              <textarea name="message" placeholder="Gästezahl, Ablauf, Budget, gewünschte Leistung..." maxLength={5000} />
            </label>
          </ContactForm>
        </div>

        {/* 2) Steffen selbst buchen → Booking-Postfach */}
        <div id="booking-steffen">
          <ContactForm
            type="booking_steffen"
            icon="🎤"
            accent="gold"
            title="Steffen buchen."
            description="Comedy, Moderation oder beides – für Firmenfeiern, Galas und Events. Direkt an Steffens Booking."
            submitLabel="Booking-Anfrage senden"
            successMessage="Anfrage empfangen! Steffen meldet sich für die Details."
            hint="→ Landet direkt im Booking-Postfach"
          >
            <div className="form two">
              <label>
                Name
                <input name="name" required maxLength={120} />
              </label>
              <label>
                Firma
                <input name="company" maxLength={200} />
              </label>
            </div>
            <div className="form two">
              <label>
                E-Mail
                <input name="email" type="email" required maxLength={254} />
              </label>
              <label>
                Telefon
                <input name="phone" maxLength={40} />
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
                <input name="event_date" maxLength={200} />
              </label>
            </div>
            <label>
              Nachricht
              <textarea name="message" placeholder="Ort, Gästezahl, Ablauf, gewünschte Leistung..." maxLength={5000} />
            </label>
          </ContactForm>
        </div>

        {/* 3) Frage / Feedback → Show-Postfach */}
        <div id="frage">
          <ContactForm
            type="frage_feedback"
            icon="💬"
            accent="blue"
            title="Frage oder Feedback."
            description="Eine kurze Frage, ein Lob oder Verbesserungsvorschlag? Schreib einfach – Steffen liest mit."
            submitLabel="Absenden"
            successMessage="Danke! Deine Nachricht ist angekommen."
            hint="→ Landet direkt im Show-Postfach"
          >
            <div className="form two">
              <label>
                Name
                <input name="name" required maxLength={120} />
              </label>
              <label>
                E-Mail
                <input name="email" type="email" required maxLength={254} />
              </label>
            </div>
            <label>
              Nachricht
              <textarea name="message" placeholder="Deine Frage oder dein Feedback..." maxLength={5000} />
            </label>
          </ContactForm>
        </div>
      </section>

      <Footer />
    </>
  );
}
