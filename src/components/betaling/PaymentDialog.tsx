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
import { Switch } from "@/components/ui/switch";
import { newId, type Debt } from "@/lib/betaling";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: string;
  editing: Debt | null;
  onSave: (d: Debt) => void;
  onDelete: (id: string) => void;
};

const empty = (month: string): Debt => ({
  id: newId(),
  month,
  creditor: "",
  caseNo: "",
  description: "",
  amount: 0,
  kid: "",
  account: "",
  auto: false,
  urgent: false,
});

export function PaymentDialog({
  open,
  onOpenChange,
  month,
  editing,
  onSave,
  onDelete,
}: Props) {
  const [draft, setDraft] = useState<Debt>(() => empty(month));

  useEffect(() => {
    if (open) setDraft(editing ? { ...editing } : empty(month));
  }, [open, editing, month]);

  const set = <K extends keyof Debt>(key: K, value: Debt[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Rediger krav" : "Nytt krav"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="creditor">Kreditor</Label>
            <Input
              id="creditor"
              value={draft.creditor}
              placeholder="Kredinor, Lowell …"
              onChange={(e) => set("creditor", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="caseNo">Saksnr</Label>
              <Input
                id="caseNo"
                value={draft.caseNo}
                onChange={(e) => set("caseNo", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Beløp (kr)</Label>
              <Input
                id="amount"
                inputMode="decimal"
                value={draft.amount ? String(draft.amount) : ""}
                onChange={(e) =>
                  set("amount", Number(e.target.value.replace(",", ".")) || 0)
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Input
              id="description"
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="kid">KID</Label>
              <Input
                id="kid"
                inputMode="numeric"
                value={draft.kid}
                onChange={(e) => set("kid", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="account">Kontonummer</Label>
              <Input
                id="account"
                placeholder="1234.56.78901"
                value={draft.account}
                onChange={(e) => set("account", e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Avtalegiro (auto)</p>
              <p className="text-xs text-muted-foreground">Trekkes automatisk</p>
            </div>
            <Switch checked={draft.auto} onCheckedChange={(v) => set("auto", v)} />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Hastefrist</p>
              <p className="text-xs text-muted-foreground">Vises i haster-banneret</p>
            </div>
            <Switch checked={draft.urgent} onCheckedChange={(v) => set("urgent", v)} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {editing ? (
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                onDelete(editing.id);
                onOpenChange(false);
              }}
            >
              Slett
            </Button>
          ) : (
            <span />
          )}
          <Button
            disabled={!draft.creditor.trim() || draft.amount <= 0}
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
