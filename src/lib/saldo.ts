const KEY = "bt_faktisk_saldo_v1";
const START_KEY = "bt_inngaaende_saldo_v1";
const LONN_KEY = "bt_lonn_mottatt_v1";

export type ActualBalances = Record<string, number>;
export type StartBalances = Record<string, number>;
export type LonnFlags = Record<string, boolean>;

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, v: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(v));
}

export function loadActual(): ActualBalances {
  return read<ActualBalances>(KEY) ?? {};
}

export function saveActual(v: ActualBalances) {
  write(KEY, v);
}

/** Saldo på konto ved starten av måneden (overført fra forrige måned). */
export function loadStart(): StartBalances {
  return read<StartBalances>(START_KEY) ?? {};
}

export function saveStart(v: StartBalances) {
  write(START_KEY, v);
}

/** Er lønnen for måneden faktisk kommet inn på konto? */
export function loadLonn(): LonnFlags {
  return read<LonnFlags>(LONN_KEY) ?? {};
}

export function saveLonn(v: LonnFlags) {
  write(LONN_KEY, v);
}
