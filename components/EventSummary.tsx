import Link from "next/link";
import { EVENTS, SHOW_META, SHOW_ORDER } from "@/lib/events";

export default function EventSummary() {
  return (
    <div className="booking-summary" data-booking-summary>
      {SHOW_ORDER.map((show) => {
        const count = EVENTS.filter((e) => e.show === show).length;
        const meta = SHOW_META[show];
        return (
          <Link className="summary-card" href={`/shows/${meta.slug}-termine`} key={show}>
            <strong>{count}</strong>
            <span>
              {show}
              <br />
              {meta.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
