import Link from "next/link";
import { getActiveShows } from "@/lib/data";
import ConsentSettingsButton from "@/components/consent/ConsentSettingsButton";
import BrandLogo from "@/components/BrandLogo";


export default async function Footer() {
  const shows = await getActiveShows();
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Link className="brand" href="/">
            <BrandLogo />
            <span>Comedy-Universum</span>
          </Link>
          <p>Steffen Vorholt · Comedian, Moderator und Veranstalter aus Recklinghausen.</p>
        </div>
        <div>
          <h4>Shows</h4>
          <p>
            {shows.map((s) => (
              <span key={s.id}>
                <Link href={`/shows/${s.slug}`}>{s.name}</Link>
                <br />
              </span>
            ))}
          </p>
        </div>
        <div>
          <h4>Entdecken</h4>
          <p>
            <Link href="/shows">Shows &amp; Termine</Link>
            <br />
            <Link href="/angebote">Angebote</Link>
            <br />
            <Link href="/galerie">Galerie &amp; Gästebuch</Link>
            <br />
            <Link href="/steffen">Über Steffen</Link>
            <br />
            <Link href="/kontakt">Booking &amp; Kontakt</Link>
          </p>
        </div>
        <div>
          <h4>Rechtliches</h4>
          <p>
            <Link href="/impressum">Impressum</Link>
            <br />
            <Link href="/datenschutz">Datenschutz</Link>
            <br />
            <Link href="/agb">AGB</Link>
            <br />
            {/* Widerruf muss so einfach sein wie die Einwilligung (Art. 7 Abs. 3 DSGVO) */}
            <ConsentSettingsButton />
          </p>
        </div>
      </div>
      <div className="container" style={{ paddingBlock: "18px", color: "var(--muted)", fontSize: 13 }}>
        © {new Date().getFullYear()} Steffen Vorholt · Mit Liebe zur Pointe irgendwo zwischen Recklinghausen und Andromeda gebaut.
      </div>
    </footer>
  );
}
