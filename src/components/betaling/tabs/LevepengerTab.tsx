import { useState } from "react";
import { AlertTriangle, Bell, Plus, SquarePen, Trash2 } from "lucide-react";
import { Card, MonthChips, PageTitle, SectionTitle } from "@/components/betaling/Bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNOK, newId } from "@/lib/betaling";
import { TERSKEL_VALG, leveStatus, type LiveCost } from "@/lib/levepenger";

export function LevepengerTab({
  months,
  current,
  onMonth,
  label,
  longLabel,
  budget,
  carry,
  onBudget,
  costs,
  onAdd,
  onDelete,
}: {
  months: string[];
  current: string;
  onMonth: (m: string) => void;
  label: (m: string) => string;
  longLabel: string;
  budget: number;
  carry: number;
  onBudget: (v: number) => void;
  costs: LiveCost[];
  onAdd: (c: LiveCost) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [editBudget, setEditBudget] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState(String(budget));

  const spent = costs.reduce((s, c) => s + c.amount, 0);
  const available = budget + carry;
  const left = available - spent;
  const pct = available > 0 ? Math.min(100, Math.round((spent / available) * 100)) : 0;

  const add = () => {
    const value = Number(amount.replace(",", ".")) || 0;
    if (!name.trim() || value <= 0) return;
    onAdd({
      id: newId(),
      month: current,
      name: name.trim(),
      amount: value,
      day: new Date().getDate(),
    });
    setName("");
    setAmount("");
  };

  return (
    <div className="space-y-4">
      <PageTitle>Levepenger</PageTitle>
      <MonthChips months={months} value={current} onChange={onMonth} label={label} />

      <Card className="p-5">
        <div className="flex items-start justify-between">
          <p className="text-sm capitalize text-muted-foreground">{longLabel}</p>
          <button
            type="button"
            onClick={() => {
              setBudgetDraft(String(budget));
              setEditBudget((v) => !v);
            }}
            className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary"
          >
            <SquarePen className="size-3.5" /> Budsjett
          </button>
        </div>

        <p
          className={`mt-2 text-4xl font-bold tabular-nums ${left < 0 ? "text-destructive" : ""}`}
        >
          {formatNOK(left)}
        </p>
        <p className="text-sm text-muted-foreground">Igjen av {formatNOK(available)}</p>

        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${left < 0 ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Brukt {formatNOK(spent)} · {pct} %
        </p>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Månedsbudsjett {formatNOK(budget)}</span>
          {carry !== 0 && (
            <span className={carry < 0 ? "text-destructive" : "text-primary"}>
              {carry > 0 ? "Overført " : "Overforbruk "}
              {formatNOK(Math.abs(carry))} fra tidligere måneder
            </span>
          )}
        </div>

        {editBudget && (
          <div className="mt-4 flex items-end gap-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="leve-budsjett">Månedsbudsjett (kr)</Label>
              <Input
                id="leve-budsjett"
                inputMode="decimal"
                value={budgetDraft}
                onChange={(e) => setBudgetDraft(e.target.value)}
              />
            </div>
            <Button
              onClick={() => {
                onBudget(Number(budgetDraft.replace(",", ".")) || 0);
                setEditBudget(false);
              }}
            >
              Lagre
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle>Ny kostnad</SectionTitle>
        <div className="mt-3 grid grid-cols-[1fr_7rem] gap-2">
          <Input
            aria-label="Beskrivelse"
            placeholder="Mat, bensin …"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <Input
            aria-label="Beløp"
            inputMode="decimal"
            placeholder="kr"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
        </div>
        <Button className="mt-3 w-full" onClick={add} disabled={!name.trim() || !amount}>
          <Plus className="size-4" /> Legg til
        </Button>
      </Card>

      <SectionTitle>Kostnader ({costs.length})</SectionTitle>
      <div className="space-y-2">
        {costs.length === 0 && (
          <Card>
            <p className="text-sm text-muted-foreground">
              Ingen kostnader ført denne måneden ennå.
            </p>
          </Card>
        )}
        {costs.map((c) => (
          <Card key={c.id} className="py-3">
            <div className="flex items-center gap-3">
              <span className="w-8 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground">
                {c.day}.
              </span>
              <p className="min-w-0 flex-1 truncate font-medium">{c.name}</p>
              <span className="font-semibold tabular-nums">{formatNOK(c.amount)}</span>
              <button
                type="button"
                aria-label={`Slett ${c.name}`}
                onClick={() => onDelete(c.id)}
                className="text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
