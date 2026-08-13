import { Check } from "lucide-react";
import { Avatar, Card, MonthChips, PageTitle } from "@/components/betaling/Bits";
import { formatNOK } from "@/lib/betaling";
import type { AgendaItem } from "@/lib/dager";

export function KalenderTab({
  months,
  current,
  onMonth,
  label,
  items,
  paidIds,
  onToggle,
  onEdit,
}: {
  months: string[];
  current: string;
  onMonth: (m: string) => void;
  label: (m: string) => string;
  items: AgendaItem[];
  paidIds: string[];
  onToggle: (i: AgendaItem) => void;
  onEdit: (i: AgendaItem) => void;
}) {
  const total = items.reduce((s, i) => s + i.amount, 0);
  const paid = items.filter((i) => paidIds.includes(i.id)).reduce((s, i) => s + i.amount, 0);
  const monthShort = label(current).toUpperCase();

  return (
    <div className="space-y-4">
      <PageTitle>Kalender</PageTitle>
      <MonthChips months={months} value={current} onChange={onMonth} label={label} />

      <Card>
        <div className="flex items-start justify-between">
          <p className="text-sm text-muted-foreground">Totalt denne måneden</p>
          <p className="text-sm text-muted-foreground">Betalt</p>
        </div>
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-bold tabular-nums">{formatNOK(total)}</p>
          <p className="text-xl font-bold tabular-nums text-primary">{formatNOK(paid)}</p>
        </div>
      </Card>

      <div className="space-y-3">
        {items.map((i) => {
          const isPaid = paidIds.includes(i.id);
          return (
            <Card key={i.id} className={isPaid ? "opacity-60" : ""}>
              <div className="flex items-center gap-3">
                <div className="w-9 shrink-0 text-center">
                  <p className="text-lg font-bold leading-none tabular-nums">{i.day}</p>
                  <p className="text-[10px] font-medium text-muted-foreground">{monthShort}</p>
                </div>
                <Avatar name={i.name} tone={i.urgent && !isPaid ? "red" : "green"} />
                <button
                  type="button"
                  onClick={() => onEdit(i)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className={`truncate font-semibold ${isPaid ? "line-through" : ""}`}>
                    {i.name}
                  </p>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    {i.kind}
                    {i.urgent && (
                      <span className="rounded bg-destructive/20 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                        HASTER
                      </span>
                    )}
                  </p>
                </button>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-semibold tabular-nums">{formatNOK(i.amount)}</span>
                  <button
                    type="button"
                    onClick={() => onToggle(i)}
                    aria-label={isPaid ? "Marker som ubetalt" : "Marker som betalt"}
                    className={`flex size-6 items-center justify-center rounded-full border transition-colors ${
                      isPaid ? "border-primary bg-primary text-primary-foreground" : "border-border"
                    }`}
                  >
                    {isPaid && <Check className="size-4" />}
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
