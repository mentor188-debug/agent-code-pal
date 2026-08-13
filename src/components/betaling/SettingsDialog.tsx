import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Settings } from "@/lib/betaling";
import { notificationPermission, requestNotificationPermission } from "@/lib/varsler";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: Settings;
  onSave: (s: Settings) => void;
};

export function SettingsDialog({ open, onOpenChange, settings, onSave }: Props) {
  const [draft, setDraft] = useState<Settings>(settings);
  const [pinEnabled, setPinEnabled] = useState(!!settings.pin);
  const [pinValue, setPinValue] = useState(settings.pin ?? "");

  useEffect(() => {
    if (open) {
      setDraft(settings);
      setPinEnabled(!!settings.pin);
      setPinValue(settings.pin ?? "");
    }
  }, [open, settings]);

  const num = (v: string) => Number(v.replace(",", ".")) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Innstillinger</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="goal">Sparemål (kr)</Label>
              <Input
                id="goal"
                inputMode="decimal"
                value={draft.savingsGoal ? String(draft.savingsGoal) : ""}
                onChange={(e) => setDraft({ ...draft, savingsGoal: num(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="saved">Spart så langt (kr)</Label>
              <Input
                id="saved"
                inputMode="decimal"
                value={draft.saved ? String(draft.saved) : ""}
                onChange={(e) => setDraft({ ...draft, saved: num(e.target.value) })}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Påminnelser før forfall</p>
                <p className="text-xs text-muted-foreground">
                  {permission === "denied"
                    ? "Varsler er blokkert i nettleseren"
                    : "Varsel når en betaling nærmer seg"}
                </p>
              </div>
              <Switch
                checked={draft.notify}
                disabled={permission === "unsupported" || permission === "denied"}
                onCheckedChange={async (v) => {
                  if (v) {
                    const res = await requestNotificationPermission();
                    setPermission(notificationPermission());
                    if (res !== "granted") return;
                  }
                  setDraft((d) => ({ ...d, notify: v }));
                }}
              />
            </div>
            <div className="mt-3 grid gap-2">
              <Label htmlFor="reminderDays">Varsle antall dager før forfall</Label>
              <Input
                id="reminderDays"
                inputMode="numeric"
                value={String(draft.reminderDays)}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    reminderDays: Math.min(31, Math.max(0, Math.round(num(e.target.value)))),
                  })
                }
              />
            </div>
          </div>

          <div className="rounded-xl border border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">PIN-lås</p>
                <p className="text-xs text-muted-foreground">4 siffer ved oppstart</p>
              </div>
              <Switch checked={pinEnabled} onCheckedChange={setPinEnabled} />
            </div>
            {pinEnabled && (
              <Input
                className="mt-3"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                value={pinValue}
                onChange={(e) => setPinValue(e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => {
              onSave({
                ...draft,
                pin: pinEnabled && pinValue.length === 4 ? pinValue : null,
              });
              onOpenChange(false);
            }}
          >
            Lagre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
