import { currentLanguage, languages, type Language } from "./i18n";
import type { FeaturePayloads, FeatureRecord } from "./feature-types";

// Curated links, not copied or hosted media. Publisher pages verified 2026-10-20.
const urls = [
  "https://www.nhs.uk/better-health/get-active/home-workout-videos/",
  "https://www.nhs.uk/live-well/exercise/strength-and-flex-exercise-plan-how-to-videos/",
];
const ids = ["nhs-home-video", "nhs-strength-flex-video"] as const;
const copy = {
  en: [
    [
      "Home video session · NHS links",
      "An editable watchlist linking to the NHS home-workout page. Choose its cardio, strength or warm-down video; record only what you complete.",
      "NHS home-workout videos",
      "Choose the intended clip on the publisher page. Review its guidance before starting. Media is in English; Kinra does not host or translate it.",
    ],
    [
      "Technique review · NHS links",
      "An editable watchlist for reviewing the NHS strength and flexibility demonstrations before practising a movement.",
      "NHS strength and flexibility demonstrations",
      "Choose the relevant demonstration on the publisher page. Review suitability and instructions. Media is in English; Kinra does not host or translate it.",
    ],
  ],
  bs: [
    [
      "Kućni video trening · NHS poveznice",
      "Urediva lista s poveznicom na NHS stranicu kućnih treninga. Odaberite kardio, vježbe snage ili istezanje; zabilježite samo ono što završite.",
      "NHS video treninzi kod kuće",
      "Odaberite željeni snimak na stranici izdavača. Prvo pregledajte njegove upute. Snimci su na engleskom; Kinra ih ne ugošćuje niti prevodi.",
    ],
    [
      "Pregled tehnike · NHS poveznice",
      "Urediva lista za pregled NHS prikaza vježbi snage i fleksibilnosti prije uvježbavanja pokreta.",
      "NHS prikazi snage i fleksibilnosti",
      "Odaberite odgovarajući prikaz na stranici izdavača. Pregledajte prikladnost i upute. Snimci su na engleskom; Kinra ih ne ugošćuje niti prevodi.",
    ],
  ],
  de: [
    [
      "Videoeinheit zu Hause · NHS-Links",
      "Eine bearbeitbare Merkliste zur NHS-Seite für Heimtraining. Wähle dort Ausdauer, Kraft oder Dehnen und erfasse nur abgeschlossene Inhalte.",
      "NHS-Videos für Heimtraining",
      "Wähle den gewünschten Film auf der Seite des Anbieters. Lies zuerst seine Hinweise. Die Videos sind auf Englisch; Kinra hostet und übersetzt sie nicht.",
    ],
    [
      "Technik ansehen · NHS-Links",
      "Eine bearbeitbare Merkliste, um NHS-Demonstrationen zu Kraft und Beweglichkeit vor dem Üben anzusehen.",
      "NHS-Demonstrationen zu Kraft und Beweglichkeit",
      "Wähle die passende Demonstration auf der Seite des Anbieters. Prüfe Eignung und Anleitung. Die Videos sind auf Englisch; Kinra hostet und übersetzt sie nicht.",
    ],
  ],
} as const;
export function videoStarters(language: Language = currentLanguage()) {
  return ids.map((id, i) => {
    const item = copy[language][i]!;
    const payload: FeaturePayloads["video_plan"] = {
      starter_id: id,
      title: item[0],
      weeks: 1,
      context: "home",
      notes: item[1],
      videos: [
        {
          id: `33a09c00-9b03-4ea0-8200-00000000000${i + 1}`,
          title: item[2],
          url: urls[i]!,
          notes: item[3],
        },
      ],
    };
    return {
      id,
      title: item[0],
      summary: item[1],
      mediaLanguage: "English",
      sourceName: "NHS",
      sourceUrl: urls[i]!,
      payload,
    };
  });
}
/** Presentation only; custom text and numeric edits remain exactly as saved. */
export function localizedVideoPlan(
  record: FeatureRecord<"video_plan">,
  language: Language = currentLanguage(),
): FeatureRecord<"video_plan"> {
  const id = record.payload.starter_id;
  if (!id) return record;
  const target = videoStarters(language).find((s) => s.id === id)?.payload;
  if (!target) return record;
  const source = languages.flatMap((l) =>
    videoStarters(l)
      .filter((s) => s.id === id)
      .map((s) => s.payload),
  );
  const project = (
    text: string | undefined,
    get: (p: FeaturePayloads["video_plan"]) => string | undefined,
    to: string | undefined,
  ) => (source.some((p) => get(p) === text) ? to : text);
  const p = record.payload;
  return {
    ...record,
    payload: {
      ...p,
      title: project(p.title, (x) => x.title, target.title)!,
      ...(p.notes !== undefined ? { notes: project(p.notes, (x) => x.notes, target.notes)! } : {}),
      videos: p.videos.map((v) => {
        const to = target.videos.find((x) => x.id === v.id && x.url === v.url);
        return to
          ? {
              ...v,
              title: project(v.title, (x) => x.videos.find((a) => a.id === v.id)?.title, to.title)!,
              ...(v.notes !== undefined
                ? {
                    notes: project(
                      v.notes,
                      (x) => x.videos.find((a) => a.id === v.id)?.notes,
                      to.notes,
                    )!,
                  }
                : {}),
            }
          : v;
      }),
    },
  };
}
