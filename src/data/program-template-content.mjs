// Original Kinra example authoring source. Run with Node from the repository root.
// Catalogue metadata identifies movements; it is not a source for these routines.
import fs from "node:fs";
const catalogue = JSON.parse(fs.readFileSync("src/data/exercises.json", "utf8"));
const refs = JSON.parse(
  fs.readFileSync("src/data/template-food-references.json", "utf8").replace(/^\uFEFF/, ""),
);
const langs = ["en", "bs", "de"];
const pick = (v, i) => (Array.isArray(v) ? v[i] : v);
const L = (en, bs, de) => [en, bs, de];
const sources = [
  {
    title: "ACSM Resistance Training Position Stand: general principles (2026)",
    url: "https://www.acsm.org/wp-content/uploads/2026/03/Resistance-Training-Position-Stand-infographic.pdf",
    observedDate: "2026-10-19",
  },
];
const audience = L(
  "An original general adult example, not an individually assessed prescription. Review exercises and equipment first. Start with easy practice sets; stop for pain or feeling unwell. Schedule rest between hard sessions. Adjust or seek qualified guidance when health, pregnancy or injury affects exercise.",
  "Originalni opći primjer za odrasle, bez individualne procjene. Prvo pregledajte vježbe i opremu. Počnite laganim probnim serijama; stanite kod bola ili lošeg osjećaja. Ostavite odmor između težih treninga. Prilagodite plan ili zatražite stručni savjet ako zdravlje, trudnoća ili povreda utiču na vježbanje.",
  "Ein eigenes allgemeines Beispiel für Erwachsene ohne individuelle Untersuchung. Übungen und Geräte zuerst prüfen. Mit leichten Übungssätzen beginnen; bei Schmerzen oder Unwohlsein stoppen. Zwischen schweren Einheiten Erholung einplanen. Bei gesundheitlichen Einschränkungen, Schwangerschaft oder Verletzung anpassen oder fachlichen Rat einholen.",
);
const standard = L(
  "Repeat the listed week. Begin at the low end of each rep range with 3–4 reps in reserve (RPE 6–7). Add one rep per set when controlled; after every set reaches the top, increase the smallest available load and return to the low end. Do not increase load and sets together. If recovery or form worsens, repeat the previous week or remove one set.",
  "Ponavljajte prikazanu sedmicu. Počnite donjim brojem ponavljanja uz 3–4 ponavljanja u rezervi (RPE 6–7). Dodajte po jedno kontrolisano ponavljanje u seriji; kada sve serije dostignu gornju granicu, dodajte najmanje dostupno opterećenje i vratite se donjoj. Ne povećavajte istovremeno opterećenje i broj serija. Ako oporavak ili tehnika oslabe, ponovite prethodnu sedmicu ili uklonite jednu seriju.",
  "Die angegebene Woche wiederholen. Am unteren Ende des Wiederholungsbereichs mit 3–4 Wiederholungen Reserve (RPE 6–7) beginnen. Bei guter Kontrolle eine Wiederholung pro Satz ergänzen; erreichen alle Sätze die Obergrenze, das kleinste verfügbare Gewicht hinzufügen und unten beginnen. Gewicht und Satzzahl nicht gleichzeitig erhöhen. Bei schlechterer Erholung oder Technik die Vorwoche wiederholen oder einen Satz streichen.",
);
const bodyProgress = L(
  "Repeat the week with a rest day between sessions. Add one controlled rep per set up to the upper limit. Then use a slightly harder movement variation only after reviewing it, and restart at the lower limit. Keep 2–4 reps in reserve; extra speed is not progression.",
  "Ponavljajte sedmicu uz dan odmora između treninga. Dodajte po jedno kontrolisano ponavljanje do gornje granice. Zatim, tek nakon pregleda, odaberite malo težu varijantu i počnite donjim brojem. Zadržite 2–4 ponavljanja u rezervi; veća brzina nije napredak.",
  "Die Woche mit einem Ruhetag zwischen Einheiten wiederholen. Kontrollierte Wiederholungen bis zur Obergrenze ergänzen. Danach erst nach Prüfung eine etwas schwierigere Variante wählen und unten beginnen. 2–4 Wiederholungen Reserve lassen; höheres Tempo ist kein Fortschrittskriterium.",
);
const mobilityProgress = L(
  "Use slow repetitions through a comfortable range, with no forced end positions. Over four weeks gradually improve control or comfortable range; do not add weight. These short sessions complement strength and aerobic activity rather than replace them.",
  "Radite sporo u ugodnom opsegu, bez forsiranja krajnjih položaja. Tokom četiri sedmice postepeno poboljšavajte kontrolu ili ugodan opseg; ne dodajte utege. Ove kratke sesije dopunjuju trening snage i aerobnu aktivnost.",
  "Langsame Wiederholungen im angenehmen Bewegungsumfang ohne erzwungene Endpositionen. Über vier Wochen Kontrolle oder angenehmen Bewegungsumfang verbessern; kein Gewicht ergänzen. Diese kurzen Einheiten ergänzen Kraft- und Ausdauertraining.",
);
const cue = {
  general: L(
    "Use a controlled range and steady breathing. Choose a load that leaves the stated effort in reserve.",
    "Krećite se kontrolisano i dišite ravnomjerno. Odaberite opterećenje s rezervom prema zadanom naporu.",
    "Kontrollierter Bewegungsumfang und gleichmäßig atmen. Eine Last mit der vorgesehenen Belastungsreserve wählen.",
  ),
  side: L(
    "Reps are per side. Complete both sides for one set; match the easier side and rest after both.",
    "Ponavljanja su po strani. Obje strane čine jednu seriju; pratite slabiju stranu i odmorite nakon obje.",
    "Wiederholungen pro Seite. Beide Seiten ergeben einen Satz; an der schwächeren Seite orientieren und danach pausieren.",
  ),
  mobility: L(
    "One slow movement cycle counts as one rep. Stay in a comfortable range; do not force a stretch.",
    "Jedan spori ciklus pokreta je jedno ponavljanje. Ostanite u ugodnom opsegu; ne forsirajte istezanje.",
    "Ein langsamer Bewegungszyklus zählt als Wiederholung. Im angenehmen Umfang bleiben; Dehnung nicht erzwingen.",
  ),
  band: L(
    "Inspect the band and secure the anchor as its manufacturer directs. Use controlled tension; never aim the band toward your face.",
    "Pregledajte traku i učvrstite sidro prema uputstvu proizvođača. Kontrolišite napetost; ne usmjeravajte traku prema licu.",
    "Band prüfen und den Anker nach Herstellerangabe befestigen. Spannung kontrollieren; das Band nicht auf das Gesicht richten.",
  ),
  cardio: L(
    "Count complete movement cycles, not seconds. Use a conversational effort and take longer rest if needed.",
    "Brojite pune cikluse pokreta, ne sekunde. Radite tempom pri kojem možete razgovarati i po potrebi odmorite duže.",
    "Vollständige Bewegungszyklen zählen, keine Sekunden. Bei Gesprächstempo arbeiten und bei Bedarf länger pausieren.",
  ),
  bar: L(
    "Use a rack with correctly set safeties or a competent spotter where needed. Warm up with lighter practice sets before the working sets.",
    "Po potrebi koristite stalak s pravilno postavljenim osiguračima ili sposobnog pomagača. Prije radnih serija uradite lakše probne serije.",
    "Bei Bedarf ein Rack mit passend eingestellten Sicherungen oder eine erfahrene Hilfsperson nutzen. Vor den Arbeitssätzen mit leichteren Übungssätzen aufwärmen.",
  ),
  body: L(
    "Bodyweight is the intended resistance; use a stable surface and a comfortable range. Stop before technique changes.",
    "Otpor je vlastita tjelesna težina; koristite stabilnu podlogu i ugodan opseg. Stanite prije promjene tehnike.",
    "Das eigene Körpergewicht ist der Widerstand; eine stabile Fläche und angenehmen Umfang nutzen. Vor Technikverlust stoppen.",
  ),
  step: L(
    "Use a low, stable step. Reps are per leg; complete both legs for one set. Do not use an unstable chair.",
    "Koristite nisku, stabilnu stepenicu. Ponavljanja su po nozi; obje noge čine jednu seriju. Ne koristite nestabilnu stolicu.",
    "Eine niedrige, stabile Stufe nutzen. Wiederholungen pro Bein; beide Beine ergeben einen Satz. Keinen instabilen Stuhl verwenden.",
  ),
};
const e = (n, sets = 2, reps = "8–12", rest = 90, rpe = 7, note = "general") => ({
  n,
  sets,
  reps,
  rest,
  rpe,
  note,
});
const d = (title, exercises) => ({ title, exercises });
const A = L("A · Full body", "A · Cijelo tijelo", "A · Ganzkörper"),
  B = L("B · Full body", "B · Cijelo tijelo", "B · Ganzkörper"),
  C = L("C · Full body", "C · Cijelo tijelo", "C · Ganzkörper");
const upper = L("Upper body", "Gornji dio tijela", "Oberkörper"),
  lower = L("Lower body", "Donji dio tijela", "Unterkörper");
const equipment = {
  gym: L("Gym", "Teretana", "Fitnessstudio"),
  body: L("Bodyweight", "Vlastita težina", "Körpergewicht"),
  mat: L("Mat", "Prostirka", "Matte"),
  dumbbell: L("Dumbbells", "Bučice", "Kurzhanteln"),
  bench: L("Stable bench", "Stabilna klupa", "Stabile Bank"),
  rack: L(
    "Barbell and safety rack",
    "Šipka i stalak s osiguračima",
    "Langhantel und Sicherheitsrack",
  ),
  band: L(
    "Resistance band and rated anchor",
    "Elastična traka i odgovarajuće sidro",
    "Widerstandsband und geeigneter Anker",
  ),
  kettlebell: L("Kettlebell", "Girja", "Kettlebell"),
  step: L("Stable low step", "Stabilna niska stepenica", "Stabile niedrige Stufe"),
  fixedbar: L(
    "Load-rated fixed rowing bar",
    "Čvrsta prečka za veslanje odgovarajuće nosivosti",
    "Belastbare feste Ruderstange",
  ),
};
const full = L("General strength", "Opća snaga", "Allgemeine Kraft"),
  growth = L("Muscle development", "Razvoj mišića", "Muskelaufbau"),
  movement = L("Movement practice", "Vježbanje pokreta", "Bewegungspraxis"),
  condition = L("Strength and conditioning", "Snaga i kondicija", "Kraft und Kondition");
const beginner = L("Beginner", "Početni", "Einstieg"),
  intermediate = L("Intermediate", "Srednji", "Fortgeschritten");
const specs = [];
function add(
  id,
  title,
  summary,
  goal,
  level,
  eq,
  weeks,
  minutes,
  days,
  progress = standard,
  extra = L("", "", ""),
) {
  specs.push({ id, title, summary, goal, level, eq, weeks, minutes, days, progress, extra });
}
add(
  "kinra-gym-foundations",
  L("Gym foundations · 2 days", "Osnove teretane · 2 dana", "Studio-Grundlagen · 2 Tage"),
  L(
    "Two straightforward full-body sessions with machines and a dumbbell squat. Alternate A and B with at least one rest day.",
    "Dva jednostavna treninga cijelog tijela uz sprave i čučanj s bučicom. Smjenjujte A i B uz barem dan odmora.",
    "Zwei einfache Ganzkörpereinheiten mit Geräten und einer Kurzhantel-Kniebeuge. A und B mit mindestens einem Ruhetag abwechseln.",
  ),
  full,
  beginner,
  ["gym"],
  6,
  40,
  [
    d(A, [e(284), e(266), e(377), e(582), e(185, 2, "6–10", 60, 6, "side")]),
    d(B, [e(393), e(233), e(574), e(282, 2, "10–15", 60, 6, "body"), e(679, 2, "10–15", 60)]),
  ],
);
add(
  "kinra-home-basics",
  L("Home basics · 2 days", "Kućne osnove · 2 dana", "Zuhause-Grundlagen · 2 Tage"),
  L(
    "No-equipment squat, push and trunk practice for a small space. This starting plan has limited pulling work; add a reviewed row option when equipment is available.",
    "Čučanj, potisak i trup bez opreme u malom prostoru. Plan ima malo povlačenja; dodajte pregledanu varijantu veslanja kada imate opremu.",
    "Kniebeuge, Drücken und Rumpfpraxis ohne Geräte auf kleinem Raum. Zugübungen sind begrenzt; bei verfügbarer Ausrüstung eine geprüfte Ruderübung ergänzen.",
  ),
  full,
  beginner,
  ["body", "mat"],
  4,
  25,
  [
    d(A, [
      e(71, 2, "8–12", 60, 6, "body"),
      e(364, 2, "6–10", 60, 6, "body"),
      e(282, 2, "10–15", 60, 6, "body"),
      e(68, 2, "6–8", 45, 5, "side"),
    ]),
    d(B, [
      e(542, 2, "6–10", 60, 6, "side"),
      e(760, 2, "8–12", 60, 6, "body"),
      e(633, 2, "6–10", 60, 6, "side"),
      e(185, 2, "6–10", 45, 5, "side"),
    ]),
  ],
  bodyProgress,
);
add(
  "kinra-dumbbell-full-body",
  L(
    "Dumbbell full body · 3 days",
    "Cijelo tijelo s bučicama · 3 dana",
    "Kurzhantel-Ganzkörper · 3 Tage",
  ),
  L(
    "Three alternating sessions with a pair of dumbbells and a stable bench. Allow a rest day between sessions.",
    "Tri različita treninga uz par bučica i stabilnu klupu. Ostavite dan odmora između treninga.",
    "Drei wechselnde Einheiten mit zwei Kurzhanteln und stabiler Bank. Einen Ruhetag zwischen Einheiten einplanen.",
  ),
  full,
  beginner,
  ["dumbbell", "bench", "mat"],
  6,
  40,
  [
    d(A, [
      e(284, 3),
      e(628, 3, "8–12", 90, 7, "side"),
      e(364, 3, "8–12", 90, 7, "body"),
      e(224),
      e(185, 2, "8", 45, 6, "side"),
    ]),
    d(B, [
      e(619, 2, "8–10", 90, 7, "side"),
      e(233, 3),
      e(628, 3, "10–12", 90, 7, "side"),
      e(228, 2, "8–10", 90, 7, "side"),
      e(218),
    ]),
    d(C, [
      e(284, 3, "10–12"),
      e(628, 3, "10–12", 90, 7, "side"),
      e(507, 3, "6–12", 90, 7, "body"),
      e(224, 3, "10–15"),
      e(238, 2, "12–15", 60),
    ]),
  ],
);
const upperA = d(L("A · Upper", "A · Gornji dio", "A · Oberkörper"), [
  e(60, 3, "6–10", 150, 7, "bar"),
  e(574, 3),
  e(233, 2),
  e(377, 2),
  e(227, 2, "12–15", 60),
  e(554, 2, "10–15", 60),
]);
const upperB = d(L("B · Upper", "B · Gornji dio", "B · Oberkörper"), [
  e(330, 3, "8–12", 120, 7, "bar"),
  e(152, 3),
  e(377, 3),
  e(227, 2, "12–15", 60),
  e(218, 2, "10–15", 60),
]);
const lowerA = d(L("A · Lower", "A · Donji dio", "A · Unterkörper"), [
  e(35, 3, "6–10", 180, 7, "bar"),
  e(549, 3, "8–10", 150, 7, "bar"),
  e(392, 2, "10–15", 75),
  e(575, 3, "10–15", 60),
  e(185, 2, "8–10", 60, 6, "side"),
]);
const lowerB = d(L("B · Lower", "B · Donji dio", "B · Unterkörper"), [
  e(393, 3, "10–12", 120),
  e(582, 3, "10–15", 90),
  e(94, 2, "8–10", 90, 7, "side"),
  e(679, 3, "10–15", 60),
  e(68, 2, "8", 45, 6, "side"),
]);
add(
  "kinra-upper-lower",
  L("Upper / lower · 4 days", "Gornji / donji dio · 4 dana", "Oberkörper / Unterkörper · 4 Tage"),
  L(
    "A balanced four-session split: upper, lower, rest, upper, lower. A repeatable next step after full-body training.",
    "Uravnotežena podjela: gornji dio, donji dio, odmor, gornji dio, donji dio. Sljedeći korak nakon treninga cijelog tijela.",
    "Ausgewogener Ablauf: Oberkörper, Unterkörper, Pause, Oberkörper, Unterkörper. Ein wiederholbarer nächster Schritt nach Ganzkörpertraining.",
  ),
  full,
  intermediate,
  ["gym", "rack"],
  8,
  55,
  [upperA, lowerA, upperB, lowerB],
);
add(
  "kinra-strength-three",
  L("Strength practice · 3 days", "Vježbanje snage · 3 dana", "Kraftpraxis · 3 Tage"),
  L(
    "Low-rep barbell practice with modest accessory work for adults already familiar with these lifts. No max testing.",
    "Vježbanje šipkom s manjim brojem ponavljanja i umjerenim dodacima za odrasle koji poznaju ove pokrete. Bez testiranja maksimuma.",
    "Langhantelpraxis mit wenigen Wiederholungen und überschaubaren Zusatzübungen für Erwachsene mit Übungserfahrung. Keine Maximaltests.",
  ),
  L("Strength", "Snaga", "Kraft"),
  intermediate,
  ["gym", "rack"],
  6,
  55,
  [
    d(A, [
      e(35, 3, "4–6", 180, 8, "bar"),
      e(60, 3, "4–6", 180, 8, "bar"),
      e(574, 3, "6–8", 120),
      e(185, 2, "8", 60, 6, "side"),
    ]),
    d(B, [
      e(169, 2, "3–5", 180, 8, "bar"),
      e(233, 3, "5–8", 150),
      e(377, 3, "6–8", 120),
      e(542, 2, "8", 90, 7, "side"),
    ]),
    d(C, [
      e(35, 3, "5–6", 180, 7, "bar"),
      e(60, 3, "5–6", 180, 7, "bar"),
      e(152, 3, "6–10", 120),
      e(582, 2, "10–12", 90),
    ]),
  ],
  L(
    "Begin below your recent working loads. Keep about 2 reps in reserve (RPE 8 maximum). Add one rep within the range first; increase the smallest load only when all sets meet the top with consistent technique. In week 4 reduce each main lift by one set, then resume only if recovered.",
    "Počnite ispod nedavnih radnih opterećenja. Zadržite oko 2 ponavljanja u rezervi (najviše RPE 8). Prvo dodajte ponavljanje unutar raspona; najmanje opterećenje dodajte tek kada su sve serije na gornjoj granici uz dobru tehniku. U četvrtoj sedmici smanjite glavne vježbe za jednu seriju, pa nastavite kada se oporavite.",
    "Unter den letzten Arbeitsgewichten beginnen. Etwa 2 Wiederholungen Reserve lassen (höchstens RPE 8). Zuerst Wiederholungen im Bereich ergänzen; das kleinste Gewicht erst erhöhen, wenn alle Sätze technisch konstant oben liegen. In Woche 4 bei jeder Hauptübung einen Satz weniger, danach bei ausreichender Erholung fortsetzen.",
  ),
);
add(
  "kinra-muscle-four",
  L("Muscle building · 4 days", "Razvoj mišića · 4 dana", "Muskelaufbau · 4 Tage"),
  L(
    "A four-day upper/lower example with additional chest, back and leg work. Use upper, lower, rest, upper, lower.",
    "Četverodnevni primjer s dodatnim radom za prsa, leđa i noge. Redoslijed: gornji, donji, odmor, gornji, donji.",
    "Vier Ober-/Unterkörpereinheiten mit zusätzlicher Brust-, Rücken- und Beinarbeit. Reihenfolge: oben, unten, Pause, oben, unten.",
  ),
  growth,
  intermediate,
  ["gym", "rack"],
  8,
  65,
  [
    d(upperA.title, [...upperA.exercises, e(266, 2, "10–15", 90)]),
    d(lowerA.title, [...lowerA.exercises, e(582, 2, "10–15", 90)]),
    d(upperB.title, [...upperB.exercises, e(266, 2, "10–15", 90), e(554, 2, "10–15", 60)]),
    d(lowerB.title, [...lowerB.exercises, e(392, 2, "10–15", 75)]),
  ],
);
add(
  "kinra-mobility-practice",
  L("Comfortable movement · 3 days", "Ugodno kretanje · 3 dana", "Angenehme Bewegung · 3 Tage"),
  L(
    "Short, repetition-based mobility practice for hips, shoulders and the upper back. General movement practice, with no injury-treatment claim.",
    "Kratke sesije mobilnosti kukova, ramena i gornjeg dijela leđa uz brojanje ponavljanja. Opće kretanje, bez tvrdnje o liječenju povrede.",
    "Kurze Mobilitätspraxis für Hüfte, Schultern und oberen Rücken mit Wiederholungen. Allgemeine Bewegung ohne Anspruch auf Verletzungsbehandlung.",
  ),
  movement,
  beginner,
  ["mat", "body"],
  4,
  15,
  [
    d(L("A · Hips and spine", "A · Kukovi i kičma", "A · Hüfte und Wirbelsäule"), [
      e(143, 2, "6–8", 30, 3, "mobility"),
      e(312, 2, "6", 30, 3, "side"),
      e(242, 2, "6", 30, 3, "side"),
      e(185, 2, "6", 30, 4, "side"),
    ]),
    d(
      L(
        "B · Shoulders and upper back",
        "B · Ramena i gornja leđa",
        "B · Schultern und oberer Rücken",
      ),
      [
        e(27, 2, "8", 30, 3, "mobility"),
        e(762, 2, "8", 30, 3, "mobility"),
        e(583, 2, "6", 30, 3, "side"),
        e(68, 2, "6", 30, 4, "side"),
      ],
    ),
    d(L("C · Whole-body movement", "C · Kretanje cijelog tijela", "C · Ganzkörperbewegung"), [
      e(143, 2, "6", 30, 3, "mobility"),
      e(667, 2, "6", 45, 3, "mobility"),
      e(512, 2, "6", 30, 3, "side"),
      e(762, 2, "8", 30, 3, "mobility"),
    ]),
  ],
  mobilityProgress,
);
add(
  "kinra-hotel-travel",
  L("Travel reset · 2 days", "Trening na putu · 2 dana", "Training unterwegs · 2 Tage"),
  L(
    "Two compact bodyweight sessions for travel. No doorframe, suitcase or furniture anchors required; pulling work is limited.",
    "Dva kratka treninga vlastitom težinom na putu. Bez vješanja o vrata, kofere ili namještaj; povlačenje je ograničeno.",
    "Zwei kompakte Körpergewichtseinheiten auf Reisen. Keine Türrahmen-, Koffer- oder Möbelanker erforderlich; Zugübungen sind begrenzt.",
  ),
  full,
  beginner,
  ["body", "mat"],
  2,
  20,
  [
    d(A, [
      e(71, 2, "10–15", 60, 6, "body"),
      e(364, 2, "6–12", 60, 6, "body"),
      e(282, 2, "12–15", 60, 6, "body"),
      e(185, 2, "8", 45, 5, "side"),
    ]),
    d(B, [
      e(542, 2, "8–10", 60, 6, "side"),
      e(760, 2, "10–15", 60, 6, "body"),
      e(68, 2, "8", 45, 5, "side"),
      e(140, 2, "12–15", 45, 5, "body"),
    ]),
  ],
  bodyProgress,
);
add(
  "kinra-band-full-body",
  L("Band full body · 3 days", "Cijelo tijelo s trakom · 3 dana", "Band-Ganzkörper · 3 Tage"),
  L(
    "Light portable resistance with a manufacturer-approved anchor. Alternate controlled leg, push and pull work.",
    "Lagani prenosivi otpor sa sidrom koje odobrava proizvođač. Smjenjujte kontrolisani rad za noge, potiske i povlačenja.",
    "Leichter tragbarer Widerstand mit vom Hersteller geeignetem Anker. Kontrollierte Bein-, Druck- und Zugarbeit im Wechsel.",
  ),
  full,
  beginner,
  ["band", "mat", "body"],
  6,
  35,
  [
    d(A, [
      e(71, 3, "10–15", 60, 6, "body"),
      e(618, 3, "10–15", 75, 7, "band"),
      e(517, 2, "10–15", 75, 6, "band"),
      e(521, 3, "12–15", 60, 7, "band"),
      e(518, 2, "12–15", 60, 6, "band"),
    ]),
    d(B, [
      e(542, 2, "8–12", 75, 7, "side"),
      e(525, 3, "10–15", 75, 7, "band"),
      e(364, 2, "8–12", 75, 7, "body"),
      e(528, 2, "12–15", 60, 7, "band"),
      e(527, 2, "12–15", 60, 6, "band"),
    ]),
    d(C, [
      e(71, 3, "12–15", 60, 7, "body"),
      e(618, 3, "12–15", 75, 7, "band"),
      e(517, 3, "10–15", 75, 7, "band"),
      e(521, 2, "12–15", 60, 7, "band"),
      e(533, 2, "12–15", 60, 6, "band"),
    ]),
  ],
);
add(
  "kinra-strength-conditioning",
  L("Strength + movement · 3 days", "Snaga i kretanje · 3 dana", "Kraft + Bewegung · 3 Tage"),
  L(
    "Two strength sessions and a counted movement circuit. The circuit is a conditioning example, not a complete weekly aerobic prescription.",
    "Dva treninga snage i kružni trening uz brojanje pokreta. Krug je primjer kondicijskog rada, a ne potpuni sedmični aerobni plan.",
    "Zwei Krafteinheiten und ein gezählter Bewegungszirkel. Der Zirkel ist ein Konditionsbeispiel, kein vollständiger Wochenplan für Ausdauer.",
  ),
  condition,
  beginner,
  ["dumbbell", "mat", "body"],
  6,
  35,
  [
    d(A, [
      e(284, 3),
      e(628, 3, "10", 90, 7, "side"),
      e(364, 3, "8–12", 75, 7, "body"),
      e(224, 2, "12–15"),
    ]),
    d(
      L(
        "B · Counted movement circuit",
        "B · Krug s brojanjem pokreta",
        "B · Gezählter Bewegungszirkel",
      ),
      [
        e(688, 3, "30", 45, 5, "cardio"),
        e(71, 3, "12", 60, 6, "body"),
        e(354, 3, "15", 60, 5, "cardio"),
        e(68, 3, "6", 45, 5, "side"),
      ],
    ),
    d(C, [
      e(228, 2, "8–10", 90, 7, "side"),
      e(233, 3),
      e(628, 3, "10–12", 90, 7, "side"),
      e(185, 2, "8", 60, 6, "side"),
    ]),
  ],
);
add(
  "kinra-kettlebell-basics",
  L("Kettlebell basics · 2 days", "Osnove s girjom · 2 dana", "Kettlebell-Grundlagen · 2 Tage"),
  L(
    "Controlled strength with a single kettlebell and bodyweight. No ballistic swings or snatches are required.",
    "Kontrolisana snaga s jednom girjom i vlastitom težinom. Nisu potrebni zamasi ni trzaji.",
    "Kontrollierte Kraft mit einer Kettlebell und Körpergewicht. Keine ballistischen Swings oder Snatches erforderlich.",
  ),
  full,
  beginner,
  ["kettlebell", "mat", "body"],
  6,
  30,
  [
    d(A, [
      e(356, 3),
      e(364, 3, "8–12", 90, 7, "body"),
      e(282, 3, "12–15", 60, 7, "body"),
      e(68, 2, "8", 45, 6, "side"),
    ]),
    d(B, [
      e(356, 3, "10–12"),
      e(542, 3, "8", 90, 7, "side"),
      e(507, 2, "6–12", 90, 7, "body"),
      e(185, 2, "8", 60, 6, "side"),
    ]),
  ],
  standard,
  L(
    "This minimal-equipment example lacks loaded pulling. Pair with a reviewed row variation when suitable equipment is available.",
    "Ovaj primjer s malo opreme nema povlačenje s opterećenjem. Dopunite pregledanom varijantom veslanja kada imate odgovarajuću opremu.",
    "Diesem Beispiel mit wenig Geräten fehlt belastetes Ziehen. Bei geeigneter Ausrüstung eine geprüfte Ruderübung ergänzen.",
  ),
);
add(
  "kinra-machine-circuit",
  L("Machine circuit · 2 days", "Krug na spravama · 2 dana", "Gerätezirkel · 2 Tage"),
  L(
    "A machine-based full-body routine with simple setup. Complete all sets on each station before moving on.",
    "Trening cijelog tijela na spravama s jednostavnom pripremom. Završite sve serije na spravi prije prelaska dalje.",
    "Eine Ganzkörperroutine an Geräten mit einfacher Vorbereitung. Alle Sätze an einer Station abschließen, dann wechseln.",
  ),
  full,
  beginner,
  ["gym"],
  6,
  40,
  [
    d(A, [
      e(393, 2, "10–15"),
      e(266, 2, "10–15"),
      e(413, 2, "10–15"),
      e(582, 2, "10–15"),
      e(679, 2, "12–15", 60),
    ]),
    d(B, [
      e(393, 2, "10–15"),
      e(266, 2, "10–15"),
      e(574, 2, "10–15"),
      e(392, 2, "10–15"),
      e(417, 2, "10–15", 60),
    ]),
  ],
);
add(
  "kinra-short-sessions",
  L(
    "Short gym sessions · 2 days",
    "Kratki treninzi u teretani · 2 dana",
    "Kurze Studioeinheiten · 2 Tage",
  ),
  L(
    "Four movements per session for busy weeks. A small repeatable routine with squat, hinge, push and pull patterns.",
    "Četiri pokreta po treningu za zauzete sedmice. Kratak ponovljiv plan s čučnjem, pregibom u kuku, potiskom i povlačenjem.",
    "Vier Bewegungen je Einheit für volle Wochen. Eine kleine wiederholbare Routine mit Kniebeuge, Hüftbeuge, Drücken und Ziehen.",
  ),
  full,
  beginner,
  ["gym", "dumbbell"],
  4,
  25,
  [
    d(A, [e(284, 2), e(266, 2), e(377, 2), e(185, 2, "8", 45, 6, "side")]),
    d(B, [e(549, 2, "8–12", 120, 7, "bar"), e(233, 2), e(574, 2), e(542, 2, "8", 75, 7, "side")]),
  ],
);
add(
  "kinra-cable-dumbbell",
  L("Cable + dumbbell · 3 days", "Sajle i bučice · 3 dana", "Kabel + Kurzhantel · 3 Tage"),
  L(
    "Full-body training without barbell racks. Rotate cable pulling, dumbbell leg work and machine pressing.",
    "Trening cijelog tijela bez stalka za šipku. Smjenjujte povlačenja sajlom, rad nogu s bučicama i potiske na spravama.",
    "Ganzkörpertraining ohne Langhantelrack. Kabelziehen, Beinarbeit mit Kurzhanteln und Gerätedrücken im Wechsel.",
  ),
  full,
  intermediate,
  ["gym", "dumbbell"],
  6,
  45,
  [
    d(A, [e(284, 3), e(574, 3), e(266, 3), e(582, 2), e(227, 2, "12–15", 60)]),
    d(B, [
      e(228, 3, "8–10", 90, 7, "side"),
      e(377, 3),
      e(233, 3),
      e(224, 3, "10–15"),
      e(218, 2, "10–15", 60),
    ]),
    d(C, [
      e(393, 3),
      e(628, 3, "10–12", 90, 7, "side"),
      e(676, 3),
      e(582, 3),
      e(554, 2, "10–15", 60),
    ]),
  ],
);
add(
  "kinra-lower-focus",
  L("Lower-body focus · 2 days", "Fokus na donji dio · 2 dana", "Unterkörper-Fokus · 2 Tage"),
  L(
    "Two leg-focused sessions for an existing balanced schedule. Add your reviewed upper-body sessions; this is not a full-body week.",
    "Dva treninga nogu kao dio postojećeg uravnoteženog rasporeda. Dodajte pregledane treninge gornjeg dijela; ovo nije sedmica za cijelo tijelo.",
    "Zwei Beineinheiten als Teil eines ausgewogenen Plans. Geprüfte Oberkörpereinheiten ergänzen; dies ist keine Ganzkörperwoche.",
  ),
  growth,
  intermediate,
  ["gym", "rack"],
  6,
  45,
  [lowerA, lowerB],
);
add(
  "kinra-upper-focus",
  L("Upper-body focus · 2 days", "Fokus na gornji dio · 2 dana", "Oberkörper-Fokus · 2 Tage"),
  L(
    "Two complementary push/pull sessions for an existing balanced schedule. Add reviewed lower-body work.",
    "Dva komplementarna treninga potiska i povlačenja u postojećem uravnoteženom rasporedu. Dodajte pregledan rad za donji dio.",
    "Zwei ergänzende Druck-/Zugeinheiten in einem ausgewogenen Plan. Geprüftes Unterkörpertraining ergänzen.",
  ),
  growth,
  intermediate,
  ["gym", "rack"],
  6,
  50,
  [upperA, upperB],
);
add(
  "kinra-easy-restart",
  L("Easy restart · 2 days", "Lagani povratak · 2 dana", "Leichter Wiedereinstieg · 2 Tage"),
  L(
    "A small, low-effort starting week for adults returning after an ordinary break. This is not rehabilitation or a post-illness clearance plan.",
    "Kratka početna sedmica manjeg napora za odrasle nakon uobičajene pauze. Ovo nije rehabilitacija niti plan povratka nakon bolesti.",
    "Eine kleine Einstiegswoche mit geringer Anstrengung nach einer gewöhnlichen Pause. Kein Rehabilitations- oder Freigabeplan nach Krankheit.",
  ),
  full,
  beginner,
  ["gym", "mat"],
  4,
  25,
  [
    d(A, [
      e(393, 1, "8–10", 90, 5),
      e(266, 1, "8–10", 90, 5),
      e(377, 1, "8–10", 90, 5),
      e(185, 1, "6", 60, 5, "side"),
    ]),
    d(B, [
      e(284, 1, "8–10", 90, 5),
      e(574, 1, "8–10", 90, 5),
      e(364, 1, "6–8", 90, 5, "body"),
      e(282, 1, "8–10", 60, 5, "body"),
    ]),
  ],
  L(
    "Week 1: use one easy set per exercise with about 5 reps in reserve (RPE 5). If comfortable and recovered, use two sets in week 2 and keep them through weeks 3–4. Add reps within the range before adding load. Reassess before moving to a larger routine.",
    "Prva sedmica: jedna lagana serija uz oko 5 ponavljanja u rezervi (RPE 5). Ako vam odgovara i oporavljeni ste, u drugoj sedmici radite dvije serije i zadržite ih do četvrte. Dodajte ponavljanja unutar raspona prije opterećenja. Ponovo procijenite prije većeg plana.",
    "Woche 1: ein leichter Satz je Übung mit etwa 5 Wiederholungen Reserve (RPE 5). Bei guter Verträglichkeit und Erholung ab Woche 2 zwei Sätze bis Woche 4. Zuerst Wiederholungen im Bereich, dann Gewicht ergänzen. Vor einem größeren Plan neu bewerten.",
  ),
);
add(
  "kinra-bodyweight-build",
  L(
    "Bodyweight build · 3 days",
    "Napredak vlastitom težinom · 3 dana",
    "Körpergewicht-Aufbau · 3 Tage",
  ),
  L(
    "Three sessions for adults comfortable with floor push-ups. Includes a rated fixed bar for rows and a stable low step.",
    "Tri treninga za odrasle koji sigurno rade sklekove na podu. Potrebna je čvrsto postavljena prečka za veslanje i niska stabilna stepenica.",
    "Drei Einheiten für Erwachsene mit sicherem Liegestütz am Boden. Mit belastbarer fester Ruderstange und stabiler niedriger Stufe.",
  ),
  full,
  intermediate,
  ["body", "mat", "step", "fixedbar"],
  6,
  35,
  [
    d(A, [
      e(507, 3, "8–15", 90, 7, "body"),
      e(345, 3, "6–12", 90, 7, "body"),
      e(542, 3, "10–12", 75, 7, "side"),
      e(185, 2, "10", 60, 6, "side"),
    ]),
    d(B, [
      e(691, 3, "8–12", 75, 7, "step"),
      e(462, 2, "5–10", 90, 7, "body"),
      e(345, 3, "8–12", 90, 7, "body"),
      e(633, 3, "10–12", 60, 7, "side"),
    ]),
    d(C, [
      e(507, 3, "8–15", 90, 7, "body"),
      e(345, 3, "8–12", 90, 7, "body"),
      e(71, 3, "15–20", 60, 7, "body"),
      e(68, 2, "10", 45, 6, "side"),
    ]),
  ],
  bodyProgress,
  L(
    "Use only a purpose-built, load-rated fixed bar for rows. Review mounting and body position before training; never substitute a table or loose furniture.",
    "Za veslanje koristite samo namjensku čvrstu prečku odgovarajuće nosivosti. Provjerite montažu i položaj tijela; ne koristite sto ili labav namještaj.",
    "Für Rudern nur eine dafür vorgesehene, belastbare feste Stange verwenden. Montage und Körperposition prüfen; keinen Tisch oder lose Möbel ersetzen.",
  ),
);

const output = specs.map((s) =>
  Object.fromEntries(
    langs.map((lang, i) => [
      lang,
      {
        id: s.id,
        type: "training",
        title: pick(s.title, i),
        summary: pick(s.summary, i),
        goal: pick(s.goal, i),
        level: pick(s.level, i),
        equipment: s.eq.map((k) => pick(equipment[k], i)),
        weeks: s.weeks,
        sessionsPerWeek: s.days.length,
        minutes: s.minutes,
        author: "Kinra",
        progression: pick(s.progress, i),
        considerations: [pick(audience, i), pick(s.extra, i)].filter(Boolean).join(" "),
        sources,
        days: s.days.map((day) => ({
          title: pick(day.title, i),
          exercises: day.exercises.map((x) => {
            const entry = catalogue.find((v) =>
              v.id.startsWith(`exercise-${String(x.n).padStart(4, "0")}-`),
            );
            if (!entry) throw Error(`Missing exercise ${x.n}`);
            return {
              catalogue_id: entry.id,
              name: entry.name,
              sets: x.sets,
              reps: x.reps,
              rest_seconds: x.rest,
              rpe: x.rpe,
              section: "main",
              ...([
                71, 364, 282, 68, 542, 760, 633, 185, 140, 143, 312, 242, 27, 762, 583, 667, 512,
                688, 354, 507, 345, 691, 462,
              ].includes(x.n)
                ? { weight: 0 }
                : {}),
              notes: pick(cue[x.note], i),
            };
          }),
        })),
      },
    ]),
  ),
);

const foods = {
  oats: [
    "173904",
    L("Oats, dry", "Zobene pahuljice, suhe", "Haferflocken, trocken"),
    L("g dry; cook with water", "g suho; skuhati s vodom", "g trocken; mit Wasser kochen"),
  ],
  banana: [
    "173944",
    L("Banana, raw, peeled", "Banana, sirova, oguljena", "Banane, roh, geschält"),
    L("g edible portion", "g jestivog dijela", "g essbarer Anteil"),
  ],
  almonds: ["170567", L("Almonds", "Bademi", "Mandeln"), L("g", "g", "g")],
  oil: ["171413", L("Olive oil", "Maslinovo ulje", "Olivenöl"), L("g", "g", "g")],
  rice: [
    "169704",
    L(
      "Brown long-grain rice, cooked",
      "Smeđa riža dugog zrna, kuhana",
      "Vollkorn-Langkornreis, gekocht",
    ),
    L("g cooked", "g kuhano", "g gekocht"),
  ],
  chicken: [
    "171477",
    L(
      "Chicken breast, roasted, meat only",
      "Pileća prsa, pečena, samo meso",
      "Hähnchenbrust, gegart, nur Fleisch",
    ),
    L("g cooked", "g pečeno", "g gegart"),
  ],
  yogurt: [
    "170894",
    L(
      "Plain nonfat Greek yogurt",
      "Grčki jogurt, obični, bez masti",
      "Griechischer Naturjoghurt, fettfrei",
    ),
    L("g", "g", "g"),
  ],
  chickpeas: [
    "173757",
    L(
      "Chickpeas, boiled without salt",
      "Slanutak, kuhan bez soli",
      "Kichererbsen, ohne Salz gekocht",
    ),
    L("g cooked and drained", "g kuhano i ocijeđeno", "g gekocht und abgetropft"),
  ],
  broccoli: [
    "169967",
    L("Broccoli, boiled without salt", "Brokula, kuhana bez soli", "Brokkoli, ohne Salz gekocht"),
    L("g cooked and drained", "g kuhano i ocijeđeno", "g gekocht und abgetropft"),
  ],
  egg: [
    "173424",
    L("Egg, hard-boiled", "Jaje, tvrdo kuhano", "Ei, hartgekocht"),
    L("g peeled", "g bez ljuske", "g ohne Schale"),
  ],
  lentils: [
    "172421",
    L("Lentils, boiled without salt", "Leća, kuhana bez soli", "Linsen, ohne Salz gekocht"),
    L("g cooked and drained", "g kuhano i ocijeđeno", "g gekocht und abgetropft"),
  ],
  salmon: [
    "175168",
    L(
      "Atlantic farmed salmon, cooked",
      "Atlantski uzgojeni losos, pečen",
      "Atlantischer Zuchtlachs, gegart",
    ),
    L("g cooked", "g pečeno", "g gegart"),
  ],
  potato: [
    "170093",
    L(
      "Potato, baked with skin, no salt",
      "Krompir, pečen s korom, bez soli",
      "Kartoffel, mit Schale gebacken, ohne Salz",
    ),
    L("g cooked", "g pečeno", "g gegart"),
  ],
  bread: [
    "172688",
    L("Whole-wheat bread", "Integralni hljeb", "Vollkornweizenbrot"),
    L("g", "g", "g"),
  ],
  apple: [
    "171688",
    L("Apple, raw with skin", "Jabuka, sirova s korom", "Apfel, roh mit Schale"),
    L("g edible portion", "g jestivog dijela", "g essbarer Anteil"),
  ],
  tofu: [
    "172475",
    L(
      "Firm tofu, calcium-set, raw",
      "Čvrsti tofu s kalcijem, sirov",
      "Fester Tofu, mit Kalzium hergestellt, roh",
    ),
    L("g before cooking", "g prije pripreme", "g vor dem Garen"),
  ],
};
const breakfast = L("Breakfast", "Doručak", "Frühstück"),
  lunch = L("Lunch", "Ručak", "Mittagessen"),
  dinner = L("Dinner", "Večera", "Abendessen"),
  snack = L("Snack", "Užina", "Zwischenmahlzeit");
const nutritionNotes = L(
  "One illustrative day, not a calorie target or weight-loss prescription. Portions and food choices are editable. Values are estimates calculated from USDA SR Legacy April 2018 per-100 g ingredient data; calories rounded to whole kcal, macros to 0.1 g. Weights refer to the stated edible/prepared form. Water, herbs and salt are not included; add all other ingredients separately. Check labels, allergies and individual needs. No supplements are included.",
  "Jedan ilustrativni dan, bez propisivanja kalorijskog cilja ili mršavljenja. Porcije i namirnice se mogu mijenjati. Procjene su izračunate iz USDA SR Legacy podataka iz aprila 2018. za 100 g; kalorije su zaokružene na cijele kcal, makronutrijenti na 0,1 g. Težine se odnose na navedeni jestivi/pripremljeni oblik. Voda, začinsko bilje i so nisu uračunati; ostale dodatke unesite zasebno. Provjerite deklaracije, alergije i lične potrebe. Suplementi nisu uključeni.",
  "Ein beispielhafter Tag ohne Kalorienziel oder Vorgabe zum Abnehmen. Portionen und Lebensmittel sind anpassbar. Schätzwerte aus USDA SR Legacy vom April 2018 je 100 g; Kalorien auf ganze kcal, Makros auf 0,1 g gerundet. Gewichte beziehen sich auf die genannte essbare/zubereitete Form. Wasser, Kräuter und Salz sind nicht eingerechnet; andere Zutaten separat ergänzen. Etiketten, Allergien und individuelle Bedürfnisse prüfen. Keine Nahrungsergänzungsmittel enthalten.",
);
const nutritionSpecs = [
  [
    "kinra-everyday-meals",
    L("Everyday balanced example", "Primjer svakodnevnih obroka", "Beispiel für Alltagsmahlzeiten"),
    L(
      "Oats and yogurt, chicken and rice, then lentils and potato. Four meals with explicit prepared weights.",
      "Zob i jogurt, piletina i riža, zatim leća i krompir. Četiri obroka s navedenim težinama.",
      "Hafer und Joghurt, Hähnchen und Reis, danach Linsen und Kartoffeln. Vier Mahlzeiten mit klaren Gewichtsangaben.",
    ),
    [
      [
        breakfast,
        [
          ["oats", 60],
          ["yogurt", 200],
          ["banana", 120],
        ],
      ],
      [
        lunch,
        [
          ["chicken", 150],
          ["rice", 220],
          ["broccoli", 150],
          ["oil", 15],
        ],
      ],
      [
        dinner,
        [
          ["lentils", 220],
          ["potato", 250],
          ["broccoli", 150],
          ["oil", 15],
        ],
      ],
      [
        snack,
        [
          ["apple", 180],
          ["almonds", 30],
        ],
      ],
    ],
  ],
  [
    "kinra-plant-day",
    L("Plant-based day example", "Primjer biljnog dana", "Beispiel für einen pflanzlichen Tag"),
    L(
      "Oats, tofu, chickpeas and lentils in a fully plant-based example. Review wider nutrient needs separately.",
      "Zob, tofu, slanutak i leća u potpuno biljnom primjeru. Zasebno razmotrite šire potrebe za nutrijentima.",
      "Hafer, Tofu, Kichererbsen und Linsen in einem rein pflanzlichen Beispiel. Weiteren Nährstoffbedarf separat prüfen.",
    ),
    [
      [
        breakfast,
        [
          ["oats", 80],
          ["banana", 120],
          ["almonds", 25],
        ],
      ],
      [
        lunch,
        [
          ["tofu", 180],
          ["rice", 220],
          ["broccoli", 150],
          ["oil", 10],
        ],
      ],
      [
        dinner,
        [
          ["chickpeas", 220],
          ["potato", 250],
          ["broccoli", 150],
          ["oil", 10],
        ],
      ],
      [
        snack,
        [
          ["apple", 180],
          ["bread", 80],
          ["lentils", 100],
        ],
      ],
    ],
  ],
  [
    "kinra-vegetarian-day",
    L(
      "Vegetarian day example",
      "Primjer vegetarijanskog dana",
      "Beispiel für einen vegetarischen Tag",
    ),
    L(
      "Eggs, dairy, lentils and tofu across four ordinary meals. No powders or supplement doses.",
      "Jaja, mliječni proizvodi, leća i tofu u četiri obična obroka. Bez proteinskih praškova ili doza suplemenata.",
      "Eier, Milchprodukte, Linsen und Tofu in vier normalen Mahlzeiten. Ohne Pulver oder Supplementdosierungen.",
    ),
    [
      [
        breakfast,
        [
          ["egg", 100],
          ["bread", 100],
          ["banana", 120],
        ],
      ],
      [
        lunch,
        [
          ["lentils", 250],
          ["rice", 200],
          ["broccoli", 150],
          ["oil", 15],
        ],
      ],
      [
        dinner,
        [
          ["tofu", 180],
          ["potato", 250],
          ["broccoli", 150],
          ["oil", 10],
        ],
      ],
      [
        snack,
        [
          ["yogurt", 250],
          ["apple", 180],
          ["almonds", 25],
        ],
      ],
    ],
  ],
  [
    "kinra-fish-day",
    L("Fish and grains example", "Primjer s ribom i žitaricama", "Beispiel mit Fisch und Getreide"),
    L(
      "A fish meal with oats, yogurt and a chickpea lunch. All additions and portion estimates remain visible.",
      "Obrok s ribom uz zob, jogurt i ručak sa slanutkom. Svi dodaci i procjene porcija su vidljivi.",
      "Eine Fischmahlzeit mit Hafer, Joghurt und Kichererbsen zum Mittag. Alle Zutaten und Portionsschätzungen bleiben sichtbar.",
    ),
    [
      [
        breakfast,
        [
          ["oats", 70],
          ["yogurt", 200],
          ["banana", 120],
        ],
      ],
      [
        lunch,
        [
          ["chickpeas", 220],
          ["rice", 180],
          ["broccoli", 150],
          ["oil", 15],
        ],
      ],
      [
        dinner,
        [
          ["salmon", 170],
          ["potato", 300],
          ["broccoli", 150],
          ["oil", 10],
        ],
      ],
      [
        snack,
        [
          ["apple", 180],
          ["almonds", 30],
          ["bread", 60],
        ],
      ],
    ],
  ],
];
for (const [id, title, summary, meals] of nutritionSpecs) {
  const ingredients = meals.flatMap(([, items], mi) =>
    items.map(([key, grams], fi) => ({ meal: mi, food: fi, fdcId: foods[key][0], grams })),
  );
  output.push(
    Object.fromEntries(
      langs.map((lang, i) => [
        lang,
        {
          id,
          type: "nutrition",
          title: pick(title, i),
          summary: pick(summary, i),
          goal: pick(
            L(
              "Meal planning example",
              "Primjer planiranja obroka",
              "Beispiel zur Mahlzeitenplanung",
            ),
            i,
          ),
          level: pick(
            L(
              "General adult example",
              "Opći primjer za odrasle",
              "Allgemeines Erwachsenenbeispiel",
            ),
            i,
          ),
          equipment: [],
          weeks: 1,
          days: [],
          sessionsPerWeek: 0,
          minutes: 0,
          author: "Kinra",
          progression: pick(
            L(
              "Review and edit this example day before use. Repeat or swap foods deliberately; this example does not set a daily energy requirement.",
              "Pregledajte i uredite primjer prije upotrebe. Ponavljajte ili mijenjajte namirnice svjesno; primjer ne određuje dnevnu energetsku potrebu.",
              "Den Beispieltag vor Nutzung prüfen und bearbeiten. Lebensmittel bewusst wiederholen oder austauschen; dieses Beispiel legt keinen täglichen Energiebedarf fest.",
            ),
            i,
          ),
          considerations: pick(nutritionNotes, i),
          ingredients,
          sources: [
            {
              title: "USDA FoodData Central · SR Legacy April 2018 (ingredient estimates)",
              url: "https://fdc.nal.usda.gov/download-datasets/",
              observedDate: "2026-10-19",
            },
          ],
          nutrition: {
            title: pick(title, i),
            notes: pick(nutritionNotes, i),
            meals: meals.map(([name, items]) => ({
              name: pick(name, i),
              foods: items.map(([key, grams]) => {
                const [fdcId, foodName, unit] = foods[key];
                const ref = refs.find((r) => r.fdcId === fdcId);
                if (!ref) throw Error(`Missing food ${fdcId}`);
                const macros = Object.fromEntries(
                  Object.entries(ref.per100g).map(([k, v]) => [
                    k,
                    k === "calories"
                      ? Math.round((v * grams) / 100)
                      : Math.round((v * grams) / 10) / 10,
                  ]),
                );
                return {
                  name: pick(foodName, i),
                  quantity: `${grams} ${pick(unit, i)}`,
                  ...macros,
                };
              }),
            })),
          },
        },
      ]),
    ),
  );
}
fs.writeFileSync("src/data/program-templates.json", JSON.stringify(output, null, 2) + "\n");
console.log(
  `Wrote ${specs.length} original training and ${nutritionSpecs.length} nutrition templates in ${langs.length} languages.`,
);
