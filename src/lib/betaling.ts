import { DEBTS, ENGANGS, FASTE, LEVEPENGER_BUDSJETT, MONTHS, type Debt } from "./gjeldsplan";

export type Settings = {
  savingsGoal: number;
  saved: number;
  pin: string | null;
  reminderDays: number;
  notify: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  savingsGoal: 0,
  saved: 0,
  pin: null,
  reminderDays: 5,
  notify: false,
};

const KEY_PAID = "bt_paid_v2";
const KEY_EXTRA = "bt_extra_v2";
const KEY_SETTINGS = "bt_settings_v2";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export const loadPaid = () => read<string[]>(KEY_PAID, []);
export const savePaid = (v: string[]) => window.localStorage.setItem(KEY_PAID, JSON.stringify(v));

export const loadExtra = () => read<Debt[]>(KEY_EXTRA, []);
export const saveExtra = (v: Debt[]) => window.localStorage.setItem(KEY_EXTRA, JSON.stringify(v));

export const loadSettings = () => ({
  ...DEFAULT_SETTINGS,
  ...read<Partial<Settings>>(KEY_SETTINGS, {}),
});
export const saveSettings = (v: Settings) =>
  window.localStorage.setItem(KEY_SETTINGS, JSON.stringify(v));

export const MONTH_KEYS: string[] = MONTHS.map((m) => m.key);

export function monthMeta(key: string) {
  return MONTHS.find((m) => m.key === key) ?? (MONTHS[0] as (typeof MONTHS)[number]);
}

function parseKey(key: string): [number, number] {
  const p = key.split("-");
  return [Number(p[0]), Number(p[1])];
}

export function monthLabel(key: string) {
  const [y, m] = parseKey(key);
  return new Date(y, m - 1, 1).toLocaleDateString("nb-NO", {
    month: "long",
    year: "numeric",
  });
}

export function shortMonthLabel(key: string) {
  const [y, m] = parseKey(key);
  return new Date(y, m - 1, 1).toLocaleDateString("nb-NO", { month: "short" });
}

export function currentMonthKey() {
  const now = new Date();
  const k = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return MONTH_KEYS.includes(k) ? k : (MONTH_KEYS[0] as string);
}

export function debtsFor(key: string, extra: Debt[]) {
  return [...DEBTS, ...extra].filter((d) => d.month === key);
}

export function fasteSum() {
  return FASTE.reduce((s, f) => s + f.amount, 0);
}

export function engangsFor(key: string) {
  return ENGANGS[key] ?? [];
}

export function monthResult(key: string, extra: Debt[], levepenger = LEVEPENGER_BUDSJETT) {
  const meta = monthMeta(key);
  const gjeld = debtsFor(key, extra).reduce((s, d) => s + d.amount, 0);
  const engangs = engangsFor(key).reduce((s, e) => s + e.amount, 0);
  const faste = fasteSum();
  return {
    netto: meta.netto,
    faste,
    engangs,
    gjeld,
    levepenger,
    manuelt: debtsFor(key, extra)
      .filter((d) => !d.auto)
      .reduce((s, d) => s + d.amount, 0),
    resultat: meta.netto - faste - engangs - gjeld - levepenger,
  };
}

export function formatNOK(n: number) {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    maximumFractionDigits: 0,
  }).format(n);
}

export function newId() {
  return "x" + Math.random().toString(36).slice(2, 10);
}

export type { Debt };
