import { Calendar, Coins, Home, Shield, ShoppingBasket, TrendingDown, Wallet } from "lucide-react";

export type TabKey =
  "hjem" | "kalender" | "gjeld" | "budsjett" | "levepenger" | "saldo" | "sparing";

const TABS: { key: TabKey; label: string; icon: typeof Home }[] = [
  { key: "hjem", label: "Hjem", icon: Home },
  { key: "kalender", label: "Kalender", icon: Calendar },
  { key: "gjeld", label: "Gjeld", icon: TrendingDown },
  { key: "budsjett", label: "Budsjett", icon: Wallet },
  { key: "levepenger", label: "Leve", icon: ShoppingBasket },
  { key: "saldo", label: "Igjen", icon: Coins },
  { key: "sparing", label: "Sparing", icon: Shield },
];

export function BottomNav({ value, onChange }: { value: TabKey; onChange: (t: TabKey) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto flex max-w-2xl">
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = key === value;
          return (
            <li key={key} className="flex-1">
              <button
                type="button"
                onClick={() => onChange(key)}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-14 w-full flex-col items-center justify-center gap-1 py-2 text-[10.5px] leading-none transition-colors active:opacity-70 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {active && (
                  <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-primary" />
                )}
                <Icon className="size-[1.35rem]" strokeWidth={active ? 2.4 : 1.8} />
                <span className="max-w-full truncate">{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
