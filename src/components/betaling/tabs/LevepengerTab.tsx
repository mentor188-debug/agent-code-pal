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
  threshold,
  onThreshold,
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
  threshold: number;
  onThreshold: (v: number) => void;
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
  const status = leveStatus(spent, available, threshold);
  const left = status.left;
  const pct = Math.min(100, status.pct);

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

        <p className={`mt-2 text-4xl font-bold tabular-nums ${left < 0 ? "text-destructive" : ""}`}>
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

        {status.level !== "ok" && (
          <div
            className={`mt-4 flex items-start gap-2 rounded-lg p-3 text-sm ${
              status.level === "over"
                ? "bg-destructive/15 text-destructive"
                : "bg-amber-500/15 text-amber-500"
            }`}
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>
              {status.level === "over"
                ? `Levepengene er brukt opp – ${formatNOK(Math.abs(left))} over budsjettet.`
                : `Du har brukt ${status.pct} % av levepengene (terskel ${threshold} %). Kun ${formatNOK(left)} igjen.`}
            </p>
          </div>
        )}

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

        <div className="mt-4 border-t border-border pt-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Bell className="size-3.5" /> Varsle meg når jeg har brukt
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {TERSKEL_VALG.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onThreshold(t)}
                aria-pressed={threshold === t}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  threshold === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {t} %
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Gjelder <span className="capitalize">{longLabel}</span>. Slå på systemvarsler i
            Innstillinger for å få beskjed utenfor appen.
          </p>
        </div>
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
