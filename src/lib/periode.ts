/**
 * Felles månedsavgrensning. Både banksynken og «Igjen»-fanen bruker dette,
 * slik at beregningen alltid dekker nøyaktig samme tidsvindu som det som
 * hentes fra banken.
 */
export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y!, m! - 1, 1));
  const last = new Date(Date.UTC(y!, m!, 0));
  return { from: first.toISOString().slice(0, 10), to: last.toISOString().slice(0, 10) };
}

/** Antall dager i måneden (siste dag i vinduet). */
export function daysInMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y!, m!, 0)).getUTCDate();
}

/** Er en dag-i-måneden innenfor vinduet? */
export function dayInRange(day: number, month: string) {
  return day >= 1 && day <= daysInMonth(month);
}

/** Er en ISO-dato (YYYY-MM-DD) innenfor månedsvinduet? */
export function dateInRange(date: string, month: string) {
  const { from, to } = monthRange(month);
  return date >= from && date <= to;
}

/** F.eks. «1.–31. aug». */
export function rangeLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  const short = new Intl.DateTimeFormat("nb-NO", { month: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(y!, m! - 1, 1)),
  );
  return `1.–${daysInMonth(month)}. ${short}`;
}
