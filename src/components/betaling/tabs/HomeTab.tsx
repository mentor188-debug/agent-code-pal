import { AlertTriangle, BarChart3, CalendarDays, ChevronRight, Clock, X } from "lucide-react";
import { Avatar, Card, KvalitetBadge, SectionTitle } from "@/components/betaling/Bits";
import { InstallPrompt } from "@/components/betaling/InstallPrompt";
import { ReminderBanner } from "@/components/betaling/ReminderBanner";
import { formatNOK } from "@/lib/betaling";
import type { AgendaItem } from "@/lib/dager";
import type { Reminder } from "@/lib/varsler";
import type { Datakvalitet, Forecast } from "@/lib/gjeld/motor";
import type { Sak } from "@/lib/gjeld/model";

export function HomeTab({
  estimertGjeld,
  dokumentert,
  bekreftetBetalt,
  ufordelt,
  kvalitet,
  forecastData,
  monthName,
  neste,
  buffer,
  urgent,
  upcoming,
  reminders,
  planOppdatert,
  onDismissUpdate,
  onGo,
}: {
  estimertGjeld: number;
  dokumentert: number;
  bekreftetBetalt: number;
  ufordelt: number;
  kvalitet: Datakvalitet;
  forecastData: Forecast;
  monthName: (key: string | null) => string;
  neste: { sak: Sak; estimert: number; forslag: number; grunn: string } | null;
  buffer: { tilGjeld: number; buffer: number; pendling: number };
  urgent: AgendaItem[];
  upcoming: AgendaItem[];
  reminders: Reminder[];
  planOppdatert: boolean;
  onDismissUpdate: () => void;
  onGo: (tab: "kalender" | "gjeld" | "budsjett") => void;
}) {
  const dokPct = dokumentert ? Math.round((bekreftetBetalt / dokumentert) * 100) : 0;

  return (
    <div className="space-y-5">
      <header className="space-y-4">
        <div className="h-10" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Gjeldfri – forecast
          </p>
          <p className="mt-1 text-3xl font-bold leading-tight">
            {monthName(forecastData.realistisk)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tidligst {monthName(forecastData.tidligst)} · konservativt{" "}
            {monthName(forecastData.konservativ)}
          </p>
        </div>
      </header>

      {planOppdatert && (
        <Card className="border-primary/40 bg-primary/5">
          <div className="flex items-start gap-3">
            <p className="flex-1 text-sm">
              <span className="font-semibold">Planen er oppdatert.</span> Nytt datagrunnlag per
              15.08.2026: Kredinor-baseline, sak 6661303/22 er tatt inn, og utleggstrekk er skilt ut
              som egen forpliktelse. Gå gjennom nye og korrigerte poster i Gjeld.
            </p>
            <button
              type="button"
              aria-label="Lukk melding"
              onClick={onDismissUpdate}
              className="text-muted-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Estimert gjeld</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{formatNOK(estimertGjeld)}</p>
          <div className="mt-2">
            <KvalitetBadge level={kvalitet} />
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Dokumentert vs estimert</p>
          <p className="mt-1 text-lg font-bold tabular-nums">{formatNOK(dokumentert)}</p>
          <p className="text-xs text-muted-foreground">dokumentert saldo</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-primary">
            −{formatNOK(bekreftetBetalt)}
          </p>
          <p className="text-xs text-muted-foreground">
            bekreftet betalt{ufordelt > 0 ? ` (${formatNOK(ufordelt)} ufordelt)` : ""} · {dokPct} %
          </p>
        </Card>

        <Card className="col-span-2 p-4">
          <p className="text-xs text-muted-foreground">Neste beste betaling</p>
          {neste ? (
            <>
              <p className="mt-1 font-bold">
                {neste.sak.creditor} · {neste.sak.caseNo}
              </p>
              <p className="text-xs text-muted-foreground">{neste.grunn}</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-primary">
                {formatNOK(neste.forslag)}
              </p>
              <p className="text-xs text-muted-foreground">
                av estimert {formatNOK(neste.estimert)}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Ingen åpne saker med estimert saldo.</p>
          )}
        </Card>

        <Card className="col-span-2 p-4">
          <p className="text-xs text-muted-foreground">Buffer etter alt</p>
          <p
            className={`mt-1 text-2xl font-bold tabular-nums ${
              buffer.tilGjeld < 0 ? "text-destructive" : ""
            }`}
          >
            {formatNOK(buffer.tilGjeld)}
          </p>
          <p className="text-xs text-muted-foreground">
            disponibelt til gjeld etter faste utgifter, pendling ({formatNOK(buffer.pendling)}),
            levepenger og reservert buffer ({formatNOK(buffer.buffer)})
          </p>
        </Card>
      </div>

      <ReminderBanner reminders={reminders} onOpen={() => onGo("kalender")} />

      <InstallPrompt />

      <div className="space-y-3">
        <NavCard
          icon={<BarChart3 className="size-5 text-primary" />}
          title="Budsjett og pendling"
          sub="Faste utgifter, pendlerscenario og abonnement som må klassifiseres"
          onClick={() => onGo("budsjett")}
        />
        <NavCard
          icon={<CalendarDays className="size-5 text-primary" />}
          title="Gjeld og kredittfil"
          sub="Saldo per sak, bekreftede betalinger og anmerkninger"
          onClick={() => onGo("gjeld")}
        />
      </div>

      {urgent.length > 0 && (
        <section className="space-y-3">
          <SectionTitle icon={<AlertTriangle className="size-4 text-destructive" />}>
            <span className="text-destructive">Haster</span>
          </SectionTitle>
          {urgent.map((i) => (
            <Card key={i.id} className="border-destructive/35">
              <div className="flex items-center gap-3">
                <Avatar name={i.name} tone="red" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{i.name}</p>
                  <p className="text-xs text-muted-foreground">Forfall {i.day}. i måneden</p>
                </div>
                <span className="shrink-0 font-semibold tabular-nums text-destructive">
                  {formatNOK(i.amount)}
                </span>
              </div>
            </Card>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <SectionTitle icon={<Clock className="size-4 text-primary" />}>
          Kommende betalinger
        </SectionTitle>
        {upcoming.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Ingen betalinger igjen denne måneden.
          </p>
        )}
        {upcoming.map((i) => (
          <Card key={i.id}>
            <div className="flex items-center gap-3">
              <Avatar name={i.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{i.name}</p>
                <p className="text-xs text-muted-foreground">
                  {i.kind} · forfall {i.day}.
                </p>
              </div>
              <span className="shrink-0 font-semibold tabular-nums">{formatNOK(i.amount)}</span>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}

function NavCard({
  icon,
  title,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left"
    >
      <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{sub}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
    </button>
  );
}
