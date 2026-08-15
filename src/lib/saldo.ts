const KEY = "bt_faktisk_saldo_v1";

export type ActualBalances = Record<string, number>;

export function loadActual(): ActualBalances {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ActualBalances) : {};
  } catch {
    return {};
  }
}

export function saveActual(v: ActualBalances) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(v));
}
