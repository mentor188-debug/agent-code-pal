import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export const Route = createFileRoute("/bank/callback")({
  head: () => ({
    meta: [
      { title: "Bankkobling fullført – Betaling Tracker" },
      {
        name: "description",
        content:
          "Returside etter samtykke i nettbanken. Her bekreftes at bankkoblingen mot Betaling Tracker er opprettet.",
      },
      { property: "og:title", content: "Bankkobling – Betaling Tracker" },
      {
        property: "og:description",
        content: "Bekreftelse på samtykke til lesetilgang for automatisk avhuking av betalinger.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BankCallback,
});

type State =
  | { kind: "loading" }
  | { kind: "ok"; code: string }
  | { kind: "error"; message: string };

function BankCallback() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error") ?? params.get("error_description");
    const code = params.get("code") ?? params.get("auth_code");
    if (error) {
      setState({ kind: "error", message: error });
      return;
    }
    if (!code) {
      setState({ kind: "error", message: "Mangler autorisasjonskode fra banken." });
      return;
    }
    try {
      window.localStorage.setItem("bank.auth.code", code);
    } catch {
      /* lagring kan være blokkert */
    }
    setState({ kind: "ok", code });
    // Auto-redirect tilbake til appen etter 2 sekunder
    setTimeout(() => navigate({ to: "/" }), 2000);
  }, [navigate]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center text-foreground">
      {state.kind === "loading" && (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <h1 className="mt-4 text-lg font-medium">Fullfører bankkobling…</h1>
        </>
      )}

      {state.kind === "ok" && (
        <>
          <CheckCircle2 className="h-10 w-10 text-primary" />
          <h1 className="mt-4 text-xl font-semibold">Bankkobling godkjent</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Samtykket er registrert. Du sendes tilbake til appen automatisk…
          </p>
        </>
      )}

      {state.kind === "error" && (
        <>
          <XCircle className="h-10 w-10 text-destructive" />
          <h1 className="mt-4 text-xl font-semibold">Koblingen ble avbrutt</h1>
          <p className="mt-2 text-sm text-muted-foreground">{state.message}</p>
        </>
      )}

      <Link
        to="/"
        className="mt-8 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
      >
        Tilbake til appen
      </Link>
    </main>
  );
}
