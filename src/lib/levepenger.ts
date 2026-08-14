import { LEVEPENGER_BUDSJETT } from "./gjeldsplan";

export type LiveCost = {
  id: string;
  month: string;
  name: string;
  amount: number;
  day: number;
};

const KEY_COSTS = "bt_leve_costs_v1";
const KEY_BUDGETS = "bt_leve_budsjett_v1";
const KEY_THRESHOLDS = "bt_leve_terskel_v1";

/** Standard varselterskel i prosent av tilgjengelige levepenger. */
export const DEFAULT_TERSKEL = 80;
export const TERSKEL_VALG = [50, 60, 70, 80, 90] as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export const loadCosts = () => read<LiveCost[]>(KEY_COSTS, []);
export const saveCosts = (v: LiveCost[]) =>
  window.localStorage.setItem(KEY_COSTS, JSON.stringify(v));

export const loadBudgets = () => read<Record<string, number>>(KEY_BUDGETS, {});
export const saveBudgets = (v: Record<string, number>) =>
  window.localStorage.setItem(KEY_BUDGETS, JSON.stringify(v));

export function budgetFor(month: string, budgets: Record<string, number>) {
  return budgets[month] ?? LEVEPENGER_BUDSJETT;
}

export function costsFor(month: string, costs: LiveCost[]) {
  return costs.filter((c) => c.month === month).sort((a, b) => b.day - a.day);
}

export function spentFor(month: string, costs: LiveCost[]) {
  return costsFor(month, costs).reduce((s, c) => s + c.amount, 0);
}

/**
 * Ubrukt (eller overforbrukt) levepenger fra tidligere måneder, rullert fram
 * til `month`. Kun måneder som allerede er påbegynt teller med, slik at
 * framtidige måneder ikke «arver» budsjett som ikke er brukt ennå.
 */
export function carryOverFor(
  month: string,
  monthKeys: string[],
  costs: LiveCost[],
  budgets: Record<string, number>,
  today: string,
) {
  return monthKeys
    .filter((k) => k < month && k < today)
    .reduce((sum, k) => sum + budgetFor(k, budgets) - spentFor(k, costs), 0);
}

/** Tilgjengelig denne måneden = månedsbudsjett + overført saldo. */
export function availableFor(
  month: string,
  monthKeys: string[],
  costs: LiveCost[],
  budgets: Record<string, number>,
  today: string,
) {
  return budgetFor(month, budgets) + carryOverFor(month, monthKeys, costs, budgets, today);
}
