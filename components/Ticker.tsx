import { getPublishedEvents } from "@/lib/data";
import { partitionEvents, formatDateLong } from "@/lib/event-helpers";

export default async function Ticker() {
  const { upcoming } = partitionEvents(await getPublishedEvents());
  const next = upcoming[0];
  const text = next
    ? `✦ Nächste Show: ${next.shows?.name} · ${formatDateLong(next.date)} · ${next.city} ✦ Tickets jetzt sichern`
    : "✦ Neue Termine in Arbeit ✦ Steffen schreibt gerade neue Witze";
  const content = Array(4).fill(text).join("  ");

  return (
    <a href="/termine" className="ticker" aria-label="Zum Kalender">
      <div className="ticker-track">
        <span>{content}</span>
        <span aria-hidden="true">{content}</span>
      </div>
    </a>
  );
}
