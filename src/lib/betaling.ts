export type Category =
  | "Bolig"
  | "Strøm"
  | "Forsikring"
  | "Lån"
  | "Abonnement"
  | "Transport"
  | "Annet";

export const CATEGORIES: Category[] = [
  "Bolig",
  "Strøm",
  "Forsikring",
  "Lån",
  "Abonnement",
  "Transport",
  "Annet",
];

export type Payment = {
  id: string;
  name: string;
  amount: number;
  dueDay: number; // 1-31
  kid?: string;
  account?: string;
  category: Category;
  recurring: boolean;
  paidMonths: string[]; // ["2026-08"]
};

export type Settings = {
  income: number;
  savingsGoal: number;
  saved: number;
  pin: string | null;
};

export const DEFAULT_SETTINGS: Settings = {
  income: 0,
  savingsGoal: 0,
  saved: 0,
  pin: null,
};

const KEY_PAYMENTS = "bt_payments_v1";
const KEY_SETTINGS = "bt_settings_v1";

export function loadPayments(): Payment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY_PAYMENTS);
    return raw ? (JSON.parse(raw) as Payment[]) : [];
  } catch {
    return [];
  }
}

export function savePayments(p: Payment[]) {
  window.localStorage.setItem(KEY_PAYMENTS, JSON.stringify(p));
}

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(KEY_SETTINGS);
    return raw
      ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) }
      : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings) {
  window.localStorage.setItem(KEY_SETTINGS, JSON.stringify(s));
}

export function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("nb-NO", {
    month: "long",
    year: "numeric",
  });
}

export function shortMonthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("nb-NO", { month: "short" });
}

export function addMonths(key: string, delta: number) {
  const [y, m] = key.split("-").map(Number);
  return monthKey(new Date(y, m - 1 + delta, 1));
}

export function dueDateFor(payment: Payment, key: string) {
  const [y, m] = key.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return new Date(y, m - 1, Math.min(payment.dueDay, lastDay));
}

export function daysUntil(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export function isPaid(p: Payment, key: string) {
  return p.paidMonths.includes(key);
}

export function formatNOK(n: number) {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    maximumFractionDigits: 0,
  }).format(n);
}

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}
