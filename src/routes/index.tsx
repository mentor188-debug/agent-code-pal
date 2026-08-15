import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Settings as SettingsIcon } from "lucide-react";
import { PaymentDialog } from "@/components/betaling/PaymentDialog";
import { SettingsDialog } from "@/components/betaling/SettingsDialog";
import { PinLock } from "@/components/betaling/PinLock";
import { BottomNav, type TabKey } from "@/components/betaling/BottomNav";
import { HomeTab } from "@/components/betaling/tabs/HomeTab";
import { KalenderTab } from "@/components/betaling/tabs/KalenderTab";
import { GjeldTab } from "@/components/betaling/tabs/GjeldTab";
import { BudsjettTab } from "@/components/betaling/tabs/BudsjettTab";
import { LevepengerTab } from "@/components/betaling/tabs/LevepengerTab";
import { SparingTab } from "@/components/betaling/tabs/SparingTab";
import { SaldoTab } from "@/components/betaling/tabs/SaldoTab";
import { PendlingCard } from "@/components/betaling/PendlingCard";
import { AbonnementCard } from "@/components/betaling/AbonnementCard";
import { ForpliktelserCard } from "@/components/betaling/ForpliktelserCard";
import { FordelBetalingDialog } from "@/components/betaling/FordelBetalingDialog";
import { loadPlan, markUpdateSeen, savePlan, shouldAnnounceUpdate } from "@/lib/gjeld/store";
import { defaultPlanState, pendlingTotal, type PlanState, type RegistrertBetaling } from "@/lib/gjeld/model";
import {
  byggPlan,
  forecast,
  kapasitetFor,
  nesteBesteBetaling,
  statusPerKreditor,
} from "@/lib/gjeld/motor";
import { dueDayFor, fasteAgenda, loadDue, type AgendaItem } from "@/lib/dager";
import { dueReminders, fireOnce, fireReminders } from "@/lib/varsler";
import { BudgetItemDialog } from "@/components/betaling/BudgetItemDialog";
import { IncomeDialog } from "@/components/betaling/IncomeDialog";
import {
  defaultBudget,
  engangsOf,
  fasteSumOf,
  incomeFor,
  loadBudget,
  removeEngangs,
  removeFast,
  saveBudget,
  setIncome,
  upsertEngangs,
  upsertFast,
  type BudgetData,
  type BudgetItem,
} from "@/lib/budsjett";
import {
  budgetFor,
  carryOverFor,
  leveStatus,
  loadThresholds,
  saveThresholds,
  thresholdFor,
  costsFor,
  loadBudgets,
  loadCosts,
  saveBudgets,
  saveCosts,
  type LiveCost,
} from "@/lib/levepenger";
import {
  DEFAULT_SETTINGS,
  MONTH_KEYS,
  currentMonthKey,
  debtsFor,
  formatNOK,
  loadExtra,
  loadPaid,
  loadSettings,
  monthLabel,
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
  const [tab, setTab] = useState<TabKey>("hjem");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [due, setDue] = useState<Record<string, number>>({});
  const [liveCosts, setLiveCosts] = useState<LiveCost[]>([]);
  const [liveBudgets, setLiveBudgets] = useState<Record<string, number>>({});
  const [leveThresholds, setLeveThresholds] = useState<Record<string, number>>({});
  const [budget, setBudget] = useState<BudgetData>(() => defaultBudget());
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [itemDialog, setItemDialog] = useState<{
    kind: "fast" | "engangs";
    item: BudgetItem | null;
  } | null>(null);
  const [plan, setPlan] = useState<PlanState>(() => defaultPlanState());
  const [planOppdatert, setPlanOppdatert] = useState(false);
  const [fordel, setFordel] = useState<RegistrertBetaling | null>(null);

  useEffect(() => {
    const s = loadSettings();
    setPaid(loadPaid());
    setExtra(loadExtra());
    setDue(loadDue());
    setLiveCosts(loadCosts());
    setLiveBudgets(loadBudgets());
    setLeveThresholds(loadThresholds());
    setBudget(loadBudget());
    setPlan(loadPlan());
    setPlanOppdatert(shouldAnnounceUpdate());
    setSettings(s);
    setUnlocked(!s.pin);
    setReady(true);
  }, []);

  const updateBudget = (next: BudgetData) => {
    setBudget(next);
    saveBudget(next);
  };

  const updatePlan = (next: PlanState) => {
    setPlan(next);
    savePlan(next);
  };


  const meta = incomeFor(current, budget);
  const leveBudget = budgetFor(current, liveBudgets);
  const leveCarry = carryOverFor(current, MONTH_KEYS, liveCosts, liveBudgets, currentMonthKey());
  const leveCosts = costsFor(current, liveCosts);
  const leveTerskel = thresholdFor(current, leveThresholds);
  const leveStat = leveStatus(
    leveCosts.reduce((s, c) => s + c.amount, 0),
    leveBudget + leveCarry,
    leveTerskel,
  );

  // Resurs avsluttes etter valgt sluttmåned – da forsvinner den fra faste utgifter.
  const fasteFor = (key: string) =>
    budget.faste.filter((f) => !/resurs/i.test(f.name) || key <= plan.resursSlutt);
  const fasteSumFor = (key: string) => fasteFor(key).reduce((s, f) => s + f.amount, 0);

  const kapasitet = useMemo(
    () => (key: string) =>
      kapasitetFor(key, plan, {
        netto: incomeFor(key, budget).netto,
        faste: fasteSumFor(key),
        engangs: engangsOf(key, budget).reduce((s, e) => s + e.amount, 0),
        levepenger: budgetFor(key, liveBudgets),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plan, budget, liveBudgets],
  );

  const planDebts = useMemo<Debt[]>(
    () =>
      byggPlan(plan, (m) => kapasitet(m).tilGjeld, currentMonthKey()).map((p) => ({
        id: p.id,
        month: p.month,
        creditor: p.creditor,
        caseNo: p.caseNo,
        description: p.description,
        amount: p.amount,
        kid: p.kid,
        account: p.account,
        auto: false,
        urgent: p.urgent,
      })),
    [plan, kapasitet],
  );

  const resultFor = (key: string, leve = budgetFor(key, liveBudgets)) => {
    const inc = incomeFor(key, budget);
    const gjeld = debtsFor(key, extra, planDebts).reduce((s, d) => s + d.amount, 0);
    const eng = engangsOf(key, budget).reduce((s, e) => s + e.amount, 0);
    const faste = fasteSumFor(key);
    const pendling = kapasitet(key).pendling;
    return {
      netto: inc.netto,
      faste,
      engangs: eng,
      gjeld,
      pendling,
      resultat: inc.netto - faste - eng - gjeld - leve - pendling,
    };
  };
  const res = resultFor(current, leveBudget);

  const agenda = useMemo<AgendaItem[]>(() => {
    const debts = debtsFor(current, extra, planDebts).map((d, i) => ({
      id: d.id,
      day: dueDayFor(d, due, i),
      name: d.creditor,
      kind: "Gjeld" as const,
      amount: d.amount,
      urgent: d.urgent,
      debt: d,
    }));
    const eng = engangsOf(current, budget).map((e) => ({
      id: e.id,
      day: e.day,
      name: e.name,
      kind: "Engangs" as const,
      amount: e.amount,
      urgent: false,
    }));
    return [...fasteAgenda(fasteFor(current)), ...eng, ...debts].sort((a, b) => a.day - b.day);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, extra, due, budget, planDebts, plan.resursSlutt]);

  const kreditorer = useMemo(() => statusPerKreditor(plan), [plan]);
  const estimertGjeld = kreditorer.reduce((s, k) => s + k.estimert, 0);
  const dokumentertTotal = kreditorer.reduce((s, k) => s + k.dokumentert, 0);
  const bekreftetBetalt = kreditorer.reduce((s, k) => s + k.bekreftetBetalt + k.ufordelt, 0);
  const ufordeltSum = kreditorer.reduce((s, k) => s + k.ufordelt, 0);
  const samletKvalitet = kreditorer.some((k) => k.kvalitet === "rod")
    ? ("rod" as const)
    : kreditorer.some((k) => k.kvalitet === "gul")
      ? ("gul" as const)
      : ("gronn" as const);

  const forecastData = useMemo(
    () => forecast(plan, (m) => kapasitet(m).tilGjeld, currentMonthKey()),
    [plan, kapasitet],
  );
  const kapasitetNa = kapasitet(currentMonthKey());
  const neste = nesteBesteBetaling(plan, kapasitetNa.tilGjeld);
  const monthName = (key: string | null) => (key ? monthLabel(key) : "senere enn juni 2027");


  const buffer = MONTH_KEYS.map((k) => ({
    month: monthLabel(k),
    value: Math.round(resultFor(k).resultat),
  }));

  const reminders = useMemo(
    () =>
      current === currentMonthKey()
        ? dueReminders(agenda, paid, settings.reminderDays)
        : [],
    [agenda, paid, settings.reminderDays, current],
  );

  useEffect(() => {
    if (!ready || !settings.notify || reminders.length === 0) return;
    fireReminders(reminders);
  }, [ready, settings.notify, reminders]);

  useEffect(() => {
    if (!ready || !settings.notify) return;
    if (current !== currentMonthKey() || leveStat.level === "ok") return;
    fireOnce(
      `leve-${current}-${leveStat.level}`,
      leveStat.level === "over" ? "Levepengene er brukt opp" : "Levepengene nærmer seg slutten",
      leveStat.level === "over"
        ? `${formatNOK(Math.abs(leveStat.left))} over budsjettet denne måneden.`
        : `${leveStat.pct} % brukt (terskel ${leveStat.threshold} %). ${formatNOK(leveStat.left)} igjen.`,
    );
  }, [ready, settings.notify, current, leveStat.level, leveStat.pct, leveStat.left, leveStat.threshold]);

  const togglePaid = (id: string) => {
    const next = paid.includes(id) ? paid.filter((x) => x !== id) : [...paid, id];
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

  if (!ready) return <div className="min-h-screen bg-background" />;
  if (settings.pin && !unlocked)
    return <PinLock pin={settings.pin} onUnlock={() => setUnlocked(true)} />;

  const openDebt = (i: AgendaItem) => {
    if (!i.debt) return;
    setEditing(i.debt);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl px-5 pb-[calc(8.5rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
        {tab === "hjem" && (
          <HomeTab
            estimertGjeld={estimertGjeld}
            dokumentert={dokumentertTotal}
            bekreftetBetalt={bekreftetBetalt}
            ufordelt={ufordeltSum}
            kvalitet={samletKvalitet}
            forecastData={forecastData}
            monthName={monthName}
            neste={neste}
            buffer={kapasitetNa}
            urgent={agenda.filter((i) => i.urgent && !paid.includes(i.id))}
            upcoming={agenda.filter((i) => !paid.includes(i.id) && !i.urgent).slice(0, 5)}
            reminders={reminders}
            planOppdatert={planOppdatert}
            onDismissUpdate={() => {
              markUpdateSeen();
              setPlanOppdatert(false);
            }}
            onGo={(t) => setTab(t)}
          />
        )}

        {tab === "kalender" && (
          <KalenderTab
            months={MONTH_KEYS}
            current={current}
            onMonth={setCurrent}
            label={shortMonthLabel}
            items={agenda}
            paidIds={paid}
            onToggle={(i) => togglePaid(i.id)}
            onEdit={openDebt}
          />
        )}

        {tab === "gjeld" && (
          <GjeldTab
            kreditorer={kreditorer}
            betalinger={plan.betalinger}
            merknader={plan.merknader}
            saker={plan.saker}
            onFordel={setFordel}
            onMerknad={(m) =>
              updatePlan({
                ...plan,
                merknader: plan.merknader.map((x) => (x.id === m.id ? m : x)),
              })
            }
          />
        )}

        {tab === "budsjett" && (
          <BudsjettTab
            months={MONTH_KEYS}
            current={current}
            onMonth={setCurrent}
            label={shortMonthLabel}
            longLabel={monthLabel(current)}
            meta={meta}
            faste={fasteFor(current)}
            engangs={engangsOf(current, budget)}
            gjeld={res.gjeld}
            levepenger={leveBudget}
            pendling={res.pendling}
            extra={
              <>
                <PendlingCard
                  scenarier={plan.pendling.scenarier}
                  valgt={plan.pendling.valgt}
                  onVelg={(id) => updatePlan({ ...plan, pendling: { ...plan.pendling, valgt: id } })}
                  onChange={(s) =>
                    updatePlan({
                      ...plan,
                      pendling: {
                        ...plan.pendling,
                        scenarier: plan.pendling.scenarier.map((x) => (x.id === s.id ? s : x)),
                      },
                    })
                  }
                />
                <ForpliktelserCard
                  items={plan.forpliktelser}
                  onChange={(f) =>
                    updatePlan({
                      ...plan,
                      forpliktelser: plan.forpliktelser.map((x) => (x.id === f.id ? f : x)),
                    })
                  }
                />
                <AbonnementCard
                  items={plan.abonnement}
                  onChange={(a) =>
                    updatePlan({
                      ...plan,
                      abonnement: plan.abonnement.map((x) => (x.id === a.id ? a : x)),
                    })
                  }
                />
              </>
            }
            onEditIncome={() => setIncomeOpen(true)}
            onEditFast={(item) => setItemDialog({ kind: "fast", item })}
            onAddFast={() => setItemDialog({ kind: "fast", item: null })}
            onEditEngangs={(item) => setItemDialog({ kind: "engangs", item })}
            onAddEngangs={() => setItemDialog({ kind: "engangs", item: null })}
          />
        )}


        {tab === "levepenger" && (
          <LevepengerTab
            months={MONTH_KEYS}
            current={current}
            onMonth={setCurrent}
            label={shortMonthLabel}
            longLabel={monthLabel(current)}
            budget={leveBudget}
            carry={leveCarry}
            threshold={leveTerskel}
            onThreshold={(v) => {
              const next = { ...leveThresholds, [current]: v };
              setLeveThresholds(next);
              saveThresholds(next);
            }}
            onBudget={(v) => {
              const next = { ...liveBudgets, [current]: v };
              setLiveBudgets(next);
              saveBudgets(next);
            }}
            costs={leveCosts}
            onAdd={(c) => {
              const next = [...liveCosts, c];
              setLiveCosts(next);
              saveCosts(next);
            }}
            onDelete={(id) => {
              const next = liveCosts.filter((c) => c.id !== id);
              setLiveCosts(next);
              saveCosts(next);
            }}
          />
        )}

        {tab === "saldo" && (
          <SaldoTab
            months={MONTH_KEYS}
            current={current}
            onMonth={setCurrent}
            label={shortMonthLabel}
            longLabel={monthLabel(current)}
            netto={meta.netto}
            items={agenda}
            paidIds={paid}
            leveAvailable={leveBudget + leveCarry}
            leveCosts={leveCosts}
            onToggle={togglePaid}
          />
        )}

        {tab === "sparing" && (
          <SparingTab
            saved={settings.saved}
            goal={settings.savingsGoal}
            monthlyBuffer={buffer}
            onEdit={() => setSettingsOpen(true)}
          />
        )}
      </main>

      <button
        type="button"
        aria-label="Innstillinger"
        onClick={() => setSettingsOpen(true)}
        className="fixed right-5 top-[calc(1rem+env(safe-area-inset-top))] z-30 flex size-10 items-center justify-center rounded-full border border-border bg-card/85 text-muted-foreground shadow-sm backdrop-blur transition-transform active:scale-95"
      >
        <SettingsIcon className="size-5" />
      </button>

      {(tab === "kalender" || tab === "gjeld") && (
        <button
          type="button"
          aria-label="Legg til krav"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-5 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background transition-transform active:scale-95"
        >
          <Plus className="size-7" />
        </button>
      )}

      <BottomNav value={tab} onChange={setTab} />

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
        month={current}
        monthLabel={monthLabel(current)}
      />

      <IncomeDialog
        open={incomeOpen}
        onOpenChange={setIncomeOpen}
        monthLabel={monthLabel(current)}
        income={{ brutto: meta.brutto, skatt: meta.skatt, utleggstrekk: meta.utleggstrekk }}
        onSave={(inc) => updateBudget(setIncome(budget, current, inc))}
      />

      <BudgetItemDialog
        open={itemDialog !== null}
        onOpenChange={(v) => !v && setItemDialog(null)}
        title={
          itemDialog?.kind === "engangs"
            ? itemDialog.item
              ? "Rediger engangsutgift"
              : "Ny engangsutgift"
            : itemDialog?.item
              ? "Rediger fast utgift"
              : "Ny fast utgift"
        }
        editing={itemDialog?.item ?? null}
        onSave={(item) =>
          updateBudget(
            itemDialog?.kind === "engangs"
              ? upsertEngangs(budget, current, item)
              : upsertFast(budget, item),
          )
        }
        onDelete={(id) =>
          updateBudget(
            itemDialog?.kind === "engangs"
              ? removeEngangs(budget, current, id)
              : removeFast(budget, id),
          )
        }
      />

      <FordelBetalingDialog
        betaling={fordel}
        saker={plan.saker}
        onOpenChange={(v) => !v && setFordel(null)}
        onSave={(b) =>
          updatePlan({
            ...plan,
            betalinger: plan.betalinger.map((x) => (x.id === b.id ? b : x)),
          })
        }
      />
    </div>
  );
}
