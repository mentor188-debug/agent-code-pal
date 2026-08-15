import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatNOK } from "@/lib/betaling";
import type { RegistrertBetaling, Sak } from "@/lib/gjeld/model";

export function FordelBetalingDialog({
  betaling,
  saker,
  onOpenChange,
  onSave,
}: {
  betaling: RegistrertBetaling | null;
  saker: Sak[];
  onOpenChange: (v: boolean) => void;
  onSave: (b: RegistrertBetaling) => void;
}) {
  const [sakId, setSakId] = useState("");

  useEffect(() => {
    setSakId(betaling?.sakId ?? "");
  }, [betaling]);

  const kandidater = betaling
    ? saker
        .filter((s) => s.creditor === betaling.creditor)
        .concat(saker.filter((s) => s.creditor !== betaling.creditor))
    : [];

  return (
    <Dialog open={betaling !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fordel betaling</DialogTitle>
        </DialogHeader>
        {betaling && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {formatNOK(betaling.amount)} · {betaling.date} · {betaling.creditor}. Velg hvilken sak
              beløpet faktisk gikk til – ikke gjett hvis portalen ikke viser det.
            </p>
            <select
              value={sakId}
              onChange={(e) => setSakId(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
              aria-label="Velg sak"
            >
              <option value="">Ikke fordelt</option>
              {kandidater.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.creditor} · {s.caseNo} ({formatNOK(s.documented)})
                </option>
              ))}
            </select>
          </div>
        )}
        <DialogFooter>
          <Button
            onClick={() => {
              if (betaling) onSave({ ...betaling, sakId: sakId || null });
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
