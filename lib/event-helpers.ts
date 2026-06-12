const MONTHS_SHORT = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const MONTHS_LONG = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function partitionEvents<T extends { date: string }>(
  events: T[],
  today: string = todayIso(),
): { upcoming: T[]; past: T[] } {
  const upcoming = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = events.filter((e) => e.date < today).sort((a, b) => b.date.localeCompare(a.date));
  return { upcoming, past };
}

export function formatDay(dateIso: string): string {
  return dateIso.slice(8, 10);
}

export function formatMonth(dateIso: string): string {
  return `${MONTHS_SHORT[Number(dateIso.slice(5, 7)) - 1]} ${dateIso.slice(0, 4)}`;
}

export function formatDateLong(dateIso: string): string {
  return `${Number(dateIso.slice(8, 10))}. ${MONTHS_LONG[Number(dateIso.slice(5, 7)) - 1]} ${dateIso.slice(0, 4)}`;
}
