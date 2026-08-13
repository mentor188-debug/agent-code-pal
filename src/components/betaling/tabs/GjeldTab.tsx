import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Avatar, Card, PageTitle, SectionTitle } from "@/components/betaling/Bits";
import { formatNOK } from "@/lib/betaling";

export type CreditorSummary = {
  creditor: string;
  total: number;
  paid: number;
  cases: number;
  casesPaid: number;
  note: string;
  target: string;
};

export function GjeldTab({
  chart,
  creditors,
}: {
  chart: { month: string; gjeld: number }[];
  creditors: CreditorSummary[];
}) {
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
      <div className="space-y-3">
        {creditors.map((c) => {
          const pct = c.total ? Math.min(100, (c.paid / c.total) * 100) : 0;
          return (
            <Card key={c.creditor} className="p-5">
              <div className="flex items-center gap-3">
                <Avatar name={c.creditor} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{c.creditor}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.note}</p>
                </div>
                <span className="shrink-0 text-lg font-bold tabular-nums">
                  {formatNOK(c.total)}
                </span>
              </div>
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
