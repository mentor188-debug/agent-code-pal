import { PiggyBank, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, PageTitle, SectionTitle } from "@/components/betaling/Bits";
import { formatNOK } from "@/lib/betaling";

export function SparingTab({
  saved,
  goal,
  monthlyBuffer,
  onEdit,
}: {
  saved: number;
  goal: number;
  monthlyBuffer: { month: string; value: number }[];
  onEdit: () => void;
}) {
  const pct = goal ? Math.min(100, (saved / goal) * 100) : 0;
  const totalBuffer = monthlyBuffer.reduce((s, m) => s + m.value, 0);

  return (
    <div className="space-y-4">
      <PageTitle>Sparing</PageTitle>

      <Card className="p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <PiggyBank className="size-4 text-primary" /> Spart så langt
        </div>
        <p className="mt-2 text-4xl font-bold tabular-nums">{formatNOK(saved)}</p>
        <p className="text-sm text-muted-foreground">
          av sparemål {goal ? formatNOK(goal) : "– ikke satt"}
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <Button variant="outline" className="mt-4 w-full" onClick={onEdit}>
          Oppdater sparing
        </Button>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="size-4 text-primary" /> Estimert overskudd i planen
        </div>
        <p
          className={`mt-2 text-3xl font-bold tabular-nums ${totalBuffer < 0 ? "text-destructive" : "text-primary"}`}
        >
          {formatNOK(totalBuffer)}
        </p>
        <p className="text-sm text-muted-foreground">
          Summen av månedsresultatene fram til februar 2027
        </p>
      </Card>

      <SectionTitle icon={<Shield className="size-4 text-primary" />}>
        Buffer per måned
      </SectionTitle>
      <div className="space-y-3">
        {monthlyBuffer.map((m) => (
          <Card key={m.month}>
            <div className="flex items-center justify-between">
              <span className="font-medium capitalize">{m.month}</span>
              <span
                className={`font-semibold tabular-nums ${m.value < 0 ? "text-destructive" : "text-primary"}`}
              >
                {formatNOK(m.value)}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
