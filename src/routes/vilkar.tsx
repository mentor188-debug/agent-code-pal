import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/vilkar")({
  head: () => ({
    meta: [
      { title: "Vilkår for bruk – Betaling Tracker" },
      {
        name: "description",
        content:
          "Vilkår for bruk av Betaling Tracker: privat bruk, ingen finansiell rådgivning, ansvar for egne tall og regler for bankkobling.",
      },
      { property: "og:title", content: "Vilkår for bruk – Betaling Tracker" },
      {
        property: "og:description",
        content:
          "Betingelsene for å bruke appen til å følge egen nedbetalingsplan, budsjett og eventuell bankkobling.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Vilkar,
});

function Vilkar() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 text-foreground">
      <h1 className="text-2xl font-semibold">Vilkår for bruk</h1>
      <p className="mt-2 text-sm text-muted-foreground">Sist oppdatert: 15. august 2026</p>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-medium">1. Om tjenesten</h2>
        <p className="text-sm text-muted-foreground">
          Betaling Tracker er et privat verktøy for å holde oversikt over egen nedbetalingsplan,
          budsjett, levepenger og sparing. Tjenesten tilbys som den er, uten garanti for
          tilgjengelighet eller feilfri drift.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-medium">2. Ikke finansiell rådgivning</h2>
        <p className="text-sm text-muted-foreground">
          Innholdet i appen er kun oversikt og beregning basert på tallene du selv legger inn.
          Det utgjør ikke finansiell, juridisk eller regnskapsmessig rådgivning. Du er selv
          ansvarlig for at betalinger faktisk gjennomføres til rett tid og med riktig KID og
          kontonummer.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-medium">3. Ditt ansvar</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Du er ansvarlig for riktigheten av data du registrerer.</li>
          <li>Du er ansvarlig for å sikre enheten din, for eksempel med kodelås.</li>
          <li>Du må ikke bruke appen til ulovlige formål.</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-medium">4. Bankkobling</h2>
        <p className="text-sm text-muted-foreground">
          Kobling til bank skjer via Enable Banking under PSD2, og krever ditt eget samtykke hos
          banken. Tilgangen er kun lesetilgang; appen kan ikke initiere betalinger. Du kan trekke
          samtykket tilbake når som helst.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-medium">5. Data og sletting</h2>
        <p className="text-sm text-muted-foreground">
          Data lagres lokalt på enheten din, og i skyen dersom du aktiverer skylagring. Se
          {" "}
          <Link to="/personvern" className="underline">
            personvernerklæringen
          </Link>
          {" "}
          for detaljer om lagring og sletting.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-medium">6. Ansvarsbegrensning</h2>
        <p className="text-sm text-muted-foreground">
          Appen er ikke ansvarlig for tap som følge av forsinkede eller uteblitte betalinger,
          tapte data, eller feil i beregninger. Bruk skjer på eget ansvar.
        </p>
      </section>

      <Link to="/" className="mt-10 inline-block text-sm underline">
        Tilbake til appen
      </Link>
    </main>
  );
}
