export type SyncLogEntry = {
  at: string;
  month: string;
  txCount: number;
  foundCount: number;
  appliedCount: number;
  note?: string;
  status: "ok" | "avbrutt" | "feil" | "tom";
};

const LOG_KEY = "bt_bank_synclog_v1";
const MAX_ENTRIES = 25;

export function loadSyncLog(): SyncLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOG_KEY);
    return raw ? (JSON.parse(raw) as SyncLogEntry[]) : [];
  } catch {
    return [];
  }
}

export function appendSyncLog(entry: SyncLogEntry): SyncLogEntry[] {
  const next = [entry, ...loadSyncLog()].slice(0, MAX_ENTRIES);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LOG_KEY, JSON.stringify(next));
  }
  return next;
}

export function clearSyncLog(): SyncLogEntry[] {
  if (typeof window !== "undefined") window.localStorage.removeItem(LOG_KEY);
  return [];
}
