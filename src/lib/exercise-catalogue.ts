import exerciseData from "../data/exercises.json";
import programData from "../data/program-references.json";
import displayNames from "../data/exercise-display-names.json";
import guidanceData from "../data/exercise-guidance.json";
import { currentLanguage, type Language } from "./i18n";
import { guideFamilies, guideLines, type GuideFamily } from "./exercise-guide-content";
import { variantNote, type VariantNote } from "./exercise-variant-notes";
import { specificTechnique } from "./exercise-specific-guidance";
import { specialGuide } from "./exercise-special-guides";
import { correctedGuide } from "./exercise-final-guide-fixes";

export interface ExerciseCatalogueEntry {
  id: string;
  name: string;
  aliases: string[];
  category: string;
  muscles: string[];
  sourceUrl: string;
  observedDate: string;
  coverage: "metadata";
  instructions: null;
  media: null;
  equipment: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  movement: string;
  guideFamily: GuideFamily;
  isClinical: boolean;
  alternativeIds: string[];
}
export interface ProgramReference {
  id: string;
  name: string;
  classification: string;
  author: string;
  equipment: string[];
  sourceUrl: string;
  observedDate: string;
  coverage: "reference-only";
  observedItemCount: number;
}
interface GuidanceMetadata {
  family: GuideFamily;
  equipment: string[];
  difficulty: ExerciseCatalogueEntry["difficulty"];
  movement: string;
  variants: VariantNote[];
  clinical: boolean;
  alternatives: string[];
  media?: { upstreamId: string; sourceName: string; images: string[]; match: string };
}
const guidance = guidanceData as Record<string, GuidanceMetadata>;
export const exercises: ExerciseCatalogueEntry[] = exerciseData.map((entry) => {
  const meta = guidance[entry.id];
  if (!meta) throw new Error(`Missing exercise guidance: ${entry.id}`);
  return {
    ...entry,
    coverage: "metadata",
    instructions: null,
    media: null,
    equipment: meta.equipment,
    difficulty: meta.difficulty,
    movement: meta.movement,
    guideFamily: meta.family,
    isClinical: meta.clinical,
    alternativeIds: meta.alternatives,
  };
});
export const programReferences = programData as ProgramReference[];
export const exerciseCategories = [...new Set(exercises.map((e) => e.category))].sort();
export const exerciseMuscles = [...new Set(exercises.flatMap((e) => e.muscles))].sort();
export const exerciseEquipment = [...new Set(exercises.flatMap((e) => e.equipment))].sort();
export const exerciseDifficulties = ["beginner", "intermediate", "advanced"] as const;
export const exerciseMovements = [...new Set(exercises.map((e) => e.movement))].sort();
const localizedNames = displayNames as Record<string, Record<Language, string>>;
export const exerciseDisplayName = (entry: ExerciseCatalogueEntry, language = currentLanguage()) =>
  localizedNames[entry.id]?.[language] ?? entry.name;
/** Authored/custom program labels keep their exact text. Only recognized catalogue labels follow the UI locale. */
export function programExerciseName(entry: { name: string; catalogue_id?: string | undefined }) {
  const source = exercises.find((e) => e.id === entry.catalogue_id);
  if (
    !source ||
    ![source.name, ...Object.values(localizedNames[source.id] ?? {})].includes(entry.name)
  )
    return entry.name;
  return exerciseDisplayName(source);
}
const normalize = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/đ/g, "dj");
const index = exercises.map((exercise) => ({
  exercise,
  text: normalize(
    [
      exercise.name,
      ...exercise.aliases,
      ...Object.values(localizedNames[exercise.id] ?? {}),
      exercise.category,
      ...exercise.muscles,
      ...exercise.equipment,
      exercise.difficulty,
      exercise.movement,
    ].join(" "),
  ),
}));
export function searchExercises(
  query: string,
  filters: {
    category?: string;
    muscle?: string;
    equipment?: string;
    difficulty?: string;
    movement?: string;
  } = {},
): ExerciseCatalogueEntry[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return index
    .filter(
      ({ exercise: e, text }) =>
        (!filters.category || e.category === filters.category) &&
        (!filters.muscle || e.muscles.includes(filters.muscle)) &&
        (!filters.equipment || e.equipment.includes(filters.equipment)) &&
        (!filters.difficulty || e.difficulty === filters.difficulty) &&
        (!filters.movement || e.movement === filters.movement) &&
        terms.every((term) => text.includes(term)),
    )
    .map(({ exercise }) => exercise);
}
export const exerciseById = (id: string) => exercises.find((e) => e.id === id);

export interface ExerciseGuideContent {
  setup: string[];
  steps: string[];
  mistakes: string[];
  cues: string[];
  images: Array<{ url: string; alt: string }>;
  videoUrl?: string;
  sourceName: string;
  sourceUrl: string;
  mediaSourceName?: string | undefined;
  mediaLicense?: string | undefined;
  mediaKind: "photographs" | "illustration" | "none";
  alternatives: string[];
  isClinical: boolean;
  contentStatus: "authored general guidance" | "individual plan required";
}
/** Original capture provenance remains on the entry. This separate source identifies our own guide. */
export function exerciseGuide(
  entry: ExerciseCatalogueEntry,
  language: Language = currentLanguage(),
): ExerciseGuideContent {
  const meta = guidance[entry.id];
  if (!meta) throw new Error(`Missing exercise guidance: ${entry.id}`);
  const content = correctedGuide(entry.id) ?? specialGuide(entry.id) ?? guideFamilies[meta.family];
  const technique = specificTechnique(entry.id, language);
  const variants = meta.variants.map((key) => variantNote(key, language));
  const illustration = !["clinical", "thermal", "protocol"].includes(meta.family);
  const name = exerciseDisplayName(entry, language);
  const imageLabel = {
    en: {
      photo: "Public-domain movement photograph",
      illustration:
        "Original movement-family illustration; simplified positions, not an exact demonstration",
    },
    bs: {
      photo: "Fotografija pokreta u javnoj domeni",
      illustration:
        "Originalna ilustracija porodice pokreta; pojednostavljeni položaji, nije tačna demonstracija",
    },
    de: {
      photo: "Gemeinfreies Bewegungsfoto",
      illustration:
        "Eigene Illustration der Bewegungsfamilie; vereinfachte Positionen, keine genaue Demonstration",
    },
  }[language];
  return {
    setup: [...(technique ? [technique] : []), ...guideLines(content.setup, language), ...variants],
    steps: guideLines(content.steps, language),
    mistakes: guideLines(content.mistakes, language),
    cues: guideLines(content.cues, language),
    images: meta.media
      ? meta.media.images.map((url, i) => ({
          url,
          alt: `${name} — ${imageLabel.photo} ${i + 1} (${meta.media!.sourceName})`,
        }))
      : illustration
        ? [
            {
              url: `/exercise-illustrations/${meta.family}.svg`,
              alt: `${name} — ${imageLabel.illustration}`,
            },
          ]
        : [],
    sourceName: {
      en: "Kinra original guide · general education · no claimed clinical review",
      bs: "Originalni Kinra vodič · opšta edukacija · bez tvrdnje o kliničkoj recenziji",
      de: "Eigener Kinra-Leitfaden · allgemeine Information · keine behauptete klinische Prüfung",
    }[language],
    sourceUrl: "/exercise-guidance.html",
    mediaSourceName: meta.media
      ? "yuhonas/free-exercise-db"
      : illustration
        ? {
            en: "Kinra original schematic illustration",
            bs: "Originalna Kinra shematska ilustracija",
            de: "Eigene schematische Kinra-Illustration",
          }[language]
        : undefined,
    mediaLicense: meta.media ? "Unlicense · public domain" : illustration ? "CC0-1.0" : undefined,
    mediaKind: meta.media ? "photographs" : illustration ? "illustration" : "none",
    alternatives: meta.alternatives,
    isClinical: meta.clinical,
    contentStatus:
      meta.family === "clinical" ? "individual plan required" : "authored general guidance",
  };
}
