import { MONTHS } from "@/lib/gjeldsplan";
import { pendlingTotal, type PlanState, type Sak } from "./model";

export type Datakvalitet = "gronn" | "gul" | "rod";

export type SakStatus = {
  sak: Sak;
  bekreftetBetalt: number;
  estimert: number;
  kvalitet: Datakvalitet;
  kvalitetTekst: string;
};

export type KreditorStatus = {
  creditor: string;
  saker: SakStatus[];
  dokumentert: number;
  bekreftetBetalt: number;
  ufordelt: number;
  estimert: number;
  kvalitet: Datakvalitet;
  urgent: boolean;
};

const DAG = 86400000;

export function datakvalitet(sak: Sak, harBetalinger: boolean, now = new Date()): {
  kvalitet: Datakvalitet;
  tekst: string;
} {
  if (sak.quality === "maa_verifiseres" || !sak.docDate)
    return { kvalitet: "rod", tekst: "Mangler saldo/avklaring" };
  const alder = Math.floor((now.getTime() - new Date(sak.docDate + "T00:00:00Z").getTime()) / DAG);
  if (sak.quality === "dokumentert" && alder <= 30)
    return { kvalitet: "gronn", tekst: `Verifisert for ${alder} dager siden` };
  return {
    kvalitet: "gul",
    tekst: harBetalinger
      ? `Estimat: saldo fra ${sak.docDate} minus bekreftede betalinger`
      : `Estimat: saldo ${alder} dager gammel, renter ikke oppdatert`,
  };
}

export function statusPerKreditor(plan: PlanState, now = new Date()): KreditorStatus[] {
  const map = new Map<string, KreditorStatus>();
  for (const sak of plan.saker) {
    const betalt = plan.betalinger
      .filter((b) => b.status === "bekreftet" && b.sakId === sak.id)
      .reduce((s, b) => s + b.amount, 0);
    const q = datakvalitet(sak, betalt > 0, now);
    const entry: SakStatus = {
      sak,
      bekreftetBetalt: betalt,
      estimert: Math.max(0, sak.documented - betalt),
      kvalitet: q.kvalitet,
      kvalitetTekst: q.tekst,
    };
    const cur =
      map.get(sak.creditor) ??
      ({
        creditor: sak.creditor,
        saker: [],
        dokumentert: 0,
        bekreftetBetalt: 0,
        ufordelt: 0,
        estimert: 0,
        kvalitet: "gronn",
        urgent: false,
      } satisfies KreditorStatus);
    cur.saker.push(entry);
    cur.dokumentert += sak.documented;
    cur.bekreftetBetalt += betalt;
    if (sak.legal) cur.urgent = true;
    map.set(sak.creditor, cur);
  }
  for (const [creditor, cur] of map) {
    cur.ufordelt = plan.betalinger
      .filter((b) => b.status === "bekreftet" && !b.sakId && b.creditor === creditor)
      .reduce((s, b) => s + b.amount, 0);
    cur.estimert = Math.max(0, cur.dokumentert - cur.bekreftetBetalt - cur.ufordelt);
    cur.kvalitet = cur.saker.some((s) => s.kvalitet === "rod")
      ? "rod"
      : cur.saker.some((s) => s.kvalitet === "gul")
        ? "gul"
        : "gronn";
    cur.saker.sort((a, b) => b.estimert - a.estimert);
  }
  return [...map.values()].sort((a, b) => b.estimert - a.estimert);
}

/** Hybrid: kredittfil + høy rente. */
export function prioriter(plan: PlanState): SakStatus[] {
  const alle = statusPerKreditor(plan).flatMap((k) => k.saker);
  return alle
    .filter((s) => s.estimert > 0)
    .sort((a, b) => {
      const legal = Number(b.sak.legal) - Number(a.sak.legal);
      if (legal) return legal;
      const smallA = a.sak.closesCreditFile && a.estimert <= 2500 ? 1 : 0;
      const smallB = b.sak.closesCreditFile && b.estimert <= 2500 ? 1 : 0;
      if (smallA !== smallB) return smallB - smallA;
      if (smallA && smallB) return a.estimert - b.estimert;
      const rate = (b.sak.rate ?? 0) - (a.sak.rate ?? 0);
      if (rate) return rate;
      return b.estimert - a.estimert;
    });
}

export type Kapasitet = {
  month: string;
  netto: number;
  faste: number;
  engangs: number;
  levepenger: number;
  pendling: number;
  buffer: number;
  tilGjeld: number;
};

export function kapasitetFor(
  month: string,
  plan: PlanState,
  input: { netto: number; faste: number; engangs: number; levepenger: number },
): Kapasitet {
  const scen =
    plan.pendling.scenarier.find((s) => s.id === plan.pendling.valgt) ?? plan.pendling.scenarier[0];
  const pendling = scen ? pendlingTotal(scen).total : 0;
  const tilGjeld =
    input.netto - input.faste - input.engangs - input.levepenger - pendling - plan.buffer;
  return {
    month,
    netto: input.netto,
    faste: input.faste,
    engangs: input.engangs,
    levepenger: input.levepenger,
    pendling,
    buffer: plan.buffer,
    tilGjeld: Math.round(tilGjeld),
  };
}

export type PlanPost = {
  id: string;
  month: string;
  sakId: string;
  creditor: string;
  caseNo: string;
  description: string;
  amount: number;
  kid: string;
  account: string;
  urgent: boolean;
  /** Planlagt, ikke gjennomført. */
  planlagt: true;
};

/** Fordeler faktisk disponibelt beløp måned for måned etter valgt prioritet. */
export function byggPlan(
  plan: PlanState,
  kapasitet: (month: string) => number,
  fraMaaned: string,
): PlanPost[] {
  const rest = new Map(prioriter(plan).map((s) => [s.sak.id, s.estimert]));
  const rekkefolge = prioriter(plan);
  const poster: PlanPost[] = [];
  const maaneder = MONTHS.map((m) => m.key).filter((k) => k >= fraMaaned);
  for (const month of maaneder) {
    let igjen = Math.max(0, kapasitet(month));
    if (igjen <= 0) continue;
    for (const s of rekkefolge) {
      const r = rest.get(s.sak.id) ?? 0;
      if (r <= 0 || igjen <= 0) continue;
      const belop = Math.min(r, igjen);
      rest.set(s.sak.id, r - belop);
      igjen -= belop;
      poster.push({
        id: `plan-${s.sak.id}-${month}`,
        month,
        sakId: s.sak.id,
        creditor: s.sak.creditor,
        caseNo: s.sak.caseNo,
        description: s.sak.description,
        amount: Math.round(belop),
        kid: s.sak.kid,
        account: s.sak.account,
        urgent: s.sak.legal,
        planlagt: true,
      });
    }
  }
  return poster;
}

export type Forecast = {
  tidligst: string | null;
  realistisk: string | null;
  konservativ: string | null;
  totalEstimert: number;
  medRentebuffer: number;
};

function naarFerdig(total: number, kapasitet: (m: string) => number, faktor: number, fra: string) {
  let rest = total;
  for (const m of MONTHS.map((x) => x.key).filter((k) => k >= fra)) {
    rest -= Math.max(0, kapasitet(m)) * faktor;
    if (rest <= 0) return m;
  }
  return null;
}

export function forecast(
  plan: PlanState,
  kapasitet: (m: string) => number,
  fraMaaned: string,
): Forecast {
  const totalEstimert = statusPerKreditor(plan).reduce((s, k) => s + k.estimert, 0);
  const medRentebuffer = totalEstimert * (1 + plan.rentebuffer / 100);
  return {
    tidligst: naarFerdig(totalEstimert, kapasitet, 1.15, fraMaaned),
    realistisk: naarFerdig(medRentebuffer, kapasitet, 1, fraMaaned),
    konservativ: naarFerdig(medRentebuffer, kapasitet, 0.8, fraMaaned),
    totalEstimert,
    medRentebuffer,
  };
}

export function nesteBesteBetaling(plan: PlanState, kapasitetNa: number) {
  const first = prioriter(plan)[0];
  if (!first) return null;
  return {
    sak: first.sak,
    estimert: first.estimert,
    forslag: Math.max(0, Math.min(first.estimert, kapasitetNa)),
    grunn: first.sak.legal
      ? "Juridisk frist / hastesak"
      : first.sak.closesCreditFile && first.estimert <= 2500
        ? "Liten sak – kan lukke en kredittfilpost"
        : `Høyest rente (${first.sak.rate ?? "ukjent"} %)`,
  };
}
