import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MonthIncome } from "@/lib/budsjett";

export function IncomeDialog({
  open,
  onOpenChange,
  monthLabel,
  income,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  monthLabel: string;
  income: MonthIncome;
  onSave: (v: MonthIncome) => void;
}) {
  const [draft, setDraft] = useState<MonthIncome>(income);

  useEffect(() => {
    if (open) setDraft(income);
  }, [open, income]);

  const field = (key: keyof MonthIncome, label: string, hint?: string) => (
    <div className="grid gap-2">
      <Label htmlFor={"inc-" + key}>{label}</Label>
      <Input
        id={"inc-" + key}
        type="number"
        inputMode="decimal"
        value={draft[key]}
        onChange={(e) => setDraft((d) => ({ ...d, [key]: Number(e.target.value) || 0 }))}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="capitalize">Inntekt – {monthLabel}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          {field("brutto", "Bruttolønn")}
          {field("skatt", "Skattetrekk", "Skriv som negativt tall, f.eks. -16384")}
          {field("utleggstrekk", "Utleggstrekk", "Skriv som negativt tall, 0 hvis ingen")}
          <div className="rounded-xl bg-secondary px-4 py-3 text-sm">
            Netto:{" "}
            <span className="font-semibold tabular-nums">
              {Math.round(draft.brutto + draft.skatt + draft.utleggstrekk).toLocaleString("nb-NO")} kr
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => {
              onSave(draft);
              onOpenChange(false);
            }}
          >
            Lagre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
