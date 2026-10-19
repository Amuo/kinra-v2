import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const archive = process.argv[2] ?? "D:/Projects/output/FitConnect-Kinra-Research-2026-10-19.zip";
const root = new URL("../", import.meta.url);
const read = (file) => execFileSync("tar", ["-xOf", archive, file], { maxBuffer: 4 * 1024 * 1024 });
const manifest = JSON.parse(read("manifest.json"));
for (const file of manifest.files) {
  const bytes = read(file.file);
  if (
    bytes.length !== file.bytes ||
    createHash("sha256").update(bytes).digest("hex") !== file.sha256
  )
    throw new Error(`Research checksum failed: ${file.file}`);
}
const data = JSON.parse(read("Library-research.json"));
const slug = (s) =>
  s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const exercises = data.exercises.map((e) => ({
  id: `exercise-${String(e.catalogueOrdinal).padStart(4, "0")}-${slug(e.name)}`,
  name: e.name,
  aliases: [
    e.name.replace(/\s*\([^)]*\)/g, "").trim(),
    ...[...e.name.matchAll(/\(([^)]+)\)/g)].map((m) => m[1]),
  ],
  category: e.category,
  muscles: e.displayedMuscles
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean),
  sourceUrl: e.sourceUrl,
  observedDate: e.observedDate,
  coverage: "metadata",
  instructions: null,
  media: null,
}));
const programs = data.programs.map((p) => ({
  id: `reference-${p.sourceUrl.split("/").pop()}`,
  name: p.name,
  classification: p.classification,
  author: p.author,
  equipment: p.equipment.split("|").map((s) => s.trim()),
  sourceUrl: p.sourceUrl,
  observedDate: p.observedDate,
  coverage: "reference-only",
  observedItemCount: p.observedItemCount,
}));
if (
  exercises.length !== 778 ||
  new Set(exercises.map((e) => e.id)).size !== 778 ||
  programs.length !== 18
)
  throw new Error("Unexpected catalogue coverage");
mkdirSync(new URL("src/data/", root), { recursive: true });
writeFileSync(new URL("src/data/exercises.json", root), JSON.stringify(exercises, null, 2) + "\n");
writeFileSync(
  new URL("src/data/program-references.json", root),
  JSON.stringify(programs, null, 2) + "\n",
);
mkdirSync(new URL("docs/research/", root), { recursive: true });
writeFileSync(
  new URL("docs/research/2026-10-19-provenance.json", root),
  JSON.stringify(
    {
      archive,
      archiveSha256: createHash("sha256").update(readFileSync(archive)).digest("hex"),
      observedDate: manifest.date,
      exerciseRows: exercises.length,
      programRows: programs.length,
      verified: manifest.files,
      limits:
        "Metadata inventory, not a full instructional or program-content export. No third-party media or authored instructions shipped. Source listing authorship is attribution, not Kinra endorsement.",
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Verified ${manifest.files.length} source checksums; imported ${exercises.length} metadata rows and ${programs.length} reference-only listings.`,
);
