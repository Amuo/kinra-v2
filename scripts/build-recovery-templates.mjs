import fs from "node:fs";
const catalogue = JSON.parse(fs.readFileSync("src/data/exercises.json", "utf8"));
const get = (number) => catalogue.find((e) => Number(e.id.split("-")[1]) === number);
const rows = [
  [
    "post-leg-mobility",
    "After legs · gentle mobility|Nakon nogu · lagana mobilnost|Nach dem Beintraining · sanfte Mobilität",
    [757, 5, 305, 205],
  ],
  [
    "post-upper-mobility",
    "After upper body · easy movement|Nakon gornjeg dijela · lagani pokreti|Nach dem Oberkörpertraining · lockere Bewegung",
    [27, 72, 587, 205],
  ],
  [
    "post-cardio-mobility",
    "After cardio · easy mobility|Nakon kardija · lagana mobilnost|Nach Ausdauertraining · lockere Mobilität",
    [23, 753, 312, 205],
  ],
  [
    "morning-mobility",
    "Morning · move gently|Jutro · nježno razgibavanje|Morgens · sanft bewegen",
    [143, 27, 312, 757],
  ],
  [
    "floor-mobility-flow",
    "Floor mobility · gentle flow|Mobilnost na podu · lagani slijed|Bodenmobilität · sanfter Ablauf",
    [143, 728, 5, 305],
  ],
  [
    "rolling-practice",
    "Foam roller · light-pressure practice|Valjak · vježbanje uz lagan pritisak|Faszienrolle · Üben mit leichtem Druck",
    [270, 271, 272, 273],
  ],
  [
    "evening-mobility",
    "Evening · unwind with movement|Večer · opuštanje kroz pokret|Abends · mit Bewegung entspannen",
    [455, 72, 583, 205],
  ],
  [
    "easy-recovery-mobility",
    "Easy day · recovery movement|Lagani dan · pokreti za oporavak|Leichter Tag · erholsame Bewegung",
    [753, 27, 757, 143],
  ],
];
const trip = (s) => s.split("|");
const progression = trip(
  "Repeat this short session when it fits your schedule. Keep the movements easy and the range comfortable; this is not a load-progression program. Skip any movement that does not suit you rather than pushing through symptoms.|Ponovite kratku sesiju kada vam odgovara. Pokreti ostaju lagani i u udobnom rasponu; ovo nije program povećanja tereta. Preskočite pokret koji vam ne odgovara umjesto rada kroz simptome.|Wiederhole die kurze Einheit passend zu deinem Alltag. Halte die Bewegungen leicht und angenehm; dies ist kein Programm zur Laststeigerung. Lasse unpassende Bewegungen aus, statt durch Beschwerden zu trainieren.",
);
const considerations = trip(
  "Original general adult movement example. Adapt or skip after a hard workout; stop for pain, dizziness or feeling unwell. It does not prevent soreness, treat injury or replace an individual rehabilitation plan. Counts are movements, breaths or roller passes, not seconds; no duration is logged automatically.|Originalni opšti primjer kretanja za odrasle. Prilagodite ili preskočite nakon teškog treninga; stanite pri bolu, vrtoglavici ili slabosti. Ne sprečava upalu mišića, ne liječi povredu i ne zamjenjuje individualni rehabilitacijski plan. Brojevi su pokreti, udasi ili prolazi valjkom, ne sekunde; trajanje se ne bilježi automatski.|Eigenes allgemeines Bewegungsbeispiel für Erwachsene. Passe es nach hartem Training an oder lasse es aus; stoppe bei Schmerz, Schwindel oder Unwohlsein. Es verhindert keinen Muskelkater, behandelt keine Verletzung und ersetzt keinen individuellen Rehaplan. Gezählt werden Bewegungen, Atemzüge oder Rollpassagen, keine Sekunden; Dauer wird nicht automatisch protokolliert.",
);
const notes = trip(
  "One rep means one slow out-and-back movement, on each side where relevant. Use a small comfortable range, pause as needed and keep breathing; do not turn this into a forced stretch or timed hold.|Jedno ponavljanje znači jedan spor pokret i povratak, na svakoj strani gdje je primjenjivo. Koristite mali udoban raspon, odmarajte po potrebi i dišite; ne pretvarajte pokret u forsirano istezanje ili zadržavanje na vrijeme.|Eine Wiederholung ist eine langsame Hin-und-zurück-Bewegung, gegebenenfalls je Seite. Nutze einen kleinen angenehmen Weg, pausiere nach Bedarf und atme weiter; kein erzwungenes Dehnen oder Halten auf Zeit.",
);
const breath = trip(
  "Count one relaxed inhale and exhale as one rep. Breathe normally without breath holding or forcing a depth or rhythm; stop if light-headed. This records breaths, not a timed breathing session.|Jedan opušten udah i izdah računajte kao ponavljanje. Dišite normalno bez zadržavanja ili forsiranja dubine i ritma; stanite pri omaglici. Bilježite udahe, ne vremensku sesiju disanja.|Zähle einmal entspanntes Ein- und Ausatmen als Wiederholung. Atme normal ohne Halten oder erzwungene Tiefe und Rhythmus; stoppe bei Benommenheit. Erfasst werden Atemzüge, keine Zeiteinheit.",
);
const roll = trip(
  "One rep means one short gentle pass out and back over the muscle. Support your weight, avoid joints and sensitive areas, and stop if pressure is painful or causes tingling. Pass count is not seconds or a treatment dose.|Jedno ponavljanje znači jedan kratak blag prolaz preko mišića i nazad. Podržite svoju težinu, izbjegavajte zglobove i osjetljiva mjesta i stanite pri bolu ili trncima. Broj prolaza nije broj sekundi niti terapijska doza.|Eine Wiederholung ist eine kurze sanfte Rollpassage hin und zurück über den Muskel. Stütze dein Gewicht, meide Gelenke und empfindliche Stellen und stoppe bei Schmerz oder Kribbeln. Passagen sind keine Sekunden oder Behandlungsdosis.",
);
const result = rows.map(([slug, title, numbers]) =>
  Object.fromEntries(
    ["en", "bs", "de"].map((language, l) => [
      language,
      {
        id: `kinra-${slug}`,
        type: "training",
        title: trip(title)[l],
        summary: trip(
          "A short optional movement break with four easy exercises. Copy it to your programs, review the notes and adjust before starting.|Kratka opcionalna pauza za kretanje s četiri lagane vježbe. Kopirajte u programe, pregledajte napomene i prilagodite prije početka.|Eine kurze optionale Bewegungspause mit vier leichten Übungen. Kopiere sie in deine Programme, prüfe die Hinweise und passe sie vor dem Start an.",
        )[l],
        goal: trip(
          "Gentle mobility and recovery movement|Lagana mobilnost i pokreti za oporavak|Sanfte Mobilität und erholsame Bewegung",
        )[l],
        level: trip("Beginner|Početni|Anfänger")[l],
        equipment: slug === "rolling-practice" ? ["Foam roller"] : ["Bodyweight"],
        weeks: 1,
        sessionsPerWeek: 1,
        minutes: 8,
        author: "Kinra",
        progression: progression[l],
        considerations: considerations[l],
        sources: [
          {
            title: "Kinra original movement guidance · reviewed 21 October 2026",
            url: "https://kinra.fit/exercise-guidance.html",
            observedDate: "2026-10-21",
          },
        ],
        days: [
          {
            title: trip(title)[l],
            exercises: numbers.map((n) => ({
              catalogue_id: get(n).id,
              name: get(n).name,
              sets: 1,
              // These examples prescribe unloaded movement, not the last load
              // logged for an exercise or automatic strength progression.
              weight: 0,
              reps: n === 205 ? "6" : "4–6",
              rest_seconds: 30,
              rpe: 2,
              section: "cooldown",
              notes: (n === 205 ? breath : slug === "rolling-practice" ? roll : notes)[l],
            })),
          },
        ],
      },
    ]),
  ),
);
fs.writeFileSync(
  "src/data/recovery-program-templates.json",
  JSON.stringify(result, null, 2) + "\n",
);
