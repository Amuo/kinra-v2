/** Original vector schematics. No photographs or third-party artwork are used. */
import fs from "node:fs";
const base = new URL("../", import.meta.url);
const metadata = JSON.parse(
  fs.readFileSync(new URL("src/data/exercise-guidance.json", base), "utf8"),
);
const out = new URL("public/exercise-illustrations/", base);
fs.mkdirSync(out, { recursive: true });
// Points: head, neck, pelvis, left elbow/wrist, right elbow/wrist, left knee/foot, right knee/foot.
const upright = [
  [150, 55],
  [150, 85],
  [150, 165],
  [123, 120],
  [116, 155],
  [177, 120],
  [184, 155],
  [132, 210],
  [130, 260],
  [168, 210],
  [170, 260],
];
const squat = [
  [165, 90],
  [160, 119],
  [118, 175],
  [185, 125],
  [210, 108],
  [186, 140],
  [210, 125],
  [174, 196],
  [145, 260],
  [164, 215],
  [190, 260],
];
const hinge = [
  [205, 112],
  [180, 126],
  [125, 164],
  [182, 163],
  [177, 207],
  [194, 160],
  [191, 206],
  [126, 210],
  [130, 260],
  [152, 210],
  [165, 260],
];
const lunge = [
  [143, 74],
  [143, 103],
  [143, 171],
  [117, 133],
  [110, 165],
  [171, 133],
  [178, 165],
  [205, 190],
  [212, 260],
  [105, 220],
  [59, 241],
];
const overhead = [
  [150, 55],
  [150, 85],
  [150, 165],
  [115, 55],
  [130, 13],
  [185, 55],
  [170, 13],
  [132, 210],
  [130, 260],
  [168, 210],
  [170, 260],
];
const frontarm = [
  [150, 55],
  [150, 85],
  [150, 165],
  [185, 90],
  [230, 90],
  [184, 102],
  [224, 106],
  [132, 210],
  [130, 260],
  [168, 210],
  [170, 260],
];
const sidearm = [
  [150, 55],
  [150, 85],
  [150, 165],
  [105, 88],
  [60, 88],
  [195, 88],
  [240, 88],
  [132, 210],
  [130, 260],
  [168, 210],
  [170, 260],
];
const curl = [
  [150, 55],
  [150, 85],
  [150, 165],
  [120, 124],
  [134, 91],
  [180, 124],
  [166, 91],
  [132, 210],
  [130, 260],
  [168, 210],
  [170, 260],
];
const seated = [
  [130, 80],
  [130, 110],
  [130, 185],
  [164, 146],
  [198, 145],
  [157, 148],
  [191, 148],
  [196, 185],
  [196, 255],
  [189, 199],
  [220, 255],
];
const supine = [
  [55, 226],
  [82, 226],
  [163, 226],
  [105, 248],
  [132, 251],
  [105, 204],
  [132, 200],
  [205, 190],
  [247, 251],
  [204, 205],
  [252, 251],
];
const bridge = [
  [55, 226],
  [82, 226],
  [163, 179],
  [110, 244],
  [145, 249],
  [103, 246],
  [138, 254],
  [211, 206],
  [247, 253],
  [212, 215],
  [253, 258],
];
const plank = [
  [55, 170],
  [83, 178],
  [164, 193],
  [88, 217],
  [92, 258],
  [96, 219],
  [110, 258],
  [218, 222],
  [260, 258],
  [213, 225],
  [254, 258],
];
const bird = [
  [55, 150],
  [83, 158],
  [164, 168],
  [91, 211],
  [93, 257],
  [42, 159],
  [8, 159],
  [207, 164],
  [258, 164],
  [167, 215],
  [204, 258],
];
const kneel = [
  [137, 65],
  [137, 93],
  [137, 164],
  [107, 125],
  [96, 158],
  [167, 125],
  [178, 158],
  [139, 230],
  [190, 250],
  [151, 227],
  [202, 250],
];
const deadbug = [
  [55, 242],
  [82, 242],
  [163, 242],
  [96, 199],
  [96, 153],
  [109, 198],
  [109, 153],
  [175, 195],
  [228, 197],
  [181, 183],
  [234, 185],
];
const leglift = [
  [55, 242],
  [82, 242],
  [163, 242],
  [108, 254],
  [143, 257],
  [108, 254],
  [143, 257],
  [194, 203],
  [224, 160],
  [201, 210],
  [232, 166],
];
const lean = [
  [145, 68],
  [135, 96],
  [115, 168],
  [107, 128],
  [91, 158],
  [163, 124],
  [181, 155],
  [128, 215],
  [153, 259],
  [150, 214],
  [180, 259],
];
const flat = [
  [55, 222],
  [82, 222],
  [163, 222],
  [105, 185],
  [109, 139],
  [110, 180],
  [115, 134],
  [207, 222],
  [260, 222],
  [206, 231],
  [260, 231],
];
const crunch = [
  [73, 170],
  [96, 190],
  [163, 231],
  [119, 174],
  [140, 173],
  [119, 185],
  [141, 183],
  [205, 190],
  [248, 252],
  [208, 204],
  [253, 258],
];
const familyPoses = {
  squat: [upright, squat],
  lunge: [upright, lunge],
  hinge: [upright, hinge],
  bridge: [supine, bridge],
  row: [hinge, { ...hinge }],
  pulldown: [overhead, curl],
  pullup: [overhead, curl],
  press: [flat, { ...flat }],
  overhead: [curl, overhead],
  pushup: [plank, { ...plank }],
  fly: [sidearm, frontarm],
  reversefly: [frontarm, sidearm],
  raise: [upright, sidearm],
  curl: [upright, curl],
  triceps: [curl, upright],
  dip: [upright, { ...upright }],
  pullover: [overhead, frontarm],
  calf: [upright, { ...upright }],
  legcurl: [upright, { ...upright }],
  legextension: [seated, { ...seated }],
  hipabduction: [upright, { ...upright }],
  hipadduction: [{ ...upright }, upright],
  kickback: [upright, { ...upright }],
  plank: [plank, plank],
  sideplank: [flat, flat],
  coreflexion: [supine, crunch],
  legraise: [supine, leglift],
  deadbug: [deadbug, leglift],
  birddog: [plank, bird],
  rotation: [frontarm, sidearm],
  antirotation: [curl, frontarm],
  carry: [upright, lunge],
  jump: [squat, upright],
  cardio: [upright, lunge],
  locomotion: [lunge, upright],
  crawl: [plank, bird],
  balance: [upright, { ...upright }],
  stretch: [upright, lean],
  mobility: [frontarm, sidearm],
  rolling: [supine, supine],
  breathing: [supine, supine],
  olympic: [hinge, curl],
  swing: [hinge, frontarm],
  throw: [curl, frontarm],
  sled: [lean, lunge],
  rope: [upright, upright],
  wrist: [frontarm, curl],
  shrug: [upright, upright],
};
// Copy before editing to avoid shared pose mutation.
for (const [key, value] of Object.entries(familyPoses))
  familyPoses[key] = value.map((p) => Array.from({ length: 11 }, (_, i) => [...p[i]]));
familyPoses.row[1][3] = [143, 143];
familyPoses.row[1][4] = [177, 132];
familyPoses.press[1][3] = [113, 222];
familyPoses.press[1][4] = [130, 190];
familyPoses.press[1][5] = [117, 226];
familyPoses.press[1][6] = [135, 194];
familyPoses.pushup[1] = familyPoses.pushup[1].map(([x, y], i) => [x, i < 3 ? y + 38 : y]);
familyPoses.dip[1] = familyPoses.dip[1].map(([x, y], i) => [x, y + 23]);
familyPoses.dip[1][3] = [114, 133];
familyPoses.dip[1][4] = [124, 113];
familyPoses.dip[1][5] = [186, 133];
familyPoses.dip[1][6] = [176, 113];
familyPoses.calf[1] = upright.map(([x, y]) => [x, y - 15]);
familyPoses.calf[1][8] = [145, 260];
familyPoses.calf[1][10] = [185, 260];
familyPoses.legcurl[1][9] = [179, 205];
familyPoses.legcurl[1][10] = [210, 170];
familyPoses.legextension[1][9] = [188, 198];
familyPoses.legextension[1][10] = [250, 198];
familyPoses.hipabduction[1][9] = [200, 202];
familyPoses.hipabduction[1][10] = [230, 240];
familyPoses.hipadduction[0] = familyPoses.hipabduction[1];
familyPoses.kickback[1][9] = [207, 198];
familyPoses.kickback[1][10] = [244, 222];
familyPoses.balance[1][9] = [205, 170];
familyPoses.balance[1][10] = [212, 223];
familyPoses.shrug[1][1] = [150, 72];
const esc = (x) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;");
function pose(points, index, key) {
  const joints = [
    [1, 2],
    [1, 3],
    [3, 4],
    [1, 5],
    [5, 6],
    [2, 7],
    [7, 8],
    [2, 9],
    [9, 10],
  ];
  const path = joints.map(([a, b]) => `M${points[a].join(" ")}L${points[b].join(" ")}`).join(" ");
  let equipment = "";
  if (["curl", "raise", "shrug", "carry", "press", "overhead"].includes(key))
    equipment = [4, 6]
      .map(
        (i) =>
          `<rect x="${points[i][0] - 12}" y="${points[i][1] - 4}" width="24" height="8" rx="3" fill="#d97706"/>`,
      )
      .join("");
  if (["pulldown", "pullup"].includes(key))
    equipment = '<path d="M80 10H220" stroke="#d97706" stroke-width="8"/>';
  if (key === "rolling")
    equipment =
      '<circle cx="148" cy="254" r="15" stroke="#d97706" fill="#ffedd5" stroke-width="5"/>';
  if (key === "rope")
    equipment =
      '<path d="M112 156C-15 290 315 290 188 156" fill="none" stroke="#d97706" stroke-width="3"/>';
  if (key === "throw")
    equipment = `<circle cx="${points[4][0] + 12}" cy="${points[4][1]}" r="16" fill="#d97706"/>`;
  return `<g transform="translate(${index * 300 + 20} 17)"><path d="M15 267H285" stroke="#cbd5e1" stroke-width="2"/><circle cx="${points[0][0]}" cy="${points[0][1]}" r="16" fill="#f0fdfa" stroke="#0f766e" stroke-width="6"/><path d="M${points[0].join(" ")}L${points[1].join(" ")}" stroke="#0f766e" stroke-width="6"/><path d="${path}" stroke="#0f766e" stroke-width="8" stroke-linecap="round" fill="none"/>${equipment}<circle cx="25" cy="15" r="14" fill="#0f766e"/><text x="25" y="20" text-anchor="middle" font-size="15" fill="white" font-family="sans-serif">${index + 1}</text></g>`;
}
const families = [
  ...new Set(
    Object.values(metadata)
      .filter((m) => !["clinical", "thermal", "protocol"].includes(m.family))
      .map((m) => m.family),
  ),
];
for (const key of families) {
  const poses = familyPoses[key];
  if (!poses) throw new Error("Missing original schematic " + key);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="320" viewBox="0 0 640 320" role="img"><title>${esc(key)}: original simplified movement-family illustration</title><desc>Two schematic positions for the movement family. This is not an exact demonstration of every variation. Follow the written setup and steps.</desc><rect width="640" height="320" fill="#f8fafc"/><path d="M320 32V289" stroke="#cbd5e1" stroke-dasharray="5 5"/>${pose(poses[0], 0, key)}${pose(poses[1], 1, key)}</svg>`;
  fs.writeFileSync(new URL(key + ".svg", out), svg + "\n");
}
console.log(`${families.length} original schematic illustrations generated.`);
