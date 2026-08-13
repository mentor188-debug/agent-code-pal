import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Avatar, Card, PageTitle, SectionTitle } from "@/components/betaling/Bits";
import { Input } from "@/components/ui/input";
import { formatNOK } from "@/lib/betaling";

export type CreditorSummary = {
  creditor: string;
  total: number;
  paid: number;
  cases: number;
  casesPaid: number;
  note: string;
  target: string;
  urgent: boolean;
  caseNos: string[];
  kids: string[];
};

type Filter = "alle" | "ubetalt" | "betalt" | "haster";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "alle", label: "Alle" },
  { key: "ubetalt", label: "Gjenstår" },
  { key: "betalt", label: "Fullført" },
  { key: "haster", label: "Haster" },
];

export function GjeldTab({
  chart,
  creditors,
}: {
  chart: { month: string; gjeld: number }[];
  creditors: CreditorSummary[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("alle");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return creditors.filter((c) => {
      const done = c.paid >= c.total;
      if (filter === "ubetalt" && done) return false;
      if (filter === "betalt" && !done) return false;
      if (filter === "haster" && !c.urgent) return false;
      if (!q) return true;
      return [c.creditor, c.note, c.target, ...c.caseNos, ...c.kids]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [creditors, query, filter]);

  const sum = visible.reduce((s, c) => s + (c.total - c.paid), 0);

  return (
    <div className="space-y-5">
      <PageTitle>Gjeld</PageTitle>


      <Card className="p-5">
        <h2 className="text-lg font-semibold">Gjeldsutvikling</h2>
        <p className="text-xs text-muted-foreground">Estimert gjenstående gjeld mot gjeldfri</p>
        <div className="mt-4 h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart} margin={{ top: 8, right: 14, left: 14, bottom: 0 }}>
              <defs>
                <linearGradient id="gjeldFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                interval={0}
                stroke="var(--color-muted-foreground)"
              />
              <Tooltip
                formatter={(v: number) => formatNOK(v)}
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="gjeld"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                fill="url(#gjeldFill)"
                dot={{ r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <SectionTitle>Kreditorer</SectionTitle>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Søk kreditor, KID eller saksnr."
          aria-label="Søk i kreditorer"
          className="pl-9 pr-9"
        />
        {query && (
          <button
            type="button"
            aria-label="Tøm søk"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              f.key === filter
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="px-1 text-xs text-muted-foreground">
        {visible.length} av {creditors.length} kreditorer · {formatNOK(sum)} gjenstår
      </p>

      <div className="space-y-3">
        {visible.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Ingen treff.
          </p>
        )}
        {visible.map((c) => {
          const pct = c.total ? Math.min(100, (c.paid / c.total) * 100) : 0;
          return (
            <Card key={c.creditor} className="p-5">
              <div className="flex items-center gap-3">
                <Avatar name={c.creditor} tone={c.urgent ? "red" : "green"} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{c.creditor}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.note}</p>
                </div>
                <span className="shrink-0 text-lg font-bold tabular-nums">
                  {formatNOK(c.total)}
                </span>
              </div>
              {query.trim() && (c.caseNos.length > 0 || c.kids.length > 0) && (
                <p className="mt-2 truncate text-xs text-muted-foreground">
                  Saksnr: {c.caseNos.join(", ") || "–"} · KID: {c.kids.join(", ") || "–"}
                </p>
              )}
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span className="tabular-nums">
                  {formatNOK(c.paid)} av {formatNOK(c.total)}
                </span>
                <span>
                  {c.casesPaid} av {c.cases} saker
                </span>
                <span>Mål: {c.target}</span>
              </div>
            </Card>
          );
        })}
      </div>

    </div>
  );
}
