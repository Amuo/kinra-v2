import { displayNumber } from "@/lib/i18n";
import { errorText } from "@/lib/i18n-errors";
import { t as tr, useLanguage, Message } from "@/lib/i18n";
import { useState, type ReactNode } from "react";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { IconScale, SaveButton, type ScaleOption } from "./ui";
import { useAct } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { MEALS, type FoodDraft } from "@/lib/fuel";
import { FoodBarcode } from "./food-barcode";
import {
  X,
  Dumbbell,
  Utensils,
  Moon,
  NotebookPen,
  Scale as ScaleIcon,
  ScanBarcode,
  Frown,
  Annoyed,
  Meh,
  Smile,
  Laugh,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Battery,
  Zap,
} from "lucide-react";

export const moodOptions: ScaleOption[] = [
  { icon: Frown, label: "Awful" },
  { icon: Annoyed, label: "Low" },
  { icon: Meh, label: "Okay" },
  { icon: Smile, label: "Good" },
  { icon: Laugh, label: "Great" },
];
export const energyOptions: ScaleOption[] = [
  { icon: Battery, label: "Drained" },
  { icon: BatteryLow, label: "Low" },
  { icon: BatteryMedium, label: "Steady" },
  { icon: BatteryFull, label: "High" },
  { icon: Zap, label: "Wired" },
];
export const sleepQualityOptions: ScaleOption[] = [
  { icon: Frown, label: "Terrible" },
  { icon: Annoyed, label: "Restless" },
  { icon: Meh, label: "Fair" },
  { icon: Smile, label: "Restful" },
  { icon: Laugh, label: "Deep" },
];

export function Sheet({
  open,
  onOpenChange,
  title,
  sub,
  children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  sub?: string;
  children: ReactNode;
}) {
  useLanguage();
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-h-[92dvh] max-w-md border-border bg-popover">
        <div className="pb-safe overflow-y-auto px-5 pt-2">
          <div className="flex items-start justify-between gap-3">
            <DrawerTitle className="min-w-0 flex-1 break-words font-display text-title font-extrabold min-[400px]:text-title-l">
              {title}
            </DrawerTitle>
            <Button
              type="button"
              variant="ghost"
              className="size-11 shrink-0 rounded-full p-0"
              aria-label={tr("Close")}
              onClick={() => onOpenChange(false)}
            >
              <X className="size-5" aria-hidden="true" />
            </Button>
          </div>
          <DrawerDescription className="mb-5 mt-1 text-label text-muted-foreground">
            {sub ?? " "}
          </DrawerDescription>
          {children}
          <div className="h-4" />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="mb-5 block">
    <div className="eyebrow mb-2">{label}</div>
    {children}
  </label>
);

type SheetProps = { open: boolean; onOpenChange: (o: boolean) => void };
const fail = (e: unknown) => {
  toast.error(errorText((e as Error).message));
  throw e;
};

const quickFoods = [
  { name: "Protein shake", calories: 160, protein: 30, carbs: 5, fat: 2 },
  { name: "Chicken & rice", calories: 620, protein: 48, carbs: 70, fat: 12 },
  { name: "Banana", calories: 105, protein: 1, carbs: 27, fat: 0 },
  { name: "3 eggs", calories: 215, protein: 18, carbs: 1, fat: 15 },
];

export function FoodSheet({
  open,
  onOpenChange,
  meal: initialMeal,
  date,
  initialFood,
}: SheetProps & { meal?: string | undefined; date?: string; initialFood?: FoodDraft }) {
  useLanguage();
  const [scanning, setScanning] = useState(false);
  const [meal, setMeal] = useState(initialFood?.meal ?? initialMeal ?? "Lunch");
  const [f, setF] = useState(
    initialFood
      ? {
          name: initialFood.name,
          calories: initialFood.calories,
          protein: initialFood.protein,
          carbs: initialFood.carbs,
          fat: initialFood.fat,
        }
      : { name: "", calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
  const save = useAct((api) =>
    api.insert("nutrition_logs", { meal, ...f, ...(date ? { log_date: date } : {}) }),
  );
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={tr("Log food")}
      sub={date ? tr("Meal for {p0}", { p0: date }) : tr("Your daily nutrition.")}
    >
      {scanning ? (
        <FoodBarcode
          onClose={() => setScanning(false)}
          onUse={(food) => {
            setF(food);
            setScanning(false);
          }}
        />
      ) : (
        <Button
          variant="glass"
          className="mb-5 h-12 w-full text-body"
          onClick={() => setScanning(true)}
        >
          <ScanBarcode />
          <Message source="Scan food barcode" />
        </Button>
      )}
      <div className="mb-5 grid grid-cols-2 gap-2">
        {MEALS.map((m) => (
          <Button
            variant="glass"
            key={m}
            aria-pressed={meal === m}
            onClick={() => setMeal(m)}
            className={`h-11 text-label ${meal === m ? "border-ember bg-ember/10 text-ember" : ""}`}
          >
            {tr(m)}
          </Button>
        ))}
      </div>
      <div className="mb-5 grid grid-cols-2 gap-2">
        {quickFoods.map((q) => (
          <motion.button
            key={tr(q.name)}
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => setF(q)}
            aria-pressed={f.name === q.name}
            className={`rounded-[14px] border p-3 text-left ${f.name === q.name ? "border-ember bg-ember/10" : "border-border bg-surface"}`}
          >
            <div className="text-label font-semibold">{q.name}</div>
            <div className="num text-caption text-muted-foreground">
              <Message
                source="{p0}kcal · {p1}g protein"
                values={{ p0: q.calories, p1: q.protein }}
              />
            </div>
          </motion.button>
        ))}
      </div>
      <Field label={tr("Food")}>
        <Input
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
          placeholder={tr("What did you eat?")}
          className="h-12 rounded-[14px] bg-surface text-body"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        {(["calories", "protein", "carbs", "fat"] as const).map((k) => (
          <Field key={k} label={k === "calories" ? tr("kcal") : tr("{p0} g", { p0: k })}>
            <Input
              type="number"
              inputMode="numeric"
              value={f[k]}
              onChange={(e) => setF({ ...f, [k]: +e.target.value })}
              className="num h-12 rounded-[14px] bg-surface text-center text-body"
            />
          </Field>
        ))}
      </div>
      <SaveButton
        disabled={!f.name}
        onSave={() => save.mutateAsync(undefined).catch(fail)}
        onDone={() => (
          toast.success(tr("Added to {p0}", { p0: tr(meal).toLowerCase() })),
          onOpenChange(false)
        )}
      >
        <Message source="Add to {p0}" values={{ p0: tr(meal) }} />
      </SaveButton>
    </Sheet>
  );
}

export function SleepSheet({ open, onOpenChange }: SheetProps) {
  useLanguage();
  const [hours, setHours] = useState(7.5);
  const [quality, setQuality] = useState(4);
  const save = useAct((api) => api.insert("sleep_logs", { hours, quality }));
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={tr("Log sleep")}
      sub={tr("Last night's recovery.")}
    >
      <div className="num mb-4 text-center text-display font-bold text-dream">
        {hours.toFixed(2).replace(/0$/, "").replace(/\.0$/, "")}
        <span className="text-title text-muted-foreground">
          {" "}
          <Message source="h" />
        </span>
      </div>
      <Slider
        aria-label={tr("Hours slept")}
        value={[hours]}
        min={3}
        max={12}
        step={0.25}
        onValueChange={(v) => setHours(v[0]!)}
        className="mb-8"
      />
      <div className="mb-6">
        <IconScale
          label={tr("Quality")}
          value={quality}
          onChange={setQuality}
          options={sleepQualityOptions}
          tone="text-dream"
        />
      </div>
      <SaveButton
        onSave={() => save.mutateAsync(undefined).catch(fail)}
        onDone={() => (toast.success(tr("Sleep logged")), onOpenChange(false))}
      >
        <Message source="Save sleep" />
      </SaveButton>
    </Sheet>
  );
}

export function JournalSheet({ open, onOpenChange }: SheetProps) {
  useLanguage();
  const [mood, setMood] = useState(4);
  const [energy, setEnergy] = useState(3);
  const [body, setBody] = useState("");
  const save = useAct((api) => api.insert("journal_entries", { mood, energy, body: body || null }));
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={tr("Check in")}
      sub={tr("How are you, really?")}
    >
      <div className="mb-5">
        <IconScale
          label={tr("Mood")}
          value={mood}
          onChange={setMood}
          options={moodOptions}
          tone="text-pulse"
        />
      </div>
      <div className="mb-5">
        <IconScale
          label={tr("Energy")}
          value={energy}
          onChange={setEnergy}
          options={energyOptions}
          tone="text-pulse"
        />
      </div>
      <Field label={tr("Journal")}>
        <Textarea
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={tr("Wins, stress, soreness, anything…")}
          className="rounded-[14px] bg-surface text-body"
        />
      </Field>
      <SaveButton
        onSave={() => save.mutateAsync(undefined).catch(fail)}
        onDone={() => (toast.success(tr("Check-in saved")), onOpenChange(false))}
      >
        <Message source="Save check-in" />
      </SaveButton>
    </Sheet>
  );
}

export function MetricSheet({ open, onOpenChange }: SheetProps) {
  useLanguage();
  const [weight, setWeight] = useState<number | "">("");
  const [bf, setBf] = useState<number | "">("");
  const save = useAct((api) =>
    api.insert("body_metrics", {
      weight: weight === "" ? null : weight,
      body_fat: bf === "" ? null : bf,
    }),
  );
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={tr("Weigh-in")}
      sub={tr("Same time, same conditions, every time.")}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label={tr("Weight · kg")}>
          <Input
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value === "" ? "" : +e.target.value)}
            className="num h-16 rounded-[14px] bg-surface text-center text-title"
          />
        </Field>
        <Field label={tr("Body fat · %")}>
          <Input
            type="number"
            inputMode="decimal"
            value={bf}
            onChange={(e) => setBf(e.target.value === "" ? "" : +e.target.value)}
            className="num h-16 rounded-[14px] bg-surface text-center text-title"
          />
        </Field>
      </div>
      <SaveButton
        disabled={weight === ""}
        onSave={() => save.mutateAsync(undefined).catch(fail)}
        onDone={() => (toast.success(tr("Weigh-in saved")), onOpenChange(false))}
      >
        <Message source="Save weigh-in" />
      </SaveButton>
    </Sheet>
  );
}

export type LogKind = "workout" | "food" | "sleep" | "journal" | "metric";
export const logKinds: { kind: LogKind; label: string; icon: typeof Dumbbell; tone: string }[] = [
  { kind: "workout", label: "Workout", icon: Dumbbell, tone: "text-volt" },
  { kind: "food", label: "Food", icon: Utensils, tone: "text-ember" },
  { kind: "sleep", label: "Sleep", icon: Moon, tone: "text-dream" },
  { kind: "journal", label: "Check-in", icon: NotebookPen, tone: "text-pulse" },
  { kind: "metric", label: "Weigh-in", icon: ScaleIcon, tone: "text-foreground" },
];

export function LogSheets({
  kind,
  onClose,
  meal,
}: {
  kind: LogKind | null;
  onClose: () => void;
  meal?: string | undefined;
}) {
  useLanguage();
  const oc = (o: boolean) => !o && onClose();
  return (
    <>
      {kind === "food" && <FoodSheet open onOpenChange={oc} meal={meal} />}
      {kind === "sleep" && <SleepSheet open onOpenChange={oc} />}
      {kind === "journal" && <JournalSheet open onOpenChange={oc} />}
      {kind === "metric" && <MetricSheet open onOpenChange={oc} />}
    </>
  );
}
