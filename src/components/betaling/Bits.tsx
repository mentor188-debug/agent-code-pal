import type { ReactNode } from "react";
import { initials } from "@/lib/dager";

export function Avatar({ name, tone = "green" }: { name: string; tone?: "green" | "red" }) {
  return (
    <span
      className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${
        tone === "red" ? "bg-destructive/20 text-destructive" : "bg-primary/15 text-primary"
      }`}
    >
      {initials(name)}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-4 ${className}`}>{children}</div>
  );
}

export function SectionTitle({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 px-1 text-base font-semibold tracking-tight">
      {icon}
      {children}
    </h2>
  );
}

export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="truncate px-1 pr-14 text-[1.75rem] font-bold leading-tight tracking-tight sm:text-3xl">
      {children}
    </h1>
  );
}

export function KvalitetBadge({ level, text }: { level: "gronn" | "gul" | "rod"; text?: string }) {
  const map = {
    gronn: { cls: "bg-primary/15 text-primary", label: "Verifisert" },
    gul: { cls: "bg-chart-4/20 text-chart-4", label: "Estimat" },
    rod: { cls: "bg-destructive/20 text-destructive", label: "Må avklares" },
  } as const;
  const m = map[level];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${m.cls}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {text ?? m.label}
    </span>
  );
}

export function MonthChips({
  months,
  value,
  onChange,
  label,
}: {
  months: string[];
  value: string;
  onChange: (m: string) => void;
  label: (m: string) => string;
}) {
  return (
    <div className="-mx-5 flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth px-5 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {months.map((m) => (
        <button
          key={m}
          type="button"
          ref={(el) => {
            if (el && m === value) el.scrollIntoView({ block: "nearest", inline: "center" });
          }}
          onClick={() => onChange(m)}
          className={`min-h-11 shrink-0 snap-center rounded-full px-5 py-2 text-sm font-medium capitalize transition-colors active:scale-95 ${
            m === value
              ? "bg-primary text-primary-foreground"
              : "border border-border text-muted-foreground"
          }`}
        >
          {label(m)}
        </button>
      ))}
    </div>
  );
}
