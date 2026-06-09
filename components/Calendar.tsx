import { type ComedyEvent, EVENTS, targetForEvent } from "@/lib/events";

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

const CELLS = [
  "", "", "", "", "", "", "01",
  "02", "03", "04", "05", "06", "07", "08",
  "09", "10", "11", "12", "13", "14", "15",
  "16", "17", "18", "19", "20", "21", "22",
  "23", "24", "25", "26", "27", "28", "29",
  "30", "31", "", "", "", "", "",
];

export default function Calendar() {
  const eventByDay: Record<string, ComedyEvent[]> = {};
  EVENTS.forEach((e) => {
    if (!e.date) return;
    const day = e.date.slice(-2);
    (eventByDay[day] ||= []).push(e);
  });

  return (
    <div className="calendar-grid-large" data-calendar-grid>
      {WEEKDAYS.map((d) => (
        <div className="calendar-weekday" key={d}>
          {d}
        </div>
      ))}
      {CELLS.map((day, i) => {
        const items = day && eventByDay[day] ? eventByDay[day] : [];
        return (
          <div className={`calendar-cell ${day ? "" : "dim"}`} key={i}>
            <div className="calendar-cell-number">{day}</div>
            {items.map((e, j) => {
              const isExternal = Boolean(e.ticketUrl);
              return (
                <a
                  className={`calendar-event ${e.color}`}
                  href={targetForEvent(e)}
                  target={isExternal ? "_blank" : "_self"}
                  key={j}
                >
                  {e.show}
                  <br />
                  {e.city}
                </a>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
