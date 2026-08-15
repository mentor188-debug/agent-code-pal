import type { ReactNode } from "react";
import { Plus, SquarePen } from "lucide-react";
import { Avatar, Card, MonthChips, PageTitle, SectionTitle } from "@/components/betaling/Bits";
import { formatNOK } from "@/lib/betaling";
import type { BudgetItem } from "@/lib/budsjett";

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
  pendling,
  extra,
  onEditIncome,
  onEditFast,
  onAddFast,
  onEditEngangs,
  onAddEngangs,
}: {
  months: string[];
  current: string;
  onMonth: (m: string) => void;
  label: (m: string) => string;
  longLabel: string;
  meta: { brutto: number; skatt: number; utleggstrekk: number; netto: number; actual?: boolean };
  faste: BudgetItem[];
  engangs: BudgetItem[];
  gjeld: number;
  levepenger: number;
  pendling: number;
  extra?: ReactNode;
  onEditIncome: () => void;
  onEditFast: (item: BudgetItem) => void;
  onAddFast: () => void;
  onEditEngangs: (item: BudgetItem) => void;
  onAddEngangs: () => void;
}) {
  const fasteSum = faste.reduce((s, f) => s + f.amount, 0);
  const engangsSum = engangs.reduce((s, e) => s + e.amount, 0);
  const rest = meta.netto - fasteSum - engangsSum - gjeld - levepenger - pendling;
  const skattPct = meta.brutto ? Math.round((Math.abs(meta.skatt) / meta.brutto) * 100) : 0;
  const parts = [
    { label: "Faste utgifter", value: fasteSum, color: "var(--color-chart-3)" },
    { label: "Levepenger", value: levepenger, color: "var(--color-chart-5)" },
    { label: "Pendling", value: pendling, color: "var(--color-chart-1)" },
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
            onClick={onEditIncome}
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

      <div className="flex items-center justify-between gap-2">
        <SectionTitle>Faste utgifter</SectionTitle>
        <AddButton onClick={onAddFast} />
      </div>
      <div className="space-y-3">
        {faste.map((f) => (
          <ItemCard key={f.id} item={f} sub={`Forfaller den ${f.day}.`} onEdit={() => onEditFast(f)} />
        ))}
        {faste.length === 0 && (
          <p className="px-1 text-sm text-muted-foreground">Ingen faste utgifter lagt inn.</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <SectionTitle>Engangsutgifter</SectionTitle>
        <AddButton onClick={onAddEngangs} />
      </div>
      <div className="space-y-3">
        {engangs.map((e) => (
          <ItemCard key={e.id} item={e} onEdit={() => onEditEngangs(e)} />
        ))}
        {engangs.length === 0 && (
          <p className="px-1 text-sm text-muted-foreground">Ingen engangsutgifter denne måneden.</p>
        )}
      </div>

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

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary"
    >
      <Plus className="size-3.5" /> Legg til
    </button>
  );
}

function ItemCard({
  item,
  sub,
  onEdit,
}: {
  item: BudgetItem;
  sub?: string;
  onEdit: () => void;
}) {
  return (
    <Card>
      <button type="button" onClick={onEdit} className="flex w-full items-center gap-3 text-left">
        <Avatar name={item.name} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{item.name.split(" (")[0]}</span>
          {sub && <span className="block text-xs text-muted-foreground">{sub}</span>}
        </span>
        <span className="shrink-0 font-bold tabular-nums">{formatNOK(item.amount)}</span>
        <SquarePen className="size-4 shrink-0 text-muted-foreground" />
      </button>
    </Card>
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
