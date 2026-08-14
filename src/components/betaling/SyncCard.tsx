import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Cloud, CloudOff, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  applySnapshot,
  describeKey,
  isEmptySnapshot,
  loadSyncChoice,
  pullState,
  pushState,
  saveSyncChoice,
  snapshot,
  SYNC_ITEMS,
  type SyncKey,
} from "@/lib/sky";

export function SyncCard() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [choice, setChoice] = useState<SyncKey[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setChoice(loadSyncChoice());
  }, []);

  const toggleKey = (key: SyncKey, on: boolean) => {
    const next = on ? [...new Set([...choice, key])] : choice.filter((k) => k !== key);
    setChoice(next);
    saveSyncChoice(next);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Første synk etter innlogging: hent fra sky hvis den finnes, ellers last opp.
  useEffect(() => {
    const user = session?.user;
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const remote = await pullState(user.id);
        if (cancelled) return;
        if (remote && !isEmptySnapshot(remote.data)) {
          if (JSON.stringify(remote.data) !== JSON.stringify(snapshot())) {
            applySnapshot(remote.data);
            toast.success("Data hentet fra skyen");
            window.location.reload();
            return;
          }
          setLastSync(remote.updatedAt);
        } else {
          const at = await pushState(user.id);
          setLastSync(at);
        }
      } catch (e) {
        toast.error("Kunne ikke synkronisere", { description: (e as Error).message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  // Autolagring til skyen når noe endres lokalt.
  useEffect(() => {
    const user = session?.user;
    if (!user) return;
    let last = JSON.stringify(snapshot());
    const id = window.setInterval(async () => {
      const now = JSON.stringify(snapshot());
      if (now === last) return;
      last = now;
      try {
        const at = await pushState(user.id);
        setLastSync(at);
      } catch {
        /* prøver igjen ved neste endring */
      }
    }, 4000);
    return () => window.clearInterval(id);
  }, [session?.user?.id]);

  const withBusy = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return null;

  if (session?.user) {
    return (
      <div className="rounded-xl border border-border px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Cloud className="h-4 w-4 text-primary" /> Skylagring på
            </p>
            <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
            <p className="text-xs text-muted-foreground">
              {lastSync
                ? `Sist lagret ${new Date(lastSync).toLocaleString("nb-NO")}`
                : "Synkroniserer …"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() =>
              withBusy(async () => {
                await supabase.auth.signOut();
                toast.success("Logget ut (data blir liggende på denne enheten)");
              })
            }
          >
            Logg ut
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() =>
              withBusy(async () => {
                const at = await pushState(session.user.id);
                setLastSync(at);
                toast.success("Lagret til skyen");
              })
            }
          >
            Lagre nå
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() =>
              withBusy(async () => {
                const remote = await pullState(session.user.id);
                if (!remote) {
                  toast.info("Ingen data i skyen ennå");
                  return;
                }
                applySnapshot(remote.data);
                toast.success("Hentet fra skyen");
                window.location.reload();
              })
            }
          >
            Hent fra sky
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="mt-3 w-full text-left text-xs font-medium text-primary"
        >
          {showDetails
            ? "Skjul hva som synkes"
            : `Hva synkes? (${choice.length} av ${SYNC_ITEMS.length} deler)`}
        </button>

        {showDetails && (
          <div className="mt-2 space-y-1.5">
            {SYNC_ITEMS.map((item) => {
              const on = choice.includes(item.key);
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{item.label}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {item.hint} · {describeKey(item.key)}
                    </p>
                  </div>
                  <Switch
                    checked={on}
                    onCheckedChange={(v) => toggleKey(item.key, v)}
                    aria-label={item.label}
                  />
                </div>
              );
            })}
            <p className="pt-1 text-[11px] text-muted-foreground">
              Deler du slår av blir liggende kun på denne enheten.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border px-4 py-3">
      <p className="flex items-center gap-2 text-sm font-medium">
        <CloudOff className="h-4 w-4 text-muted-foreground" /> Skylagring av
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Logg inn for å lagre budsjett, betalinger og levepenger trygt – da mister du dem ikke om
        nettleseren tømmer data.
      </p>
      <div className="mt-3 grid gap-2">
        <div className="grid gap-1">
          <Label htmlFor="sync-email" className="text-xs">
            E-post
          </Label>
          <Input
            id="sync-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="sync-pass" className="text-xs">
            Passord
          </Label>
          <Input
            id="sync-pass"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            disabled={busy || !email || !password}
            onClick={() =>
              withBusy(async () => {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                toast.success("Logget inn");
              })
            }
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Logg inn"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={busy || !email || !password}
            onClick={() =>
              withBusy(async () => {
                const { error } = await supabase.auth.signUp({
                  email,
                  password,
                  options: { emailRedirectTo: window.location.origin },
                });
                if (error) throw error;
                toast.success("Konto opprettet – sjekk e-posten for bekreftelse");
              })
            }
          >
            Opprett konto
          </Button>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() =>
            withBusy(async () => {
              await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
            })
          }
        >
          Fortsett med Google
        </Button>
      </div>
    </div>
  );
}
