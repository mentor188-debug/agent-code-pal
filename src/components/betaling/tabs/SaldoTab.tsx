import { CheckCircle2, Circle, Coins, ShoppingBasket, Wallet } from "lucide-react";
import { Card, MonthChips, PageTitle, SectionTitle } from "@/components/betaling/Bits";
import { formatNOK } from "@/lib/betaling";
import type { AgendaItem } from "@/lib/dager";

export function SaldoTab({
  months,
  current,
  onMonth,
  label,
  longLabel,
  netto,
  items,
  paidIds,
  leveAvailable,
  leveSpent,
  onToggle,
}: {
  months: string[];
  current: string;
  onMonth: (m: string) => void;
  label: (m: string) => string;
  longLabel: string;
  netto: number;
  items: AgendaItem[];
  paidIds: string[];
  leveAvailable: number;
  leveSpent: number;
  onToggle: (id: string) => void;
}) {
  const paidItems = items.filter((i) => paidIds.includes(i.id));
  const openItems = items.filter((i) => !paidIds.includes(i.id));
  const betalt = paidItems.reduce((s, i) => s + i.amount, 0);
  const gjenstaar = openItems.reduce((s, i) => s + i.amount, 0);
  const leveRest = Math.max(0, leveAvailable - leveSpent);

  const disponibelt = netto - betalt - leveSpent;
  const etterAlt = disponibelt - gjenstaar - leveRest;

  const brukt = betalt + leveSpent;
  const pct = netto > 0 ? Math.min(100, (brukt / netto) * 100) : 0;
  const reservertPct = netto > 0 ? Math.min(100 - pct, ((gjenstaar + leveRest) / netto) * 100) : 0;

  return (
    <div className="space-y-4">
      <PageTitle>Igjen nå</PageTitle>
      <MonthChips months={months} value={current} onChange={onMonth} label={label} />

      <Card className="p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Wallet className="size-4 text-primary" /> Disponibelt akkurat nå · {longLabel}
        </div>
        <p
          className={`mt-2 text-4xl font-bold tabular-nums ${disponibelt < 0 ? "text-destructive" : ""}`}
        >
          {formatNOK(disponibelt)}
        </p>
        <p className="text-sm text-muted-foreground">
          Netto {formatNOK(netto)} minus det du faktisk har betalt
        </p>

        <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
          <div className="h-full bg-primary/30" style={{ width: `${reservertPct}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>Betalt {formatNOK(brukt)}</span>
          <span>Reservert {formatNOK(gjenstaar + leveRest)}</span>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Coins className="size-4 text-primary" /> Gjenstår å betale
          </div>
          <p className="mt-1 text-xl font-semibold tabular-nums">{formatNOK(gjenstaar)}</p>
          <p className="text-xs text-muted-foreground">{openItems.length} poster</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShoppingBasket className="size-4 text-primary" /> Levepenger igjen
          </div>
          <p className="mt-1 text-xl font-semibold tabular-nums">{formatNOK(leveRest)}</p>
          <p className="text-xs text-muted-foreground">brukt {formatNOK(leveSpent)}</p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Igjen når alt i måneden er betalt</span>
          <span
            className={`text-lg font-semibold tabular-nums ${etterAlt < 0 ? "text-destructive" : "text-primary"}`}
          >
            {formatNOK(etterAlt)}
          </span>
        </div>
      </Card>

      <SectionTitle icon={<Circle className="size-4 text-primary" />}>
        Ikke betalt ennå
      </SectionTitle>
      <div className="space-y-2">
        {openItems.length === 0 && (
          <Card className="p-4 text-sm text-muted-foreground">Alt er huket av denne måneden.</Card>
        )}
        {openItems.map((i) => (
          <Card key={i.id} className="flex items-center gap-3 p-4">
            <button
              type="button"
              aria-label={`Marker ${i.name} som betalt`}
              onClick={() => onToggle(i.id)}
              className="text-muted-foreground"
            >
              <Circle className="size-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{i.name}</p>
              <p className="text-xs text-muted-foreground">
                {i.kind} · den {i.day}.
              </p>
            </div>
            <span className="tabular-nums text-sm font-semibold">{formatNOK(i.amount)}</span>
          </Card>
        ))}
      </div>

      {paidItems.length > 0 && (
        <>
          <SectionTitle icon={<CheckCircle2 className="size-4 text-primary" />}>
            Betalt ({formatNOK(betalt)})
          </SectionTitle>
          <div className="space-y-2">
            {paidItems.map((i) => (
              <Card key={i.id} className="flex items-center gap-3 p-4 opacity-70">
                <button
                  type="button"
                  aria-label={`Angre betalt for ${i.name}`}
                  onClick={() => onToggle(i.id)}
                  className="text-primary"
                >
                  <CheckCircle2 className="size-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium line-through">{i.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {i.kind} · den {i.day}.
                  </p>
                </div>
                <span className="tabular-nums text-sm font-semibold">{formatNOK(i.amount)}</span>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
