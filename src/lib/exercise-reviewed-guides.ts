import additions from "../data/exercise-additions.json";
import type { FamilyGuide } from "./exercise-guide-content";
import type { Language } from "./i18n";
type Text = [string, string, string];
const triple = (text: string) => text.split("|") as Text;
const finish = {
  mistakes: [
    triple(
      "Reduce resistance if balance, grip or the described body position changes; do not force an uncomfortable range.|Smanjite otpor ako se mijenja ravnoteža, hvat ili opisani položaj; ne forsirajte neugodan raspon.|Reduziere den Widerstand bei veränderter Balance, Griff- oder Körperposition; erzwinge keinen unangenehmen Weg.",
    ),
  ],
  cues: [
    triple(
      "Practise the exact variation with light resistance before adding load or speed.|Uvježbajte tačnu varijantu uz mali otpor prije dodavanja tereta ili brzine.|Übe die genaue Variante mit geringem Widerstand vor zusätzlicher Last oder Geschwindigkeit.",
    ),
  ],
};
const hip9090: FamilyGuide = {
  setup: [
    triple(
      "Sit on a comfortable surface with both knees bent near a right angle; use your hands or a cushion for support.|Sjednite na udobnu podlogu s oba koljena savijena približno pod pravim uglom; oslonite se rukama ili jastukom.|Sitze bequem mit beiden Knien ungefähr rechtwinklig gebeugt; nutze Hände oder Kissen zur Unterstützung.",
    ),
  ],
  steps: [
    triple(
      "Place the front hip in external rotation and the rear hip in internal rotation; keep both knees comfortable.|Prednji kuk je u vanjskoj, a stražnji u unutrašnjoj rotaciji; oba koljena ostaju u udobnom položaju.|Die vordere Hüfte befindet sich in Außenrotation, die hintere in Innenrotation; halte beide Knie angenehm.",
    ),
    triple(
      "Sit tall or lean a little over the front thigh from the hip, without pressing either knee into the floor.|Sjedite uspravno ili se malo nagnite iz kuka preko prednjeg bedra, bez pritiskanja koljena u pod.|Sitze aufrecht oder neige dich aus der Hüfte etwas über den vorderen Oberschenkel, ohne ein Knie zum Boden zu drücken.",
    ),
    triple(
      "Return upright, use your hands to help switch sides and compare a comfortable range without forcing symmetry.|Vratite se uspravno, pomozite rukama pri promjeni strane i uporedite udoban raspon bez forsiranja simetrije.|Richte dich auf, unterstütze den Seitenwechsel mit den Händen und vergleiche angenehme Bewegungswege ohne erzwungene Symmetrie.",
    ),
  ],
  mistakes: [
    triple(
      "Do not twist through a fixed knee, force both sitting bones down or chase a prescribed angle through pain.|Ne uvrćite fiksirano koljeno, ne gurajte obje sjedne kosti prema podu i ne tražite zadati ugao kroz bol.|Verdrehe kein fixiertes Knie, drücke nicht beide Sitzbeinhöcker gewaltsam ab und erzwinge keinen Winkel durch Schmerz.",
    ),
  ],
  cues: [
    triple(
      "Front hip turns outward; rear hip turns inward. Support the position before increasing the range.|Prednji kuk ide prema van, stražnji prema unutra. Osigurajte položaj prije povećanja raspona.|Vorn dreht die Hüfte nach außen, hinten nach innen. Unterstütze die Haltung vor größerem Bewegungsweg.",
    ),
  ],
};

/** Original rewritten instructions: source topics informed these mechanical
 * distinctions, while unsafe universal doses and clinical protocols were omitted. */
export const reviewedTechniqueGroups: Array<{ numbers: number[]; text: Text }> = [
  {
    numbers: [454, 415, 616],
    text: triple(
      "Set the pec-deck seat so the pads or handles align with the middle chest. Keep the elbow angle steady and bring the arms together without shrugging; on the one-arm version keep the torso facing forward.|Podesite pec-deck da su jastučići ili ručke u visini srednjih prsa. Ugao lakta ostaje miran; spojite ruke bez podizanja ramena, a u jednoručnoj varijanti trup ostaje naprijed.|Stelle den Pec-Deck-Sitz für Polster oder Griffe auf mittlerer Brusthöhe ein. Halte den Ellenbogenwinkel gleich und führe ohne Schulterhochziehen zusammen; halte einarmig den Rumpf nach vorn.",
    ),
  },
  {
    numbers: [101, 57, 333, 191, 603],
    text: triple(
      "For the cable fly, keep a small, steady elbow bend and move the upper arms across the chest; do not turn the return into a deep shoulder stretch. Adjust the bench or stance to the selected cable angle.|Za razvlačenje na sajli zadržite blago i stalno savijene laktove, a nadlaktice vodite preko prsa; povratak nije duboko istezanje ramena. Podesite klupu ili stav odabranom uglu sajle.|Halte beim Kabel-Fly die Ellenbogen leicht und gleich gebeugt und führe die Oberarme vor der Brust zusammen; vermeide eine tiefe Schulterdehnung beim Rückweg. Passe Bank oder Stand an den Kabelwinkel an.",
    ),
  },
  {
    numbers: [303],
    text: triple(
      "Set the pulleys above shoulder height and sweep the handles downward and inward toward the lower chest. Keep the trunk steady instead of bowing forward to finish the movement.|Postavite sajle iznad ramena i vodite ručke dolje i unutra prema donjim prsima. Trup ostaje miran umjesto pregibanja naprijed za završetak.|Stelle die Rollen über Schulterhöhe und führe die Griffe abwärts nach innen zur unteren Brust. Halte den Rumpf ruhig statt zum Abschluss vorzubeugen.",
    ),
  },
  {
    numbers: [400, 130],
    text: triple(
      "Start with a low pulley and guide the arm upward and inward to a comfortable chest-height finish. Keep the elbow softly bent; do not shrug or lift the hand overhead to chase a longer arc.|Počnite s niskom sajlom i vodite ruku gore i unutra do udobne visine prsa. Lakat je blago savijen; ne podižite rame ili šaku iznad glave radi dužeg luka.|Beginne an einer tiefen Rolle und führe den Arm aufwärts nach innen bis zu angenehmer Brusthöhe. Halte den Ellenbogen weich und verlängere den Bogen nicht durch Schulterhochziehen oder Überkopfführen.",
    ),
  },
  {
    numbers: [107, 346, 222],
    text: triple(
      "For a fly hold, choose a position you can keep still with a soft elbow bend. Maintain gentle breathing and release the load under control; a hold is not a counted dynamic repetition.|Za zadržavanje razvlačenja izaberite miran položaj uz blago savijene laktove. Dišite i kontrolisano otpustite teret; zadržavanje nije dinamičko ponavljanje.|Wähle für das Fly-Halten eine ruhige Position mit weich gebeugtem Ellenbogen. Atme weiter und löse kontrolliert; Halten ist keine gezählte dynamische Wiederholung.",
    ),
  },
  {
    numbers: [108, 109],
    text: triple(
      "Use a deliberately short fly arc with a light load, keeping the same elbow angle throughout. Small pulses remain controlled; they do not justify bouncing into the stretched shoulder position.|Koristite namjerno kratak luk razvlačenja uz mali teret i isti ugao lakta. Mali pokreti ostaju kontrolisani; ne odskačite u istegnuti položaj ramena.|Nutze bewusst einen kurzen Fly-Bogen mit geringer Last und gleichem Ellenbogenwinkel. Kleine Pulse bleiben kontrolliert und rechtfertigen kein Federn in der gedehnten Schulterposition.",
    ),
  },
  {
    numbers: [219, 193],
    text: triple(
      "With dumbbells, maintain a soft elbow bend as the upper arms open and close. End the opening when shoulder control ends, not when the dumbbells reach a fixed depth; use a spotter or lighter load if returning is difficult.|S bučicama zadržite blago savijene laktove dok otvarate i zatvarate nadlaktice. Završite otvaranje prije gubitka kontrole ramena, bez zadate dubine; koristite pomoć ili lakši teret ako je povratak težak.|Halte mit Kurzhanteln die Ellenbogen weich, während die Oberarme öffnen und schließen. Beende die Öffnung vor Kontrollverlust statt bei fester Tiefe; nutze Hilfe oder weniger Last bei schwierigem Rückweg.",
    ),
  },
  {
    numbers: [40, 218, 252, 518, 100, 576, 63],
    text: triple(
      "Keep the upper arms beside the ribs as the elbows bend. Let the forearms move without lifting the shoulders or driving the hips forward; lower until the elbows are comfortably extended.|Nadlaktice držite uz rebra pri savijanju laktova. Podlaktice se kreću bez podizanja ramena ili guranja kukova naprijed; spuštajte do udobno opruženih laktova.|Halte die Oberarme beim Beugen neben den Rippen. Bewege die Unterarme ohne Schulterheben oder Hüftschub und senke bis zur angenehmen Ellenbogenstreckung.",
    ),
  },
  {
    numbers: [493, 568, 125, 617],
    text: triple(
      "Set the preacher pad under the upper arm rather than against the elbow joint. Keep the arm supported throughout and stop the lowering before the elbow is forced into a hard lockout.|Postavite jastučić pod nadlakticu, ne na zglob lakta. Ruka ostaje oslonjena i spuštanje staje prije prisilnog zaključavanja lakta.|Stelle das Scott-Polster unter den Oberarm statt gegen das Ellenbogengelenk. Halte den Arm gestützt und stoppe vor erzwungener harter Ellenbogenstreckung.",
    ),
  },
  {
    numbers: [334, 339, 53],
    text: triple(
      "These behind-the-body curl setups lengthen the start position: use a modest shoulder reach and a light load. Keep the upper arm still rather than pulling it forward to finish the curl.|Ovi pregibi s rukom iza tijela produžuju početni položaj: koristite mali doseg ramena i lagan teret. Nadlaktica ostaje mirna umjesto povlačenja naprijed za završetak.|Bei diesen Curls hinter dem Körper ist die Startposition verlängert: nutze einen kleinen Schulterweg und geringe Last. Halte den Oberarm ruhig statt ihn zum Abschluss vorzuziehen.",
    ),
  },
  {
    numbers: [288, 13, 177, 553],
    text: triple(
      "Maintain a neutral, thumbs-up grip through the hammer curl. In the cross-body version guide the hand toward the opposite chest without rotating the torso; the shoulder does not lead the lift.|Zadržite neutralan hvat s palcem gore kroz čekić-pregib. U varijanti preko tijela šaka ide prema suprotnim prsima bez rotiranja trupa; rame ne vodi podizanje.|Halte den Hammergriff mit Daumen oben. Führe die Hand bei der Cross-Body-Variante zur gegenüberliegenden Brust ohne Rumpfdrehung; die Schulter führt den Hub nicht an.",
    ),
  },
  {
    numbers: [538, 253],
    text: triple(
      "Keep the palms facing down during the reverse curl and use less weight than for an underhand curl. Keep wrists in line with the forearms instead of bending them back to lift the bar.|Dlanovi su dolje kroz obrnuti pregib; koristite manji teret nego s pothvatom. Zapešća su u liniji podlaktica umjesto zabacivanja radi podizanja šipke.|Halte die Handflächen beim Reverse Curl nach unten und wähle weniger Last als im Untergriff. Halte die Handgelenke in Unterarmlinie statt sie zum Anheben zurückzuknicken.",
    ),
  },
  {
    numbers: [778],
    text: triple(
      "Curl upward with palms turned up, then rotate to palms down only after the top is controlled. Lower slowly in the overhand position and reset the forearm rotation near the bottom.|Podignite pregib dlanovima gore, pa okrenite dlanove dolje nakon kontrolisanog vrha. Polako spustite nadhvatom i vratite rotaciju podlaktice pri dnu.|Beuge mit Handflächen oben und drehe erst am kontrollierten oberen Punkt nach unten. Senke langsam im Obergriff und stelle die Unterarmdrehung unten zurück.",
    ),
  },
  {
    numbers: [392, 620],
    text: triple(
      "Align the machine pivot with the knee and place the resistance above the ankle, not on the foot. Extend the knee without lifting the thigh or pelvis; for a cable or band secure the cuff and anchor before starting.|Poravnajte osovinu sprave s koljenom i otpor postavite iznad gležnja, ne na stopalo. Opružite koljeno bez podizanja bedra ili karlice; na sajli ili traci prvo osigurajte manžetu i sidrište.|Richte die Geräteachse zum Knie aus und platziere den Widerstand über dem Knöchel statt am Fuß. Strecke ohne Anheben von Oberschenkel oder Becken; sichere bei Kabel oder Band zuerst Manschette und Anker.",
    ),
  },
  {
    numbers: [119, 529],
    text: triple(
      "Secure the cable cuff or band above the ankle and check the anchor behind you. Keep the thigh supported and nearly still while extending the knee; return slowly without moving the hip to pull the resistance.|Osigurajte manžetu sajle ili traku iznad gležnja i provjerite sidrište iza tijela. Bedro je oslonjeno i gotovo mirno dok opružate koljeno; vratite polako bez pomjeranja kuka radi povlačenja otpora.|Sichere Kabelmanschette oder Band über dem Knöchel und prüfe den Anker hinter dir. Halte den Oberschenkel gestützt und fast ruhig beim Kniestrecken; kehre langsam ohne Hüftbewegung zum Ziehen des Widerstands zurück.",
    ),
  },
  {
    numbers: [582, 625],
    text: triple(
      "Set the seated leg-curl backrest so the knees align with the pivot. Secure the thigh pad, draw the lower legs beneath the seat and return without letting the hips slide forward.|Podesite naslon sjedećeg pregiba da koljena prate osovinu. Osigurajte jastučić bedara, povucite potkoljenice pod sjedište i vratite bez klizanja kukova naprijed.|Stelle die Sitzlehne des Beinbeugers für Knie auf Achshöhe ein. Sichere das Oberschenkelpolster, ziehe die Unterschenkel unter den Sitz und kehre ohne Vorrutschen der Hüfte zurück.",
    ),
  },
  {
    numbers: [405, 623],
    text: triple(
      "On the lying leg curl, keep the pelvis supported and position the roller above the heels. Bend the knees without lifting the hips or arching the back; do not accelerate the last part by kicking.|Na ležećem pregibu oslonite karlicu i postavite valjak iznad peta. Savijte koljena bez podizanja kukova ili izvijanja leđa; ne završavajte udarcem noge.|Halte beim liegenden Beinbeuger das Becken gestützt und die Rolle über den Fersen. Beuge ohne Hüftheben oder Hohlkreuz und beschleunige den Abschluss nicht durch Treten.",
    ),
  },
  {
    numbers: [684, 118, 528],
    text: triple(
      "Support yourself and keep the working thigh nearly still during the standing leg curl. Bend only the knee, then return slowly; reduce the resistance if the pelvis tilts forward to move the heel.|Oslonite se i držite radno bedro gotovo mirno kroz stojeći pregib. Savijte samo koljeno pa polako vratite; smanjite otpor ako se karlica naginje naprijed radi pomjeranja pete.|Stütze dich und halte den arbeitenden Oberschenkel beim stehenden Beinbeugen fast ruhig. Beuge nur das Knie und kehre langsam zurück; reduziere bei nach vorn kippendem Becken.",
    ),
  },
  {
    numbers: [124, 444, 448, 338, 194],
    text: triple(
      "For overhead or lying triceps extensions, set the upper arm position before bending the elbows. Keep the ribs controlled and move the forearms; reduce depth if the shoulder or elbow cannot stay comfortable.|Za opružanje tricepsa iznad glave ili ležeći prvo namjestite nadlaktice. Kontrolišite rebra i pomjerajte podlaktice; smanjite dubinu ako rame ili lakat nisu u udobnom položaju.|Positioniere bei Überkopf- oder liegenden Trizepsstreckungen zuerst die Oberarme. Halte die Rippen stabil und bewege die Unterarme; verkürze bei unangenehmen Schultern oder Ellenbogen.",
    ),
  },
  {
    numbers: [176],
    text: triple(
      "Set one cable high and guide the forearm diagonally down across the body. Keep the upper arm and torso still rather than turning the movement into a shoulder swing.|Postavite jednu sajlu visoko i vodite podlakticu dijagonalno dolje preko tijela. Nadlaktica i trup ostaju mirni umjesto zamaha ramenom.|Stelle ein Kabel hoch ein und führe den Unterarm schräg abwärts vor dem Körper. Halte Oberarm und Rumpf ruhig statt mit der Schulter zu schwingen.",
    ),
  },
  {
    numbers: [377, 135, 413, 525, 605, 614],
    text: triple(
      "Choose a grip that permits a comfortable overhead reach. Draw the elbows toward the sides of the ribs without pulling the handle behind the head; let the shoulder blades move naturally during the controlled return.|Izaberite hvat za udoban doseg iznad glave. Povucite laktove prema bočnim rebrima bez povlačenja iza glave; lopatice se prirodno kreću pri kontrolisanom povratku.|Wähle einen Griff für angenehmes Überkopfreichen. Ziehe die Ellenbogen zu den seitlichen Rippen ohne Griff hinter dem Kopf und lasse die Schulterblätter beim kontrollierten Rückweg natürlich gleiten.",
    ),
  },
  {
    numbers: [131, 127, 606],
    text: triple(
      "In a straight-arm cable pull, preserve a small elbow bend and move from the shoulders toward the thighs. Keep the ribcage over the pelvis; do not add a triceps extension or a backward trunk swing.|U povlačenju sajle ispruženim rukama zadržite mali ugao lakta i krećite iz ramena prema bedrima. Rebra su iznad karlice; ne dodajte opružanje tricepsa ili zamah trupa nazad.|Halte beim gestreckten Kabelzug eine kleine Ellenbogenbeugung und bewege aus den Schultern zu den Oberschenkeln. Halte Rippen über dem Becken ohne zusätzliche Trizepsstreckung oder Rückschwung.",
    ),
  },
  {
    numbers: [229, 230, 612],
    text: triple(
      "Support your head and trunk on the bench for the dumbbell pullover. Lower overhead only until the shoulders permit it without rib flare; keep the elbow angle steady and return over the chest.|Oslonite glavu i trup na klupu za pulover bučicom. Spuštajte iznad glave samo bez širenja rebara i uz udobna ramena; zadržite ugao lakta i vratite iznad prsa.|Stütze Kopf und Rumpf beim Kurzhantel-Pullover auf der Bank. Senke nur ohne Rippenaufklappen im angenehmen Schulterbereich über Kopf; halte den Ellenbogenwinkel und kehre über die Brust zurück.",
    ),
  },
  {
    numbers: [255, 256],
    text: triple(
      "Use a face-height anchor and draw the hands toward the sides of the face with controlled elbows. Keep the neck long, avoid shrugging and let the shoulder rotation stay comfortable rather than forcing the hands far behind the head.|Koristite sidrište u visini lica i povucite šake prema bočnim stranama lica uz kontrolisane laktove. Vrat je dug, bez podizanja ramena ili forsiranja šaka iza glave.|Nutze einen Anker auf Gesichtshöhe und ziehe die Hände kontrolliert seitlich zum Gesicht. Halte den Nacken lang, vermeide Schulterhochziehen und erzwinge keine Hände weit hinter dem Kopf.",
    ),
  },
  {
    numbers: [35, 94],
    text: triple(
      "Set the rack or rear-foot support before loading. Keep pressure through the whole front foot and let the knee follow the toes; depth depends on control and comfort rather than a mandatory knee or hip angle.|Podesite stalak ili oslonac stražnjeg stopala prije tereta. Oslonite cijelo prednje stopalo i pratite prste koljenom; dubina zavisi od kontrole i udobnosti, ne od obaveznog ugla.|Stelle Rack oder hintere Fußstütze vor dem Beladen ein. Belaste den ganzen Vorderfuß und führe das Knie den Zehen folgend; die Tiefe richtet sich nach Kontrolle und Komfort statt Pflichtwinkeln.",
    ),
  },
  {
    numbers: [44],
    text: triple(
      "Place the bench edge below the shoulder blades and pad the bar over the hip crease. Finish the hip thrust with the ribs and pelvis controlled; stop at hip extension rather than lifting higher by arching the back.|Rub klupe je ispod lopatica, a podstavljena šipka u pregibu kukova. Završite potisak kukovima uz kontrolisana rebra i karlicu; stanite pri opružanju kuka bez dodatnog izvijanja leđa.|Lege die Bankkante unter die Schulterblätter und polstere die Stange in der Hüftfalte. Beende den Hip Thrust mit kontrollierten Rippen und Becken bei Hüftstreckung statt zusätzlichem Hohlkreuz.",
    ),
  },
  {
    numbers: [169, 188, 549, 550],
    text: triple(
      "For a floor deadlift, reset the bar over the midfoot before each lift; for an RDL, begin standing and hinge without needing to reach the floor. In either version keep the load close and finish by standing tall rather than leaning back.|Za mrtvo dizanje s poda vratite šipku iznad sredine stopala prije podizanja; RDL počinje stojeći i ne mora do poda. U obje varijante teret je blizu i završetak uspravan, bez zabacivanja.|Setze beim Boden-Kreuzheben die Stange vor jedem Hub über dem Mittelfuß zurück; beginne beim RDL stehend ohne Pflicht zum Boden. Halte die Last jeweils nah und ende aufrecht ohne Zurücklehnen.",
    ),
  },
  {
    numbers: [62, 719, 456],
    text: triple(
      "Hold the hip-hinge angle while rowing so the torso does not rise to meet the load. Let the elbows travel back and return smoothly; a floor-reset Pendlay row returns the bar to a stable stop between repetitions.|Zadržite pregib kukova pri veslanju bez podizanja trupa prema teretu. Laktovi idu nazad i glatko se vraćaju; Pendlay veslanje vraća šipku u miran položaj na podu između ponavljanja.|Halte den Hüftbeugewinkel beim Rudern ohne Aufrichten zur Last. Führe die Ellenbogen zurück und kehre gleichmäßig zurück; beim Pendlay-Rudern kommt die Stange zwischen Wiederholungen ruhig am Boden an.",
    ),
  },
  {
    numbers: [60, 330, 189],
    text: triple(
      "Set the bench supports and safety height before unracking. Keep the forearms beneath the bar, use a controlled chest approach and stop before shoulder discomfort; the incline or decline changes the bench angle, not the need for a safe handoff.|Podesite nosače i visinu zaštita prije skidanja šipke. Podlaktice su ispod šipke; približite je kontrolisano prsima i stanite prije nelagode ramena; nagib klupe ne mijenja potrebu za sigurnim dodavanjem.|Stelle Ablagen und Sicherungen vor dem Ausheben ein. Halte die Unterarme unter der Stange, nähere kontrolliert zur Brust und stoppe vor Schulterbeschwerden; die Bankneigung ersetzt keine sichere Übergabe.",
    ),
  },
];
export function reviewedTechnique(id: string, language: Language): string | undefined {
  const number = Number(id.split("-")[1]);
  return reviewedTechniqueGroups.find((group) => group.numbers.includes(number))?.text[
    { en: 0, bs: 1, de: 2 }[language]
  ];
}
export function reviewedGuide(id: string): FamilyGuide | undefined {
  if (id.startsWith("exercise-0305-")) return hip9090;
  if ([107, 346, 222].includes(Number(id.split("-")[1])))
    return {
      setup: [
        triple(
          "Choose a stable cable stance or supported dumbbell bench position with a light load; keep the elbows softly bent.|Izaberite stabilan stav na sajli ili oslonjen položaj na klupi s laganim bučicama; laktovi su blago savijeni.|Wähle einen stabilen Kabelstand oder eine gestützte Hantelbankposition mit geringer Last und weich gebeugten Ellenbogen.",
        ),
      ],
      steps: [
        triple(
          "Move into a comfortable fly position slowly, stopping before the shoulders are pulled into a deep stretch.|Polako zauzmite udoban položaj razvlačenja i stanite prije dubokog istezanja ramena.|Gehe langsam in eine angenehme Fly-Position und stoppe vor tiefer Schulterdehnung.",
        ),
        triple(
          "Keep that arm position still while breathing normally; choose the hold length yourself or follow an individual plan, rather than counting moving repetitions.|Zadržite položaj ruku uz normalno disanje; sami odaberite trajanje ili pratite individualni plan umjesto brojanja dinamičkih ponavljanja.|Halte die Armposition bei normaler Atmung; wähle die Haltedauer selbst oder nach individuellem Plan statt bewegte Wiederholungen zu zählen.",
        ),
        triple(
          "End the hold before the hands drift or the shoulders strain, then return the load to a secure supported position.|Završite zadržavanje prije pomjeranja šaka ili naprezanja ramena, pa vratite teret u siguran oslonjen položaj.|Beende das Halten vor abdriftenden Händen oder Schulterbelastung und bringe die Last in eine sichere gestützte Position zurück.",
        ),
      ],
      ...finish,
    };
  const addition = additions.find((entry) => entry.id === id);
  if (!addition) return undefined;
  return {
    setup: [
      triple(
        "Check the equipment, supports and available space; start with a light practice set for this exact variation.|Provjerite opremu, oslonce i slobodan prostor; počnite laganom probnom serijom ove tačne varijante.|Prüfe Geräte, Stützen und freien Platz; beginne mit einem leichten Übungssatz der genauen Variante.",
      ),
    ],
    steps: [
      addition.variantInstruction as Text,
      triple(
        "Repeat only while you can reproduce the described path and support points; pause between repetitions whenever you need to reset.|Ponavljajte samo dok zadržavate opisanu putanju i oslonce; zastanite između ponavljanja kada treba obnoviti položaj.|Wiederhole nur bei gleicher beschriebener Bahn und sicheren Kontaktpunkten; pausiere bei Bedarf zum Neueinrichten.",
      ),
      triple(
        "Finish by returning the load or body to a secure support before releasing your grip or leaving the equipment.|Završite vraćanjem tereta ili tijela na siguran oslonac prije otpuštanja hvata ili napuštanja opreme.|Bringe zum Abschluss Last oder Körper auf eine sichere Stütze, bevor du loslässt oder das Gerät verlässt.",
      ),
    ],
    ...finish,
  };
}
