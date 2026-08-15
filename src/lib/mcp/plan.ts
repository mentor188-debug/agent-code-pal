import {
  DEBTS,
  ENGANGS,
  FASTE,
  LEVEPENGER_BUDSJETT,
  LONNSTREKK_SAK,
  MONTHS,
  type Debt,
} from "@/lib/gjeldsplan";
import { defaultPlanState } from "@/lib/gjeld/model";
import { statusPerKreditor } from "@/lib/gjeld/motor";

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
  const plan = defaultPlanState();
  return statusPerKreditor(plan).map((k) => ({
    creditor: k.creditor,
    dokumentert: k.dokumentert,
    bekreftetBetalt: k.bekreftetBetalt,
    ufordelt: k.ufordelt,
    estimert: k.estimert,
    cases: k.saker.length,
    caseNos: k.saker.map((s) => s.sak.caseNo),
    kids: k.saker.map((s) => s.sak.kid).filter(Boolean),
    datakvalitet: k.kvalitet,
    urgent: k.urgent,

  }));
}


export function daysUntilDebtFree(from = new Date()) {
  const target = new Date(GJELDFRI_DATO + "T00:00:00Z");
  const start = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  return Math.max(0, Math.round((target.getTime() - start) / 86400000));
}

export { DEBTS, MONTHS, FASTE, ENGANGS, LONNSTREKK_SAK, LEVEPENGER_BUDSJETT };
export type { Debt };
