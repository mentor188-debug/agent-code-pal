import { useEffect, useState } from "react";
import {
  Banknote,
  CalendarRange,
  CheckCircle2,
  Circle,
  Coins,
  ShoppingBasket,
  Wallet,
} from "lucide-react";
import { Card, MonthChips, PageTitle, SectionTitle } from "@/components/betaling/Bits";
import { formatNOK } from "@/lib/betaling";
import {
  loadActual,
  loadLonn,
  loadStart,
  saveActual,
  saveLonn,
  saveStart,
} from "@/lib/saldo";
import type { AgendaItem } from "@/lib/dager";
import type { LiveCost } from "@/lib/levepenger";
import { dayInRange, monthRange, rangeLabel } from "@/lib/periode";
import { loadSyncLog, type SyncLogEntry } from "@/lib/banklogg";


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
  leveCosts,
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
  leveCosts: LiveCost[];
  onToggle: (id: string) => void;
}) {
  const [actuals, setActuals] = useState<Record<string, number>>({});
  const [starts, setStarts] = useState<Record<string, number>>({});
  const [lonn, setLonn] = useState<Record<string, boolean>>({});
  const [log, setLog] = useState<SyncLogEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [startDraft, setStartDraft] = useState("");

  useEffect(() => {
    setActuals(loadActual());
    setStarts(loadStart());
    setLonn(loadLonn());
    setLog(loadSyncLog());
  }, []);

  const start = starts[current] ?? 0;
  useEffect(() => {
    setStartDraft(starts[current] === undefined ? "" : String(starts[current]));
  }, [current, starts]);

  const lonnMottatt = lonn[current] ?? true;
  const toggleLonn = () => {
    const next = { ...lonn, [current]: !lonnMottatt };
    setLonn(next);
    saveLonn(next);
  };

  const commitStart = () => {
    const cleaned = startDraft.replace(/\s/g, "").replace(",", ".");
    const next = { ...starts };
    if (cleaned === "") delete next[current];
    else {
      const n = Number(cleaned);
      if (!Number.isFinite(n)) return;
      next[current] = n;
    }
    setStarts(next);
    saveStart(next);
  };


  const actual = actuals[current];
  useEffect(() => {
    setDraft(actual === undefined ? "" : String(actual));
  }, [current, actual]);

  const commitActual = () => {
    const cleaned = draft.replace(/\s/g, "").replace(",", ".");
    const next = { ...actuals };
    if (cleaned === "") delete next[current];
    else {
      const n = Number(cleaned);
      if (!Number.isFinite(n)) return;
      next[current] = n;
    }
    setActuals(next);
    saveActual(next);
  };

  // Samme avgrensning som banksynken: kun poster innenfor månedsvinduet.
  const periode = monthRange(current);
  const windowItems = items.filter((i) => dayInRange(i.day, current));
  const paidItems = windowItems.filter((i) => paidIds.includes(i.id));
  const openItems = windowItems.filter((i) => !paidIds.includes(i.id));
  const leveSpent = leveCosts
    .filter((c) => c.month === current && dayInRange(c.day, current))
    .reduce((s, c) => s + c.amount, 0);
  const lastSync = log.find((e) => e.month === current);
  const betalt = paidItems.reduce((s, i) => s + i.amount, 0);
  const gjenstaar = openItems.reduce((s, i) => s + i.amount, 0);
  const leveRest = Math.max(0, leveAvailable - leveSpent);

  const lonnInn = lonnMottatt ? netto : 0;
  const beregnet = start + lonnInn - betalt - leveSpent;
  const disponibelt = actual !== undefined ? actual : beregnet;
  const avvik = actual !== undefined ? actual - beregnet : 0;
  const etterAlt = disponibelt - gjenstaar - leveRest;

  const brukt = betalt + leveSpent;
  const grunnlag = start + lonnInn;
  const pct = grunnlag > 0 ? Math.min(100, (brukt / grunnlag) * 100) : 0;
  const reservertPct =
    grunnlag > 0 ? Math.min(100 - pct, ((gjenstaar + leveRest) / grunnlag) * 100) : 0;


  return (
    <div className="space-y-4">
      <PageTitle>Igjen nå</PageTitle>
      <MonthChips months={months} value={current} onChange={onMonth} label={label} />

      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarRange className="size-4 text-primary" /> Periode {rangeLabel(current)}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Samme tidsvindu som banksynken bruker ({periode.from} – {periode.to}), så tallene her
          dekker nøyaktig det som hentes fra banken.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {lastSync
            ? `Siste banksynk ${new Date(lastSync.at).toLocaleString("nb-NO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · ${lastSync.appliedCount} avhuket av ${lastSync.foundCount} forslag`
            : "Ingen banksynk kjørt for denne perioden ennå."}
        </p>
      </Card>

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
          {actual !== undefined
            ? `Faktisk saldo i banken · beregnet var ${formatNOK(beregnet)}`
            : `Inngående saldo ${formatNOK(start)}${lonnMottatt ? ` + lønn ${formatNOK(netto)}` : " (lønn ikke kommet)"} minus det du har betalt`}
        </p>

        <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Inngående saldo</span>
            <span className="tabular-nums">{formatNOK(start)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Lønn inn {lonnMottatt ? "" : "(ikke kommet)"}
            </span>
            <span className="tabular-nums">{formatNOK(lonnInn)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Betalt i perioden</span>
            <span className="tabular-nums">−{formatNOK(betalt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Levepenger brukt</span>
            <span className="tabular-nums">−{formatNOK(leveSpent)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-1 font-semibold">
            <span>Beregnet</span>
            <span className="tabular-nums">{formatNOK(beregnet)}</span>
          </div>
        </div>




        <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
          <div className="h-full bg-primary/30" style={{ width: `${reservertPct}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>Betalt {formatNOK(brukt)}</span>
          <span>Reservert {formatNOK(gjenstaar + leveRest)}</span>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Wallet className="size-4 text-primary" /> Inngående saldo ved månedsstart
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            inputMode="decimal"
            value={startDraft}
            onChange={(e) => setStartDraft(e.target.value)}
            onBlur={commitStart}
            placeholder="f.eks. 3200"
            className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-secondary px-3 text-base tabular-nums outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={commitStart}
            className="h-11 shrink-0 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground active:scale-95"
          >
            Lagre
          </button>
        </div>
        <button
          type="button"
          onClick={toggleLonn}
          className="mt-3 flex w-full items-center justify-between rounded-xl border border-border bg-secondary px-3 py-3 text-left text-sm active:scale-[0.99]"
        >
          <span>Lønnen er kommet inn på konto</span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${lonnMottatt ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"}`}
          >
            {lonnMottatt ? "Ja" : "Nei"}
          </span>
        </button>
        <p className="mt-2 text-xs text-muted-foreground">
          Det som stod på konto da måneden startet, pluss om lønnen faktisk har kommet. Uten disse
          to blir «Igjen» alltid ulik banken.
        </p>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Banknote className="size-4 text-primary" /> Faktisk saldo i banken
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            inputMode="decimal"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitActual}
            placeholder="f.eks. 12500"
            className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-secondary px-3 text-base tabular-nums outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={commitActual}
            className="h-11 shrink-0 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground active:scale-95"
          >
            Lagre
          </button>
        </div>
        {actual !== undefined ? (
          <div className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Beregnet</span>
              <span className="tabular-nums">{formatNOK(beregnet)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avvik</span>
              <span
                className={`tabular-nums font-semibold ${avvik < 0 ? "text-destructive" : "text-primary"}`}
              >
                {avvik > 0 ? "+" : ""}
                {formatNOK(avvik)}
              </span>
            </div>
            <p className="pt-1 text-xs text-muted-foreground">
              {Math.abs(avvik) < 1
                ? "Alt stemmer med banken."
                : avvik < 0
                  ? "Banken har mindre enn beregnet – trolig utgifter som ikke er ført opp (levepenger, gebyr, trekk)."
                  : "Banken har mer enn beregnet – trolig inntekt eller overført saldo som ikke er ført opp."}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            Legg inn saldoen banken viser, så bruker «Igjen nå» det ekte tallet og viser avviket mot
            beregningen.
          </p>
        )}
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
