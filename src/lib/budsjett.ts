import { ENGANGS, FASTE, MONTHS } from "./gjeldsplan";
import { newId } from "./betaling";

export type BudgetItem = { id: string; name: string; amount: number; day: number };
export type MonthIncome = { brutto: number; skatt: number; utleggstrekk: number };

export type BudgetData = {
  faste: BudgetItem[];
  engangs: Record<string, BudgetItem[]>;
  months: Record<string, MonthIncome>;
};

const KEY = "bt_budsjett_v1";

export function defaultBudget(): BudgetData {
  return {
    faste: FASTE.map((f) => ({ id: "fast-" + f.name, name: f.name, amount: f.amount, day: f.day })),
    engangs: Object.fromEntries(
      Object.entries(ENGANGS).map(([k, list]) => [
        k,
        list.map((e) => ({ id: "eng-" + k + "-" + e.name, name: e.name, amount: e.amount, day: 15 })),
      ]),
    ),
    months: Object.fromEntries(
      MONTHS.map((m) => [
        m.key,
        { brutto: m.brutto, skatt: m.skatt, utleggstrekk: m.utleggstrekk },
      ]),
    ),
  };
}

export function loadBudget(): BudgetData {
  const base = defaultBudget();
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Partial<BudgetData>;
    return {
      faste: saved.faste ?? base.faste,
      engangs: saved.engangs ?? base.engangs,
      months: { ...base.months, ...(saved.months ?? {}) },
    };
  } catch {
    return base;
  }
}

export const saveBudget = (v: BudgetData) => window.localStorage.setItem(KEY, JSON.stringify(v));

export function incomeFor(month: string, b: BudgetData): MonthIncome & { netto: number } {
  const m = b.months[month] ?? { brutto: 0, skatt: 0, utleggstrekk: 0 };
  return { ...m, netto: m.brutto + m.skatt + m.utleggstrekk };
}

export const fasteSumOf = (b: BudgetData) => b.faste.reduce((s, f) => s + f.amount, 0);
export const engangsOf = (month: string, b: BudgetData) => b.engangs[month] ?? [];

export function upsertFast(b: BudgetData, item: BudgetItem): BudgetData {
  return {
    ...b,
    faste: b.faste.some((f) => f.id === item.id)
      ? b.faste.map((f) => (f.id === item.id ? item : f))
      : [...b.faste, item],
  };
}

export function removeFast(b: BudgetData, id: string): BudgetData {
  return { ...b, faste: b.faste.filter((f) => f.id !== id) };
}

export function upsertEngangs(b: BudgetData, month: string, item: BudgetItem): BudgetData {
  const list = engangsOf(month, b);
  return {
    ...b,
    engangs: {
      ...b.engangs,
      [month]: list.some((e) => e.id === item.id)
        ? list.map((e) => (e.id === item.id ? item : e))
        : [...list, item],
    },
  };
}

export function removeEngangs(b: BudgetData, month: string, id: string): BudgetData {
  return { ...b, engangs: { ...b.engangs, [month]: engangsOf(month, b).filter((e) => e.id !== id) } };
}

export function setIncome(b: BudgetData, month: string, income: MonthIncome): BudgetData {
  return { ...b, months: { ...b.months, [month]: income } };
}

export const emptyItem = (day = 15): BudgetItem => ({ id: newId(), name: "", amount: 0, day });
