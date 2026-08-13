import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "betaling-install-prompt-dismissed";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    setIsIOS(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // iOS Safari does not fire beforeinstallprompt; show a gentle tip instead.
    if (ios && !("standalone" in window.navigator && (window.navigator as any).standalone)) {
      setVisible(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    const promptEvent = deferredPrompt as any;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  if (!visible) return null;

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4">
      <div className="mx-auto flex max-w-2xl items-start gap-3">
        <Download className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium">Legg Betaling Tracker på hjemskjermen</p>
          <p className="text-xs text-muted-foreground">
            {isIOS
              ? "Trykk del-knappen i Safari og velg «Legg til på Hjem-skjermen»."
              : "Installer appen for rask tilgang og offline bruk."}
          </p>
          {!isIOS && deferredPrompt && (
            <Button size="sm" className="mt-2" onClick={install}>
              Installer nå
            </Button>
          )}
        </div>
        <Button variant="ghost" size="icon" aria-label="Lukk" onClick={dismiss}>
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
