/** Rebuild enriched metadata without modifying the 778 captured source records.
 * Classification rules and semantic media crosswalk are authored and reviewable.
 * Never match images by edit-distance or token similarity.
 */
import fs from "node:fs";
import crypto from "node:crypto";
const root = new URL("../", import.meta.url);
const read = (path) => JSON.parse(fs.readFileSync(new URL(path, root), "utf8"));
const exercises = read("src/data/exercises.json");
const names = read("src/data/exercise-display-names.json");
const commit = "f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5";
fs.mkdirSync(new URL("audit/", root), { recursive: true });
const upstreamPath = new URL("audit/free-exercises.json", root);
if (!fs.existsSync(upstreamPath)) {
  const response = await fetch(
    `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${commit}/dist/exercises.json`,
  );
  if (!response.ok) throw new Error(`Pinned exercise source unavailable: ${response.status}`);
  fs.writeFileSync(upstreamPath, await response.text());
}
const upstreamBytes = fs.readFileSync(upstreamPath);
if (
  crypto.createHash("sha256").update(upstreamBytes).digest("hex") !==
  "5bb747e3fc658f095a60dcbf6d53c96627acdcc6ffb6fffde86f7e26995d40bf"
)
  throw new Error("Pinned upstream source checksum mismatch");
const upstream = JSON.parse(upstreamBytes.toString("utf8"));
const clean = (name) =>
  name.toLowerCase().replace(/[’]/g, "'").replace(/[-–—]/g, " ").replace(/\s+/g, " ").trim();
const groups = [
  ["thermal", /sauna|steam bath|cold bath|ice bath|contrast therapy/],
  [
    "clinical",
    /alfredson|postoperative|cervical traction|pnf |ankle proprioception program|cervical stabilization/,
  ],
  ["breathing", /breathing|body scan|savasana|progressive muscle relaxation/],
  [
    "protocol",
    /session|protocol|routine|sequence|warm up.*sets|specific warm|cool down|cns activation|postural correction|zone 2|fartlek|circuit/,
  ],
  ["rolling", /foam roll|lacrosse ball/],
  ["stretch", /stretch|child's pose|pigeon pose|prayer stretch|sleeper/],
  [
    "mobility",
    / cars\b|^ankle alphabet|ankle rotations|mobilization|hip circles|knee circles|neck rolls|arm circles|cat cow|book opening|hip 90|pelvic tilt|chin tuck|cervical retraction|thoracic.*(?:rotation|extension)|thread the needle|wall angel|wall slide|shoulder flexion wall walk|hip airplane|leg swings|pendulum exercises|supine twist/,
  ],
  ["balance", /balance|heel to toe|wobble/],
  ["rope", /jump rope|double under|heavy rope jump/],
  ["sled", /sled|prowler/],
  ["throw", /medicine ball|wall ball/],
  ["swing", /kettlebell swing/],
  ["olympic", /clean|snatch(?! grip)|high pull|sandbag over shoulder|tire flip|turkish get/],
  ["jump", /jump|bound|\bhop\b|altitude drop|depth drop|ice skater|split squat jump/],
  [
    "cardio",
    /bike|cycling|treadmill|swimming|rower|rowing|ergomet|ellipt|cross trainer|stepper|stairmaster|versaclimber|ski erg|spinning|aqua jogging|dance cardio|zumba/,
  ],
  [
    "locomotion",
    /skip|sprint|shuttle|ladder|shuffl|butt kicks|high knees|step touch|jogging|boxing|battle ropes/,
  ],
  ["crawl", /bear crawl|crab walk|inchworm|mountain climb|burpee/],
  ["sideplank", /side plank|copenhagen/],
  ["antirotation", /pallof|anti rotation/],
  ["deadbug", /dead bug|supine marching/],
  ["birddog", /bird dog/],
  [
    "plank",
    /plank|hollow|body saw|ab wheel|roll out|rollout|stir the pot|dragon flag|front lever|human flag|planche|l sit(?! pull)|stability ball pike|wall handstand/,
  ],
  ["legraise", /leg raise|knee raise|knee tuck|flutter kicks|scissor kicks|hanging oblique|v up/],
  ["coreflexion", /crunch|sit up|mcgill curl up/],
  [
    "rotation",
    /woodchop|rotational chop|low to high lift|russian twist|core rotation|torso rotations|side bend/,
  ],
  ["carry", /carry|farmer|pinch hold|rope climb/],
  ["shrug", /shrug/],
  ["wrist", /wrist.*curl|wrist roller/],
  ["hipadduction", /hip adduction|inner thigh lift/],
  ["hipabduction", /hip abduction|abductor kick|side kick|fire hydrant|clamshell|mini band walk/],
  ["kickback", /glute kickback|donkey kick|hip extension|resistance band kickback/],
  ["calf", /calf raise|heel raise|heel drop/],
  ["legcurl", /leg curl|hamstring curl|nordic(?! curl)|nordic curl|reverse nordic/],
  [
    "legextension",
    /leg extension|quad sets|short arc quad|terminal knee extension|straight leg raise/,
  ],
  ["bridge", /glute bridge|hip thrust|frog pumps/],
  ["dip", /\bdip\b|\bdips\b/],
  ["pushup", /push up|pushup/],
  [
    "reversefly",
    /reverse fly|rear delt fly|reverse pec deck|band pull apart|prone.*(?:raise|y t w)|prone t \/ y \/ w/,
  ],
  ["fly", /\bfly\b|pec deck|crossover|chest squeeze|around the world/],
  ["triceps", /triceps|skull crusher|pushdown|tate press/],
  ["curl", /curl/],
  ["pullover", /pullover|straight arm|lat prayer|lat sweep(?! row)/],
  ["pullup", /pull up|chin up|dead hang|muscle up|scapular depression/],
  ["pulldown", /pulldown/],
  ["row", /\brow\b|face pull|scapular retraction/],
  ["raise", /raise|upright row|empty can|serratus wall push/],
  [
    "overhead",
    /shoulder press|overhead press|military press|arnold press|kettlebell press|landmine press|push press|thruster|squat to press/,
  ],
  ["press", /chest press|bench press|squeeze press|plate press|decline press|incline press/],
  [
    "hinge",
    /deadlift|rdl|hip hinge|good morning|rack pull|back extension|hyperextension|superman|prone press up|sphinx/,
  ],
  ["lunge", /lunge|split squat|step up|step down|sit to stand/],
  ["squat", /squat|leg press|wall sit/],
];
const overrides = {
  5: "mobility",
  17: "protocol",
  32: "carry",
  37: "locomotion",
  88: "cardio",
  126: "hinge",
  133: "fly",
  137: "raise",
  240: "raise",
  269: "mobility",
  287: "mobility",
  336: "press",
  362: "hinge",
  389: "hipabduction",
  543: "lunge",
  571: "stretch",
  615: "triceps",
  724: "mobility",
  749: "raise",
  753: "mobility",
  584: "pushup",
  702: "squat",
  761: "squat",
  20: "mobility",
  38: "mobility",
  39: "mobility",
  83: "breathing",
  142: "stretch",
  143: "mobility",
  148: "clinical",
  198: "mobility",
  205: "breathing",
  247: "mobility",
  250: "mobility",
  251: "mobility",
  262: "thermal",
  274: "rolling",
  297: "balance",
  342: "thermal",
  344: "mobility",
  347: "rolling",
  370: "thermal",
  391: "thermal",
  419: "birddog",
  420: "coreflexion",
  421: "sideplank",
  437: "mobility",
  453: "thermal",
  458: "mobility",
  459: "mobility",
  479: "clinical",
  480: "clinical",
  481: "clinical",
  482: "clinical",
  483: "clinical",
  484: "clinical",
  489: "clinical",
  494: "breathing",
  499: "reversefly",
  510: "legextension",
  563: "reversefly",
  564: "pullup",
  565: "pullup",
  585: "legextension",
  589: "mobility",
  599: "mobility",
  602: "mobility",
  697: "legextension",
  721: "legextension",
  722: "legextension",
  732: "stretch",
  735: "mobility",
  736: "mobility",
  757: "mobility",
  760: "pushup",
};
const movement = {
  thermal: "Thermal recovery",
  clinical: "Individual rehabilitation plan",
  breathing: "Breathing and relaxation",
  protocol: "Session structure",
  rolling: "Self massage",
  stretch: "Stretching",
  mobility: "Joint mobility",
  balance: "Balance",
  rope: "Rope skipping",
  sled: "Sled push or pull",
  throw: "Ball throw",
  swing: "Hip swing",
  olympic: "Technical power lift",
  jump: "Jump and landing",
  cardio: "Cyclic cardio",
  locomotion: "Footwork and agility",
  crawl: "Ground locomotion",
  sideplank: "Side trunk stability",
  antirotation: "Anti rotation",
  deadbug: "Supine trunk stability",
  birddog: "Quadruped trunk stability",
  plank: "Trunk stability",
  legraise: "Leg raise",
  coreflexion: "Trunk flexion",
  rotation: "Trunk rotation",
  carry: "Loaded carry or hold",
  shrug: "Shoulder elevation",
  wrist: "Wrist strength",
  hipadduction: "Hip adduction",
  hipabduction: "Hip abduction",
  kickback: "Hip extension",
  calf: "Ankle plantar flexion",
  legcurl: "Knee flexion",
  legextension: "Knee extension",
  bridge: "Hip bridge",
  dip: "Dip",
  pushup: "Push up",
  reversefly: "Rear shoulder opening",
  fly: "Chest fly",
  triceps: "Elbow extension",
  curl: "Elbow flexion",
  pullover: "Straight arm shoulder extension",
  pullup: "Bodyweight vertical pull",
  pulldown: "Vertical pull",
  row: "Horizontal pull",
  raise: "Shoulder raise",
  overhead: "Overhead push",
  press: "Horizontal push",
  hinge: "Hip hinge",
  lunge: "Single leg knee dominant",
  squat: "Squat",
};
function equipment(name, id, family) {
  const out = [];
  const add = (pattern, value) => {
    if (pattern.test(name)) out.push(value);
  };
  add(/dumbbell|empty can|full can/, "Dumbbells");
  add(
    /barbell|\bbench press|\bback squat|^front squat|^deadlift|conventional deadlift|sumo deadlift|snatch grip|^good morning|^overhead squat|^zercher|^pendlay|^power clean|^hang clean|military press|^push press/,
    "Barbell",
  );
  add(/ez bar/, "EZ bar");
  add(/kettlebell|goblet squat/, "Kettlebell");
  add(/cable/, "Cable machine");
  add(/band|elasti|mini band/, "Resistance band");
  add(/plate/, "Weight plate");
  add(/machine|pec deck|leg press|hack squat|pendulum squat/, "Resistance machine");
  add(/bench|preacher|scott|seal row|chest supported|hip thrust/, "Bench");
  add(/bosu/, "BOSU");
  add(/swiss ball|stability ball/, "Stability ball");
  add(/foam roll/, "Foam roller");
  add(/lacrosse ball/, "Massage ball");
  add(/medicine ball|wall ball/, "Medicine ball");
  add(/sled|prowler/, "Sled");
  add(/sandbag/, "Sandbag");
  add(/tire flip/, "Training tire");
  add(/trap bar|hex bar/, "Trap bar");
  add(/suspension|ring/, "Suspension trainer");
  add(/ab wheel/, "Ab wheel");
  add(/jump rope|double under|heavy rope/, "Skipping rope");
  add(/battle ropes/, "Battle ropes");
  add(/rope climb/, "Climbing rope");
  add(/box jump|box squat|box shuffle|jump.*box|step up|step down|box step/, "Box or step");
  add(/hurdle/, "Low hurdles");
  add(/ladder/, "Agility ladder");
  add(/wobble board/, "Balance board");
  add(/wrist roller/, "Wrist roller");
  add(/towel/, "Towel");
  add(/strap/, "Stretching strap");
  add(/wall|doorway/, "Wall or doorway");
  add(/roman chair|back extension|hyperextension/, "Back extension bench");
  if (family === "pullup" || /hanging|l sit pull up|front lever|muscle up/.test(name))
    out.push("Pull-up bar");
  if (family === "dip" && !/bench/.test(name)) out.push("Parallel bars");
  if (family === "cardio") {
    if (/bike|cycling|spinning/.test(name)) out.push("Bicycle or exercise bike");
    else if (/treadmill/.test(name)) out.push("Treadmill");
    else if (/rowing|rower/.test(name)) out.push("Rowing machine");
    else if (/swim|aqua/.test(name)) out.push("Pool");
    else if (/ellipt|cross trainer/.test(name)) out.push("Elliptical trainer");
    else if (/stepper|stairmaster/.test(name)) out.push("Stair machine");
    else if (/ski erg/.test(name)) out.push("Ski ergometer");
    else if (/versaclimber/.test(name)) out.push("Climbing machine");
    else if (/hand bike|arm erg/.test(name)) out.push("Arm ergometer");
  }
  if (family === "thermal")
    out.push(/sauna|steam/.test(name) ? "Supervised heat facility" : "Supervised water facility");
  if (/landmine|meadows|t bar/.test(name)) out.push("Landmine attachment", "Barbell");
  if (
    family === "pulldown" &&
    !out.some((v) => ["Cable machine", "Resistance machine", "Resistance band"].includes(v))
  )
    out.push("Cable machine");
  if (
    /face pull|rope hammer curl|rope triceps|triceps pushdown|straight arm rope/.test(name) &&
    !/band/.test(name)
  )
    out.push("Cable machine");
  if (/back extension|roman chair/.test(name) && /stability ball/.test(name))
    out.splice(out.indexOf("Back extension bench"), 1);
  if (id === 290) return ["Arm ergometer"];
  if (
    family === "carry" &&
    !out.some((v) => ["Sandbag", "Trap bar", "Weight plate", "Climbing rope"].includes(v))
  )
    out.push("Dumbbells");
  if (
    family === "curl" &&
    !out.some((v) =>
      [
        "Dumbbells",
        "Barbell",
        "EZ bar",
        "Cable machine",
        "Resistance band",
        "Resistance machine",
        "Weight plate",
      ].includes(v),
    )
  )
    out.push("Dumbbells");
  if (family === "triceps" && !out.length) out.push(/skull/.test(name) ? "EZ bar" : "Dumbbells");
  if (family === "overhead" && !out.length) out.push("Dumbbells");
  if (family === "row" && out.length === 1 && out[0] === "Bench") out.push("Dumbbells");
  if (/inverted row/.test(name)) out.push("Pull-up bar");
  if (/nordic/.test(name) && !/reverse/.test(name)) out.push("Secure ankle support");
  if (id === 94) out.push("Bench");
  if (id === 87) out.push("Barbell");
  if (id === 515) out.push("Dumbbells");
  if (!out.length) out.push("Bodyweight");
  return [...new Set(out)];
}
const metadata = {};
const missing = [];
for (const e of exercises) {
  const id = Number(e.id.slice(9, 13));
  const name = clean(names[e.id].en);
  const family = overrides[id] ?? groups.find(([, pattern]) => pattern.test(name))?.[0];
  if (!family) {
    missing.push(`${id}: ${name}`);
    continue;
  }
  let difficulty = /jump|olympic/.test(family)
    ? "advanced"
    : /stretch|breathing|rolling|mobility|cardio|protocol|calf|curl|legextension|hipabduction|hipadduction/.test(
          family,
        )
      ? "beginner"
      : "intermediate";
  if (
    /single leg|single arm|one arm|one leg|pistol|shrimp|nordic|dragon|planche|human flag|front lever|muscle up|handstand|l sit|explosive|clap|bosu/.test(
      name,
    )
  )
    difficulty = "advanced";
  if (
    /wall push|knee push|bodyweight squat|glute bridge|bird dog|dead bug|sit to stand|supported/.test(
      name,
    )
  )
    difficulty = "beginner";
  const variants = [];
  const note = (condition, key) => {
    if (condition) variants.push(key);
  };
  note(/dumbbell/.test(name), "dumbbells");
  note(/barbell|bench press|back squat|front squat|military press/.test(name), "barbell");
  note(/cable/.test(name), "cable");
  note(/band/.test(name), "band");
  note(/machine|pec deck|leg press|hack squat|pendulum squat/.test(name), "machine");
  note(/single arm|one arm/.test(name), "oneArm");
  note(/single leg|one leg/.test(name), "oneLeg");
  note(/alternating/.test(name), "alternating");
  note(/seated/.test(name), "seated");
  note(/kneeling/.test(name), "kneeling");
  note(/bosu|swiss ball|stability ball/.test(name), "unstable");
  note(/incline/.test(name) && family === "press", "inclinePress");
  note(/decline/.test(name) && family === "press", "declinePress");
  note(/incline/.test(name) && family === "fly", "inclineFly");
  note(/decline/.test(name) && family === "fly", "declineFly");
  note(/high to low/.test(name) && family === "fly", "highLow");
  note(/low to high/.test(name) && family === "fly", "lowHigh");
  note(/front raise/.test(name), "frontRaise");
  note(/lateral raise/.test(name), "lateralRaise");
  note(/behind body lateral/.test(name), "behindRaise");
  note(/leaning.*raise/.test(name), "leaningRaise");
  note(/hammer/.test(name), "hammer");
  note(/reverse grip|reverse curl/.test(name), "reverseGrip");
  note(/underhand/.test(name), "underhand");
  note(/close grip|narrow grip/.test(name), "closeGrip");
  note(/wide grip/.test(name), "wideGrip");
  note(family === "triceps" && /overhead/.test(name), "overheadTriceps");
  note(
    family === "triceps" &&
      /skull crusher|incline dumbbell triceps|decline dumbbell triceps/.test(name),
    "lyingTriceps",
  );
  note(family === "triceps" && /kickback/.test(name), "tricepsKickback");
  note(family === "triceps" && /pushdown/.test(name), "pushdown");
  note(/preacher|scott/.test(name), "preacher");
  note(/chest supported|seal row|incline.*row/.test(name), "chestSupport");
  note(family === "row" && /lat|seal/.test(name), "latRow");
  note(/rear delt row/.test(name), "rearRow");
  note(family === "calf" && /seated/.test(name), "bentKnee");
  note(family === "calf" && !/seated/.test(name), "straightKnee");
  note(/pulse|pulsing/.test(name), "pulse");
  note(/\bhold\b|isometric/.test(name), "hold");
  note(/partial/.test(name), "partial");
  note(id === 1, "rotation180");
  note(id === 2, "rotation360");
  note(/box jump|jump to box/.test(name), "boxJump");
  note(/depth|altitude|drop jump/.test(name), "depth");
  note(family === "jump" && /lateral|skater/.test(name), "lateralJump");
  note(/broad jump|long jump/.test(name), "broadJump");
  note(/pogo|ankle hop/.test(name), "pogo");
  note(id === 35, "backSquat");
  note(id === 278, "frontSquat");
  note(/goblet/.test(name), "goblet");
  note(/sumo|plié/.test(name), "sumo");
  note(/romanian|\brdl\b/.test(name), "romanian");
  note([169, 188, 700, 738].includes(id), "deadliftFloor");
  note(/hip thrust/.test(name), "hipthrust");
  note(/reverse lunge/.test(name), "reverseLunge");
  note(id === 384, "lateralLunge");
  note(/bulgarian/.test(name), "bulgarian");
  note(/curtsy/.test(name), "curtsy");
  const clinical =
    /rehab|rehabilit|alfredson|mcgill|postoper|cervical traction|pnf |proprioception program|deep neck flexor|cervical stabilization/.test(
      name + " " + e.name.toLowerCase(),
    );
  note(clinical && family !== "clinical", "clinical");
  metadata[e.id] = {
    family,
    movement: movement[family],
    equipment: equipment(name, id, family),
    difficulty,
    variants,
    clinical,
    alternatives: [],
  };
}
if (missing.length) {
  console.log("UNCLASSIFIED\n" + missing.join("\n"));
  process.exitCode = 1;
}
fs.writeFileSync(
  new URL("audit/exercise-family-review.json", root),
  JSON.stringify(
    Object.entries(movement).map(([family]) => ({
      family,
      entries: exercises
        .filter((e) => metadata[e.id]?.family === family)
        .map((e) => ({ id: Number(e.id.slice(9, 13)), name: names[e.id].en })),
    })),
    null,
    2,
  ) + "\n",
);
if (missing.length) process.exit(1);
// Exact identity, or an explicitly authored semantic crosswalk, only.
const crosswalk = read("src/data/exercise-media-crosswalk.json");
const upstreamByName = new Map(upstream.map((e) => [clean(e.name), e]));
function optionGroup(e) {
  const name = clean(names[e.id].en),
    family = metadata[e.id].family;
  if (["stretch", "mobility", "rolling"].includes(family)) {
    if (/cervical|neck|chin|levator/.test(name)) return "neck";
    if (/ankle|calf|heel|peroneal/.test(name)) return "ankle";
    if (/toe|plantar|towel/.test(name)) return "foot";
    if (/wrist|forearm/.test(name)) return "wrist";
    if (/hip|glute|piriformis|pigeon|figure|adductor|frog|butterfly|lunge/.test(name)) return "hip";
    if (/hamstring/.test(name)) return "hamstring";
    if (/quad|couch/.test(name)) return "quad";
    if (
      /shoulder|rotation.*band|external rotation|internal rotation|wall|chest|biceps|triceps|arm circle/.test(
        name,
      )
    )
      return "shoulder";
    return "trunk";
  }
  if (family === "olympic") return /clean|high pull/.test(name) ? "clean" : name;
  if (family === "plank")
    return /front lever|human flag|planche|dragon|l sit|handstand/.test(name) ? name : "trunk";
  if (family === "legcurl")
    return /reverse nordic/.test(name)
      ? "reverse nordic"
      : /nordic/.test(name)
        ? "nordic"
        : "hamstring curl";
  if (family === "cardio") return "cyclic cardio";
  return family;
}
for (const e of exercises) {
  const m = metadata[e.id];
  const name = clean(names[e.id].en);
  const curated = crosswalk[Number(e.id.slice(9, 13))];
  const source = curated ? upstream.find((item) => item.id === curated) : upstreamByName.get(name);
  if (curated && !source) throw new Error("Unknown upstream media: " + e.id + " " + curated);
  if (source && !m.clinical && !["protocol", "clinical", "thermal"].includes(m.family))
    m.media = {
      upstreamId: source.id,
      sourceName: source.name,
      imageSourceUrls: source.images.map(
        (path) =>
          `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${commit}/exercises/${path}`,
      ),
      images: source.images.map((path) =>
        fs.existsSync(new URL("public/exercise-media/" + path, root))
          ? "/exercise-media/" + path
          : `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${commit}/exercises/${path}`,
      ),
      match: curated ? "curated semantic identity" : "exact name",
    };
  const peers = exercises.filter(
    (other) =>
      other.id !== e.id &&
      metadata[other.id].family === m.family &&
      optionGroup(other) === optionGroup(e) &&
      !metadata[other.id].clinical &&
      clean(names[other.id].en) !== name,
  );
  peers.sort((a, b) => {
    const score = (other) =>
      (metadata[other.id].equipment.some((v) => !m.equipment.includes(v)) ? 2 : 0) +
      (other.muscles.some((v) => e.muscles.includes(v)) ? 4 : 0) +
      (metadata[other.id].difficulty === "beginner" ? 1 : 0);
    return score(b) - score(a);
  });
  if (!m.clinical && !["thermal", "clinical", "protocol"].includes(m.family))
    m.alternatives = peers.slice(0, 3).map((item) => item.id);
}
fs.writeFileSync(
  new URL("src/data/exercise-guidance.json", root),
  JSON.stringify(metadata, null, 2) + "\n",
);
const familyCounts = Object.fromEntries(
  Object.keys(movement).map((family) => [
    family,
    Object.values(metadata).filter((m) => m.family === family).length,
  ]),
);
const report = {
  generated: "2026-10-19",
  entries: exercises.length,
  languages: ["en", "bs", "de"],
  originalSourceSha256: crypto
    .createHash("sha256")
    .update(fs.readFileSync(new URL("src/data/exercises.json", root)))
    .digest("hex"),
  upstream: {
    repository: "https://github.com/yuhonas/free-exercise-db",
    commit,
    license: "Unlicense",
  },
  photos: Object.values(metadata).filter((m) => m.media).length,
  illustrations: Object.values(metadata).filter(
    (m) => !m.media && !["clinical", "thermal", "protocol"].includes(m.family),
  ).length,
  clinical: Object.values(metadata).filter((m) => m.clinical).length,
  families: familyCounts,
};
fs.writeFileSync(
  new URL("audit/exercise-guidance-coverage.json", root),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
