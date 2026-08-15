import { Card } from "@/components/betaling/Bits";
import { Input } from "@/components/ui/input";
import { formatNOK } from "@/lib/betaling";
import { pendlingTotal, type PendlingScenario } from "@/lib/gjeld/model";

export function PendlingCard({
  scenarier,
  valgt,
  onVelg,
  onChange,
}: {
  scenarier: PendlingScenario[];
  valgt: string;
  onVelg: (id: string) => void;
  onChange: (s: PendlingScenario) => void;
}) {
  const aktiv = scenarier.find((s) => s.id === valgt) ?? scenarier[0];
  if (!aktiv) return null;
  const t = pendlingTotal(aktiv);
  const andre = scenarier.filter((s) => s.id !== aktiv.id);

  return (
    <Card className="p-5">
      <h2 className="font-semibold">Pendling – scenario</h2>
      <p className="text-xs text-muted-foreground">
        Pendling er ikke lenger en fast utgift på 1 800, men et scenario du styrer selv.
      </p>

      <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {scenarier.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onVelg(s.id)}
            className={`min-h-10 shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ${
              s.id === aktiv.id
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      <p className="mt-4 text-3xl font-bold tabular-nums">{formatNOK(t.total)}</p>
      <p className="text-sm text-muted-foreground">
        per måned · basis kollektiv + parkering {formatNOK(t.basis)}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Felt
          label="Kollektiv 30 dager"
          value={aktiv.kollektiv}
          onChange={(v) => onChange({ ...aktiv, kollektiv: v })}
        />
        <Felt
          label="Pendlerparkering"
          value={aktiv.parkering}
          onChange={(v) => onChange({ ...aktiv, parkering: v })}
        />
        <Felt
          label="Kontordager/mnd"
          value={aktiv.kontordager}
          onChange={(v) => onChange({ ...aktiv, kontordager: v })}
        />
        <Felt
          label="Km tur-retur bil"
          value={aktiv.kmTurRetur}
          onChange={(v) => onChange({ ...aktiv, kmTurRetur: v })}
        />
        <Felt
          label="kWh per km"
          step="0.01"
          value={aktiv.kwhPerKm}
          onChange={(v) => onChange({ ...aktiv, kwhPerKm: v })}
        />
        <Felt
          label="Strømpris kr/kWh"
          step="0.01"
          value={aktiv.stromPris}
          onChange={(v) => onChange({ ...aktiv, stromPris: v })}
        />
        <Felt
          label="Bom per dag"
          value={aktiv.bomPerDag}
          onChange={(v) => onChange({ ...aktiv, bomPerDag: v })}
        />
      </div>

      <dl className="mt-4 space-y-1.5 text-sm">
        <Rad label="Kollektiv" value={formatNOK(t.kollektiv)} />
        <Rad label="Parkering" value={formatNOK(t.parkering)} />
        <Rad label="Strøm kjøring" value={formatNOK(t.strom)} />
        <Rad label="Bom" value={formatNOK(t.bom)} />
      </dl>

      <p className="mt-3 rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
        {aktiv.kollektivNote}
        <br />
        {aktiv.parkeringNote}
      </p>

      {andre.map((s) => {
        const o = pendlingTotal(s);
        return (
          <p key={s.id} className="mt-3 text-xs text-muted-foreground">
            Sammenlignet med {s.name}: {formatNOK(o.total)} ({formatNOK(t.total - o.total)}{" "}
            differanse). Hva som lønner seg avhenger av dine kjøredata og tidsbruk – juster
            scenariene og se selv.
          </p>
        );
      })}

      <p className="mt-3 text-xs text-muted-foreground">
        Hint: 30-dagersbillett lønner seg typisk ved 30+ kollektivreiser per måned. Med{" "}
        {aktiv.kontordager} kontordager blir det {aktiv.kontordager * 2} reiser – vurder{" "}
        {aktiv.kontordager * 2 >= 30 ? "periodebillett" : "enkeltbillett/Reis"}. Ingenting endres
        automatisk.
      </p>
    </Card>
  );
}

function Felt({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: string;
}) {
  return (
    <label className="block text-xs text-muted-foreground">
      {label}
      <Input
        type="number"
        inputMode="decimal"
        step={step ?? "1"}
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="mt-1 tabular-nums"
      />
    </label>
  );
}

function Rad({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
