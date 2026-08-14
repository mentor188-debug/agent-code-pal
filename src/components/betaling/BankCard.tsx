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

/** Matcher transaksjoner mot gjeldsposter basert på beløp eller KID. */
function matchTransactions(
  transactions: {
    amount: number;
    direction: "DBIT" | "CRDT";
    date?: string;
    text?: string;
    ref?: string;
  }[],
  debts: Debt[],
  alreadyPaid: string[],
): string[] {
  const matched = new Set<string>();
  for (const tx of transactions) {
    if (tx.direction !== "DBIT") continue; // kun utgående betalinger
    for (const debt of debts) {
      if (alreadyPaid.includes(debt.id) || matched.has(debt.id)) continue;
      const amountMatch = Math.abs(tx.amount - debt.amount) < 1;
      const kidMatch =
        debt.kid && tx.ref && tx.ref.replace(/\s/g, "").includes(debt.kid);
      const creditorMatch =
        debt.creditor &&
        tx.text &&
        tx.text.toLowerCase().includes(debt.creditor.toLowerCase());
      if (amountMatch || kidMatch || creditorMatch) {
        matched.add(debt.id);
        break;
      }
    }
  }
  return [...matched];
}

export function BankCard() {
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
          accounts: (result.accounts ?? []).map((a) => ({
            uid: a.uid,
            iban: a.account_id?.iban,
            name: a.name,
            currency: a.currency,
          })),
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
        setBanks(result.map((b) => ({ name: b.name, logo: b.logo })));
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
      const redirectUrl = `${window.location.origin}/bank/callback`;
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
        newBalances[acc.uid] = (result.balances ?? []).map((b) => ({
          name: b.name,
          amount: b.balance_amount.amount,
          currency: b.balance_amount.currency,
        }));
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
      const dateFrom = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      const dateTo = new Date().toISOString().slice(0, 10);
      const allTx: {
        amount: number;
        direction: "DBIT" | "CRDT";
        date?: string;
        text?: string;
        ref?: string;
      }[] = [];
      for (const acc of session.accounts) {
        let continuationKey: string | null | undefined = undefined;
        do {
          const result = await fetchBankTransactions({
            data: { accountUid: acc.uid, dateFrom, dateTo },
          });
          for (const tx of result.transactions ?? []) {
            allTx.push({
              amount: parseFloat(tx.transaction_amount.amount),
              direction: tx.credit_debit_indicator,
              date: tx.booking_date,
              text: [
                tx.creditor?.name,
                tx.debtor?.name,
                ...(tx.remittance_information ?? []),
              ]
                .filter(Boolean)
                .join(" "),
              ref: tx.reference_number,
            });
          }
          continuationKey = result.continuation_key;
        } while (continuationKey);
      }

      // Match mot gjeldsposter
      const alreadyPaid = loadPaid();
      const matched = matchTransactions(allTx, DEBTS, alreadyPaid);
      if (matched.length > 0) {
        const updated = [...new Set([...alreadyPaid, ...matched])];
        savePaid(updated);
        setMatchResult(
          `${matched.length} betaling(er) auto-avhuket fra banktransaksjoner`,
        );
        toast.success(`${matched.length} betaling(er) avhuket automatisk`);
      } else {
        setMatchResult("Ingen samsvarende betalinger funnet i perioden");
        toast.info("Ingen nye samsvarende betalinger funnet");
      }
    } catch (e) {
      toast.error("Synk feilet", { description: (e as Error).message });
    } finally {
      setSyncing(false);
    }
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
          {session.accounts.map((acc) => (
            <div
              key={acc.uid}
              className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs"
            >
              <span className="truncate text-muted-foreground">
                {acc.name || acc.iban || acc.uid.slice(0, 8)}
              </span>
              {balances[acc.uid]?.[0] && (
                <span className="font-medium">
                  {formatNOK(parseFloat(balances[acc.uid][0].amount))}
                </span>
              )}
            </div>
          ))}
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
