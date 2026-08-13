import { AlertTriangle, BarChart3, CalendarDays, ChevronRight, Clock } from "lucide-react";
import { Avatar, Card, SectionTitle } from "@/components/betaling/Bits";
import { InstallPrompt } from "@/components/betaling/InstallPrompt";
import { ReminderBanner } from "@/components/betaling/ReminderBanner";
import { formatNOK } from "@/lib/betaling";
import type { AgendaItem } from "@/lib/dager";
import type { Reminder } from "@/lib/varsler";

export function HomeTab({
  daysLeft,
  remaining,
  paid,
  total,
  urgent,
  upcoming,
  reminders,
  onGo,
}: {
  daysLeft: number;
  remaining: number;
  paid: number;
  total: number;
  urgent: AgendaItem[];
  upcoming: AgendaItem[];
  reminders: Reminder[];
  onGo: (tab: "kalender" | "gjeld" | "budsjett") => void;
}) {
  const pct = total ? Math.min(100, (paid / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <header className="space-y-5">
        <div className="h-10" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Gjeldfri om
          </p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-6xl font-bold tabular-nums leading-none">{daysLeft}</span>
            <span className="text-2xl font-semibold">dager</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Måldato: februar 2027</p>
        </div>

        <div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Gjenstår</p>
              <p className="text-2xl font-bold tabular-nums">{formatNOK(remaining)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Nedbetalt</p>
              <p className="text-2xl font-bold tabular-nums text-primary">{formatNOK(paid)}</p>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {Math.round(pct)}% av {formatNOK(total)} nedbetalt
          </p>
        </div>
      </header>

      <InstallPrompt />

      <div className="space-y-3">
        <NavCard
          icon={<BarChart3 className="size-5 text-primary" />}
          title="Månedsoppsummering"
          sub="Se hva du har betalt ned og framgangen din"
          onClick={() => onGo("budsjett")}
        />
        <NavCard
          icon={<CalendarDays className="size-5 text-primary" />}
          title="Årsoversikt"
          sub="Hele året, gjeldsnedbetaling og renter betalt"
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
