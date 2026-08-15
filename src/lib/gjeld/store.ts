import { defaultPlanState, type PlanState } from "./model";

export const PLAN_KEY = "bt_plan_v3";
const MIGRERT_KEY = "bt_plan_migrert_v3";

/**
 * Versjonert lagring. Brukerens egne registreringer vinner alltid:
 * lagrede lister brukes som de er, og nye standardposter legges kun til
 * hvis id-en mangler lokalt.
 */
export function loadPlan(): PlanState {
  const base = defaultPlanState();
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(PLAN_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Partial<PlanState>;
    return {
      version: 3,
      saker: mergeById(base.saker, saved.saker),
      betalinger: mergeById(base.betalinger, saved.betalinger),
      merknader: mergeById(base.merknader, saved.merknader),
      forpliktelser: mergeById(base.forpliktelser, saved.forpliktelser),
      abonnement: mergeById(base.abonnement, saved.abonnement),
      pendling: {
        valgt: saved.pendling?.valgt ?? base.pendling.valgt,
        scenarier: mergeById(base.pendling.scenarier, saved.pendling?.scenarier),
      },
      buffer: saved.buffer ?? base.buffer,
      resursSlutt: saved.resursSlutt ?? base.resursSlutt,
      rentebuffer: saved.rentebuffer ?? base.rentebuffer,
    };
  } catch {
    return base;
  }
}

function mergeById<T extends { id: string }>(defaults: T[], saved?: T[]): T[] {
  if (!saved || !Array.isArray(saved)) return defaults;
  const seen = new Set(saved.map((s) => s.id));
  const nye = defaults.filter((d) => !seen.has(d.id));
  return [...saved, ...nye];
}

export function savePlan(state: PlanState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PLAN_KEY, JSON.stringify(state));
}

/** Sant én gang etter oppgradering, slik at vi kan vise «planen er oppdatert». */
export function shouldAnnounceUpdate(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MIGRERT_KEY) !== "1";
}

export function markUpdateSeen() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MIGRERT_KEY, "1");
}
