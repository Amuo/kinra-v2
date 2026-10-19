import { t as tr, useLanguage, Message } from "@/lib/i18n";
import { useEffect, useRef, useState } from "react";
import { animate, motion, useReducedMotion } from "motion/react";
import { today } from "@/lib/stats";

/* ---------- prefs (UI-only, localStorage "strata:") ---------- */
export const isLighterToday = () =>
  typeof window !== "undefined" && localStorage.getItem("strata:lighter") === today();
export const roundPlate = (kg: number) => Math.round(kg / 2.5) * 2.5;
export const est1RM = (kg: number, reps: number) =>
  reps <= 1 ? kg : Math.round(kg * (1 + reps / 30));

export const restFor = (ex: string, fallback = 90) => {
  if (typeof window === "undefined") return fallback;
  const v = Number(localStorage.getItem(`strata:rest:${ex}`));
  return v >= 30 && v <= 600 ? v : fallback;
};
/** Learn: blend the observed rest into the stored value. */
export const learnRest = (ex: string, seconds: number) => {
  if (seconds < 20 || seconds > 600) return;
  const prev = restFor(ex);
  localStorage.setItem(`strata:rest:${ex}`, String(Math.round((prev * 2 + seconds) / 3 / 5) * 5));
};

/* ---------- haptics + sound ---------- */
export const haptic = {
  light: () => navigator.vibrate?.(10),
  medium: () => navigator.vibrate?.(20),
  success: () => navigator.vibrate?.([20, 40, 60]),
  error: () => navigator.vibrate?.([40, 30, 40]),
};

export const soundOn = () =>
  typeof window !== "undefined" && localStorage.getItem("strata:sound") === "1";
let ctx: AudioContext | null = null;
function tone(freq: number, dur: number, delay = 0, type: OscillatorType = "sine", gain = 0.12) {
  if (!soundOn()) return;
  ctx ??= new AudioContext();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = ctx.currentTime + delay;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}
export const sound = {
  tick: () => tone(1400, 0.05, 0, "square", 0.05),
  chime: () => (tone(880, 0.4), tone(1320, 0.5, 0.12)),
  pr: () => (
    tone(523, 0.18, 0, "triangle"),
    tone(659, 0.18, 0.1, "triangle"),
    tone(784, 0.18, 0.2, "triangle"),
    tone(1047, 0.6, 0.3, "triangle")
  ),
};

/* ---------- count up ---------- */
export function CountUp({
  to,
  decimals = 0,
  delay = 0,
  duration = 0.9,
  suffix,
}: {
  to: number;
  decimals?: number;
  delay?: number;
  duration?: number;
  suffix?: string;
}) {
  useLanguage();
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      el.textContent = to.toFixed(decimals);
      return;
    }
    const c = animate(0, to, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => (el.textContent = v.toFixed(decimals)),
    });
    return () => c.stop();
  }, [to, decimals, delay, duration, reduce]);
  return (
    <span className="num">
      <span ref={ref}>{(0).toFixed(decimals)}</span>
      {suffix && (
        <span className="ml-[0.15em] text-[0.55em] font-medium text-muted-foreground">
          {suffix}
        </span>
      )}
    </span>
  );
}

/* ---------- strata bands (signature motif) ---------- */
const BANDS = [
  "var(--volt)",
  "var(--pulse)",
  "var(--dream)",
  "var(--ember)",
  "var(--surface-3, var(--surface-2))",
];
export function StrataBands({ onDone }: { onDone?: () => void }) {
  useLanguage();
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-30 flex flex-col"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: reduce ? 0.1 : 0.55, duration: 0.2 }}
      onAnimationComplete={() => onDone?.()}
      aria-hidden
    >
      {BANDS.map((c, i) => (
        <motion.div
          key={i}
          className="flex-1 origin-left"
          style={{ background: c }}
          initial={reduce ? { opacity: 0 } : { x: i % 2 ? "100%" : "-100%" }}
          animate={reduce ? { opacity: 1 } : { x: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 38, delay: i * 0.04 }}
        />
      ))}
    </motion.div>
  );
}

/* ---------- PR moment ---------- */
export function PrMoment({
  exercise,
  kg,
  onDone,
}: {
  exercise: string;
  kg: number;
  onDone: () => void;
}) {
  useLanguage();
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    haptic.success();
    sound.pr();
    const t = setTimeout(onDone, 1300);
    const c = canvas.current;
    if (!c || reduce) return () => clearTimeout(t);
    const dpr = window.devicePixelRatio || 1;
    c.width = c.clientWidth * dpr;
    c.height = c.clientHeight * dpr;
    const g = c.getContext("2d")!;
    const volt =
      getComputedStyle(document.documentElement).getPropertyValue("--volt").trim() || "#c6ff3d";
    const cx = c.width / 2,
      cy = c.height * 0.45;
    const ps = Array.from({ length: 60 }, () => {
      const a = Math.random() * Math.PI * 2,
        s = (4 + Math.random() * 9) * dpr;
      return {
        x: cx,
        y: cy,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 3 * dpr,
        r: (2 + Math.random() * 3) * dpr,
      };
    });
    let raf = 0,
      f = 0;
    const tick = () => {
      f++;
      g.clearRect(0, 0, c.width, c.height);
      g.fillStyle = volt;
      g.globalAlpha = Math.max(0, 1 - f / 70);
      for (const p of ps) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25 * dpr;
        p.vx *= 0.98;
        g.beginPath();
        g.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        g.fill();
      }
      if (f < 70) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => (clearTimeout(t), cancelAnimationFrame(raf));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <motion.div
      className="absolute inset-0 z-40 grid place-items-center bg-background/85"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      role="status"
      aria-live="assertive"
      onClick={onDone}
    >
      <canvas ref={canvas} className="pointer-events-none absolute inset-0 size-full" />
      <div className="relative text-center">
        <motion.div
          className="font-display text-[64px] font-black leading-[0.9] tracking-[-0.03em] text-volt [font-stretch:125%]"
          initial={reduce ? { opacity: 0 } : { scale: 0.4, opacity: 0, rotate: -6 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
        >
          <Message source="NEW PR" />
        </motion.div>
        <div className="mt-3 text-label font-semibold text-muted-foreground">{exercise}</div>
        <div className="mt-1 text-display font-black">
          <CountUp to={kg} decimals={kg % 1 ? 1 : 0} duration={0.8} suffix="kg" />
        </div>
      </div>
    </motion.div>
  );
}

/* ---------- plate calculator ---------- */
const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const PLATE_STYLE: Record<number, { h: number; c: string }> = {
  25: { h: 92, c: "var(--ember)" },
  20: { h: 92, c: "var(--dream)" },
  15: { h: 80, c: "var(--volt)" },
  10: { h: 68, c: "var(--pulse)" },
  5: { h: 52, c: "var(--foreground)" },
  2.5: { h: 42, c: "var(--muted-foreground)" },
  1.25: { h: 34, c: "var(--muted-foreground)" },
};
export function platesFor(total: number, bar = 20) {
  let side = Math.max(0, (total - bar) / 2);
  const out: number[] = [];
  for (const p of PLATES)
    while (side >= p - 1e-6) {
      out.push(p);
      side -= p;
    }
  return { out, rest: +(side * 2).toFixed(2) };
}
export function Barbell({ kg, bar = 20 }: { kg: number; bar?: number }) {
  useLanguage();
  const { out } = platesFor(kg, bar);
  const reduce = useReducedMotion();
  const sides = [1, -1] as const;
  return (
    <svg
      viewBox="0 0 340 110"
      className="w-full"
      role="img"
      aria-label={tr("{p0} kg: {p1} kg bar plus {p2}", {
        p0: kg,
        p1: bar,
        p2: out.length ? out.join(", ") + " kg per side" : "no plates",
      })}
    >
      <rect
        x="4"
        y="51"
        width="332"
        height="8"
        rx="4"
        fill="var(--muted-foreground)"
        opacity="0.5"
      />
      <rect x="226" y="44" width="8" height="22" rx="3" fill="var(--muted-foreground)" />
      <rect x="106" y="44" width="8" height="22" rx="3" fill="var(--muted-foreground)" />
      {sides.map((dir) => {
        let x = dir === 1 ? 236 : 104;
        return out.map((p, i) => {
          const st = PLATE_STYLE[p]!;
          const w = p >= 10 ? 13 : 9;
          const px = dir === 1 ? x : x - w;
          x += dir * (w + 2);
          return (
            <motion.rect
              key={`${dir}-${p}-${i}-${kg}`}
              x={px}
              y={55 - st.h / 2}
              width={w}
              height={st.h}
              rx="3"
              fill={st.c}
              initial={reduce ? { opacity: 0 } : { x: dir * 90, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 38, delay: i * 0.05 }}
            />
          );
        });
      })}
    </svg>
  );
}

/* ---------- body map ---------- */
type Muscle =
  "chest" | "shoulders" | "arms" | "core" | "quads" | "back" | "glutes" | "hamstrings" | "calves";
const RULES: [RegExp, Muscle[]][] = [
  [/bench|press up|push|dip|fly|chest/i, ["chest", "shoulders", "arms"]],
  [/overhead|ohp|shoulder|lateral|military/i, ["shoulders", "arms"]],
  [/curl|tricep|extension|arm/i, ["arms"]],
  [/squat|lunge|leg press|split|step/i, ["quads", "glutes"]],
  [/deadlift|rdl|romanian|hinge|good morning/i, ["hamstrings", "glutes", "back"]],
  [/row|pull|chin|lat|pulldown/i, ["back", "arms"]],
  [/plank|core|ab|crunch|carry/i, ["core"]],
  [/calf|run|bike|row erg|jog/i, ["calves", "quads"]],
  [/hip thrust|bridge|glute/i, ["glutes", "hamstrings"]],
];
export function musclesFor(names: string[]) {
  const s = new Set<Muscle>();
  for (const n of names) for (const [re, m] of RULES) if (re.test(n)) m.forEach((x) => s.add(x));
  return s;
}
export function BodyMap({ exercises }: { exercises: string[] }) {
  useLanguage();
  const on = musclesFor(exercises);
  const reduce = useReducedMotion();
  const P = ({ m, d, delay = 0 }: { m: Muscle; d: string; delay?: number }) => (
    <motion.path
      d={d}
      fill={on.has(m) ? "var(--volt)" : "var(--surface-2)"}
      stroke="var(--border)"
      strokeWidth="1"
      initial={{ opacity: 0.3 }}
      animate={{ opacity: on.has(m) ? 1 : 0.7 }}
      transition={{ delay: reduce ? 0 : 0.6 + delay, duration: 0.32 }}
    />
  );
  const head = <circle cx="50" cy="14" r="9" fill="var(--surface-2)" stroke="var(--border)" />;
  return (
    <div
      className="grid grid-cols-2 gap-4"
      role="img"
      aria-label={tr("Muscles worked: {p0}", {
        p0: [...on].map((m) => tr(m)).join(", ") || tr("none recorded"),
      })}
    >
      {(["Front", "Back"] as const).map((side) => (
        <div key={side} className="text-center">
          <svg viewBox="0 0 100 200" className="mx-auto h-44">
            {head}
            <P m="shoulders" d="M28 28 Q50 22 72 28 L76 40 L24 40 Z" />
            {side === "Front" ? (
              <P m="chest" d="M28 40 H72 L70 62 H30 Z" delay={0.05} />
            ) : (
              <P m="back" d="M28 40 H72 L68 84 H32 Z" delay={0.05} />
            )}
            <P
              m="arms"
              d="M18 40 L27 40 L24 96 L14 94 Z M82 40 L73 40 L76 96 L86 94 Z"
              delay={0.1}
            />
            {side === "Front" ? (
              <P m="core" d="M31 63 H69 L66 96 H34 Z" delay={0.15} />
            ) : (
              <P m="glutes" d="M32 86 H68 L68 108 H32 Z" delay={0.15} />
            )}
            {side === "Front" ? (
              <P m="quads" d="M33 98 H49 L47 146 H35 Z M51 98 H67 L65 146 H53 Z" delay={0.2} />
            ) : (
              <P
                m="hamstrings"
                d="M33 110 H49 L47 146 H35 Z M51 110 H67 L65 146 H53 Z"
                delay={0.2}
              />
            )}
            <P m="calves" d="M36 150 H47 L46 188 H38 Z M53 150 H64 L62 188 H54 Z" delay={0.25} />
          </svg>
          <div className="eyebrow mt-1">{tr(side === "Back" ? "Back view" : side)}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- share card (1080×1920 canvas) ---------- */
export async function shareSession(d: {
  title: string;
  duration: string;
  volume: string;
  sets: number;
  prs: { ex: string; kg: number; reps: number }[];
}) {
  const c = document.createElement("canvas");
  c.width = 1080;
  c.height = 1920;
  const g = c.getContext("2d")!;
  const css = getComputedStyle(document.documentElement);
  const v = (n: string, f: string) => css.getPropertyValue(n).trim() || f;
  const bg = v("--background", "#15171b"),
    fg = v("--foreground", "#f4f4f5"),
    volt = v("--volt", "#c6ff3d"),
    mute = v("--muted-foreground", "#9aa0a6");
  g.fillStyle = bg;
  g.fillRect(0, 0, 1080, 1920);
  [volt, v("--pulse", "#5ad"), v("--dream", "#88f"), v("--ember", "#f84")].forEach((col, i) => {
    g.fillStyle = col;
    g.globalAlpha = 0.9 - i * 0.15;
    g.fillRect(0, 140 + i * 36, 1080 - i * 160, 24);
  });
  g.globalAlpha = 1;
  g.fillStyle = mute;
  g.font = "600 36px 'JetBrains Mono', monospace";
  g.fillText(tr("KINRA · SESSION COMPLETE"), 80, 400);
  g.fillStyle = fg;
  g.font = "900 104px Archivo, sans-serif";
  wrap(g, d.title, 80, 530, 920, 110);
  const stats: [string, string][] = [
    ["Duration", d.duration],
    ["Volume", d.volume],
    ["Sets", String(d.sets)],
    ["PRs", String(d.prs.length)],
  ];
  stats.forEach(([l, val], i) => {
    const x = 80 + (i % 2) * 470,
      y = 860 + Math.floor(i / 2) * 260;
    g.fillStyle = mute;
    g.font = "600 32px 'JetBrains Mono', monospace";
    g.fillText(tr(l).toUpperCase(), x, y);
    g.fillStyle = l === "PRs" && d.prs.length ? volt : fg;
    g.font = "800 110px 'JetBrains Mono', monospace";
    g.fillText(val, x, y + 120);
  });
  d.prs.slice(0, 3).forEach((p, i) => {
    g.fillStyle = volt;
    g.font = "700 44px Manrope, sans-serif";
    g.fillText(`PR  ${p.ex} · ${p.kg} kg × ${p.reps}`, 80, 1500 + i * 70);
  });
  g.fillStyle = mute;
  g.font = "600 32px Manrope, sans-serif";
  g.fillText(tr("Tracked with KINRA"), 80, 1820);
  const blob: Blob = await new Promise((r) => c.toBlob((b) => r(b!), "image/png"));
  const file = new File([blob], "kinra-session.png", { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: d.title });
      return "shared";
    } catch {
      /* cancelled → fall through to nothing */
      return "cancelled";
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "kinra-session.png";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return "downloaded";
}
function wrap(
  g: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  max: number,
  lh: number,
) {
  let line = "";
  for (const w of text.split(" ")) {
    const t = line ? `${line} ${w}` : w;
    if (g.measureText(t).width > max && line) {
      g.fillText(line, x, y);
      line = w;
      y += lh;
    } else line = t;
  }
  g.fillText(line, x, y);
}

/** Simple state hook for a boolean pref in localStorage. */
export function usePref(key: string) {
  const [v, setV] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(key) === "1",
  );
  return [
    v,
    (n: boolean) => (setV(n), n ? localStorage.setItem(key, "1") : localStorage.removeItem(key)),
  ] as const;
}
