import Image from "next/image";
import type { CSSProperties } from "react";
import { formatDateLong } from "@/lib/event-helpers";
import { mediaUrl } from "@/lib/media";
import type { Appearance } from "@/lib/types";

const KIND_LABEL: Record<Appearance["kind"], string> = {
  open_mic: "Open Mic",
  guest: "Auftritt",
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
          <h2>Hier siehst du mich als Nächstes.</h2>
        </div>
        <p>
          Open Mics, Mix Shows, Veranstaltungen oder auf dem Platz mit der{" "}
          <strong>Komiker 11</strong>. Ein Klick führt dich direkt dort hin.
        </p>
      </div>
      <div className="appearance-grid">
        {appearances.map((a) => {
          const style = { "--accent": a.color || "#7CFF6B" } as CSSProperties;
          const inner = (
            <>
              <div className="appearance-flyer">
                {a.flyer_path ? (
                  // .appearance-flyer ist ein 4:3-Rahmen mit position:relative — genau das,
                  // was `fill` braucht. Karten sind im 3er-Grid rund 380 px breit.
                  <Image
                    src={mediaUrl(a.flyer_path)}
                    alt={a.title}
                    fill
                    sizes="(max-width: 900px) 92vw, 380px"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <span className="appearance-flyer-fallback" aria-hidden="true">🎤</span>
                )}
                <span className="appearance-kind badge">{KIND_LABEL[a.kind]}</span>
              </div>
              <div className="appearance-body">
                <h3>{a.title}</h3>
                {a.date && <p className="appearance-date">{formatDateLong(a.date)}</p>}
                {(a.venue || a.organizer || a.city) && (
                  <p className="appearance-sub">
                    {[a.venue || a.organizer, a.city].filter(Boolean).join(", ")}
                  </p>
                )}
                {a.url && <span className="appearance-cta">Mehr Infos →</span>}
              </div>
            </>
          );
          return a.url ? (
            <a
              className="card appearance-card is-link"
              key={a.id}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              style={style}
            >
              {inner}
            </a>
          ) : (
            <article className="card appearance-card" key={a.id} style={style}>
              {inner}
            </article>
          );
        })}
      </div>
    </section>
  );
}
