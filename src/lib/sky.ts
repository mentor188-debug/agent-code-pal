import { supabase } from "@/integrations/supabase/client";

/** Alle localStorage-nøkler appen bruker for brukerdata. */
export const SYNC_KEYS = [
  "bt_paid_v2",
  "bt_extra_v2",
  "bt_settings_v2",
  "bt_budsjett_v1",
  "bt_due_v1",
  "bt_leve_costs_v1",
  "bt_leve_budsjett_v1",
  "bt_leve_terskel_v1",
] as const;

export type Snapshot = Record<string, string>;

export function snapshot(): Snapshot {
  if (typeof window === "undefined") return {};
  const out: Snapshot = {};
  for (const key of SYNC_KEYS) {
    const raw = window.localStorage.getItem(key);
    if (raw != null) out[key] = raw;
  }
  return out;
}

export function isEmptySnapshot(s: Snapshot) {
  return Object.keys(s).length === 0;
}

export function applySnapshot(s: Snapshot) {
  if (typeof window === "undefined") return;
  for (const key of SYNC_KEYS) {
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
