import { supabase } from "@/integrations/supabase/client";

/** Alle localStorage-nøkler appen bruker for brukerdata. */
export const SYNC_ITEMS = [
  { key: "bt_paid_v2", label: "Avhukede betalinger", hint: "Hva du har markert som betalt" },
  { key: "bt_extra_v2", label: "Egne betalinger", hint: "Poster du har lagt til selv" },
  { key: "bt_settings_v2", label: "Innstillinger", hint: "Sparemål, varsler og PIN" },
  { key: "bt_budsjett_v1", label: "Budsjett", hint: "Inntekt og faste utgifter" },
  { key: "bt_due_v1", label: "Forfallsdatoer", hint: "Egne datoer på krav" },
  { key: "bt_leve_costs_v1", label: "Levepenger – utgifter", hint: "Registrerte kjøp" },
  { key: "bt_leve_budsjett_v1", label: "Levepenger – budsjett", hint: "Månedsramme" },
  { key: "bt_leve_terskel_v1", label: "Levepenger – terskel", hint: "Når du får varsel" },
] as const;

export type SyncKey = (typeof SYNC_ITEMS)[number]["key"];

export const SYNC_KEYS = SYNC_ITEMS.map((i) => i.key) as unknown as readonly SyncKey[];

const CHOICE_KEY = "bt_sync_valg_v1";

/** Hvilke deler brukeren har valgt å synkronisere (alle som standard). */
export function loadSyncChoice(): SyncKey[] {
  if (typeof window === "undefined") return [...SYNC_KEYS];
  try {
    const raw = window.localStorage.getItem(CHOICE_KEY);
    if (!raw) return [...SYNC_KEYS];
    const list = JSON.parse(raw) as string[];
    const valid = SYNC_KEYS.filter((k) => list.includes(k));
    return valid;
  } catch {
    return [...SYNC_KEYS];
  }
}

export function saveSyncChoice(keys: SyncKey[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHOICE_KEY, JSON.stringify(keys));
}

/** Kort oppsummering av hva en nøkkel inneholder, til oversikten. */
export function describeKey(key: SyncKey): string {
  if (typeof window === "undefined") return "";
  const raw = window.localStorage.getItem(key);
  if (raw == null) return "tomt";
  try {
    const value = JSON.parse(raw);
    if (Array.isArray(value)) return `${value.length} element(er)`;
    if (value && typeof value === "object") {
      const n = Object.keys(value as object).length;
      return `${n} felt`;
    }
    return String(value);
  } catch {
    return `${raw.length} tegn`;
  }
}

export type Snapshot = Record<string, string>;

export function snapshot(keys: readonly SyncKey[] = loadSyncChoice()): Snapshot {
  if (typeof window === "undefined") return {};
  const out: Snapshot = {};
  for (const key of keys) {
    const raw = window.localStorage.getItem(key);
    if (raw != null) out[key] = raw;
  }
  return out;
}

export function isEmptySnapshot(s: Snapshot) {
  return Object.keys(s).length === 0;
}

export function applySnapshot(s: Snapshot, keys: readonly SyncKey[] = loadSyncChoice()) {
  if (typeof window === "undefined") return;
  for (const key of keys) {
    const value = s[key];
    if (value == null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  }
}

export async function pushState(userId: string): Promise<string> {
  const data = snapshot();
  const updated_at = new Date().toISOString();
  const { error } = await supabase
    .from("app_state")
    .upsert({ user_id: userId, data, updated_at }, { onConflict: "user_id" });
  if (error) throw error;
  return updated_at;
}

export async function pullState(
  userId: string,
): Promise<{ data: Snapshot; updatedAt: string } | null> {
  const { data, error } = await supabase
    .from("app_state")
    .select("data, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { data: (data.data ?? {}) as Snapshot, updatedAt: data.updated_at as string };
}
