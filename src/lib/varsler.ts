import type { AgendaItem } from "./dager";

const KEY_SENT = "bt_varsel_sent_v1";

export type Reminder = AgendaItem & { daysUntil: number };

function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Dager til forfall i inneværende kalendermåned (negativ = forfalt). */
export function daysUntilDue(day: number, from = new Date()) {
  return day - from.getDate();
}

/** Ubetalte poster som forfaller innen `within` dager (inkl. forfalte). */
export function dueReminders(
  items: AgendaItem[],
  paidIds: string[],
  within: number,
  from = new Date(),
): Reminder[] {
  return items
    .filter((i) => !paidIds.includes(i.id))
    .map((i) => ({ ...i, daysUntil: daysUntilDue(i.day, from) }))
    .filter((i) => i.daysUntil <= within)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

export function dueLabel(daysUntil: number) {
  if (daysUntil < 0) return `Forfalt for ${Math.abs(daysUntil)} dag${Math.abs(daysUntil) === 1 ? "" : "er"} siden`;
  if (daysUntil === 0) return "Forfaller i dag";
  if (daysUntil === 1) return "Forfaller i morgen";
  return `Forfaller om ${daysUntil} dager`;
}

export function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  return notificationsSupported() ? Notification.permission : "unsupported";
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return "unsupported" as const;
  return Notification.requestPermission();
}

function readSent(): Record<string, string> {
  try {
    return JSON.parse(window.localStorage.getItem(KEY_SENT) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

/** Sender lokale varsler én gang per post per dag. */
export function fireReminders(reminders: Reminder[]) {
  if (!notificationsSupported() || Notification.permission !== "granted") return 0;
  const sent = readSent();
  const stamp = todayKey();
  let count = 0;
  reminders.forEach((r) => {
    if (sent[r.id] === stamp) return;
    try {
      new Notification(`${r.name} – ${dueLabel(r.daysUntil).toLowerCase()}`, {
        body: `${r.kind} · forfall ${r.day}. i måneden`,
        tag: `bt-${r.id}-${stamp}`,
      });
      sent[r.id] = stamp;
      count += 1;
    } catch {
      /* ignorer */
    }
  });
  window.localStorage.setItem(KEY_SENT, JSON.stringify(sent));
  return count;
}
