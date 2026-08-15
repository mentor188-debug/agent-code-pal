// Dokumentbasert datagrunnlag per 15.08.2026.
// Prinsipp: skill alltid mellom dokumentert saldo, bekreftet betaling,
// estimat og tidligere antakelse som må verifiseres.

export type Kvalitet = "dokumentert" | "estimat" | "maa_verifiseres";

export type Sak = {
  id: string;
  creditor: string;
  caseNo: string;
  description: string;
  /** Dokumentert eller sist registrert saldo. */
  documented: number;
  /** Dato saldoen er dokumentert (ISO). Tom = ukjent. */
  docDate: string;
  /** Nominell rente i prosent, null = ukjent. */
  rate: number | null;
  kid: string;
  account: string;
  quality: Kvalitet;
  /** Juridisk frist / hastesak. */
  legal: boolean;
  /** Liten sak som kan lukke en kredittfilpost. */
  closesCreditFile: boolean;
  note: string;
};

export type BetalingStatus = "bekreftet" | "venter";

export type RegistrertBetaling = {
  id: string;
  date: string;
  amount: number;
  creditor: string;
  /** Hvilken sak beløpet er fordelt til. null = ikke fordelt. */
  sakId: string | null;
  source: "bank" | "manuell";
  status: BetalingStatus;
  note: string;
};

export type MerknadStatus = "verifisert" | "ikke_verifisert" | "slettet";

export type Merknad = {
  id: string;
  label: string;
  sakId: string | null;
  status: MerknadStatus;
  lastChecked: string | null;
};

export type Forpliktelse = {
  id: string;
  label: string;
  amount: number;
  /** aktiv = gjeldende dokument, arkiv = tidligere antakelse. */
  scope: "aktiv" | "arkiv";
  status: "maa_verifiseres" | "gjennomfort" | "ikke_gjennomfort" | "antakelse";
  note: string;
};

export type Abonnement = {
  id: string;
  name: string;
  amount: number;
  /** null = må klassifiseres. */
  klasse: "fast" | "valgfri" | "ikke_mitt" | null;
  note: string;
};

export type PendlingScenario = {
  id: string;
  name: string;
  kollektiv: number;
  kollektivNote: string;
  parkering: number;
  parkeringNote: string;
  kontordager: number;
  kmTurRetur: number;
  kwhPerKm: number;
  stromPris: number;
  bomPerDag: number;
};

export type PlanState = {
  version: 3;
  saker: Sak[];
  betalinger: RegistrertBetaling[];
  merknader: Merknad[];
  forpliktelser: Forpliktelse[];
  abonnement: Abonnement[];
  pendling: { valgt: string; scenarier: PendlingScenario[] };
  buffer: number;
  /** Sluttmåned for Resurs-avdrag (YYYY-MM). */
  resursSlutt: string;
  rentebuffer: number;
};

const K = { kid: "", account: "7014.05.01423" };

export const KREDINOR_BASELINE_DATE = "2026-06-30";

export const DEFAULT_SAKER: Sak[] = [
  {
    id: "kred-5140228",
    creditor: "Kredinor",
    caseNo: "5140228/23",
    description: "Morrow Bank",
    documented: 17118.18,
    docDate: KREDINOR_BASELINE_DATE,
    rate: 22,
    kid: "223051402282424",
    account: K.account,
    quality: "dokumentert",
    legal: false,
    closesCreditFile: false,
    note: "Baseline 30.06.2026",
  },
  {
    id: "kred-6661303",
    creditor: "Kredinor",
    caseNo: "6661303/22",
    description: "Kredinor Finans – hovedkrav",
    documented: 39299.44,
    docDate: KREDINOR_BASELINE_DATE,
    rate: 21,
    kid: "222066613032427",
    account: K.account,
    quality: "dokumentert",
    legal: false,
    closesCreditFile: false,
    note: "Var feilaktig utelatt fra gammel plan (antatt lønnstrekk). Nå aktiv.",
  },
  {
    id: "kred-6673459",
    creditor: "Kredinor",
    caseNo: "6673459/23",
    description: "Kredinor Finans",
    documented: 12711.75,
    docDate: KREDINOR_BASELINE_DATE,
    rate: 22,
    kid: "223066734592423",
    account: K.account,
    quality: "dokumentert",
    legal: false,
    closesCreditFile: false,
    note: "Baseline 30.06.2026",
  },
  {
    id: "kred-537376",
    creditor: "Kredinor",
    caseNo: "537376/23",
    description: "Bank Norwegian",
    documented: 14003.5,
    docDate: KREDINOR_BASELINE_DATE,
    rate: 20.49,
    kid: "223005373762426",
    account: K.account,
    quality: "dokumentert",
    legal: false,
    closesCreditFile: false,
    note: "Baseline 30.06.2026",
  },
  {
    id: "kred-1230095",
    creditor: "Kredinor",
    caseNo: "1230095/25",
    description: "Vegfinans",
    documented: 11680.19,
    docDate: KREDINOR_BASELINE_DATE,
    rate: 12.25,
    kid: "225012300952425",
    account: K.account,
    quality: "dokumentert",
    legal: false,
    closesCreditFile: false,
    note: "Baseline 30.06.2026",
  },
  {
    id: "lowell-samlet",
    creditor: "Lowell",
    caseNo: "19 saker",
    description: "Fortum m.fl. – samlet portefølje",
    documented: 32356,
    docDate: "2026-06-30",
    rate: null,
    kid: "hent i portal",
    account: "6318.05.20351",
    quality: "estimat",
    legal: false,
    closesCreditFile: true,
    note: "Tidligere registrert 19 saker. Saldo må hentes på nytt i portal.",
  },
  {
    id: "riverty-samlet",
    creditor: "Riverty",
    caseNo: "12 saker",
    description: "Onepark / APCOA m.fl.",
    documented: 21108,
    docDate: "2026-06-30",
    rate: null,
    kid: "hent i portal",
    account: "1503.08.25117",
    quality: "maa_verifiseres",
    legal: false,
    closesCreditFile: true,
    note: "Tidligere registrert. Nåværende saldo må verifiseres.",
  },
  {
    id: "sergel-r4rb4v",
    creditor: "Sergel",
    caseNo: "R4RB4V",
    description: "Fjellinjen – opprinnelig 18 023, kostnader 6 416,25, betalt 9 310",
    documented: 19241.75,
    docDate: "2026-08-01",
    rate: null,
    kid: "5900662859510593",
    account: "1638.03.56353",
    quality: "dokumentert",
    legal: false,
    closesCreditFile: false,
    note: "Avdragsplan viste 1 000 den 25.07 og 1 000 den 25.08 – ikke bekreftet betalt.",
  },
  {
    id: "payex-k2fjg6",
    creditor: "PayEx",
    caseNo: "K2FJG6",
    description: "Nemusklinikken",
    documented: 771.31,
    docDate: "2026-08-01",
    rate: null,
    kid: "590048894570859",
    account: "8101.07.46116",
    quality: "dokumentert",
    legal: false,
    closesCreditFile: true,
    note: "Skjermbilde PayEx",
  },
  {
    id: "payex-k2cysf",
    creditor: "PayEx",
    caseNo: "K2CYSF",
    description: "Fastlege Molander",
    documented: 718.69,
    docDate: "2026-08-01",
    rate: null,
    kid: "5900488898936597",
    account: "8101.07.46116",
    quality: "dokumentert",
    legal: false,
    closesCreditFile: true,
    note: "Skjermbilde PayEx",
  },
  {
    id: "payex-k2k3zd",
    creditor: "PayEx",
    caseNo: "K2K3ZD",
    description: "PayEx Sverige",
    documented: 655.23,
    docDate: "2026-08-01",
    rate: null,
    kid: "5900489052881591",
    account: "8101.07.46116",
    quality: "dokumentert",
    legal: false,
    closesCreditFile: true,
    note: "Skjermbilde PayEx",
  },
  {
    id: "payex-k2k34d",
    creditor: "PayEx",
    caseNo: "K2K34D",
    description: "PayEx Sverige",
    documented: 619.53,
    docDate: "2026-08-01",
    rate: null,
    kid: "5900489052075595",
    account: "8101.07.46116",
    quality: "dokumentert",
    legal: false,
    closesCreditFile: true,
    note: "Skjermbilde PayEx",
  },
  {
    id: "payex-k2lf0t",
    creditor: "PayEx",
    caseNo: "K2LF0T",
    description: "Norsk Arbeidshelse",
    documented: 1613.78,
    docDate: "2026-08-01",
    rate: null,
    kid: "5900489091365592",
    account: "8101.07.46116",
    quality: "dokumentert",
    legal: false,
    closesCreditFile: true,
    note: "Skjermbilde PayEx. Upcoming 300 + 500 den 16.07 – ikke bekreftet gjennomført.",
  },
  {
    id: "skyfitness-collectio",
    creditor: "Sky Fitness / Collectio",
    caseNo: "Collectio",
    description: "Utleggstrekk endret til 4 717,65",
    documented: 4717.65,
    docDate: "2026-08-01",
    rate: null,
    kid: "hent i portal",
    account: "hent i portal",
    quality: "maa_verifiseres",
    legal: true,
    closesCreditFile: true,
    note: "Namsmannsbrev: første/siste trekkdato 01.08.2026. Må verifiseres om trekket er gjennomført eller om manuelt oppgjør gjenstår.",
  },
  {
    id: "svea-11634015",
    creditor: "Svea",
    caseNo: "11634015",
    description: "Göteborg parkering",
    documented: 921.55,
    docDate: "2026-06-30",
    rate: 12,
    kid: "51116340152",
    account: "6401.06.90607",
    quality: "dokumentert",
    legal: false,
    closesCreditFile: true,
    note: "Dokumentert 30.06.2026",
  },
  {
    id: "intrum-45299827",
    creditor: "Intrum",
    caseNo: "45299827",
    description: "Viking Redningstjeneste",
    documented: 152.29,
    docDate: "2026-08-01",
    rate: null,
    kid: "0045299827217",
    account: "7016.05.01217",
    quality: "dokumentert",
    legal: false,
    closesCreditFile: true,
    note: "Skjermbilde Intrum",
  },
  {
    id: "fair-ukjent",
    creditor: "Fair Collection",
    caseNo: "må kobles",
    description: "Betaling registrert – sak/saldo må kobles",
    documented: 0,
    docDate: "",
    rate: null,
    kid: "hent i portal",
    account: "1506.13.56735",
    quality: "maa_verifiseres",
    legal: false,
    closesCreditFile: false,
    note: "Bekreftet bankbetaling 1 311,87 den 13.08.2026, men saldo/sak er ikke dokumentert.",
  },
];

export const DEFAULT_BETALINGER: RegistrertBetaling[] = [
  {
    id: "bet-kredinor-0715",
    date: "2026-07-15",
    amount: 6000,
    creditor: "Kredinor",
    sakId: null,
    source: "bank",
    status: "bekreftet",
    note: "Historikk – ikke del av august-budsjettet. Fordel til sak når portal viser hvor den gikk.",
  },
  {
    id: "bet-kredinor-0813",
    date: "2026-08-13",
    amount: 6000,
    creditor: "Kredinor",
    sakId: null,
    source: "bank",
    status: "bekreftet",
    note: "Fordel til sak når portal/KID bekrefter hvilken.",
  },
  {
    id: "bet-lowell-0813",
    date: "2026-08-13",
    amount: 1060.65,
    creditor: "Lowell",
    sakId: "lowell-samlet",
    source: "bank",
    status: "bekreftet",
    note: "Bekreftet bankbetaling",
  },
  {
    id: "bet-fair-0813",
    date: "2026-08-13",
    amount: 1311.87,
    creditor: "Fair Collection",
    sakId: "fair-ukjent",
    source: "bank",
    status: "bekreftet",
    note: "Bekreftet bankbetaling – sak må kobles",
  },
  {
    id: "bet-mobil-0814",
    date: "2026-08-14",
    amount: 3500,
    creditor: "Ukjent (mobilbetaling med KID)",
    sakId: null,
    source: "bank",
    status: "venter",
    note: "Reservert 14.08.2026. Venter på bokføring og identifisering av kreditor/KID. Ingen gjeld markeres betalt før dette.",
  },
];

export const DEFAULT_MERKNADER: Merknad[] = Array.from({ length: 14 }, (_, i) => ({
  id: `merknad-${i + 1}`,
  label: `Betalingsanmerkning ${i + 1} (tidligere registrert)`,
  sakId: null,
  status: "ikke_verifisert" as MerknadStatus,
  lastChecked: null,
}));

export const DEFAULT_FORPLIKTELSER: Forpliktelse[] = [
  {
    id: "forp-collectio",
    label: "Utleggstrekk Sky Fitness / Collectio",
    amount: 4717.65,
    scope: "aktiv",
    status: "maa_verifiseres",
    note: "Namsmannsbrev: endret trekk, første/siste trekkdato 01.08.2026. Trekkes ikke fra inntekt før det er bekreftet gjennomført.",
  },
  {
    id: "forp-arkiv-aug",
    label: "Utleggstrekk august 12 400",
    amount: 12400,
    scope: "arkiv",
    status: "antakelse",
    note: "Tidligere antakelse – ikke bekreftet. Ble ikke trukket fra lønn.",
  },
  {
    id: "forp-arkiv-sep",
    label: "Utleggstrekk september 8 947",
    amount: 8947,
    scope: "arkiv",
    status: "antakelse",
    note: "Tidligere antakelse – ikke bekreftet.",
  },
];

export const DEFAULT_ABONNEMENT: Abonnement[] = [
  { id: "ab-talkmore-1", name: "Talkmore (trekk 1, 14.08)", amount: 634.27, klasse: null, note: "3 trekk samme dag – er alle dine?" },
  { id: "ab-talkmore-2", name: "Talkmore (trekk 2, 14.08)", amount: 558.58, klasse: null, note: "3 trekk samme dag – er alle dine?" },
  { id: "ab-talkmore-3", name: "Talkmore (trekk 3, 14.08)", amount: 522.2, klasse: null, note: "3 trekk samme dag – er alle dine?" },
  { id: "ab-netflix", name: "Netflix", amount: 219, klasse: null, note: "Observert juli" },
  { id: "ab-prime", name: "Prime Video", amount: 79, klasse: null, note: "Observert tidligere" },
  { id: "ab-tv2", name: "TV 2", amount: 0, klasse: null, note: "Variable trekk observert – legg inn beløp" },
  { id: "ab-chatgpt", name: "ChatGPT", amount: 0, klasse: null, note: "Legg inn beløp hvis fast" },
  { id: "ab-apple", name: "Apple / Microsoft og små digitale kjøp", amount: 0, klasse: null, note: "Klassifiser før det tas inn som fast kost" },
];

export const DEFAULT_PENDLING: PlanState["pendling"] = {
  valgt: "vestby",
  scenarier: [
    {
      id: "vestby",
      name: "Vestby stasjon",
      kollektiv: 2198,
      kollektivNote: "Ruter 30 dager voksen, alle soner / 3+ soner. Verifiser i Ruter/Vy reiseplanlegger.",
      parkering: 100,
      parkeringNote:
        "Bane NOR pendlerparkering 100 kr/30 dager (250 kr BYPRIS). Vestby-siden viser ikke kategorien eksplisitt – verifiser i Bane NOR Parkering. Dagparkering er 40 kr/døgn, 224 plasser.",
      kontordager: 15,
      kmTurRetur: 20,
      kwhPerKm: 0.2,
      stromPris: 1.5,
      bomPerDag: 0,
    },
    {
      id: "ski",
      name: "Ski stasjon (gammel base)",
      kollektiv: 1556,
      kollektivNote: "Ruter 2 soner 30 dager",
      parkering: 250,
      parkeringNote: "Ski pendlerparkering",
      kontordager: 15,
      kmTurRetur: 20,
      kwhPerKm: 0.2,
      stromPris: 1.5,
      bomPerDag: 0,
    },
  ],
};

export function pendlingTotal(s: PendlingScenario) {
  const strom = s.kontordager * s.kmTurRetur * s.kwhPerKm * s.stromPris;
  const bom = s.kontordager * s.bomPerDag;
  return {
    kollektiv: s.kollektiv,
    parkering: s.parkering,
    basis: s.kollektiv + s.parkering,
    strom,
    bom,
    total: s.kollektiv + s.parkering + strom + bom,
  };
}

export function defaultPlanState(): PlanState {
  return {
    version: 3,
    saker: DEFAULT_SAKER.map((s) => ({ ...s })),
    betalinger: DEFAULT_BETALINGER.map((b) => ({ ...b })),
    merknader: DEFAULT_MERKNADER.map((m) => ({ ...m })),
    forpliktelser: DEFAULT_FORPLIKTELSER.map((f) => ({ ...f })),
    abonnement: DEFAULT_ABONNEMENT.map((a) => ({ ...a })),
    pendling: {
      valgt: DEFAULT_PENDLING.valgt,
      scenarier: DEFAULT_PENDLING.scenarier.map((s) => ({ ...s })),
    },
    buffer: 2500,
    resursSlutt: "2026-12",
    rentebuffer: 3,
  };
}
