import { useId } from "react";
import { useLanguage } from "@/lib/i18n";
import { bodyMuscleLabels, sessionMuscles, type BodyMuscle } from "@/lib/body-map";

// All authored paths use absolute x/y coordinate pairs. Keep contours aligned while
// broadening the figure and shortening the legs without flattening the head/torso.
const proportionPath = (path: string) => {
  let coordinate = 0;
  return path.replace(/-?\d*\.?\d+/g, (value) => {
    const original = Number(value);
    const adjusted =
      coordinate++ % 2 === 0
        ? 80 + (original - 70) * 1.15
        : original <= 150
          ? original
          : 150 + (original - 150) * 0.8;
    return String(Math.round(adjusted * 100) / 100);
  });
};

// Original schematic anatomy. Each side is mirrored around the centre line; no external artwork.
const silhouette =
  "M64 38 C59 36 57 29 57 20 C57 4 83 4 83 20 C83 29 81 36 76 38 L77 44 C84 47 94 47 101 54 C108 62 108 76 112 91 L119 123 L123 149 C125 156 128 164 125 169 C122 172 118 164 116 161 C116 169 112 169 111 164 L111 151 L105 127 L99 111 L94 86 C90 102 88 114 89 127 C89 139 96 149 96 162 C97 182 92 204 89 225 C88 233 92 246 88 264 L82 293 L83 303 C87 308 86 313 80 314 L73 313 L72 298 L75 273 C72 258 72 248 74 233 L71 205 L70 178 L69 205 L66 233 C68 248 68 258 65 273 L68 298 L67 313 L60 314 C54 313 53 308 57 303 L58 293 L52 264 C48 246 52 233 51 225 C48 204 43 182 44 162 C44 149 51 139 51 127 C52 114 50 102 46 86 L41 111 L35 127 L29 151 L29 164 C28 169 24 169 24 161 C22 164 18 172 15 169 C12 164 15 156 17 149 L21 123 L28 91 C32 76 32 62 39 54 C46 47 56 47 63 44 Z";
type Region = { muscle: BodyMuscle; d: string; mirror?: boolean };
const front: Region[] = [
  { muscle: "shoulders", d: "M45 53 C38 54 35 64 34 74 C38 77 43 75 47 69 L51 57 Z", mirror: true },
  { muscle: "chest", d: "M68 54 C61 50 53 51 47 58 L47 72 C52 81 62 82 68 76 Z", mirror: true },
  {
    muscle: "biceps",
    d: "M34 78 C39 80 43 78 44 75 C44 88 41 100 37 106 C32 109 29 103 30 97 Z",
    mirror: true,
  },
  {
    muscle: "forearms",
    d: "M29 109 C34 109 37 113 35 121 L27 148 L21 149 C22 133 25 119 29 109 Z",
    mirror: true,
  },
  {
    muscle: "abs",
    d: "M55 83 L64 86 L65 97 L54 95 Z M54 99 L65 101 L66 112 L53 110 Z M53 114 L66 116 L67 128 L54 125 Z M55 129 L67 132 L68 144 C62 142 58 137 55 129 Z",
    mirror: true,
  },
  {
    muscle: "abs",
    d: "M49 82 L52 85 L50 112 L54 134 L49 141 C45 125 48 111 47 101 Z",
    mirror: true,
  },
  { muscle: "abductors", d: "M49 144 C46 149 46 157 47 167 L53 160 L57 147 Z", mirror: true },
  {
    muscle: "quads",
    d: "M50 165 C47 179 50 199 54 218 C56 228 62 232 64 225 C66 212 62 191 60 176 L57 162 Z M61 171 L66 166 L68 195 L65 219 C61 209 61 191 61 171 Z",
    mirror: true,
  },
  {
    muscle: "adductors",
    d: "M59 149 L68 157 L68 180 L65 197 C61 181 60 166 59 149 Z",
    mirror: true,
  },
  { muscle: "shins", d: "M55 239 C54 254 59 277 61 291 L65 291 L62 261 L62 240 Z", mirror: true },
  { muscle: "calves", d: "M52 240 C50 249 53 263 56 269 L57 251 L56 240 Z", mirror: true },
];
const back: Region[] = [
  { muscle: "traps", d: "M64 44 L68 45 L68 98 C62 88 60 74 49 58 Z", mirror: true },
  { muscle: "shoulders", d: "M45 53 C37 56 35 64 34 74 C39 79 45 74 48 67 L51 58 Z", mirror: true },
  {
    muscle: "back",
    d: "M49 59 C54 59 61 63 68 66 L68 123 L56 137 C52 120 50 101 46 83 Z",
    mirror: true,
  },
  {
    muscle: "lats",
    d: "M46 84 C53 91 59 96 66 99 L65 120 L54 133 C51 116 49 104 46 84 Z",
    mirror: true,
  },
  {
    muscle: "erectors",
    d: "M65 104 L68 109 L68 145 L58 141 C63 130 65 118 65 104 Z",
    mirror: true,
  },
  {
    muscle: "triceps",
    d: "M34 79 C39 81 43 76 44 76 C44 87 42 103 36 108 C30 107 29 100 30 94 Z",
    mirror: true,
  },
  {
    muscle: "forearms",
    d: "M29 112 C33 109 37 113 35 120 L27 149 L21 148 C23 132 25 120 29 112 Z",
    mirror: true,
  },
  {
    muscle: "abductors",
    d: "M50 139 L56 144 L49 162 L46 165 C44 155 47 146 50 139 Z",
    mirror: true,
  },
  {
    muscle: "glutes",
    d: "M57 144 C60 146 65 147 68 148 L68 166 C65 178 51 180 48 170 C47 160 51 151 57 144 Z",
    mirror: true,
  },
  {
    muscle: "hamstrings",
    d: "M49 179 C54 184 60 181 64 178 L65 200 L63 228 C60 233 56 229 54 221 Z M66 179 L68 178 L68 202 L65 222 Z",
    mirror: true,
  },
  {
    muscle: "calves",
    d: "M54 240 C49 248 52 264 58 275 L61 265 C62 252 59 243 57 240 Z M60 240 C64 241 66 249 65 258 L63 273 L61 280 L60 268 C62 258 61 248 60 240 Z",
    mirror: true,
  },
];

export function BodyMap({ exercises }: { exercises: string[] }) {
  const { t } = useLanguage();
  const id = useId();
  const { primary, secondary, unmatched } = sessionMuscles(exercises);
  return (
    <figure aria-labelledby={id} className="space-y-4">
      <figcaption id={id} className="sr-only">
        {t("Muscles worked")}
      </figcaption>
      <div className="grid grid-cols-2 gap-3">
        {([front, back] as const).map((regions, index) => (
          <div key={index} className="min-w-0 text-center">
            <svg viewBox="0 0 160 290" className="mx-auto max-h-60 w-full" aria-hidden="true">
              <path
                d={proportionPath(silhouette)}
                fill="var(--surface-2)"
                stroke="var(--muted-foreground)"
                strokeOpacity=".55"
                strokeWidth=".8"
              />
              {regions.map(({ muscle, d, mirror }, region) => {
                const role = primary.has(muscle)
                  ? "primary"
                  : secondary.has(muscle)
                    ? "secondary"
                    : "inactive";
                return [false, ...(mirror ? [true] : [])].map((mirrored) => (
                  <path
                    key={`${region}-${mirrored}`}
                    d={proportionPath(d)}
                    transform={mirrored ? "translate(160 0) scale(-1 1)" : undefined}
                    data-muscle={muscle}
                    data-role={role}
                    fill={role === "inactive" ? "var(--muted-foreground)" : "var(--volt)"}
                    fillOpacity={role === "primary" ? 1 : role === "secondary" ? 0.42 : 0.12}
                    stroke="var(--background)"
                    strokeWidth="1"
                    strokeLinejoin="round"
                  />
                ));
              })}
              <path
                d={proportionPath(
                  index === 0
                    ? "M70 52 L70 79 M70 83 L70 143 M54 233 Q59 238 64 233 M76 233 Q81 238 86 233"
                    : "M70 47 L70 171 M56 284 L60 299 M84 284 L80 299",
                )}
                fill="none"
                stroke="var(--muted-foreground)"
                strokeOpacity=".3"
                strokeWidth=".7"
              />
            </svg>
            <p className="mt-2 text-label text-muted-foreground">
              {t(index === 0 ? "Front" : "Back view")}
            </p>
          </div>
        ))}
      </div>
      <div className="space-y-2 text-caption">
        {(
          [
            [primary, "Primary targets"],
            [secondary, "Supporting muscles"],
          ] as const
        ).map(
          ([muscles, label]) =>
            muscles.size > 0 && (
              <div key={label}>
                <p className="flex items-center gap-2 font-semibold">
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-full bg-volt"
                    style={{ opacity: label === "Primary targets" ? 1 : 0.42 }}
                  />
                  {t(label)}
                </p>
                <p className="mt-1 leading-relaxed text-muted-foreground">
                  {[...muscles].map((muscle) => t(bodyMuscleLabels[muscle])).join(" · ")}
                </p>
              </div>
            ),
        )}
        {primary.size + secondary.size === 0 && <p>{t("No muscle groups identified.")}</p>}
        <p className="leading-relaxed text-muted-foreground">
          {t("Estimated from the exercises in this session.")}
        </p>
        {unmatched.length > 0 && (
          <p className="leading-relaxed text-muted-foreground">
            {t("Some exercises could not be matched to the catalogue.")}
          </p>
        )}
      </div>
    </figure>
  );
}
