import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import source from "../data/exercises.json";
import metadata from "../data/exercise-guidance.json";
import {
  exercises,
  exerciseById,
  exerciseGuide,
  searchExercises,
  exerciseEquipment,
  exerciseDifficulties,
  exerciseMovements,
  exerciseDisplayName,
} from "../lib/exercise-catalogue";
import { guideFamilies } from "../lib/exercise-guide-content";
const root = process.cwd();
const entry = (number: number) => exercises.find((e) => Number(e.id.slice(9, 13)) === number)!;
describe("authored exercise guidance", () => {
  it("preserves every captured ID, name, provenance and original source bytes", () => {
    expect(exercises).toHaveLength(778);
    expect(new Set(exercises.map((e) => e.id)).size).toBe(778);
    expect(Object.keys(metadata).sort()).toEqual(source.map((e) => e.id).sort());
    for (const captured of source) {
      const enriched = exerciseById(captured.id)!;
      for (const key of Object.keys(captured) as Array<keyof typeof captured>)
        expect(enriched[key]).toEqual(captured[key]);
    }
    expect(
      crypto
        .createHash("sha256")
        .update(fs.readFileSync(path.join(root, "src/data/exercises.json")))
        .digest("hex"),
    ).toBe("a992243931b62348cb3f56281a1bfb49840bc97273bcf7f3d9886bf8286090ba");
  });
  it("provides complete, non-empty localized guidance and valid metadata for all 778 entries", () => {
    for (const e of exercises) {
      expect(e.equipment.length).toBeGreaterThan(0);
      expect(exerciseDifficulties).toContain(e.difficulty);
      expect(exerciseMovements).toContain(e.movement);
      expect(guideFamilies).toHaveProperty(e.guideFamily);
      const guides = (["en", "bs", "de"] as const).map((language) => exerciseGuide(e, language));
      for (const g of guides) {
        expect(g.setup.length).toBeGreaterThan(0);
        expect(g.steps.length).toBeGreaterThanOrEqual(3);
        expect(g.mistakes.length).toBeGreaterThan(0);
        expect(g.cues.length).toBeGreaterThan(0);
        for (const line of [...g.setup, ...g.steps, ...g.mistakes, ...g.cues]) {
          expect(typeof line).toBe("string");
          expect(line.length).toBeGreaterThan(20);
          expect(line).not.toContain("|");
          expect(line).not.toMatch(/\b(?:TODO|undefined|placeholder)\b/i);
        }
      }
      expect(guides[0]!.steps).not.toEqual(guides[1]!.steps);
      expect(guides[1]!.steps).not.toEqual(guides[2]!.steps);
    }
  });
  it("retains meaningful movement and variant differences rather than one universal guide", () => {
    expect(exerciseGuide(entry(35), "en").steps).not.toEqual(exerciseGuide(entry(62), "en").steps);
    expect(exerciseGuide(entry(40), "en").setup.join(" ")).not.toEqual(
      exerciseGuide(entry(288), "en").setup.join(" "),
    );
    expect(exerciseGuide(entry(137), "en").steps.join(" ")).toContain("elbows outward and upward");
    expect(exerciseGuide(entry(440), "en").steps.join(" ")).toContain("forward from the knees");
    expect(exerciseGuide(entry(544), "en").steps.join(" ")).toContain("backward a small distance");
    expect(exerciseGuide(entry(747), "en").steps.join(" ")).toContain("half-kneel");
    expect(exerciseGuide(entry(420), "en").setup.join(" ")).toContain("one knee bent");
    expect(exerciseGuide(entry(420), "en").steps.join(" ")).toContain(
      "without curling the lower back",
    );
    expect(exerciseGuide(entry(420), "bs").steps.join(" ")).toContain("donjih leđa");
    expect(exerciseGuide(entry(250), "de").setup.join(" ")).toContain("Unterarm nach außen");
    expect(
      new Set(exercises.map((e) => JSON.stringify(exerciseGuide(e, "en").setup))).size,
    ).toBeGreaterThan(300);
  });
  it("does not give contradictory standing, heel-down, plank or catch directions to uncommon variants", () => {
    const sections = (id: number) => {
      const g = exerciseGuide(entry(id), "en");
      return [...g.setup, ...g.steps, ...g.mistakes, ...g.cues].join(" ");
    };
    for (const id of [393, 635]) {
      expect(sections(id)).toContain("Sit or recline in the leg-press machine");
      expect(sections(id)).not.toContain("Set your feet at a comfortable width");
    }
    for (const id of [235, 626, 638, 706]) {
      expect(sections(id)).toContain("heels to rise");
      expect(sections(id)).not.toMatch(
        /keep your heels down|lifting the heels|heel, base of the big toe/,
      );
    }
    expect(sections(541)).toContain("trunk and pelvis supported");
    expect(sections(541)).not.toContain("Stand close to the load");
    expect(sections(668)).toContain("Lie face down over a secured stability ball");
    expect(sections(668)).not.toContain("Stand close to the load");
    expect(sections(215)).toContain("upper back, never on the neck");
    expect(sections(215)).not.toContain("shoulders over the support");
    expect(sections(362)).toContain("upper arm stays overhead");
    expect(sections(362)).not.toContain("keeping the load close");
    expect(sections(510)).toContain("without visibly bending");
    expect(sections(510)).not.toContain("extend the knee against the resistance");
    expect(sections(697)).toContain("lift the whole leg");
    expect(sections(697)).not.toContain("place the pad above the ankle");
    expect(sections(174)).toContain("chest faces upward");
    expect(sections(174)).not.toContain("knees beneath hips");
    expect(sections(171)).toContain("top knee resting on a low secured padded bench");
    expect(sections(421)).toContain("knees as the lower support");
    expect(sections(592)).toContain("without turning the trunk");
    expect(sections(592)).not.toContain("Rotate through the intended trunk");
    expect(sections(43)).toContain("pull without a catch");
    expect(sections(43)).not.toContain("Receive the implement");
    for (const id of [730, 731]) {
      expect(sections(id)).toContain("do not try to catch a falling tire");
      expect(sections(id)).not.toContain("Receive the implement");
    }
    for (const id of [16, 201, 202, 216]) {
      expect(sections(id)).toContain("Step off the platform");
      expect(sections(id)).not.toContain("push through the floor in the intended direction");
    }
  });
  it("teaches Renegade Row from stable dumbbells in a high plank rather than a standing row", () => {
    const e = entry(515);
    expect(e.equipment).toContain("Dumbbells");
    expect(e.equipment).not.toContain("Bodyweight");
    for (const language of ["en", "bs", "de"] as const) {
      const g = exerciseGuide(e, language);
      expect(g.steps).toHaveLength(3);
      expect(
        [...g.setup, ...g.steps, ...g.mistakes, ...g.cues].every((line) => line.length > 20),
      ).toBe(true);
    }
    const g = exerciseGuide(e, "en");
    expect(g.setup.join(" ")).toContain("stable hex dumbbells");
    expect(g.setup.join(" ")).toContain("high plank");
    expect(g.setup.join(" ")).not.toContain("Set a stable stance or support your chest");
    expect(g.steps.join(" ")).toContain("alternate arms");
    expect(g.steps.join(" ")).toContain("without rotating the pelvis");
    expect(g.mistakes.join(" ")).toContain("round dumbbells that can roll");
  });
  it("keeps named clinical plans, postoperative work and thermal exposures qualified", () => {
    for (const n of [9, 22, 147, 148, 479, 480, 481, 482, 483, 484, 489]) {
      const g = exerciseGuide(entry(n), "en");
      expect(g.isClinical).toBe(true);
      expect(g.contentStatus).toBe("individual plan required");
      expect(g.images).toEqual([]);
      expect(g.alternatives).toEqual([]);
      expect(g.setup.join(" ")).toMatch(/individual|rehabilitation|plan/);
    }
    expect(exerciseGuide(entry(148), "en").setup.join(" ")).toContain(
      "Do not improvise cervical traction",
    );
    for (const n of [262, 342, 370, 391, 453])
      expect(exerciseGuide(entry(n), "en").steps.join(" ")).toContain(
        "does not prescribe a temperature or duration",
      );
  });
  it("uses local, licensed media with pinned provenance or explicitly labeled original illustrations", () => {
    // Upstream "Air Bike" is a floor bicycle crunch, not an Assault Bike.
    expect(exerciseGuide(entry(8), "en").mediaKind).toBe("illustration");
    let photographs = 0,
      illustrations = 0,
      none = 0;
    for (const e of exercises) {
      const g = exerciseGuide(e, "en");
      if (g.mediaKind === "photographs") {
        photographs++;
        expect(g.mediaLicense).toContain("Unlicense");
      } else if (g.mediaKind === "illustration") {
        illustrations++;
        expect(g.mediaLicense).toBe("CC0-1.0");
        expect(g.images[0]!.alt).toContain("not an exact demonstration");
      } else none++;
      for (const img of g.images) {
        expect(img.url).toMatch(/^\/exercise-(media|illustrations)\//);
        expect(fs.existsSync(path.join(root, "public", img.url))).toBe(true);
        expect(img.alt.length).toBeGreaterThan(20);
      }
    }
    expect(photographs).toBe(267);
    expect(illustrations).toBe(478);
    expect(none).toBe(33);
    const manifest = JSON.parse(
      fs.readFileSync(path.join(root, "public/exercise-media/manifest.json"), "utf8"),
    );
    expect(manifest.failures).toEqual([]);
    for (const asset of manifest.assets) {
      expect(asset.sourceUrl).toContain("f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5");
      expect(
        crypto
          .createHash("sha256")
          .update(fs.readFileSync(path.join(root, "public", asset.path)))
          .digest("hex"),
      ).toBe(asset.sha256);
    }
  });
  it("supports intersecting filters and localized search without changing captured labels", () => {
    expect(exerciseEquipment).toContain("Dumbbells");
    const candidates = searchExercises("", {
      equipment: "Dumbbells",
      difficulty: "beginner",
      movement: "Elbow flexion",
    });
    expect(candidates.length).toBeGreaterThan(0);
    for (const e of candidates) {
      expect(e.equipment).toContain("Dumbbells");
      expect(e.difficulty).toBe("beginner");
      expect(e.movement).toBe("Elbow flexion");
    }
    expect(searchExercises(exerciseDisplayName(entry(35), "de"))).toContain(entry(35));
    for (const e of exercises)
      for (const id of e.alternativeIds) {
        expect(id).not.toBe(e.id);
        expect(exerciseById(id)).toBeDefined();
        expect(exerciseById(id)!.guideFamily).toBe(e.guideFamily);
        expect(exerciseById(id)!.isClinical).toBe(false);
      }
  });
});
