import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Plus,
  PiggyBank,
  Settings as SettingsIcon,
  Wallet,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentDialog } from "@/components/betaling/PaymentDialog";
import { SettingsDialog } from "@/components/betaling/SettingsDialog";
import { PinLock } from "@/components/betaling/PinLock";
import { InstallPrompt } from "@/components/betaling/InstallPrompt";
import { FASTE, LONNSTREKK_SAK } from "@/lib/gjeldsplan";
import {
  DEFAULT_SETTINGS,
  MONTH_KEYS,
  currentMonthKey,
  debtsFor,
  engangsFor,
  fasteSum,
  formatNOK,
  loadExtra,
  loadPaid,
  loadSettings,
  monthLabel,
  monthMeta,
  monthResult,
  saveExtra,
  savePaid,
  saveSettings,
  shortMonthLabel,
  type Debt,
  type Settings,
} from "@/lib/betaling";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Betaling Tracker – nedbetalingsplan mot gjeldfri" },
      {
        name: "description",
        content:
          "Privat oversikt over budsjett og nedbetalingsplan: krav per måned med KID og kontonummer, huk av betalt, hastefrister, resultat og grafer mot gjeldfri februar 2027.",
      },
      { property: "og:title", content: "Betaling Tracker – nedbetalingsplan" },
      {
        property: "og:description",
        content:
          "Måned for måned: hvem du betaler, hvor mye, KID og konto – med haster-varsler og budsjettoversikt.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [paid, setPaid] = useState<string[]>([]);
  const [extra, setExtra] = useState<Debt[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [current, setCurrent] = useState<string>(() => currentMonthKey());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const s = loadSettings();
    setPaid(loadPaid());
    setExtra(loadExtra());
    setSettings(s);
    setUnlocked(!s.pin);
    setReady(true);
  }, []);

  const idx = MONTH_KEYS.indexOf(current);
  const meta = monthMeta(current);
  const items = useMemo(
    () =>
      debtsFor(current, extra).sort((a, b) => {
        if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
        return b.amount - a.amount;
      }),
    [current, extra],
  );
  const res = monthResult(current, extra);
  const paidTotal = items
    .filter((d) => paid.includes(d.id) || d.auto)
    .reduce((s, d) => s + d.amount, 0);
  const remaining = res.gjeld - paidTotal;

  const urgent = items.filter((d) => !d.auto && !paid.includes(d.id) && d.urgent);

  const totalPlan = useMemo(
    () =>
      MONTH_KEYS.reduce((s, k) => s + monthResult(k, extra).gjeld, 0) +
      LONNSTREKK_SAK.amount,
    [extra],
  );
  const totalPaid = useMemo(
    () =>
      MONTH_KEYS.flatMap((k) => debtsFor(k, extra))
        .filter((d) => paid.includes(d.id))
        .reduce((s, d) => s + d.amount, 0),
    [paid, extra],
  );

  const chartData = useMemo(
    () =>
      MONTH_KEYS.map((k) => {
        const r = monthResult(k, extra);
        return { month: shortMonthLabel(k), gjeld: r.gjeld, resultat: r.resultat };
      }),
    [extra],
  );

  const balanceData = useMemo(() => {
    let bal = 0;
    return MONTH_KEYS.map((k) => {
      bal += monthResult(k, extra).resultat;
      return { month: shortMonthLabel(k), balanse: Math.round(bal) };
    });
  }, [extra]);

  const togglePaid = (d: Debt) => {
    const next = paid.includes(d.id) ? paid.filter((x) => x !== d.id) : [...paid, d.id];
    setPaid(next);
    savePaid(next);
  };

  const updateExtra = (next: Debt[]) => {
    setExtra(next);
    saveExtra(next);
  };

  const updateSettings = (next: Settings) => {
    setSettings(next);
    saveSettings(next);
    if (!next.pin) setUnlocked(true);
  };

  const copy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  };

  if (!ready) return <div className="min-h-screen bg-background" />;
  if (settings.pin && !unlocked)
    return <PinLock pin={settings.pin} onUnlock={() => setUnlocked(true)} />;

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-5">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Betaling Tracker</h1>
            <p className="text-sm text-muted-foreground">
              Gjeldfri februar 2027 · {formatNOK(totalPlan)} i plan
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Innstillinger"
            onClick={() => setSettingsOpen(true)}
          >
            <SettingsIcon className="size-5" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-5">
        <Tabs defaultValue="hjem">
          <TabsList className="w-full">
            <TabsTrigger value="hjem" className="flex-1">
              Hjem
            </TabsTrigger>
            <TabsTrigger value="budsjett" className="flex-1">
              Budsjett
            </TabsTrigger>
            <TabsTrigger value="grafer" className="flex-1">
              Grafer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hjem" className="mt-5 space-y-5">
            <InstallPrompt />
            {urgent.length > 0 && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-destructive">
                      Haster · {urgent.length} krav med frist
                    </p>
                    <ul className="text-sm text-foreground/80">
                      {urgent.map((d) => (
                        <li key={d.id}>
                          {d.creditor} – {formatNOK(d.amount)} · {d.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between rounded-2xl bg-card px-3 py-2">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Forrige måned"
                disabled={idx <= 0}
                onClick={() => setCurrent(MONTH_KEYS[idx - 1] as string)}
              >
                <ChevronLeft className="size-5" />
              </Button>
              <span className="text-sm font-medium capitalize">{monthLabel(current)}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Neste måned"
                disabled={idx >= MONTH_KEYS.length - 1}
                onClick={() => setCurrent(MONTH_KEYS[idx + 1] as string)}
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Du betaler manuelt" value={formatNOK(res.manuelt)} />
              <StatCard label="Betalt" value={formatNOK(paidTotal)} />
              <StatCard label="Gjenstår" value={formatNOK(remaining)} highlight />
            </div>

            <div className="space-y-3">
              {items.length === 0 && (
                <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Ingen krav denne måneden.
                </p>
              )}

              {items.map((d) => {
                const isPaid = paid.includes(d.id);
                return (
                  <article
                    key={d.id}
                    className={`rounded-2xl border bg-card p-4 transition-opacity ${
                      isPaid ? "border-border opacity-60" : ""
                    } ${d.urgent && !isPaid ? "border-destructive/40" : "border-border"}`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => togglePaid(d)}
                        aria-label={isPaid ? "Marker som ubetalt" : "Marker som betalt"}
                        className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                          isPaid
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {isPaid && <Check className="size-4" />}
                      </button>

                      <button
                        className="min-w-0 flex-1 text-left"
                        onClick={() => {
                          if (d.id.startsWith("x")) {
                            setEditing(d);
                            setDialogOpen(true);
                          }
                        }}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <h2 className={`truncate font-medium ${isPaid ? "line-through" : ""}`}>
                            {d.creditor}
                          </h2>
                          <span className="shrink-0 font-semibold tabular-nums">
                            {formatNOK(d.amount)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {d.description} · sak {d.caseNo}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {d.auto && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                              <Zap className="size-3" /> Avtalegiro
                            </span>
                          )}
                          {d.urgent && !isPaid && (
                            <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[11px] font-medium text-destructive">
                              Hastefrist
                            </span>
                          )}
                        </div>
                      </button>
                    </div>

                    {(d.kid || d.account) && (
                      <div className="mt-3 flex flex-wrap gap-2 pl-9">
                        {d.kid && (
                          <CopyChip
                            label="KID"
                            value={d.kid}
                            copied={copied === d.id + "kid"}
                            onCopy={() => copy(d.kid, d.id + "kid")}
                          />
                        )}
                        {d.account && (
                          <CopyChip
                            label="Konto"
                            value={d.account}
                            copied={copied === d.id + "acc"}
                            onCopy={() => copy(d.account, d.id + "acc")}
                          />
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="budsjett" className="mt-5 space-y-4">
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Wallet className="size-4 text-primary" />
                <span className="capitalize">{monthLabel(current)}</span>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <Row label="Bruttolønn" value={formatNOK(meta.brutto)} />
                <Row label="Skattetrekk" value={formatNOK(meta.skatt)} />
                <Row label="Utleggstrekk (Namsfogden)" value={formatNOK(meta.utleggstrekk)} />
                <Row label="Netto disponibelt" value={formatNOK(res.netto)} strong />
                <div className="h-px bg-border" />
                <Row label="Faste utgifter" value={formatNOK(-res.faste)} />
                <Row label="Engangs" value={formatNOK(-res.engangs)} />
                <Row label="Gjeldsnedbetaling" value={formatNOK(-res.gjeld)} />
                <div className="h-px bg-border" />
                <Row label="Månedens resultat" value={formatNOK(res.resultat)} strong />
              </dl>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-sm font-medium">Faste utgifter</h2>
              <dl className="mt-3 space-y-2 text-sm">
                {FASTE.map((f) => (
                  <Row key={f.name} label={f.name} value={formatNOK(f.amount)} />
                ))}
                <Row label="Sum faste" value={formatNOK(fasteSum())} strong />
              </dl>
              {engangsFor(current).length > 0 && (
                <>
                  <h2 className="mt-5 text-sm font-medium">Engangsutgifter</h2>
                  <dl className="mt-3 space-y-2 text-sm">
                    {engangsFor(current).map((e) => (
                      <Row key={e.name} label={e.name} value={formatNOK(e.amount)} />
                    ))}
                  </dl>
                </>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-sm font-medium">Gjeld nedbetalt</h2>
              <p className="mt-3 text-3xl font-semibold tabular-nums">
                {formatNOK(totalPaid)}
              </p>
              <p className="text-sm text-muted-foreground">
                av {formatNOK(totalPlan)} totalt (inkl. lønnstrekk sak{" "}
                {LONNSTREKK_SAK.caseNo})
              </p>
              <Progress
                className="mt-4"
                value={totalPlan ? Math.min(100, (totalPaid / totalPlan) * 100) : 0}
              />
            </section>

            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-sm font-medium">
                <PiggyBank className="size-4 text-primary" /> Sparing
              </div>
              <p className="mt-3 text-3xl font-semibold tabular-nums">
                {formatNOK(settings.saved)}
              </p>
              <p className="text-sm text-muted-foreground">
                av sparemål {formatNOK(settings.savingsGoal)}
              </p>
              <Progress
                className="mt-4"
                value={
                  settings.savingsGoal
                    ? Math.min(100, (settings.saved / settings.savingsGoal) * 100)
                    : 0
                }
              />
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => setSettingsOpen(true)}
              >
                Oppdater sparing
              </Button>
            </section>
          </TabsContent>

          <TabsContent value="grafer" className="mt-5 space-y-4">
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-sm font-medium">Gjeldsnedbetaling per måned</h2>
              <div className="mt-4 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip formatter={(v: number) => formatNOK(v)} cursor={{ opacity: 0.1 }} />
                    <Bar dataKey="gjeld" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-sm font-medium">Utgående balanse (buffer)</h2>
              <div className="mt-4 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={balanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip formatter={(v: number) => formatNOK(v)} cursor={{ opacity: 0.1 }} />
                    <Line
                      type="monotone"
                      dataKey="balanse"
                      stroke="var(--color-chart-1)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Basert på budsjettet i regnearket: netto lønn minus faste, engangs og
                gjeldsnedbetaling.
              </p>
            </section>
      </TabsContent>
        </Tabs>
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-5 py-4">
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" /> Legg til krav i {monthLabel(current).split(" ")[0]}
          </Button>
        </div>
      </div>

      <PaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        month={current}
        editing={editing}
        onSave={(d) =>
          updateExtra(
            extra.some((x) => x.id === d.id)
              ? extra.map((x) => (x.id === d.id ? d : x))
              : [...extra, d],
          )
        }
        onDelete={(id) => updateExtra(extra.filter((x) => x.id !== id))}
      />

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSave={updateSettings}
      />
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={`text-muted-foreground ${strong ? "font-medium text-foreground" : ""}`}>
        {label}
      </dt>
      <dd className={`tabular-nums ${strong ? "font-semibold" : ""}`}>{value}</dd>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-3 ${
        highlight ? "border-primary/40 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function CopyChip({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <button
      onClick={onCopy}
      className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent"
    >
      <span className="font-medium text-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
      {copied ? <Check className="size-3 text-primary" /> : <Copy className="size-3" />}
    </button>
  );
}
