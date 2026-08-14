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
import { emptyItem, type BudgetItem } from "@/lib/budsjett";

export function BudgetItemDialog({
  open,
  onOpenChange,
  title,
  editing,
  withDay = true,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  editing: BudgetItem | null;
  withDay?: boolean;
  onSave: (item: BudgetItem) => void;
  onDelete?: (id: string) => void;
}) {
  const [draft, setDraft] = useState<BudgetItem>(() => emptyItem());

  useEffect(() => {
    if (open) setDraft(editing ? { ...editing } : emptyItem());
  }, [open, editing]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="bi-name">Navn</Label>
            <Input
              id="bi-name"
              value={draft.name}
              placeholder="Strøm, forsikring …"
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bi-amount">Beløp (kr)</Label>
            <Input
              id="bi-amount"
              type="number"
              inputMode="decimal"
              value={draft.amount || ""}
              onChange={(e) => setDraft((d) => ({ ...d, amount: Number(e.target.value) || 0 }))}
            />
          </div>
          {withDay && (
            <div className="grid gap-2">
              <Label htmlFor="bi-day">Forfallsdag i måneden</Label>
              <Input
                id="bi-day"
                type="number"
                min={1}
                max={28}
                value={draft.day}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    day: Math.min(28, Math.max(1, Number(e.target.value) || 1)),
                  }))
                }
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {editing && onDelete ? (
            <Button
              variant="destructive"
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
            disabled={!draft.name.trim()}
            onClick={() => {
              onSave({ ...draft, name: draft.name.trim() });
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
