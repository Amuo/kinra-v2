import { useEffect, useState } from "react";
import { Droplets } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/strata/ui";
import { clampWater } from "@/lib/fuel";
import { cn } from "@/lib/utils";

export function FuelWater({ date, owner }: { date: string; owner: string }) {
  const key = `strata:water:${owner}:${date}`;
  const [water, setWater] = useState(0);
  useEffect(() => {
    try {
      setWater(
        clampWater(
          Number(localStorage.getItem(key) ?? localStorage.getItem(`strata-water-${date}`) ?? 0),
        ),
      );
    } catch {
      setWater(0);
    }
  }, [key, date]);
  const update = (value: number) => {
    setWater(value);
    try {
      localStorage.setItem(key, String(value));
    } catch {
      /* Water remains usable for this visit. */
    }
  };
  return (
    <section aria-label="Water tracking">
      <SectionTitle
        action={
          <span className="num text-label text-pulse">
            {(water * 0.25).toFixed(2).replace(/0$/, "")}{" "}
            <span className="text-caption text-muted-foreground">/ 2.0 L</span>
          </span>
        }
      >
        Water
      </SectionTitle>
      <div className="flex items-center gap-2 text-caption text-muted-foreground">
        <Droplets className="size-4 text-pulse" />
        <span>250 ml per glass</span>
      </div>
      <div
        className="mt-3 grid grid-cols-4 gap-2"
        role="group"
        aria-label="Water, eight glasses of 250 millilitres"
      >
        {Array.from({ length: 8 }, (_, i) => (
          <Button
            key={i}
            variant="ghost"
            aria-label={`${i + 1} glass${i ? "es" : ""}, ${(i + 1) * 250} ml`}
            aria-pressed={i < water}
            onClick={() => update(i + 1 === water ? i : i + 1)}
            className={cn(
              "h-16 rounded-tile border border-border bg-surface",
              i < water && "border-pulse/30 bg-pulse/5",
            )}
          >
            <span className="relative block h-9 w-7 overflow-hidden rounded-b-lg border-2 border-muted-foreground/50 border-t-0">
              <motion.span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-7 origin-bottom bg-pulse/60"
                initial={false}
                animate={{ scaleY: i < water ? 1 : 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 38 }}
              />
              <span className="num relative flex h-full items-center justify-center text-caption">
                {i + 1}
              </span>
            </span>
          </Button>
        ))}
      </div>
    </section>
  );
}
