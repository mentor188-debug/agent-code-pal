import { Calendar, Home, ShoppingBasket, TrendingDown, Wallet } from "lucide-react";

export type TabKey = "hjem" | "kalender" | "gjeld" | "budsjett" | "levepenger";

const TABS: { key: TabKey; label: string; icon: typeof Home }[] = [
  { key: "hjem", label: "Hjem", icon: Home },
  { key: "kalender", label: "Kalender", icon: Calendar },
  { key: "gjeld", label: "Gjeld", icon: TrendingDown },
  { key: "budsjett", label: "Budsjett", icon: Wallet },
  { key: "levepenger", label: "Levepenger", icon: ShoppingBasket },
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
                className={`flex w-full flex-col items-center gap-1 py-2.5 text-[11px] transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
