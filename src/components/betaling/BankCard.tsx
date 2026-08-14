import { useEffect, useState } from "react";
import { Building2, CheckCircle2, Loader2, RefreshCw, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  completeBankAuth,
  fetchBankBalances,
  fetchBankTransactions,
  listNorwegianBanks,
  startBankAuth,
} from "@/lib/bank.functions";
import { DEBTS, type Debt } from "@/lib/gjeldsplan";
import { loadPaid, savePaid } from "@/lib/betaling";
import { formatNOK } from "@/lib/betaling";
import {
  appendSyncLog,
  clearSyncLog,
  loadSyncLog,
  type SyncLogEntry,
} from "@/lib/banklogg";


type BankSession = {
  sessionId: string;
  bankName: string;
  accounts: { uid: string; iban?: string; name?: string; currency?: string }[];
  validUntil: string;
  connectedAt: string;
};

const STORAGE_KEY = "bt_bank_session_v1";
const CODE_KEY = "bank.auth.code";

function loadSession(): BankSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BankSession) : null;
  } catch {
    return null;
  }
}

function saveSession(s: BankSession | null) {
  if (typeof window === "undefined") return;
  if (s) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  else window.localStorage.removeItem(STORAGE_KEY);
}

type Tx = {
  amount: number;
  direction: "DBIT" | "CRDT";
  date?: string;
  text?: string;
  ref?: string;
};

type Match = {
  debtId: string;
  creditor: string;
  debtAmount: number;
  txAmount: number;
  txDate?: string;
  txText?: string;
  reason: "beløp" | "KID" | "navn";
};

/** Matcher transaksjoner mot gjeldsposter basert på beløp, KID eller navn. */
function matchTransactions(
  transactions: Tx[],
  debts: Debt[],
  alreadyPaid: string[],
): Match[] {
  const matches: Match[] = [];
  const taken = new Set<string>();
  for (const tx of transactions) {
    if (tx.direction !== "DBIT") continue; // kun utgående betalinger
    for (const debt of debts) {
      if (alreadyPaid.includes(debt.id) || taken.has(debt.id)) continue;
      const amountMatch = Math.abs(tx.amount - debt.amount) < 1;
      const kidMatch = Boolean(
        debt.kid && tx.ref && tx.ref.replace(/\s/g, "").includes(debt.kid),
      );
      const creditorMatch = Boolean(
        debt.creditor &&
          tx.text &&
          tx.text.toLowerCase().includes(debt.creditor.toLowerCase()),
      );
      if (!amountMatch && !kidMatch && !creditorMatch) continue;
      taken.add(debt.id);
      const match: Match = {
        debtId: debt.id,
        creditor: debt.creditor,
        debtAmount: debt.amount,
        txAmount: tx.amount,
        reason: kidMatch ? "KID" : amountMatch ? "beløp" : "navn",
      };
      if (tx.date) match.txDate = tx.date;
      if (tx.text) match.txText = tx.text;
      matches.push(match);
      break;
    }
  }
  return matches;
}


function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y!, m! - 1, 1));
  const last = new Date(Date.UTC(y!, m!, 0));
  return { from: first.toISOString().slice(0, 10), to: last.toISOString().slice(0, 10) };
}

export function BankCard({ month, monthLabel }: { month: string; monthLabel: string }) {
  const [session, setSession] = useState<BankSession | null>(null);
  const [banks, setBanks] = useState<{ name: string; logo?: string }[]>([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [loading, setLoading] = useState(false);
  const [banksLoaded, setBanksLoaded] = useState(false);
  const [balances, setBalances] = useState<
    Record<string, { name?: string; amount: string; currency: string }[]>
  >({});
  const [syncing, setSyncing] = useState(false);
  const [matchResult, setMatchResult] = useState<string | null>(null);
  const [pending, setPending] = useState<Match[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [txCount, setTxCount] = useState(0);
  const [log, setLog] = useState<SyncLogEntry[]>([]);
  const [showLog, setShowLog] = useState(false);

  useEffect(() => {
    setLog(loadSyncLog());
  }, []);


  // Last eksisterende sesjon
  useEffect(() => {
    setSession(loadSession());
  }, []);

  // Sjekk om vi kommer tilbake fra banken med en auth-kode
  useEffect(() => {
    if (typeof window === "undefined") return;
    const code = window.localStorage.getItem(CODE_KEY);
    if (!code) return;
    // Har kode → fullfør autentisering
    setLoading(true);
    window.localStorage.removeItem(CODE_KEY);
    (async () => {
      try {
        const result = await completeBankAuth({ data: { code } });
        const newSession: BankSession = {
          sessionId: result.session_id,
          bankName: selectedBank || "Bank",
          accounts: (result.accounts ?? []).map((a) => {
            const acc: BankSession["accounts"][number] = { uid: a.uid };
            if (a.account_id?.iban) acc.iban = a.account_id.iban;
            if (a.name) acc.name = a.name;
            if (a.currency) acc.currency = a.currency;
            return acc;
          }),
          validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          connectedAt: new Date().toISOString(),
        };
        saveSession(newSession);
        setSession(newSession);
        toast.success(`Bank koblet til – ${newSession.accounts.length} konto(er) funnet`);
      } catch (e) {
        toast.error("Kunne ikke fullføre bankkobling", {
          description: (e as Error).message,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Last bankliste ved første visning
  useEffect(() => {
    if (session || banksLoaded) return;
    (async () => {
      try {
        const result = await listNorwegianBanks();
        setBanks(
          result.map((b) => {
            const item: { name: string; logo?: string } = { name: b.name };
            if (b.logo) item.logo = b.logo;
            return item;
          }),
        );
        setBanksLoaded(true);
      } catch {
        /* skjult — prøv igjen ved klikk */
      }
    })();
  }, [session, banksLoaded]);

  const handleConnect = async () => {
    if (!selectedBank) {
      toast.error("Velg en bank først");
      return;
    }
    setLoading(true);
    try {
      // Enable Banking godtar kun registrerte redirect-URL-er.
      // Preview-domener er ikke registrert, så bruk alltid produksjons-URL-en.
      const REGISTERED_ORIGIN = "https://agent-code-pal.lovable.app";
      const origin =
        window.location.origin === REGISTERED_ORIGIN
          ? window.location.origin
          : REGISTERED_ORIGIN;
      const redirectUrl = `${origin}/bank/callback`;
      const state = crypto.randomUUID();
      window.localStorage.setItem("bank.auth.state", state);
      const result = await startBankAuth({
        data: { bankName: selectedBank, redirectUrl, state },
      });
      window.location.href = result.url;
    } catch (e) {
      toast.error("Kunne ikke starte bankkobling", {
        description: (e as Error).message,
      });
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    saveSession(null);
    setSession(null);
    setBalances({});
    setMatchResult(null);
    toast.info("Bankkobling fjernet");
  };

  const handleFetchBalances = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const newBalances: typeof balances = {};
      for (const acc of session.accounts) {
        const result = await fetchBankBalances({ data: { accountUid: acc.uid } });
        newBalances[acc.uid] = (result.balances ?? []).map((b) => {
          const item: { name?: string; amount: string; currency: string } = {
            amount: b.balance_amount.amount,
            currency: b.balance_amount.currency,
          };
          if (b.name) item.name = b.name;
          return item;
        });
      }
      setBalances(newBalances);
      toast.success("Saldo oppdatert");
    } catch (e) {
      toast.error("Kunne ikke hente saldo", { description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncTransactions = async () => {
    if (!session) return;
    setSyncing(true);
    setMatchResult(null);
    try {
      // Synk kun for måneden som er valgt i appen.
      const { from: dateFrom, to: dateTo } = monthRange(month);
      const allTx: {
        amount: number;
        direction: "DBIT" | "CRDT";
        date?: string;
        text?: string;
        ref?: string;
      }[] = [];
      for (const acc of session.accounts) {
        let continuationKey: string | null | undefined = undefined;
        let pages = 0;
        do {
          const result: Awaited<ReturnType<typeof fetchBankTransactions>> =
            await fetchBankTransactions({
              data: {
                accountUid: acc.uid,
                dateFrom,
                dateTo,
                ...(continuationKey ? { continuationKey } : {}),
              },
            });
          pages += 1;
          for (const tx of result.transactions ?? []) {
            const entry: {
              amount: number;
              direction: "DBIT" | "CRDT";
              date?: string;
              text?: string;
              ref?: string;
            } = {
              amount: parseFloat(tx.transaction_amount.amount),
              direction: tx.credit_debit_indicator,
            };
            if (tx.booking_date) entry.date = tx.booking_date;
            const text = [
              tx.creditor?.name,
              tx.debtor?.name,
              ...(tx.remittance_information ?? []),
            ]
              .filter(Boolean)
              .join(" ");
            if (text) entry.text = text;
            if (tx.reference_number) entry.ref = tx.reference_number;
            allTx.push(entry);
          }
          continuationKey = result.continuation_key;
        } while (continuationKey && pages < 20);
      }

      // Match mot gjeldsposter — vises til godkjenning før noe endres
      const alreadyPaid = loadPaid();
      const monthDebts = DEBTS.filter((d) => d.month === month);
      const matched = matchTransactions(allTx, monthDebts, alreadyPaid);
      setTxCount(allTx.length);
      if (matched.length > 0) {
        setPending(matched);
        setSelected(matched.map((m) => m.debtId));
        setMatchResult(
          `${matched.length} forslag klar til gjennomgang for ${monthLabel}`,
        );
      } else {
        setPending([]);
        setSelected([]);
        setMatchResult(`Ingen samsvarende betalinger funnet i ${monthLabel}`);
        setLog(
          appendSyncLog({
            at: new Date().toISOString(),
            month,
            txCount: allTx.length,
            foundCount: 0,
            appliedCount: 0,
            status: "tom",
          }),
        );
        toast.info("Ingen nye samsvarende betalinger funnet");
      }
    } catch (e) {
      const msg = (e as Error).message ?? "Ukjent feil";
      const expired = /401|403|invalid|expired|session/i.test(msg);
      toast.error("Synk feilet", {
        description: expired
          ? "Banksamtykket ser ut til å ha utløpt. Koble til banken på nytt."
          : msg,
      });
      setMatchResult(msg);
      setLog(
        appendSyncLog({
          at: new Date().toISOString(),
          month,
          txCount: 0,
          foundCount: 0,
          appliedCount: 0,
          status: "feil",
          note: msg.slice(0, 140),
        }),
      );
    } finally {
      setSyncing(false);
    }
  };

  const confirmSync = () => {
    const chosen = pending.filter((m) => selected.includes(m.debtId));
    if (chosen.length === 0) {
      toast.error("Velg minst én betaling, eller avbryt");
      return;
    }
    const updated = [...new Set([...loadPaid(), ...chosen.map((m) => m.debtId)])];
    savePaid(updated);
    setLog(
      appendSyncLog({
        at: new Date().toISOString(),
        month,
        txCount,
        foundCount: pending.length,
        appliedCount: chosen.length,
        status: "ok",
        note: chosen.map((m) => m.creditor).join(", ").slice(0, 140),
      }),
    );
    setPending([]);
    setSelected([]);
    setMatchResult(`${chosen.length} betaling(er) avhuket for ${monthLabel}`);
    toast.success(`${chosen.length} betaling(er) lagt inn`);
  };

  const cancelSync = () => {
    setLog(
      appendSyncLog({
        at: new Date().toISOString(),
        month,
        txCount,
        foundCount: pending.length,
        appliedCount: 0,
        status: "avbrutt",
      }),
    );
    setPending([]);
    setSelected([]);
    setMatchResult("Synk avbrutt – ingenting ble endret");
  };


  // Allerede koblet til
  if (session) {
    return (
      <div className="rounded-xl border border-border px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4 text-primary" />
              {session.bankName}
            </p>
            <p className="text-xs text-muted-foreground">
              {session.accounts.length} konto(er) ·{" "}
              {new Date(session.connectedAt).toLocaleDateString("nb-NO")}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDisconnect}
            disabled={loading || syncing}
          >
            <Unlink className="h-4 w-4" />
          </Button>
        </div>

        {/* Kontoer */}
        <div className="mt-3 space-y-1.5">
          {session.accounts.map((acc) => {
            const bal = balances[acc.uid]?.[0];
            return (
            <div
              key={acc.uid}
              className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs"
            >
              <span className="truncate text-muted-foreground">
                {acc.name || acc.iban || acc.uid.slice(0, 8)}
              </span>
              {bal?.amount && (
                <span className="font-medium">
                  {formatNOK(parseFloat(bal.amount))}
                </span>
              )}
            </div>
            );
          })}
        </div>

        {/* Sync-knapper */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={loading || syncing}
            onClick={handleFetchBalances}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Hent saldo"
            )}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={loading || syncing}
            onClick={handleSyncTransactions}
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="mr-1 h-3.5 w-3.5" /> Synk
              </>
            )}
          </Button>
        </div>

        <p className="mt-2 text-[11px] text-muted-foreground">
          Synk henter kun transaksjoner for {monthLabel} og huker av krav i den måneden.
        </p>

        {matchResult && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            {matchResult}
          </p>
        )}
      </div>
    );
  }

  // Ikke koblet til — vis bankvelger
  return (
    <div className="rounded-xl border border-border px-4 py-3">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Building2 className="h-4 w-4 text-muted-foreground" /> Bankkobling
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Koble til banken for automatisk avhuking av betalinger via Enable Banking
        (PSD2).
      </p>
      <select
        className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        value={selectedBank}
        onChange={(e) => setSelectedBank(e.target.value)}
        disabled={loading}
      >
        <option value="">
          {banksLoaded ? "Velg bank…" : "Laster banker…"}
        </option>
        {banks.map((b) => (
          <option key={b.name} value={b.name}>
            {b.name}
          </option>
        ))}
      </select>
      <Button
        className="mt-3 w-full"
        size="sm"
        disabled={loading || !selectedBank}
        onClick={handleConnect}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Koble til bank"
        )}
      </Button>
    </div>
  );
}
