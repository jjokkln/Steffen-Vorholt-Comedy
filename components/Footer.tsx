import Link from "next/link";

const LOGO = "/assets/media/brand/steffen-vorholt-logo-primary.svg";

export default function Footer({ variant = "default" }: { variant?: "default" | "calendar" }) {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Link className="brand" href="/">
            <span className="logo">
              <img src={LOGO} alt="" />
            </span>
            <span>Comedy-Universum</span>
          </Link>
          <p>Steffen Vorholt · Comedian, Moderator und Veranstalter aus Neuss.</p>
        </div>

        <div>
          <h4>Shows</h4>
          <p>
            <Link href="/shows/brain-loading">Brain Loading</Link>
            <br />
            <Link href="/shows/comedy-eiskalt">Comedy Eiskalt</Link>
            <br />
            <Link href="/shows/comedy-check-in">Comedy Check-In</Link>
          </p>
        </div>

        {variant === "calendar" && (
          <div>
            <h4>Kalender</h4>
            <p>
              <Link href="/kalender">Alle Shows</Link>
              <br />
              <Link href="/shows/brain-loading-termine">Brain Loading</Link>
              <br />
              <Link href="/shows/comedy-eiskalt-termine">Comedy Eiskalt</Link>
              <br />
              <Link href="/shows/comedy-check-in-termine">Comedy Check-In</Link>
            </p>
          </div>
        )}

        <div>
          <h4>Aktionen</h4>
          <p>
            <Link href="/termine">Tickets</Link>
            <br />
            <Link href="/comedians-bewerben">Comedian bewerben</Link>
            <br />
            <Link href="/steffen-buchen">Steffen buchen</Link>
          </p>
        </div>

        {variant === "default" && (
          <div>
            <h4>Rechtliches</h4>
            <p>
              <Link href="/impressum">Impressum</Link>
              <br />
              <Link href="/datenschutz">Datenschutz</Link>
              <br />
              <Link href="/datenschutz#cookies">Cookie-Richtlinie</Link>
            </p>
          </div>
        )}
      </div>
    </footer>
  );
}
