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
  return <h1 className="px-1 text-3xl font-bold tracking-tight">{children}</h1>;
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
    <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {months.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium capitalize transition-colors ${
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
