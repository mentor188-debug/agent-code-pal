import { SquarePen } from "lucide-react";
import { Avatar, Card, MonthChips, PageTitle, SectionTitle } from "@/components/betaling/Bits";
import { formatNOK } from "@/lib/betaling";

export function BudsjettTab({
  months,
  current,
  onMonth,
  label,
  longLabel,
  meta,
  faste,
  engangs,
  gjeld,
  levepenger,
  onEdit,
}: {
  months: string[];
  current: string;
  onMonth: (m: string) => void;
  label: (m: string) => string;
  longLabel: string;
  meta: { brutto: number; skatt: number; utleggstrekk: number; netto: number };
  faste: { name: string; amount: number }[];
  engangs: { name: string; amount: number }[];
  gjeld: number;
  levepenger: number;
  onEdit: () => void;
}) {
  const fasteSum = faste.reduce((s, f) => s + f.amount, 0);
  const engangsSum = engangs.reduce((s, e) => s + e.amount, 0);
  const rest = meta.netto - fasteSum - engangsSum - gjeld - levepenger;
  const skattPct = meta.brutto ? Math.round((Math.abs(meta.skatt) / meta.brutto) * 100) : 0;
  const parts = [
    { label: "Faste utgifter", value: fasteSum, color: "var(--color-chart-3)" },
    { label: "Levepenger", value: levepenger, color: "var(--color-chart-5)" },
    { label: "Engangs", value: engangsSum, color: "var(--color-chart-4)" },
    { label: "Gjeldsnedbetaling", value: gjeld, color: "var(--color-chart-2)" },
    { label: "Til rådighet", value: Math.max(0, rest), color: "var(--color-muted-foreground)" },
  ].filter((p) => p.value > 0);
  const partsSum = parts.reduce((s, p) => s + p.value, 0) || 1;

  return (
    <div className="space-y-4">
      <PageTitle>Budsjett</PageTitle>
      <MonthChips months={months} value={current} onChange={onMonth} label={label} />

      <Card className="p-5">
        <div className="flex items-start justify-between">
          <p className="text-sm capitalize text-muted-foreground">{longLabel}</p>
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary"
          >
            <SquarePen className="size-3.5" /> Rediger
          </button>
        </div>
        <p className="mt-2 text-4xl font-bold tabular-nums">{formatNOK(meta.netto)}</p>
        <p className="text-sm text-muted-foreground">Netto tilgjengelig</p>

        <dl className="mt-5 space-y-2.5 text-sm">
          <Row label="Bruttolønn" value={formatNOK(meta.brutto)} />
          <Row label={`Skattetrekk (${skattPct}%)`} value={formatNOK(meta.skatt)} negative />
          <Row
            label="Utleggstrekk (Namsfogden)"
            value={formatNOK(meta.utleggstrekk)}
            negative={meta.utleggstrekk !== 0}
          />
          <div className="h-px bg-border" />
          <Row label="Netto" value={formatNOK(meta.netto)} strong />
        </dl>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold">Fordeling av netto</h2>
        <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-secondary">
          {parts.map((p) => (
            <span
              key={p.label}
              style={{ width: `${(p.value / partsSum) * 100}%`, background: p.color }}
            />
          ))}
        </div>
        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          {parts.map((p) => (
            <li key={p.label} className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ background: p.color }} />
              {p.label} · <span className="tabular-nums">{formatNOK(p.value)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <SectionTitle>Faste utgifter</SectionTitle>
      <div className="space-y-3">
        {faste.map((f) => (
          <Card key={f.name}>
            <div className="flex items-center gap-3">
              <Avatar name={f.name} />
              <p className="min-w-0 flex-1 truncate font-semibold">{f.name.split(" (")[0]}</p>
              <span className="shrink-0 font-bold tabular-nums">{formatNOK(f.amount)}</span>
            </div>
          </Card>
        ))}
      </div>

      {engangs.length > 0 && (
        <>
          <SectionTitle>Engangsutgifter</SectionTitle>
          <div className="space-y-3">
            {engangs.map((e) => (
              <Card key={e.name}>
                <div className="flex items-center gap-3">
                  <Avatar name={e.name} />
                  <p className="min-w-0 flex-1 truncate font-semibold">{e.name}</p>
                  <span className="shrink-0 font-bold tabular-nums">{formatNOK(e.amount)}</span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Card className="p-5">
        <div className="flex items-baseline justify-between">
          <p className="font-semibold">Månedens resultat</p>
          <p
            className={`text-2xl font-bold tabular-nums ${rest < 0 ? "text-destructive" : "text-primary"}`}
          >
            {formatNOK(rest)}
          </p>
        </div>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  negative,
}: {
  label: string;
  value: string;
  strong?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={strong ? "font-semibold" : "text-muted-foreground"}>{label}</dt>
      <dd
        className={`tabular-nums ${strong ? "font-bold" : ""} ${negative ? "text-destructive" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
