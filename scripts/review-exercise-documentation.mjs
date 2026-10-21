/** Rebuild reviewed anatomy annotations from the local, private review export.
 * Usage: node scripts/review-exercise-documentation.mjs <sections.json>
 * Source prose stays outside the repository; only reviewed metadata is emitted.
 */
import fs from "node:fs";
import crypto from "node:crypto";
const source = process.argv[2];
if (!source) throw new Error("Supply the locally preserved sections.json review export");
const sections = JSON.parse(fs.readFileSync(source, "utf8"));
const catalogue = JSON.parse(fs.readFileSync("src/data/exercises.json", "utf8"));
const guidance = JSON.parse(fs.readFileSync("src/data/exercise-guidance.json", "utf8"));
const id = (number) => catalogue.find((e) => Number(e.id.split("-")[1]) === number)?.id;
// Human-reviewed semantic decisions. A missing exact string match never publishes a row.
const aliases = {
  "Barbell Bench Press": 60,
  "Incline Barbell Bench Press": 330,
  "Decline Barbell Bench Press": 189,
  "Dumbbell Fly": 219,
  "Chest Dip": 206,
  "Landmine Chest Press": 375,
  "Svend Press": 686,
  "Plate Press": 476,
  "Around The World": 217,
  "Hex Press": 237,
  "Arched Back Bench Press": 60,
  "Explosive Push Up": 478,
  "OVERHEAD PRESS": 446,
  "BARBELL ROW": 62,
  "HIP THRUST": 44,
  LUNGES: 45,
  "BULLGARIAN SPLIT SQUAT": 94,
  "LANDMINE ROW": 719,
};
const excluded = {
  "Machine Chest Press":
    "Umbrella label: existing narrow- and wide-grip machine presses already cover this movement; no unique implementation described.",
  "Hammer Strength Chest Press":
    "Brand label without a distinct machine configuration; existing machine presses cover the described movement.",
  "Guillotine Press":
    "Neck-directed loaded press excluded from general self-guided additions; source lacks an appropriate reviewed teaching progression.",
};
const additions = JSON.parse(fs.readFileSync("src/data/exercise-additions.json", "utf8"));
const newByHeading = Object.fromEntries(
  additions.flatMap((e) => e.sourceHeadings.map((heading) => [heading, e.id])),
);
const decisions = sections
  .filter((s) => !s.exactIds.length)
  .map((s) => {
    const target = id(aliases[s.name]) ?? newByHeading[s.name];
    if (!target && !excluded[s.name]) throw new Error(`Unreviewed heading: ${s.name}`);
    return {
      file: s.file,
      number: Number(s.number),
      heading: s.name,
      decision: excluded[s.name] ? "excluded" : aliases[s.name] ? "alias" : "new variation",
      targetId: target ?? null,
      reason:
        excluded[s.name] ??
        (aliases[s.name]
          ? "Same apparatus and movement already represented; retain the existing identity."
          : "Distinct apparatus, support, range, catch or loading pattern; independently authored guide."),
    };
  });
// Coarse, useful existing UI groups. Tissues, systems, recovery claims and vague
// stabilizers are deliberately not inferred to be target muscles.
const groups = [
  [/pector|chest|prsa|grudi/i, "Prsa"],
  [/quadricep|vastus|rectus femoris|\bvmo\b/i, "Kvadricepsi"],
  [/hamstring|biceps femoris|semitend|semimembr/i, "Zadnja loža"],
  [/glute/i, "Gluteusi"],
  [/adduct|groin|gracilis|pectineus/i, "Aduktori kuka"],
  [/abduct|tensor fascia|\btfl\b/i, "Abduktori kuka"],
  [/hip.*rotat|rotat.*hip|piriformis|obturator|rotatori kuka/i, "Rotatori kuka"],
  [/hip flex|iliopsoas|fleksori kuka/i, "Fleksori kuka"],
  [/latissimus|širi leđni|teres major/i, "Širi leđni"],
  [/rhomboid|upper back|peri-scapular|scapular stabil|leđa$/i, "Leđa"],
  [
    /erector|lumbar extensor|lower back|donja leđa|thoracic extensor|t-spine extensor/i,
    "Donja leđa (erektori)",
  ],
  [/trapez/i, "Trapezi"],
  [/deltoid|ramena|rame|shoulder stabil|shoulder girdle/i, "Ramena"],
  [
    /rotator cuff|rotatorna|infraspin|supraspin|subscap|teres minor|shoulder external rot|^external rotators/i,
    "Rotatorna manžetna",
  ],
  [/serratus|nazubljeni/i, "Prednji nazubljeni mišić"],
  [/tricep|anconeus/i, "Tricepsi"],
  [/bicep|brachialis|brahialis/i, "Bicepsi"],
  [/forearm|wrist|grip|finger flex|brachioradial|podlaktic/i, "Podlaktice"],
  [/gastrocnem|soleus|calves|listovi|plantar flexor/i, "Listovi"],
  [/perone/i, "Peronealni mišići"],
  [/tibialis posterior|zadnji tibijalis/i, "Zadnji tibijalis"],
  [/tibialis anterior|prednji tibijalis/i, "Prednji tibijalis"],
  [/foot|toe flex|toe ext|lumbrical|stopala/i, "Mišići stopala"],
  [/core|abdomin|oblique|quadratus lumborum|trbuh|trbušni/i, "Trbuh"],
  [/multifidus|deep spinal|thoracic rotator/i, "Multifidus"],
  [/pelvic floor|karlično dno/i, "Karlično dno"],
  [/diaphragm|dijafragma|respirator/i, "Dijafragma"],
  [/intercostal|međurebar/i, "Međurebarni mišići"],
  [/cervical|capitis|colli|scalene|splenius|suboccip|\bscm\b|hyoid|vrat|levator scap/i, "Vrat"],
];
const normalizeMuscle = (value) => groups.find(([pattern]) => pattern.test(value))?.[1];
function roles(s) {
  const result = { primary: [], secondary: [], stabilizers: [] };
  let role;
  for (let line of s.text.split("\n")) {
    line = line.trim();
    if (/^(Primarni(?: mišići)?|Dominantni mišići|Primarna zona)(?:\s|:|$)/i.test(line))
      role = "primary";
    else if (/^(Sekundarni(?: mišići)?|Sekundarna zona)(?:\s|:|$)/i.test(line)) role = "secondary";
    else if (/^Stabilizatori/i.test(line)) role = "stabilizers";
    else if (role && /^[•–-]/.test(line)) {
      const muscle = normalizeMuscle(line.replace(/^[•–-]+\s*/, ""));
      if (muscle) result[role].push(muscle);
    } else if (line) role = undefined;
  }
  return Object.fromEntries(
    Object.entries(result).map(([key, value]) => [key, [...new Set(value)]]),
  );
}
const annotations = {};
// The chest document repeats an identical template across fifty movements. Its
// role claims are ignored; the richer isolation text takes precedence instead.
const ordered = [...sections].sort((a, b) => priority(a.file) - priority(b.file));
function priority(file) {
  return file.startsWith("50_vjezbi")
    ? -1
    : file.startsWith("Izolacijske")
      ? 3
      : file.startsWith("SLOZENE")
        ? 4
        : 1;
}
for (const s of ordered) {
  if (s.file.startsWith("50_vjezbi")) continue;
  const role = roles(s);
  if (!role.primary.length) continue;
  const ids = s.exactIds.length
    ? s.exactIds
    : [id(aliases[s.name]) ?? newByHeading[s.name]].filter(Boolean);
  for (const target of ids)
    annotations[target] = { ...role, evidence: { file: s.file, number: Number(s.number) } };
}
for (const e of [...catalogue, ...additions]) {
  const meta = guidance[e.id] ?? e.guidance;
  const reviewed = annotations[e.id];
  const primary = reviewed?.primary ?? [...new Set(e.muscles.map(normalizeMuscle).filter(Boolean))];
  const secondary = (reviewed?.secondary ?? []).filter((m) => !primary.includes(m));
  const stabilizers = (reviewed?.stabilizers ?? []).filter(
    (m) => !primary.includes(m) && !secondary.includes(m),
  );
  const mobility = /mobility|stretch|breathing|balance/.test(meta.family);
  const conditioning =
    /cardio|running|cycling|swimming|walking|rowing/.test(meta.family) || e.category === "Kardio";
  const recovery =
    ["Oporavak", "Istezanje"].includes(e.category) || /thermal|protocol/.test(meta.family);
  const isolation = [
    "curl",
    "triceps",
    "fly",
    "raise",
    "reversefly",
    "calf",
    "legcurl",
    "legextension",
    "shrug",
    "wrist",
    "hipabduction",
    "hipadduction",
    "kickback",
    "pullover",
  ].includes(meta.family);
  annotations[e.id] = {
    primary,
    secondary,
    stabilizers,
    ...(reviewed?.evidence ? { evidence: reviewed.evidence } : {}),
    mechanics: meta.clinical
      ? "clinical"
      : mobility || recovery
        ? "mobility"
        : conditioning
          ? "conditioning"
          : isolation
            ? "isolation"
            : "compound",
    laterality: /single.arm|single.leg|one.arm|one.leg|unilateral|suitcase|split squat/i.test(
      e.name,
    )
      ? "unilateral"
      : /lunge|alternat|walking/i.test(e.name)
        ? "alternating"
        : /clinical|breathing|thermal|protocol/.test(meta.family)
          ? "not-applicable"
          : "bilateral",
    purpose: meta.clinical
      ? ["individual-plan"]
      : e.category === "Mobilnost"
        ? ["mobility"]
        : e.category === "Istezanje"
          ? ["cool-down"]
          : e.category === "Zagrijavanje"
            ? ["warm-up"]
            : recovery
              ? ["recovery"]
              : conditioning
                ? ["conditioning"]
                : e.category === "Pliometrijske"
                  ? ["power"]
                  : e.category === "Stabilizacijske"
                    ? ["stability"]
                    : ["strength"],
  };
}
// Reviewed correction: anti-extension is the target; gripping the wheel does not
// make the rollout principally an arm exercise.
for (const e of catalogue.filter((e) => /ab.wheel/i.test(e.name)))
  Object.assign(annotations[e.id], {
    primary: ["Trbuh"],
    secondary: ["Širi leđni"],
    stabilizers: ["Ramena", "Gluteusi"],
  });
for (const e of catalogue.filter((e) =>
  /bench press|dumbbell squeeze press|machine chest press|chest fly|dumbbell chest fly|plate.*press|cable.*chest press/i.test(
    e.name,
  ),
)) {
  const a = annotations[e.id];
  a.primary = ["Prsa"];
  a.secondary = /fly/i.test(e.name) ? ["Ramena"] : ["Ramena", "Tricepsi"];
}
for (const e of additions) {
  const a = annotations[e.id];
  if (["press", "pushup", "dip"].includes(e.guidance.family)) {
    a.primary = ["Prsa"];
    a.secondary = ["Ramena", "Tricepsi"];
    a.stabilizers = ["Trbuh"];
  }
  if (e.id === "kinra-exercise-barbell-thruster") {
    a.primary = ["Kvadricepsi", "Gluteusi", "Ramena"];
    a.secondary = ["Tricepsi"];
    a.stabilizers = ["Trbuh"];
  }
  if (e.id.includes("jerk")) {
    a.primary = ["Kvadricepsi", "Gluteusi", "Ramena"];
    a.secondary = ["Tricepsi", "Trapezi"];
    a.stabilizers = ["Trbuh", "Donja leđa (erektori)"];
  }
}
// Unmatched branded instability variants: counterpart movement reviewed directly.
const manualRoles = {
  74: [
    ["Kvadricepsi", "Gluteusi"],
    ["Prsa", "Tricepsi"],
    ["Trbuh", "Ramena"],
  ],
  75: [["Gluteusi"], ["Zadnja loža"], ["Trbuh"]],
  76: [["Kvadricepsi", "Gluteusi"], ["Zadnja loža"], ["Trbuh"]],
  77: [["Trbuh", "Fleksori kuka"], ["Kvadricepsi"], ["Ramena"]],
  78: [["Trbuh"], [], ["Ramena", "Gluteusi"]],
  80: [["Gluteusi", "Zadnja loža"], [], ["Trbuh", "Mišići stopala"]],
  81: [["Kvadricepsi", "Gluteusi"], ["Zadnja loža"], ["Trbuh"]],
  710: [["Trbuh"], ["Fleksori kuka"], []],
  712: [["Gluteusi"], ["Zadnja loža"], ["Trbuh"]],
  713: [["Zadnja loža"], ["Gluteusi"], ["Trbuh"]],
  714: [["Trbuh"], [], ["Ramena", "Gluteusi"]],
  715: [["Prsa"], ["Tricepsi", "Ramena"], ["Trbuh"]],
  716: [["Trbuh"], ["Širi leđni"], ["Ramena", "Gluteusi"]],
  717: [["Trbuh"], [], ["Gluteusi"]],
  718: [["Kvadricepsi", "Gluteusi"], [], ["Trbuh"]],
};
for (const [number, [primary, secondary, stabilizers]] of Object.entries(manualRoles))
  Object.assign(annotations[id(Number(number))], { primary, secondary, stabilizers });
for (const a of Object.values(annotations))
  a.stabilizers = a.stabilizers.filter((m) => !a.primary.includes(m) && !a.secondary.includes(m));
for (const e of catalogue)
  if (["protocol", "thermal"].includes(guidance[e.id].family)) {
    const meta = guidance[e.id];
    Object.assign(annotations[e.id], {
      primary: [],
      secondary: [],
      stabilizers: [],
      laterality: "not-applicable",
      mechanics: meta.clinical ? "clinical" : e.category === "Kardio" ? "conditioning" : "mobility",
      purpose: meta.clinical
        ? ["individual-plan"]
        : e.category === "Kardio"
          ? ["conditioning"]
          : e.category === "Zagrijavanje"
            ? ["warm-up"]
            : e.category === "Mobilnost"
              ? ["mobility"]
              : ["recovery"],
    });
  }
const write = (path, value) => fs.writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
annotations[id(620)].equipment = ["Machine"];
// The source isolation compilation also contains multijoint rows and presses.
// Preserve captured categories in exercises.json and correct only this narrow
// isolation/compound conflict. Single-joint exceptions must not be promoted just
// because their teaching family includes other compound movements.
const isolatedFamilyExceptions = new Set([
  34, 42, 224, 235, 275, 322, 475, 521, 541, 548, 626, 638, 668, 703, 706,
]);
const compoundFamilies = new Set([
  "press",
  "row",
  "hinge",
  "carry",
  "squat",
  "overhead",
  "dip",
  "lunge",
  "bridge",
  "pullup",
  "pulldown",
  "pushup",
  "olympic",
  "swing",
  "sled",
]);
for (const entry of catalogue) {
  if (entry.category !== "Izolacijske") continue;
  const annotation = annotations[entry.id];
  if (annotation.mechanics !== "compound") continue;
  if (
    isolatedFamilyExceptions.has(Number(entry.id.split("-")[1])) ||
    !compoundFamilies.has(guidance[entry.id].family)
  )
    annotation.mechanics = "isolation";
  else annotation.category = "Složene";
}
write("src/data/exercise-reviewed-metadata.json", annotations);
write(
  "src/data/exercise-reviewed-aliases.json",
  Object.fromEntries(
    catalogue
      .map((e) => [
        e.id,
        decisions
          .filter((d) => d.decision === "alias" && d.targetId === e.id)
          .map((d) => d.heading),
      ])
      .filter(([, values]) => values.length),
  ),
);
write("docs/exercise-heading-decisions.json", decisions);
write("docs/exercise-review-manifest.json", {
  reviewDate: "2026-10-21",
  sourceSectionsSha256: crypto.createHash("sha256").update(fs.readFileSync(source)).digest("hex"),
  originalCatalogueSha256: crypto
    .createHash("sha256")
    .update(fs.readFileSync("src/data/exercises.json"))
    .digest("hex"),
  originalCount: catalogue.length,
  addedCount: additions.length,
  unmatchedDecisions: decisions.length,
  sourceMuscleRoleAnnotations: Object.values(annotations).filter((a) => a.evidence).length,
  reviewedCategoryCorrections: Object.values(annotations).filter((a) => a.category).length,
  excludedSource:
    "50_vjezbi_prsa_fitconnect_full.txt anatomy and repetitive technique ignored; clinical protocols, claims about hormones, DOMS prevention, diagnosis and mandatory ranges/doses not imported.",
});
