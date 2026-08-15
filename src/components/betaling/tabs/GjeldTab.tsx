import { useMemo, useState } from "react";
import { ChevronDown, Copy, Search, X } from "lucide-react";
import { Avatar, Card, KvalitetBadge, PageTitle, SectionTitle } from "@/components/betaling/Bits";
import { Input } from "@/components/ui/input";
import { formatNOK } from "@/lib/betaling";
import type { KreditorStatus } from "@/lib/gjeld/motor";
import type { Merknad, MerknadStatus, RegistrertBetaling, Sak } from "@/lib/gjeld/model";

type Filter = "alle" | "aapne" | "lukket" | "haster" | "avklar";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "alle", label: "Alle" },
  { key: "aapne", label: "Gjenstår" },
  { key: "lukket", label: "Fullført" },
  { key: "haster", label: "Haster" },
  { key: "avklar", label: "Må avklares" },
];

const STATUS_LABEL: Record<MerknadStatus, string> = {
  verifisert: "Verifisert",
  ikke_verifisert: "Ikke verifisert",
  slettet: "Dokumentert slettet",
};

export function GjeldTab({
  kreditorer,
  betalinger,
  merknader,
  saker,
  onFordel,
  onMerknad,
}: {
  kreditorer: KreditorStatus[];
  betalinger: RegistrertBetaling[];
  merknader: Merknad[];
  saker: Sak[];
  onFordel: (betaling: RegistrertBetaling) => void;
  onMerknad: (m: Merknad) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("alle");
  const [open, setOpen] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return kreditorer.filter((c) => {
      if (filter === "aapne" && c.estimert <= 0) return false;
      if (filter === "lukket" && c.estimert > 0) return false;
      if (filter === "haster" && !c.urgent) return false;
      if (filter === "avklar" && c.kvalitet !== "rod") return false;
      if (!q) return true;
      return c.saker
        .map((s) => [s.sak.caseNo, s.sak.kid, s.sak.description, c.creditor].join(" "))
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [kreditorer, query, filter]);

  const sum = visible.reduce((s, c) => s + c.estimert, 0);
  const venter = betalinger.filter((b) => b.status === "venter");
  const ufordelte = betalinger.filter((b) => b.status === "bekreftet" && !b.sakId);

  return (
    <div className="space-y-5">
      <PageTitle>Gjeld</PageTitle>

      {venter.length > 0 && (
        <Card className="border-destructive/40">
          <p className="text-sm font-semibold text-destructive">Venter på avklaring</p>
          {venter.map((b) => (
            <p key={b.id} className="mt-1 text-xs text-muted-foreground">
              {formatNOK(b.amount)} · {b.date} · {b.creditor}. {b.note}
            </p>
          ))}
        </Card>
      )}

      {ufordelte.length > 0 && (
        <Card>
          <p className="text-sm font-semibold">Bekreftede betalinger uten sak</p>
          <div className="mt-2 space-y-2">
            {ufordelte.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => onFordel(b)}
                className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {b.creditor} · {b.date}
                  </span>
                  <span className="block text-xs text-muted-foreground">Trykk for å fordele</span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums">{formatNOK(b.amount)}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Søk kreditor, KID eller saksnr."
          aria-label="Søk i kreditorer"
          className="pl-9 pr-9"
        />
        {query && (
          <button
            type="button"
            aria-label="Tøm søk"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`min-h-10 shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              f.key === filter
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="px-1 text-xs text-muted-foreground">
        {visible.length} av {kreditorer.length} kreditorer · {formatNOK(sum)} estimert gjenstår
      </p>

      <div className="space-y-3">
        {visible.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Ingen treff.
          </p>
        )}
        {visible.map((c) => {
          const expanded = open === c.creditor;
          return (
            <Card key={c.creditor} className="p-4">
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : c.creditor)}
                className="flex w-full items-center gap-3 text-left"
              >
                <Avatar name={c.creditor} tone={c.urgent ? "red" : "green"} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{c.creditor}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {c.saker.length} sak(er) · dokumentert {formatNOK(c.dokumentert)}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-lg font-bold tabular-nums">
                    {formatNOK(c.estimert)}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">estimert</span>
                </span>
                <ChevronDown
                  className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                    expanded ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <KvalitetBadge level={c.kvalitet} />
                {c.bekreftetBetalt + c.ufordelt > 0 && (
                  <span className="text-xs text-muted-foreground">
                    bekreftet betalt {formatNOK(c.bekreftetBetalt + c.ufordelt)}
                  </span>
                )}
              </div>

              {expanded && (
                <ul className="mt-4 space-y-3 border-t border-border pt-4">
                  {c.saker.map((s) => (
                    <li key={s.sak.id} className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="min-w-0 flex-1 truncate text-sm font-semibold">
                          {s.sak.caseNo} · {s.sak.description}
                        </p>
                        <span className="shrink-0 text-sm font-bold tabular-nums">
                          {formatNOK(s.estimert)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Dokumentert {formatNOK(s.sak.documented)}
                        {s.sak.docDate ? ` per ${s.sak.docDate}` : " (dato ukjent)"}
                        {s.sak.rate != null ? ` · ${s.sak.rate} %` : " · rente ukjent"}
                        {s.bekreftetBetalt > 0
                          ? ` · bekreftet betalt ${formatNOK(s.bekreftetBetalt)}`
                          : ""}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <KvalitetBadge level={s.kvalitet} text={s.kvalitetTekst} />
                        {s.sak.closesCreditFile && (
                          <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground">
                            Kan lukke kredittfilpost
                          </span>
                        )}
                      </div>
                      {s.sak.note && (
                        <p className="text-xs italic text-muted-foreground">{s.sak.note}</p>
                      )}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <CopyChip label="KID" value={s.sak.kid} />
                        <CopyChip label="Konto" value={s.sak.account} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>

      <SectionTitle>Kredittfil</SectionTitle>
      <p className="px-1 text-xs text-muted-foreground">
        14 tidligere registrerte anmerkninger. Ingen dato er lovet – målet er å verifisere
        kredittfilen etter innfrielse.
      </p>
      <div className="space-y-2">
        {merknader.map((m) => (
          <Card key={m.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{m.label}</p>
                <p className="text-xs text-muted-foreground">
                  {STATUS_LABEL[m.status]}
                  {m.lastChecked ? ` · sist sjekket ${m.lastChecked}` : " · aldri sjekket"}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["ikke_verifisert", "verifisert", "slettet"] as MerknadStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() =>
                    onMerknad({
                      ...m,
                      status: st,
                      lastChecked: new Date().toISOString().slice(0, 10),
                    })
                  }
                  className={`min-h-9 rounded-full px-3 py-1.5 text-xs font-medium ${
                    m.status === st
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground"
                  }`}
                >
                  {STATUS_LABEL[st]}
                </button>
              ))}
            </div>
            <label className="mt-3 block text-xs text-muted-foreground">
              Koblet sak
              <select
                value={m.sakId ?? ""}
                onChange={(e) => onMerknad({ ...m, sakId: e.target.value || null })}
                className="mt-1 min-h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="">Ikke koblet</option>
                {saker.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.creditor} · {s.caseNo}
                  </option>
                ))}
              </select>
            </label>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CopyChip({ label, value }: { label: string; value: string }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(value)}
      className="flex min-h-9 items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-[11px] text-muted-foreground"
    >
      <Copy className="size-3" />
      {label}: <span className="max-w-[10rem] truncate font-mono">{value}</span>
    </button>
  );
}
