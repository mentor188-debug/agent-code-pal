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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, newId, type Category, type Payment } from "@/lib/betaling";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Payment | null;
  onSave: (p: Payment) => void;
  onDelete: (id: string) => void;
};

const empty = (): Payment => ({
  id: newId(),
  name: "",
  amount: 0,
  dueDay: 1,
  kid: "",
  account: "",
  category: "Annet",
  recurring: true,
  paidMonths: [],
});

export function PaymentDialog({ open, onOpenChange, editing, onSave, onDelete }: Props) {
  const [draft, setDraft] = useState<Payment>(empty);

  useEffect(() => {
    if (open) setDraft(editing ? { ...editing } : empty());
  }, [open, editing]);

  const set = <K extends keyof Payment>(key: K, value: Payment[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Rediger betaling" : "Ny betaling"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Navn</Label>
            <Input
              id="name"
              value={draft.name}
              placeholder="Husleie, strøm, Netflix …"
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="amount">Beløp (kr)</Label>
              <Input
                id="amount"
                inputMode="decimal"
                value={draft.amount ? String(draft.amount) : ""}
                onChange={(e) => set("amount", Number(e.target.value.replace(",", ".")) || 0)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueDay">Forfallsdag</Label>
              <Input
                id="dueDay"
                inputMode="numeric"
                value={String(draft.dueDay)}
                onChange={(e) =>
                  set("dueDay", Math.min(31, Math.max(1, Number(e.target.value) || 1)))
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Kategori</Label>
            <Select
              value={draft.category}
              onValueChange={(v) => set("category", v as Category)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="kid">KID</Label>
              <Input
                id="kid"
                inputMode="numeric"
                value={draft.kid ?? ""}
                onChange={(e) => set("kid", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="account">Kontonummer</Label>
              <Input
                id="account"
                inputMode="numeric"
                placeholder="1234.56.78901"
                value={draft.account ?? ""}
                onChange={(e) => set("account", e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Gjentas hver måned</p>
              <p className="text-xs text-muted-foreground">Faste regninger</p>
            </div>
            <Switch
              checked={draft.recurring}
              onCheckedChange={(v) => set("recurring", v)}
            />
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
            disabled={!draft.name.trim() || draft.amount <= 0}
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
