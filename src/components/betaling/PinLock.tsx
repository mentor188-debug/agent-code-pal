import { useState } from "react";
import { Lock, Delete } from "lucide-react";

export function PinLock({ pin, onUnlock }: { pin: string; onUnlock: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const push = (d: string) => {
    if (value.length >= 4) return;
    const next = value + d;
    setValue(next);
    setError(false);
    if (next.length === 4) {
      if (next === pin) {
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => setValue(""), 400);
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-6">
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Lock className="size-6" />
        </div>
        <h1 className="text-lg font-semibold tracking-tight">Skriv inn PIN-kode</h1>
        <p className="text-sm text-muted-foreground">Betaling Tracker er låst</p>
      </div>

      <div className={`flex gap-4 ${error ? "animate-pulse" : ""}`}>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`size-4 rounded-full border ${
              error
                ? "border-destructive bg-destructive"
                : value.length > i
                  ? "border-primary bg-primary"
                  : "border-border"
            }`}
          />
        ))}
      </div>

      <div className="grid w-full max-w-xs grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            onClick={() => push(d)}
            className="h-16 rounded-2xl bg-card text-xl font-medium text-card-foreground transition-colors hover:bg-accent"
          >
            {d}
          </button>
        ))}
        <span />
        <button
          onClick={() => push("0")}
          className="h-16 rounded-2xl bg-card text-xl font-medium text-card-foreground transition-colors hover:bg-accent"
        >
          0
        </button>
        <button
          onClick={() => {
            setValue(value.slice(0, -1));
            setError(false);
          }}
          className="flex h-16 items-center justify-center rounded-2xl text-muted-foreground transition-colors hover:bg-accent"
          aria-label="Slett siste siffer"
        >
          <Delete className="size-5" />
        </button>
      </div>
    </div>
  );
}
