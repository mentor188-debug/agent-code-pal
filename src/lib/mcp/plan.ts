import {
  DEBTS,
  ENGANGS,
  FASTE,
  LEVEPENGER_BUDSJETT,
  LONNSTREKK_SAK,
  MONTHS,
  type Debt,
} from "@/lib/gjeldsplan";

export const GJELDFRI_DATO = "2027-02-28";

export function fasteSum() {
  return FASTE.reduce((s, f) => s + f.amount, 0);
}

export function debtsForMonth(monthKey: string): Debt[] {
  return DEBTS.filter((d) => d.month === monthKey);
}

export function monthSummary(monthKey: string) {
  const meta = MONTHS.find((m) => m.key === monthKey);
  if (!meta) return null;
  const gjeld = debtsForMonth(monthKey).reduce((s, d) => s + d.amount, 0);
  const engangs = (ENGANGS[monthKey] ?? []).reduce((s, e) => s + e.amount, 0);
  const faste = fasteSum();
  return {
    month: monthKey,
    brutto: meta.brutto,
    skatt: meta.skatt,
    utleggstrekk: meta.utleggstrekk,
    netto: meta.netto,
    faste,
    engangs,
    gjeld,
    levepenger: LEVEPENGER_BUDSJETT,
    resultat: meta.netto - faste - engangs - gjeld - LEVEPENGER_BUDSJETT,
  };
}

export function totalPlan() {
  return DEBTS.reduce((s, d) => s + d.amount, 0) + LONNSTREKK_SAK.amount;
}

export function creditorOverview() {
  const map = new Map<
    string,
    { creditor: string; total: number; cases: Set<string>; kids: Set<string>; urgent: boolean }
  >();
  for (const d of DEBTS) {
    const cur =
      map.get(d.creditor) ??
      { creditor: d.creditor, total: 0, cases: new Set<string>(), kids: new Set<string>(), urgent: false };
    cur.total += d.amount;
    cur.cases.add(d.caseNo);
    if (d.kid) cur.kids.add(d.kid);
    if (d.urgent) cur.urgent = true;
    map.set(d.creditor, cur);
  }
  const lonn = map.get(LONNSTREKK_SAK.creditor);
  if (lonn) {
    lonn.total += LONNSTREKK_SAK.amount;
    lonn.cases.add(LONNSTREKK_SAK.caseNo);
  }
  return [...map.values()]
    .map((c) => ({
      creditor: c.creditor,
      total: c.total,
      cases: c.cases.size,
      caseNos: [...c.cases],
      kids: [...c.kids],
      urgent: c.urgent,
    }))
    .sort((a, b) => b.total - a.total);
}

export function daysUntilDebtFree(from = new Date()) {
  const target = new Date(GJELDFRI_DATO + "T00:00:00Z");
  const start = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  return Math.max(0, Math.round((target.getTime() - start) / 86400000));
}

export { DEBTS, MONTHS, FASTE, ENGANGS, LONNSTREKK_SAK, LEVEPENGER_BUDSJETT };
export type { Debt };
