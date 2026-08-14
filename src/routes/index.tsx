import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Settings as SettingsIcon } from "lucide-react";
import { PaymentDialog } from "@/components/betaling/PaymentDialog";
import { SettingsDialog } from "@/components/betaling/SettingsDialog";
import { PinLock } from "@/components/betaling/PinLock";
import { BottomNav, type TabKey } from "@/components/betaling/BottomNav";
import { HomeTab } from "@/components/betaling/tabs/HomeTab";
import { KalenderTab } from "@/components/betaling/tabs/KalenderTab";
import { GjeldTab, type CreditorSummary } from "@/components/betaling/tabs/GjeldTab";
import { BudsjettTab } from "@/components/betaling/tabs/BudsjettTab";
import { LevepengerTab } from "@/components/betaling/tabs/LevepengerTab";
import { SparingTab } from "@/components/betaling/tabs/SparingTab";
import { FASTE, LONNSTREKK_SAK } from "@/lib/gjeldsplan";
import { daysUntilFree, dueDayFor, fasteAgenda, loadDue, type AgendaItem } from "@/lib/dager";
import { dueReminders, fireReminders } from "@/lib/varsler";
import {
  budgetFor,
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
  engangsFor,
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
  const [tab, setTab] = useState<TabKey>("hjem");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [due, setDue] = useState<Record<string, number>>({});
  const [liveCosts, setLiveCosts] = useState<LiveCost[]>([]);
  const [liveBudgets, setLiveBudgets] = useState<Record<string, number>>({});

  useEffect(() => {
    const s = loadSettings();
    setPaid(loadPaid());
    setExtra(loadExtra());
    setDue(loadDue());
    setLiveCosts(loadCosts());
    setLiveBudgets(loadBudgets());
    setSettings(s);
    setUnlocked(!s.pin);
    setReady(true);
  }, []);

  const meta = monthMeta(current);
  const leveBudget = budgetFor(current, liveBudgets);
  const leveCarry = carryOverFor(current, MONTH_KEYS, liveCosts, liveBudgets, currentMonthKey());
  const leveCosts = costsFor(current, liveCosts);
  const res = monthResult(current, extra, leveBudget);

  const agenda = useMemo<AgendaItem[]>(() => {
    const debts = debtsFor(current, extra).map((d, i) => ({
      id: d.id,
      day: dueDayFor(d, due, i),
      name: d.creditor,
      kind: "Gjeld" as const,
      amount: d.amount,
      urgent: d.urgent,
      debt: d,
    }));
    const eng = engangsFor(current).map((e) => ({
      id: "eng-" + e.name,
      day: 15,
      name: e.name,
      kind: "Engangs" as const,
      amount: e.amount,
      urgent: false,
    }));
    return [...fasteAgenda(), ...eng, ...debts].sort((a, b) => a.day - b.day);
  }, [current, extra, due]);

  const totalPlan = useMemo(
    () => MONTH_KEYS.reduce((s, k) => s + monthResult(k, extra).gjeld, 0) + LONNSTREKK_SAK.amount,
    [extra],
  );
  const totalPaid = useMemo(
    () =>
      MONTH_KEYS.flatMap((k) => debtsFor(k, extra))
        .filter((d) => paid.includes(d.id))
        .reduce((s, d) => s + d.amount, 0),
    [paid, extra],
  );

  const gjeldChart = useMemo(() => {
    let rest = totalPlan;
    return MONTH_KEYS.map((k) => {
      rest -= monthResult(k, extra).gjeld;
      return { month: shortMonthLabel(k), gjeld: Math.max(0, Math.round(rest)) };
    });
  }, [extra, totalPlan]);

  const creditors = useMemo<CreditorSummary[]>(() => {
    const map = new Map<
      string,
      CreditorSummary & { caseSet: Set<string>; paidCases: Set<string>; kidSet: Set<string> }
    >();
    MONTH_KEYS.forEach((k) => {
      debtsFor(k, extra).forEach((d) => {
        const cur =
          map.get(d.creditor) ??
          ({
            creditor: d.creditor,
            total: 0,
            paid: 0,
            cases: 0,
            casesPaid: 0,
            note: d.description,
            target: shortMonthLabel(k),
            caseNos: [],
            kids: [],
            urgent: false,
            caseSet: new Set<string>(),
            paidCases: new Set<string>(),
            kidSet: new Set<string>(),
          } as CreditorSummary & {
            caseSet: Set<string>;
            paidCases: Set<string>;
            kidSet: Set<string>;
          });
        cur.total += d.amount;
        cur.caseSet.add(d.caseNo);
        if (d.kid) cur.kidSet.add(d.kid);
        if (d.urgent) cur.urgent = true;
        if (paid.includes(d.id)) {
          cur.paid += d.amount;
          cur.paidCases.add(d.caseNo);
        }
        cur.target = shortMonthLabel(k);
        map.set(d.creditor, cur);
      });
    });
    const lonn = map.get(LONNSTREKK_SAK.creditor);
    if (lonn) {
      lonn.total += LONNSTREKK_SAK.amount;
      lonn.caseSet.add(LONNSTREKK_SAK.caseNo);
    } else {
      map.set(LONNSTREKK_SAK.creditor, {
        creditor: LONNSTREKK_SAK.creditor,
        total: LONNSTREKK_SAK.amount,
        paid: 0,
        cases: 1,
        casesPaid: 0,
        note: "Lønnstrekk via Namsfogden",
        target: "feb.",
        caseNos: [],
        kids: [],
        urgent: false,
        caseSet: new Set([LONNSTREKK_SAK.caseNo]),
        paidCases: new Set<string>(),
        kidSet: new Set<string>(),
      });
    }
    return [...map.values()]

      .map((c) => ({
        creditor: c.creditor,
        total: c.total,
        paid: c.paid,
        cases: c.caseSet.size,
        casesPaid: c.paidCases.size,
        note: c.note,
        target: c.target,
        urgent: c.urgent,
        caseNos: [...c.caseSet],
        kids: [...c.kidSet],
      }))
      .sort((a, b) => b.total - a.total);
  }, [extra, paid]);

  const buffer = useMemo(
    () =>
      MONTH_KEYS.map((k) => ({
        month: monthLabel(k),
        value: Math.round(monthResult(k, extra).resultat),
      })),
    [extra],
  );

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
      <main className="mx-auto max-w-2xl px-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
        {tab === "hjem" && (
          <HomeTab
            daysLeft={daysUntilFree()}
            remaining={Math.max(0, totalPlan - totalPaid)}
            paid={totalPaid}
            total={totalPlan}
            urgent={agenda.filter((i) => i.urgent && !paid.includes(i.id))}
            upcoming={agenda.filter((i) => !paid.includes(i.id) && !i.urgent).slice(0, 5)}
            reminders={reminders}
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

        {tab === "gjeld" && <GjeldTab chart={gjeldChart} creditors={creditors} />}

        {tab === "budsjett" && (
          <BudsjettTab
            months={MONTH_KEYS}
            current={current}
            onMonth={setCurrent}
            label={shortMonthLabel}
            longLabel={monthLabel(current)}
            meta={meta}
            faste={FASTE.map((f) => ({ name: f.name, amount: f.amount }))}
            engangs={engangsFor(current)}
            gjeld={res.gjeld}
            levepenger={leveBudget}
            onEdit={() => setSettingsOpen(true)}
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
        className="fixed right-5 top-[calc(1rem+env(safe-area-inset-top))] z-30 flex size-10 items-center justify-center rounded-full bg-card text-muted-foreground"
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
          className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-5 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
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
      />
    </div>
  );
}
