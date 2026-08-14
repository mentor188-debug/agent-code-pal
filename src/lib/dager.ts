import { FASTE, type Debt } from "./gjeldsplan";

const KEY_DUE = "bt_due_v1";

/** Sluttdato for planen – gjeldfri. */
export const GOAL_DATE = new Date(2027, 1, 28);

export function daysUntilFree(from = new Date()) {
  const ms = GOAL_DATE.getTime() - new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  return Math.max(0, Math.round(ms / 86400000));
}

function readDue(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY_DUE) ?? "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

export const loadDue = readDue;
export const saveDue = (v: Record<string, number>) =>
  window.localStorage.setItem(KEY_DUE, JSON.stringify(v));

/** Stabil forfallsdag når planen ikke oppgir en dato. */
export function dueDayFor(debt: Debt, overrides: Record<string, number> = {}, index = 0) {
  const o = overrides[debt.id];
  if (o) return o;
  const cycle = [5, 12, 19, 26];
  return cycle[index % cycle.length] as number;
}

export function initials(name: string) {
  const clean = name.replace(/[^\p{L}\s]/gu, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

export type AgendaItem = {
  id: string;
  day: number;
  name: string;
  kind: "Gjeld" | "Fast utgift" | "Engangs";
  amount: number;
  urgent: boolean;
  debt?: Debt;
};

export function fasteAgenda(
  items: readonly { id?: string; name: string; amount: number; day: number }[] = FASTE,
): AgendaItem[] {
  return items.map((f) => ({
    id: f.id ?? "fast-" + f.name,
    day: f.day,
    name: f.name.split(" (")[0] as string,
    kind: "Fast utgift" as const,
    amount: f.amount,
    urgent: false,
  }));
}
