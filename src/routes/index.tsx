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
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
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
import {
  addMonths,
  daysUntil,
  dueDateFor,
  formatNOK,
  isPaid,
  loadPayments,
  loadSettings,
  monthKey,
  monthLabel,
  savePayments,
  saveSettings,
  shortMonthLabel,
  type Payment,
  type Settings,
  DEFAULT_SETTINGS,
} from "@/lib/betaling";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Betaling Tracker – oversikt over regninger og sparing" },
      {
        name: "description",
        content:
          "Privat betalingsoversikt: forfall, KID og kontonummer, huk av betalt, budsjett, sparemål og grafer – alt lagret lokalt på din enhet.",
      },
      { property: "og:title", content: "Betaling Tracker – regninger og sparing" },
      {
        property: "og:description",
        content:
          "Hold styr på faste regninger, forfallsdatoer, budsjett og sparemål i én privat app.",
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
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [current, setCurrent] = useState(() => monthKey(new Date()));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const s = loadSettings();
    setPayments(loadPayments());
    setSettings(s);
    setUnlocked(!s.pin);
    setReady(true);
  }, []);

  const updatePayments = (next: Payment[]) => {
    setPayments(next);
    savePayments(next);
  };

  const updateSettings = (next: Settings) => {
    setSettings(next);
    saveSettings(next);
    if (!next.pin) setUnlocked(true);
  };

  const monthPayments = useMemo(
    () =>
      payments
        .filter((p) => p.recurring || !p.paidMonths.length || isPaid(p, current))
        .map((p) => ({
          payment: p,
          date: dueDateFor(p, current),
          paid: isPaid(p, current),
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
    [payments, current],
  );

  const total = monthPayments.reduce((s, r) => s + r.payment.amount, 0);
  const paidTotal = monthPayments
    .filter((r) => r.paid)
    .reduce((s, r) => s + r.payment.amount, 0);
  const remaining = total - paidTotal;
  const leftOfIncome = settings.income - total;

  const urgent = monthPayments.filter(
    (r) => !r.paid && daysUntil(r.date) <= 5,
  );

  const chartData = useMemo(() => {
    const keys = Array.from({ length: 6 }, (_, i) => addMonths(monthKey(new Date()), i - 5));
    return keys.map((k) => ({
      month: shortMonthLabel(k),
      betalt: payments
        .filter((p) => isPaid(p, k))
        .reduce((s, p) => s + p.amount, 0),
      total: payments
        .filter((p) => p.recurring || isPaid(p, k))
        .reduce((s, p) => s + p.amount, 0),
    }));
  }, [payments]);

  const togglePaid = (p: Payment) => {
    const next = payments.map((x) =>
      x.id === p.id
        ? {
            ...x,
            paidMonths: isPaid(x, current)
              ? x.paidMonths.filter((m) => m !== current)
              : [...x.paidMonths, current],
          }
        : x,
    );
    updatePayments(next);
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
            <p className="text-sm text-muted-foreground">Privat oversikt · lagret på enheten</p>
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
            {urgent.length > 0 && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-destructive">
                      Haster · {urgent.length} forfaller snart
                    </p>
                    <ul className="text-sm text-foreground/80">
                      {urgent.map((r) => {
                        const d = daysUntil(r.date);
                        return (
                          <li key={r.payment.id}>
                            {r.payment.name} – {formatNOK(r.payment.amount)} ·{" "}
                            {d < 0
                              ? `${Math.abs(d)} dager på overtid`
                              : d === 0
                                ? "forfaller i dag"
                                : `om ${d} dag${d === 1 ? "" : "er"}`}
                          </li>
                        );
                      })}
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
                onClick={() => setCurrent(addMonths(current, -1))}
              >
                <ChevronLeft className="size-5" />
              </Button>
              <span className="text-sm font-medium capitalize">{monthLabel(current)}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Neste måned"
                onClick={() => setCurrent(addMonths(current, 1))}
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Totalt" value={formatNOK(total)} />
              <StatCard label="Betalt" value={formatNOK(paidTotal)} />
              <StatCard label="Gjenstår" value={formatNOK(remaining)} highlight />
            </div>

            <div className="space-y-3">
              {monthPayments.length === 0 && (
                <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Ingen betalinger ennå. Trykk «Ny betaling» for å legge til din første regning.
                </p>
              )}

              {monthPayments.map(({ payment, date, paid }) => {
                const d = daysUntil(date);
                return (
                  <article
                    key={payment.id}
                    className={`rounded-2xl border border-border bg-card p-4 transition-opacity ${
                      paid ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => togglePaid(payment)}
                        aria-label={paid ? "Marker som ubetalt" : "Marker som betalt"}
                        className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                          paid
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {paid && <Check className="size-4" />}
                      </button>

                      <button
                        className="min-w-0 flex-1 text-left"
                        onClick={() => {
                          setEditing(payment);
                          setDialogOpen(true);
                        }}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <h2
                            className={`truncate font-medium ${paid ? "line-through" : ""}`}
                          >
                            {payment.name}
                          </h2>
                          <span className="shrink-0 font-semibold tabular-nums">
                            {formatNOK(payment.amount)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {payment.category} ·{" "}
                          {date.toLocaleDateString("nb-NO", {
                            day: "numeric",
                            month: "short",
                          })}
                          {!paid && d <= 5 && (
                            <span className="ml-1 font-medium text-destructive">
                              {d < 0 ? "forfalt" : d === 0 ? "i dag" : `om ${d} d`}
                            </span>
                          )}
                        </p>
                      </button>
                    </div>

                    {(payment.kid || payment.account) && (
                      <div className="mt-3 flex flex-wrap gap-2 pl-9">
                        {payment.kid && (
                          <CopyChip
                            label="KID"
                            value={payment.kid}
                            copied={copied === payment.id + "kid"}
                            onCopy={() => copy(payment.kid!, payment.id + "kid")}
                          />
                        )}
                        {payment.account && (
                          <CopyChip
                            label="Konto"
                            value={payment.account}
                            copied={copied === payment.id + "acc"}
                            onCopy={() => copy(payment.account!, payment.id + "acc")}
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
                <Wallet className="size-4 text-primary" /> Månedsbudsjett
              </div>
              <p className="mt-3 text-3xl font-semibold tabular-nums">
                {formatNOK(leftOfIncome)}
              </p>
              <p className="text-sm text-muted-foreground">
                igjen av {formatNOK(settings.income)} etter faste utgifter
              </p>
              <Progress
                className="mt-4"
                value={settings.income ? Math.min(100, (total / settings.income) * 100) : 0}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Faste utgifter denne måneden: {formatNOK(total)}
              </p>
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
                Oppdater inntekt og sparing
              </Button>
            </section>
          </TabsContent>

          <TabsContent value="grafer" className="mt-5">
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-sm font-medium">Betalt siste 6 måneder</h2>
              <div className="mt-4 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip
                      formatter={(v: number) => formatNOK(v)}
                      cursor={{ opacity: 0.1 }}
                    />
                    <Bar dataKey="betalt" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Søylene viser hvor mye du har huket av som betalt hver måned.
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
            <Plus className="size-4" /> Ny betaling
          </Button>
        </div>
      </div>

      <PaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSave={(p) =>
          updatePayments(
            payments.some((x) => x.id === p.id)
              ? payments.map((x) => (x.id === p.id ? p : x))
              : [...payments, p],
          )
        }
        onDelete={(id) => updatePayments(payments.filter((x) => x.id !== id))}
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
