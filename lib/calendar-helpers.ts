const MONTHS_LONG = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

export interface CalendarCell {
  day: number | null;
  iso: string | null;
}

export function buildCalendarCells(year: number, month: number): CalendarCell[] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7; // Montag = 0
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: CalendarCell[] = [];
  for (let i = 0; i < offset; i++) cells.push({ day: null, iso: null });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, iso: `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, iso: null });
  return cells;
}

export function monthTitle(year: number, month: number): string {
  return `${MONTHS_LONG[month - 1]} ${year}`;
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const idx = year * 12 + (month - 1) + delta;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}
