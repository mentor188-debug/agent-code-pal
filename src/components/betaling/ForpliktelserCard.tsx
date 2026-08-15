import { Card } from "@/components/betaling/Bits";
import { formatNOK } from "@/lib/betaling";
import type { Forpliktelse } from "@/lib/gjeld/model";

const STATUS: { key: Forpliktelse["status"]; label: string }[] = [
  { key: "maa_verifiseres", label: "Må verifiseres" },
  { key: "gjennomfort", label: "Gjennomført" },
  { key: "ikke_gjennomfort", label: "Ikke gjennomført" },
];

export function ForpliktelserCard({
  items,
  onChange,
}: {
  items: Forpliktelse[];
  onChange: (f: Forpliktelse) => void;
}) {
  const aktive = items.filter((i) => i.scope === "aktiv");
  const arkiv = items.filter((i) => i.scope === "arkiv");

  return (
    <Card className="p-5">
      <h2 className="font-semibold">Utleggstrekk og juridiske forpliktelser</h2>
      <p className="text-xs text-muted-foreground">
        Trekkes ikke automatisk fra inntekten. Nettolønn reduseres først når du markerer et trekk
        som gjennomført.
      </p>

      <ul className="mt-4 space-y-3">
        {aktive.map((f) => (
          <li key={f.id} className="rounded-xl border border-border p-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 flex-1 text-sm font-semibold">{f.label}</p>
              <span className="shrink-0 font-bold tabular-nums">{formatNOK(f.amount)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{f.note}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {STATUS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => onChange({ ...f, status: s.key })}
                  className={`min-h-9 rounded-full px-3 py-1.5 text-xs font-medium ${
                    f.status === s.key
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {arkiv.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
            Historikk – tidligere antakelser, ikke aktivt budsjett
          </summary>
          <ul className="mt-2 space-y-2">
            {arkiv.map((f) => (
              <li key={f.id} className="rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
                <span className="font-medium">{f.label}</span> · {formatNOK(f.amount)} · tidligere
                antakelse – ikke bekreftet.
                <br />
                {f.note}
              </li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}
