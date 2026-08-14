import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/personvern")({
  head: () => ({
    meta: [
      { title: "Personvern – Betaling Tracker" },
      {
        name: "description",
        content:
          "Slik behandles data i Betaling Tracker: lagring på egen enhet, valgfri skylagring med innlogging, og bruk av bankdata via Enable Banking.",
      },
      { property: "og:title", content: "Personvern – Betaling Tracker" },
      {
        property: "og:description",
        content:
          "Oversikt over hvilke data appen lagrer, hvor de lagres, og hvordan bankkobling via Enable Banking brukes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Personvern,
});

function Personvern() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 text-foreground">
      <h1 className="text-2xl font-semibold">Personvernerklæring</h1>
      <p className="mt-2 text-sm text-muted-foreground">Sist oppdatert: 15. august 2026</p>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-medium">Hvem er ansvarlig</h2>
        <p className="text-sm text-muted-foreground">
          Betaling Tracker er en privat app for å holde oversikt over egen nedbetalingsplan,
          budsjett og levepenger. Appen brukes av én privatperson, som også er behandlingsansvarlig
          for opplysningene i den.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-medium">Hvilke data lagres</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Budsjettposter, inntekt, faste utgifter og engangsutgifter du selv legger inn.</li>
          <li>Nedbetalingsplan med kreditor, saksnummer, KID, kontonummer og beløp.</li>
          <li>Avhuking av betalte krav, levepenger-utgifter og sparemål.</li>
          <li>Ved innlogging: e-postadresse og bruker-ID fra påloggingstjenesten.</li>
          <li>Ved bankkobling: kontoinformasjon og transaksjoner du gir samtykke til å hente.</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-medium">Hvor lagres dataene</h2>
        <p className="text-sm text-muted-foreground">
          Som standard lagres alt lokalt i nettleseren på din egen enhet. Hvis du slår på
          skylagring og logger inn, lagres de samme dataene kryptert i transitt hos appens
          databaseleverandør, knyttet til din bruker-ID. Ingen andre brukere har tilgang til dine
          rader.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-medium">Bankkobling (Enable Banking)</h2>
        <p className="text-sm text-muted-foreground">
          Hvis du kobler til banken din, skjer det gjennom Enable Banking, en lisensiert
          tredjepart under PSD2. Du gir samtykke direkte hos banken din, og appen mottar kun
          lesetilgang til konto- og transaksjonsopplysninger for å kunne huke av betalinger
          automatisk. Appen kan ikke flytte penger. Samtykket varer maksimalt 90 dager og kan
          når som helst trekkes tilbake i banken din eller ved å fjerne koblingen i appen.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-medium">Deling</h2>
        <p className="text-sm text-muted-foreground">
          Dataene selges ikke og deles ikke med tredjeparter for markedsføring. De behandles kun
          av de tekniske leverandørene som kreves for å drifte appen (hosting, database og
          eventuelt Enable Banking ved bankkobling).
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-medium">Sletting</h2>
        <p className="text-sm text-muted-foreground">
          Du kan når som helst slette lokale data ved å tømme nettleserdata, og skylagrede data
          ved å slette dem i appens innstillinger. Bankkoblingen slettes når samtykket utløper
          eller trekkes tilbake.
        </p>
      </section>

      <Link to="/" className="mt-10 inline-block text-sm underline">
        Tilbake til appen
      </Link>
    </main>
  );
}
