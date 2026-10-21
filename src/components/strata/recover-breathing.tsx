import { t as tr, useLanguage, Message } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, Pause, Play, RotateCcw, Wind, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { breathFrame, BREATH_SECONDS, BREATH_PHASES } from "@/lib/recover";

export function RecoverBreathing({ onClose }: { onClose: () => void }) {
  useLanguage();
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const frame = breathFrame(elapsed);
  useEffect(() => {
    if (paused || frame.done) return;
    let previous = Date.now();
    const timer = window.setInterval(() => {
      const now = Date.now();
      const delta = (now - previous) / 1000;
      previous = now;
      setElapsed((value) => Math.min(BREATH_SECONDS, value + delta));
    }, 100);
    return () => window.clearInterval(timer);
  }, [paused, frame.done]);
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/90" />
        <Dialog.Content className="fixed inset-y-0 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 flex-col overflow-y-auto bg-background px-5 pb-safe pt-5">
          <div className="flex items-center justify-between gap-3">
            <span className="eyebrow text-pulse">
              <Message source="Make room to recover" />
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-11 rounded-full"
              aria-label={tr("Close breathing")}
              onClick={onClose}
            >
              <X />
            </Button>
          </div>
          <Dialog.Title className="mt-4 font-display text-title-l font-extrabold">
            {frame.done ? tr("A little more space.") : tr("Find your rhythm.")}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-label text-muted-foreground">
            {frame.done
              ? tr("Eight rounds complete. Take the calm with you.")
              : tr("Box breathing · 4 seconds each phase · 8 rounds")}
          </Dialog.Description>
          <div className="relative my-auto flex min-h-80 items-center justify-center py-10">
            <div
              className="absolute size-64 max-w-full rounded-card border border-pulse/20"
              aria-hidden
            />
            <motion.div
              className="absolute size-56 max-w-full rounded-card border-2 border-pulse bg-pulse/5"
              aria-hidden
              initial={false}
              animate={{ scale: reduce || frame.done ? 1 : frame.phase < 2 ? 1 : 0.7 }}
              transition={{ duration: reduce ? 0 : frame.phase % 2 ? 0 : 4, ease: "easeInOut" }}
            />
            <div className="relative text-center">
              {frame.done ? (
                <Check className="mx-auto size-12 text-pulse" />
              ) : (
                <>
                  <div className="text-title font-bold text-pulse">
                    {paused ? tr("Paused") : tr(frame.name)}
                  </div>
                  <div className="num mt-3 text-display font-bold">
                    {frame.left}
                    <span className="ml-1 text-title text-muted-foreground">
                      <Message source="s" />
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="mb-6">
            <div className="flex flex-wrap justify-between gap-2 text-label">
              <span>
                <Message source="{p0}/ 8 rounds" values={{ p0: frame.rounds }} />
              </span>
              <span className="num text-muted-foreground">
                <Message
                  source="{p0}:{p1} remaining"
                  values={{
                    p0: Math.floor(frame.remaining / 60),
                    p1: String(frame.remaining % 60).padStart(2, "0"),
                  }}
                />
              </span>
            </div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-2">
              <motion.div
                className="h-full origin-left bg-pulse"
                initial={false}
                animate={{ scaleX: elapsed / BREATH_SECONDS }}
              />
            </div>
            <div className="mt-5 grid grid-cols-4 gap-1 text-center text-caption">
              {BREATH_PHASES.map((name, i) => (
                <span
                  key={i}
                  className={
                    !frame.done && frame.phase === i
                      ? "font-bold text-pulse"
                      : "text-muted-foreground"
                  }
                >
                  {tr(name)}
                </span>
              ))}
            </div>
          </div>
          <div className="mb-4 flex gap-3">
            <Button
              variant="glass"
              size="icon"
              className="size-14 shrink-0 rounded-full"
              aria-label={tr("Restart breathing")}
              onClick={() => {
                setElapsed(0);
                setPaused(true);
              }}
            >
              <RotateCcw />
            </Button>
            <Button
              variant="glass"
              className="h-14 flex-1 rounded-full text-body text-pulse"
              onClick={() => (frame.done ? onClose() : setPaused((value) => !value))}
            >
              {frame.done ? <Check /> : paused ? <Play /> : <Pause />}
              {frame.done ? tr("Done") : paused ? tr("Resume") : tr("Pause")}
            </Button>
          </div>
          <p className="mb-4 flex items-center justify-center gap-2 text-caption text-muted-foreground">
            <Wind className="size-4" />
            <Message source="Keep it comfortable. Stop if you feel dizzy." />
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
