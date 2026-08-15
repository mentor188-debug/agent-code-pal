import { Card } from "@/components/betaling/Bits";
import { Input } from "@/components/ui/input";
import { formatNOK } from "@/lib/betaling";
import type { Abonnement } from "@/lib/gjeld/model";

const KLASSER: { key: Abonnement["klasse"]; label: string }[] = [
  { key: "fast", label: "Fast" },
  { key: "valgfri", label: "Valgfri" },
  { key: "ikke_mitt", label: "Ikke mitt" },
];

export function AbonnementCard({
  items,
  onChange,
}: {
  items: Abonnement[];
  onChange: (a: Abonnement) => void;
}) {
  const uklassifisert = items.filter((i) => i.klasse === null);
  const fast = items.filter((i) => i.klasse === "fast").reduce((s, i) => s + i.amount, 0);

  return (
    <Card className="p-5">
      <h2 className="font-semibold">Må klassifiseres</h2>
      <p className="text-xs text-muted-foreground">
        Observerte trekk fra bankdata. Ingenting regnes som fast kost før du bekrefter det.
        {uklassifisert.length > 0
          ? ` ${uklassifisert.length} post(er) mangler klassifisering.`
          : " Alt er klassifisert."}
      </p>
      <p className="mt-2 text-sm">
        Bekreftet fast: <span className="font-bold tabular-nums">{formatNOK(fast)}</span>/mnd
      </p>

      <ul className="mt-4 space-y-3">
        {items.map((a) => (
          <li key={a.id} className="rounded-xl border border-border p-3">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{a.name}</p>
                <p className="text-xs text-muted-foreground">{a.note}</p>
              </div>
              <Input
                type="number"
                inputMode="decimal"
                value={String(a.amount)}
                onChange={(e) => onChange({ ...a, amount: Number(e.target.value) || 0 })}
                className="w-24 shrink-0 tabular-nums"
                aria-label={`Beløp ${a.name}`}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {KLASSER.map((k) => (
                <button
                  key={String(k.key)}
                  type="button"
                  onClick={() => onChange({ ...a, klasse: a.klasse === k.key ? null : k.key })}
                  className={`min-h-9 rounded-full px-3 py-1.5 text-xs font-medium ${
                    a.klasse === k.key
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground"
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
