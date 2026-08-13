import { BellRing } from "lucide-react";
import { formatNOK } from "@/lib/betaling";
import { dueLabel, type Reminder } from "@/lib/varsler";

export function ReminderBanner({
  reminders,
  onOpen,
}: {
  reminders: Reminder[];
  onOpen: () => void;
}) {
  if (reminders.length === 0) return null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-2xl border border-primary/40 bg-primary/10 p-4 text-left"
    >
      <div className="flex items-center gap-2">
        <BellRing className="size-4 text-primary" />
        <p className="text-sm font-semibold text-primary">
          {reminders.length} betaling{reminders.length === 1 ? "" : "er"} nærmer seg forfall
        </p>
      </div>
      <ul className="mt-3 space-y-2">
        {reminders.slice(0, 3).map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3">
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{r.name}</span>
              <span className="block text-xs text-muted-foreground">{dueLabel(r.daysUntil)}</span>
            </span>
            <span className="shrink-0 text-sm font-semibold tabular-nums">
              {formatNOK(r.amount)}
            </span>
          </li>
        ))}
      </ul>
      {reminders.length > 3 && (
        <p className="mt-2 text-xs text-muted-foreground">
          +{reminders.length - 3} flere i kalenderen
        </p>
      )}
    </button>
  );
}
