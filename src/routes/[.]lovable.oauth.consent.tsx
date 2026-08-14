import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

type OAuthClient = { name?: string; client_id?: string; redirect_uri?: string };
type AuthorizationDetails = {
  client?: OAuthClient;
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};
type OAuthApi = {
  getAuthorizationDetails: (
    id: string,
  ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (
    id: string,
  ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  denyAuthorization: (
    id: string,
  ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
};

const oauthApi = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  component: Consent,
});

function Consent() {
  const { authorization_id } = Route.useSearch();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSignedIn(Boolean(data.session));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(Boolean(session));
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!signedIn || !authorization_id) return;
    let active = true;
    oauthApi()
      .getAuthorizationDetails(authorization_id)
      .then(({ data, error: err }) => {
        if (!active) return;
        if (err) {
          setError(err.message);
          return;
        }
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
      });
    return () => {
      active = false;
    };
  }, [signedIn, authorization_id]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const api = oauthApi();
    const { data, error: err } = approve
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("Ingen retur-URL fra autorisasjonsserveren.");
      return;
    }
    window.location.href = target;
  }

  async function signInEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) setError(err.message);
  }

  async function signUpEmail() {
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.href },
    });
    setBusy(false);
    if (err) setError(err.message);
    else setError("Sjekk e-posten din for å bekrefte kontoen, og kom tilbake hit.");
  }

  async function signInGoogle() {
    setBusy(true);
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.href,
    });
    if (result.error) {
      setBusy(false);
      setError(String(result.error));
      return;
    }
    if (result.redirected) return;
    setBusy(false);
  }

  if (!authorization_id) {
    return (
      <Shell>
        <p className="text-sm text-muted-foreground">
          Mangler <code>authorization_id</code> i lenken.
        </p>
      </Shell>
    );
  }

  if (signedIn === null) {
    return (
      <Shell>
        <p className="text-sm text-muted-foreground">Laster …</p>
      </Shell>
    );
  }

  if (!signedIn) {
    return (
      <Shell>
        <h1 className="text-xl font-semibold text-foreground">Logg inn for å koble til</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Du må være innlogget for å gi en app tilgang til betalingsplanen din.
        </p>
        <form onSubmit={signInEmail} className="mt-6 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-post"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passord"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            Logg inn
          </button>
          <button
            type="button"
            onClick={signUpEmail}
            disabled={busy}
            className="w-full rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground disabled:opacity-60"
          >
            Opprett konto
          </button>
          <button
            type="button"
            onClick={signInGoogle}
            disabled={busy}
            className="w-full rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground disabled:opacity-60"
          >
            Fortsett med Google
          </button>
        </form>
      </Shell>
    );
  }

  const clientName = details?.client?.name ?? "Appen";

  return (
    <Shell>
      <h1 className="text-xl font-semibold text-foreground">
        Koble {clientName} til Betaling Tracker
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Dette lar {clientName} bruke verktøyene i appen som deg – lese nedbetalingsplan, budsjett,
        krav og kreditorer.
      </p>
      {details?.client?.redirect_uri && (
        <p className="mt-2 break-all text-xs text-muted-foreground">
          Retur-URL: {details.client.redirect_uri}
        </p>
      )}
      {details?.scope && (
        <p className="mt-1 text-xs text-muted-foreground">Forespurt tilgang: {details.scope}</p>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Dette omgår ikke appens egne tilgangsregler.
      </p>
      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="mt-6 flex gap-2">
        <button
          disabled={busy}
          onClick={() => decide(true)}
          className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          Godkjenn
        </button>
        <button
          disabled={busy}
          onClick={() => decide(false)}
          className="flex-1 rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground disabled:opacity-60"
        >
          Avbryt
        </button>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">{children}</div>
    </main>
  );
}
