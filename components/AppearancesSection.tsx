import { formatDateLong } from "@/lib/event-helpers";
import type { Appearance } from "@/lib/types";

const KIND_LABEL: Record<Appearance["kind"], string> = {
  open_mic: "Open Mic",
  guest: "Gastauftritt",
  gig: "Gig",
  show: "Eigene Show",
};

export default function AppearancesSection({ appearances }: { appearances: Appearance[] }) {
  if (appearances.length === 0) return null;

  return (
    <section className="container section">
      <div className="section-head">
        <div>
          <div className="eyebrow">Steffen als Comedian</div>
          <h2>Wo Steffen selbst auf der Bühne steht.</h2>
        </div>
        <p>
          Open Mics, Gastauftritte &amp; Gigs – unter anderem bei <strong>Komiker 11</strong>.
          Ein Klick führt direkt zur Show.
        </p>
      </div>
      <div className="grid-3 appearance-grid">
        {appearances.map((a) => (
          <article className="card appearance-card" key={a.id}>
            <span className="badge">{KIND_LABEL[a.kind]}</span>
            <h3>{a.title}</h3>
            {a.date && <p className="appearance-date">{formatDateLong(a.date)}</p>}
            {(a.venue || a.organizer || a.city) && (
              <p className="appearance-sub">
                {[a.venue || a.organizer, a.city].filter(Boolean).join(", ")}
              </p>
            )}
            {a.url && (
              <a className="btn secondary" href={a.url} target="_blank" rel="noopener noreferrer">
                Mehr Infos
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
