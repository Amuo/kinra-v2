import { guideFamilies, type FamilyGuide } from "./exercise-guide-content";
const text = (value: string) => value.split("|") as [string, string, string];
const guide = (
  base: keyof typeof guideFamilies,
  setup: string,
  steps: string[],
  cue?: string,
): FamilyGuide => ({
  ...guideFamilies[base],
  setup: [text(setup)],
  steps: steps.map(text),
  ...(cue ? { cues: [text(cue)] } : {}),
});
const rollout = guide(
  "plank",
  "Kneel on padding with hands on the wheel, or forearms on the secured ball; start with the support close.|Kleknite na podstavu s dlanovima na kotačiću ili podlakticama na osiguranoj lopti; oslonac je blizu.|Knie gepolstert mit Händen am Rad oder Unterarmen auf dem gesicherten Ball; beginne mit nahem Stützpunkt.",
  [
    "Brace the abdomen and glutes, then roll the support forward a short distance.|Učvrstite trbuh i stražnjicu, zatim otkotrljajte oslonac malo naprijed.|Spanne Bauch und Gesäß an und rolle die Stütze ein kurzes Stück nach vorn.",
    "Stop before the ribs flare or the lower back starts to arch.|Zaustavite prije isturanja rebara ili početka izvijanja donjih leđa.|Stoppe vor aufklappenden Rippen oder einem beginnenden Hohlkreuz.",
    "Draw the support back toward the knees while maintaining the trunk as one unit.|Povucite oslonac nazad prema koljenima, uz trup koji ostaje cjelina.|Ziehe die Stütze zu den Knien zurück; der Rumpf bleibt eine Einheit.",
  ],
  "Start with a short rollout; a wall can limit the wheel's travel.|Počnite kratkim otkotrljavanjem; zid može ograničiti put kotačića.|Beginne mit kurzem Ausrollen; eine Wand kann den Radweg begrenzen.",
);
const nordic = guide(
  "legcurl",
  "Kneel on thick padding with ankles held by a purpose-built support or reliable partner; begin with assistance.|Kleknite na debelu podstavu s gležnjevima u namjenskom osloncu ili uz pouzdanog partnera; počnite s pomoći.|Knie dick gepolstert mit sicher fixierten Knöcheln an einer geeigneten Halterung oder durch eine zuverlässige Person; beginne unterstützt.",
  [
    "Keep shoulders, hips and knees in a line and slowly lean the whole body forward from the knees.|Poravnajte ramena, kukove i koljena i polako nagnite cijelo tijelo naprijed iz koljena.|Halte Schultern, Hüfte und Knie in einer Linie und neige den Körper langsam aus den Knien nach vorn.",
    "Resist the descent with the hamstrings only as far as control allows; catch softly with the hands on a raised support or floor.|Zadnjom ložom kočite spuštanje samo dok imate kontrolu; mekano se prihvatite dlanovima na povišen oslonac ili pod.|Bremse mit der Oberschenkelrückseite nur so weit wie kontrollierbar und fange dich sanft mit den Händen auf erhöhter Stütze oder Boden ab.",
    "Use the hands or assistance to return; reduce the range rather than falling forward.|Vratite se uz ruke ili pomoć; smanjite raspon umjesto pada naprijed.|Kehre mit Händen oder Unterstützung zurück; verkürze den Weg, statt nach vorn zu fallen.",
  ],
  "This is demanding eccentric work; use assistance before adding range or load.|Ovo je zahtjevan ekscentrični rad; koristite pomoć prije povećanja raspona ili tereta.|Dies ist anspruchsvolle exzentrische Arbeit; nutze Unterstützung vor mehr Weg oder Last.",
);
const reverseNordic = guide(
  "legextension",
  "Kneel upright on thick padding with the knees comfortably apart and hips extended; hold a secure assistance band if used.|Kleknite uspravno na debelu podstavu s udobno razmaknutim koljenima i opruženim kukovima; po potrebi držite sigurnu traku za pomoć.|Knie aufrecht dick gepolstert mit angenehm geöffneten Knien und gestreckter Hüfte; halte gegebenenfalls ein sicheres Unterstützungsband.",
  [
    "Keep shoulders, hips and knees in one line and lean backward a small distance from the knees.|Poravnajte ramena, kukove i koljena i nagnite se malo nazad iz koljena.|Halte Schultern, Hüfte und Knie in einer Linie und neige dich klein aus den Knien zurück.",
    "Stop before knee discomfort, loss of alignment or a need to arch the back.|Zaustavite prije nelagode koljena, gubitka poravnanja ili potrebe da izvijete leđa.|Stoppe vor Kniebeschwerden, Ausrichtungsverlust oder einem notwendigen Hohlkreuz.",
    "Use the front thighs and assistance to return upright slowly.|Prednjom stranom bedara i pomoći polako se vratite uspravno.|Kehre mit der Oberschenkelvorderseite und Unterstützung langsam aufrecht zurück.",
  ],
  "Move from the knees with the hips open; use a very short range first.|Krećite iz koljena s otvorenim kukovima; prvo koristite vrlo kratak raspon.|Bewege aus den Knien bei offener Hüfte; beginne mit sehr kurzem Weg.",
);
const stepup = guide(
  "lunge",
  "Choose a low stable step and place the whole working foot on top; keep a hand support nearby.|Izaberite nizak stabilan stepenik i oslonite cijelo radno stopalo na vrh; oslonac za ruku je blizu.|Wähle eine niedrige feste Stufe und setze den ganzen Arbeitsfuß darauf; halte eine Handstütze bereit.",
  [
    "Lean slightly over the working foot and push through that foot to rise onto the step.|Blago se nagnite iznad radnog stopala i odgurnite njime do penjanja na stepenik.|Neige dich leicht über den Arbeitsfuß und drücke dich darüber auf die Stufe.",
    "Stand balanced at the top without pushing excessively from the trailing leg.|Stabilizujte se gore bez pretjeranog odgurivanja zadnjom nogom.|Stabilisiere dich oben, ohne stark mit dem hinteren Bein abzudrücken.",
    "Lower the trailing foot slowly to the floor while keeping the working knee aligned.|Polako spustite zadnje stopalo na pod uz poravnato radno koljeno.|Senke den hinteren Fuß langsam zum Boden; das Arbeitsknie bleibt ausgerichtet.",
  ],
  "Lower the step height if you cannot control the descent.|Smanjite visinu stepenika ako ne možete kontrolisati spuštanje.|Verringere die Stufenhöhe bei fehlender Absenkkontrolle.",
);
const backextension = guide(
  "hinge",
  "Secure feet on a back-extension bench and position the pad below the hip crease; keep room to hinge.|Osigurajte stopala na klupi za ekstenziju i postavite jastučić ispod pregiba kuka; ostavite prostor za pregib.|Sichere die Füße an einer Rückenstreckerbank und positioniere das Polster unter der Hüftfalte, sodass eine Hüftbeuge möglich bleibt.",
  [
    "Fold forward mainly from the hips while maintaining a comfortable natural spine.|Nagnite se naprijed prvenstveno iz kukova uz udoban prirodan položaj kičme.|Beuge dich hauptsächlich aus der Hüfte vor und halte eine angenehme natürliche Wirbelsäule.",
    "Use the hips and trunk muscles to raise the torso until it aligns with the legs.|Kukovima i mišićima trupa podignite tijelo do linije s nogama.|Hebe den Rumpf mit Hüft- und Rumpfmuskeln bis zur Linie mit den Beinen.",
    "Pause without leaning past that line, then lower slowly.|Zadržite bez prelaska te linije, zatim se polako spustite.|Halte ohne Überstrecken über diese Linie und senke langsam ab.",
  ],
  "Finish long rather than arching high.|Završite izduženo, bez visokog izvijanja.|Ende lang statt hoch im Hohlkreuz.",
);
const proneextension = guide(
  "mobility",
  "Lie face down with legs relaxed and place the forearms under the shoulders for sphinx, or hands beside the chest for a press-up.|Lezite licem dolje s opuštenim nogama; za sfingu oslonite podlaktice ispod ramena, a za potisak dlanove uz prsa.|Liege bäuchlings mit entspannten Beinen; platziere für die Sphinx Unterarme unter den Schultern oder für den Press-up Hände neben der Brust.",
  [
    "Gently lift the upper chest using the chosen arm support while the pelvis remains supported.|Blago podignite gornja prsa odabranim osloncem ruku dok karlica ostaje oslonjena.|Hebe die obere Brust sanft über die gewählte Armstütze; das Becken bleibt gestützt.",
    "Move only within a comfortable range; do not force the elbows straight or lift the pelvis for more height.|Krećite se samo udobnim rasponom; ne forsirajte opružanje laktova niti podižite karlicu radi visine.|Bleibe im angenehmen Bereich; erzwinge weder gestreckte Ellenbogen noch mehr Höhe durch Beckenheben.",
    "Return slowly to lying; if used for back symptoms, follow the response and progression rules from your individual plan.|Polako se vratite ležeći; ako koristite zbog leđnih simptoma, pratite reakciju i progresiju individualnog plana.|Kehre langsam in Bauchlage zurück; bei Anwendung wegen Rückenbeschwerden gelten Reaktions- und Steigerungsregeln deines individuellen Plans.",
  ],
);
const hollow = guide(
  "deadbug",
  "Lie on your back with arms and legs supported; begin with the knees bent to shorten the lever.|Lezite na leđa s oslonjenim rukama i nogama; počnite savijenih koljena da skratite polugu.|Liege auf dem Rücken mit gestützten Armen und Beinen; beginne mit gebeugten Knien für einen kürzeren Hebel.",
  [
    "Exhale and brace, then lift the shoulders a small distance while keeping the neck comfortable.|Izdahnite i učvrstite trup, zatim malo podignite ramena uz udoban vrat.|Atme aus, spanne an und hebe die Schultern klein bei angenehmem Nacken.",
    "Reach the legs away only as far as the lower back and pelvis remain controlled.|Pružite noge samo dok donja leđa i karlica ostaju pod kontrolom.|Strecke die Beine nur so weit weg, wie unterer Rücken und Becken kontrolliert bleiben.",
    "Hold with quiet breathing, then lower the legs and head gently to rest.|Zadržite uz mirno disanje, zatim lagano spustite noge i glavu na odmor.|Halte bei ruhiger Atmung und lege dann Beine und Kopf sanft ab.",
  ],
  "Bend the knees or bring the arms forward before increasing hold time.|Savijte koljena ili pružite ruke naprijed prije povećanja trajanja.|Beuge die Knie oder bringe die Arme nach vorn, bevor du länger hältst.",
);
const handstand = guide(
  "plank",
  "Use a clear wall and non-slip floor; practice a safe exit and a supported pike hold before a full handstand.|Koristite slobodan zid i pod koji ne kliže; uvježbajte siguran izlaz i podržan pike oslonac prije punog stava na rukama.|Nutze eine freie Wand und rutschfesten Boden; übe einen sicheren Ausstieg und gestützten Pike-Halt vor dem vollen Handstand.",
  [
    "Place hands about shoulder width, spread the fingers and enter the wall-supported position using a method you have learned.|Postavite dlanove blizu širine ramena, raširite prste i uđite u položaj uz zid naučenom metodom.|Setze die Hände etwa schulterbreit, spreize die Finger und gehe mit einer erlernten Methode in die Wandstützposition.",
    "Push the floor away with long arms, keeping the ribs and pelvis controlled and the head free of load.|Odgurnite pod ispruženim rukama, uz kontrolisana rebra i karlicu te glavu bez opterećenja.|Drücke mit langen Armen den Boden weg; halte Rippen und Becken kontrolliert und den Kopf unbelastet.",
    "Hold only while breathing and wrist/shoulder control remain comfortable, then exit deliberately.|Držite samo dok su disanje i kontrola zapešća i ramena udobni, zatim namjerno izađite.|Halte nur bei angenehmer Atmung und Handgelenk-/Schulterkontrolle und steige dann bewusst aus.",
  ],
);
const ropeclimb = guide(
  "pullup",
  "Use a professionally secured climbing rope with a padded landing zone and supervision; first learn a foot lock close to the ground.|Koristite stručno osigurano uže s podstavljenom zonom doskoka i nadzorom; prvo naučite blokadu stopalima blizu poda.|Nutze ein fachgerecht gesichertes Kletterseil mit gepolsterter Landezone und Aufsicht; lerne zuerst einen Fußklemmgriff bodennah.",
  [
    "Grip the rope overhead and secure it between the feet using the taught lock.|Uhvatite uže iznad glave i osigurajte ga stopalima naučenom blokadom.|Greife das Seil über Kopf und sichere es mit der erlernten Fußklemmung.",
    "Stand into the foot lock and move the hands upward a short distance; repeat only as high as you can descend safely.|Uspravite se preko blokade i pomjerite dlanove malo gore; penjite se samo do visine s koje možete sigurno sići.|Drücke dich über die Fußklemmung hoch und greife kurz höher; klettere nur so hoch, wie du sicher absteigen kannst.",
    "Descend hand over hand with the feet controlling the rope; do not slide or drop.|Siđite prehvatanjem ruku uz kontrolu užeta stopalima; ne klizite i ne padajte.|Steige Hand für Hand ab und kontrolliere das Seil mit den Füßen; rutsche und falle nicht.",
  ],
);
const getup = guide(
  "olympic",
  "Rehearse without weight or with a balanced shoe first. Lie with one knee bent and same-side arm pointing up; the other arm rests diagonally on the floor.|Prvo uvježbajte bez tereta ili balansirajući cipelu. Lezite sa savijenim jednim koljenom i istom rukom gore; druga ruka je dijagonalno na podu.|Übe zuerst unbelastet oder mit balanciertem Schuh. Liege mit einem gebeugten Knie und gleichseitigem Arm nach oben; der andere Arm liegt diagonal am Boden.",
  [
    "Keeping the raised arm vertical, roll onto the opposite forearm and then the hand.|Uz podignutu ruku okomito pređite na suprotnu podlakticu, zatim dlan.|Halte den angehobenen Arm senkrecht und rolle auf den gegenüberliegenden Unterarm und dann die Hand.",
    "Lift the hips enough to sweep the straight leg underneath into a supported half-kneel; stabilize before removing the hand.|Podignite kukove dovoljno da opruženu nogu provučete ispod u podržan poluklek; stabilizujte prije odmicanja dlana.|Hebe die Hüfte für das Durchführen des langen Beins in einen gestützten Halbkniestand; stabilisiere vor dem Lösen der Hand.",
    "Stand from the half-kneel, then reverse each stage slowly to return to lying; learn the sequence with instruction before loading.|Ustanite iz polukleka, zatim polako obrnite svaku fazu do ležanja; naučite sekvencu uz obuku prije tereta.|Stehe aus dem Halbkniestand auf und kehre jede Stufe langsam bis zur Rückenlage um; lerne die Folge vor Zusatzlast mit Anleitung.",
  ],
  "Pause at every transition; an unloaded precise get-up is the starting point.|Zastanite u svakom prelazu; precizno ustajanje bez tereta je početak.|Pausiere bei jedem Übergang; ein präzises unbelastetes Aufstehen ist der Anfang.",
);
getup.mistakes = [
  text(
    "Do not rush transitions, lose sight of the load or progress to weight before a controlled unloaded sequence.|Ne žurite prelaze, ne gubite teret iz vida i ne dodajte težinu prije kontrolisane sekvence bez tereta.|Hetze Übergänge nicht, verliere die Last nicht aus dem Blick und steigere erst nach kontrollierter unbelasteter Folge.",
  ),
];
const burpee = guide(
  "pushup",
  "Stand on a clear floor; use an elevated hand support if getting to the floor is difficult.|Stanite na slobodan pod; koristite povišen oslonac rukama ako je silazak na pod težak.|Stehe auf freiem Boden; nutze eine erhöhte Handstütze bei schwierigem Bodenwechsel.",
  [
    "Bend hips and knees and place the hands firmly on the floor or support.|Savijte kukove i koljena i čvrsto postavite dlanove na pod ili oslonac.|Beuge Hüfte und Knie und setze die Hände fest auf Boden oder Stütze.",
    "Step or lightly hop the feet back into a controlled high plank; include a push-up only if it is part of your plan.|Zakoračite ili lagano odskočite stopalima nazad u kontrolisan visoki plank; dodajte sklek samo ako je dio plana.|Gehe oder hüpfe leicht mit den Füßen in einen kontrollierten hohen Stütz; ergänze einen Liegestütz nur nach Plan.",
    "Bring the feet forward and stand; add a low jump only if you can land quietly and reset.|Vratite stopala naprijed i ustanite; dodajte nizak skok samo uz tih doskok i obnovu položaja.|Bringe die Füße vor und stehe auf; ergänze einen niedrigen Sprung nur mit leiser kontrollierter Landung.",
  ],
);
const climber = guide(
  "plank",
  "Start in a high plank with the hands under the shoulders and feet on a non-slip surface.|Počnite u visokom planku s dlanovima ispod ramena i stopalima na podlozi koja ne kliže.|Beginne im hohen Stütz mit Händen unter den Schultern und Füßen auf rutschfester Fläche.",
  [
    "Draw one knee forward beneath the trunk while keeping the shoulders over the hands.|Povucite jedno koljeno naprijed ispod trupa uz ramena iznad dlanova.|Ziehe ein Knie unter dem Rumpf vor; die Schultern bleiben über den Händen.",
    "Return the foot to the start and change legs without bouncing the pelvis upward.|Vratite stopalo na početak i promijenite nogu bez odskakivanja karlice gore.|Setze den Fuß zurück und wechsle das Bein ohne Hochfedern des Beckens.",
    "Build speed only while the trunk remains controlled; stop and reset when the hips start swaying.|Ubrzavajte samo uz kontrolisan trup; stanite i obnovite položaj kada kukovi počnu njihati.|Steigere das Tempo nur bei kontrolliertem Rumpf; stoppe bei schaukelnder Hüfte und richte dich neu aus.",
  ],
);
const inchworm = guide(
  "plank",
  "Stand with space in front of you and keep a soft knee bend for reaching the floor.|Stanite sa slobodnim prostorom ispred i blago savijenim koljenima za doseg poda.|Stehe mit freiem Raum vor dir und leicht gebeugten Knien zum Bodenerreichen.",
  [
    "Fold at the hips and walk the hands forward a little at a time.|Nagnite se iz kukova i pomjerajte dlanove malo po malo naprijed.|Beuge dich aus der Hüfte vor und wandere schrittweise mit den Händen nach vorn.",
    "Stop in a high plank with the ribs and pelvis controlled; do not walk farther into a back arch.|Zaustavite u visokom planku uz kontrolisana rebra i karlicu; ne idite dalje u izvijanje leđa.|Stoppe im hohen Stütz bei kontrollierten Rippen und Becken; wandere nicht weiter ins Hohlkreuz.",
    "Walk the hands back toward the feet or take small steps toward the hands, then stand slowly.|Vratite dlanove prema stopalima ili malim koracima priđite dlanovima, zatim polako ustanite.|Wandere mit den Händen zurück oder mit kleinen Fußschritten zu den Händen und richte dich langsam auf.",
  ],
);
const reversecrunch = guide(
  "coreflexion",
  "Lie on your back with knees bent and hands supported beside the trunk or holding the bench securely.|Lezite na leđa savijenih koljena i oslonite dlanove uz trup ili sigurno držite klupu.|Liege auf dem Rücken mit gebeugten Knien und gestützten Händen am Rumpf oder sicherem Bankgriff.",
  [
    "Exhale and draw the bent knees toward the trunk while gently curling the pelvis off the support.|Izdahnite i približite savijena koljena trupu uz blago odizanje karlice od oslonca.|Atme aus und führe die gebeugten Knie zum Rumpf, während das Becken sanft von der Stütze einrollt.",
    "Lift only a small distance without kicking the legs toward the head.|Podignite samo malo bez izbacivanja nogu prema glavi.|Hebe nur klein an, ohne die Beine zum Kopf zu werfen.",
    "Lower the pelvis slowly and let the legs return only as far as the lower back stays controlled.|Polako spustite karlicu i vratite noge samo dok kontrolišete donja leđa.|Senke das Becken langsam und führe die Beine nur bei kontrolliertem unteren Rücken zurück.",
  ],
);
const mcgillcurl = guide(
  "coreflexion",
  "Lie on your back with one knee bent and the other leg long. Place the hands under the natural lower-back curve without flattening it.|Lezite na leđa s jednim koljenom savijenim i drugom nogom opruženom. Postavite šake ispod prirodne krivine donjih leđa bez ravnanja.|Liege mit einem gebeugten Knie und einem langen Bein auf dem Rücken. Lege die Hände unter die natürliche Lendenkurve, ohne sie abzuflachen.",
  [
    "Brace gently while keeping the neck aligned with the trunk.|Blago učvrstite trup uz vrat poravnat s trupom.|Spanne sanft an und halte den Hals in Rumpflinie.",
    "Lift the head and upper shoulders a small distance together without curling the lower back.|Podignite glavu i gornja ramena malo zajedno bez savijanja donjih leđa.|Hebe Kopf und obere Schultern gemeinsam klein an, ohne den unteren Rücken einzurollen.",
    "Lower gently and use only the hold duration and dose agreed for your situation; this is not a full McGill treatment program.|Lagano se spustite i koristite samo dogovoreno zadržavanje i dozu; ovo nije puni McGill terapijski program.|Senke sanft ab und nutze nur vereinbarte Haltedauer und Dosis; dies ist kein vollständiges McGill-Behandlungsprogramm.",
  ],
);
const stepdown = guide(
  "lunge",
  "Stand on a low stable step with the working foot fully supported and a hand support nearby.|Stanite na nizak stabilan stepenik s potpuno oslonjenim radnim stopalom i bliskim osloncem za ruku.|Stehe auf einer niedrigen festen Stufe mit voll gestütztem Arbeitsfuß und naher Handstütze.",
  [
    "Bend the working knee slowly and lower the other heel toward the floor.|Polako savijte radno koljeno i spuštajte drugu petu prema podu.|Beuge das Arbeitsknie langsam und senke die andere Ferse Richtung Boden.",
    "Touch the floor lightly without shifting the weight off the working leg or dropping the pelvis sideways.|Lagano dodirnite pod bez prenosa težine s radne noge ili bočnog pada karlice.|Berühre den Boden leicht, ohne das Arbeitsbein zu entlasten oder das Becken seitlich fallen zu lassen.",
    "Press through the working foot to rise; reduce the step height if you cannot control the lowering.|Odgurnite se radnim stopalom za povratak; smanjite visinu ako ne kontrolišete spuštanje.|Drücke über den Arbeitsfuß hoch; reduziere bei unkontrolliertem Absenken die Stufenhöhe.",
  ],
);
const sitstand = guide(
  "squat",
  "Sit near the front of a stable chair placed against a wall, with both feet supported beneath you.|Sjedite blizu prednjeg ruba stabilne stolice uz zid, s oba stopala oslonjena ispod sebe.|Sitze nahe der Vorderkante eines festen Stuhls an einer Wand mit beiden Füßen unter dir.",
  [
    "Lean the trunk slightly forward from the hips while keeping the feet grounded.|Blago nagnite trup naprijed iz kukova uz oslonjena stopala.|Neige den Rumpf leicht aus der Hüfte vor und halte die Füße am Boden.",
    "Press through both feet to stand; use the armrests if your plan allows assistance.|Odgurnite se oba stopala do stajanja; koristite naslone ruku ako plan dopušta pomoć.|Drücke über beide Füße zum Stand; nutze Armlehnen, wenn dein Plan Unterstützung erlaubt.",
    "Reach the hips back and lower to the chair slowly rather than dropping onto it.|Vratite kukove nazad i polako sjednite umjesto pada na stolicu.|Schiebe die Hüfte zurück und setze dich langsam statt auf den Stuhl zu fallen.",
  ],
);
const deadhang = guide(
  "pullup",
  "Use a secure bar low enough to reach from a stable step; keep feet partly supported if needed.|Koristite sigurnu šipku dohvatljivu sa stabilnog stepenika; po potrebi djelimično oslonite stopala.|Nutze eine sichere Stange, erreichbar von einer festen Stufe; stütze bei Bedarf die Füße teilweise.",
  [
    "Take a comfortable grip and gradually transfer only the weight your shoulders and grip tolerate.|Uhvatite udobno i postepeno prenesite samo težinu koju ramena i hvat podnose.|Greife angenehm und übertrage allmählich nur das von Schultern und Griff tolerierte Gewicht.",
    "Hang with long arms and quiet breathing without forcing the shoulders into an uncomfortable stretch.|Visite dugih ruku uz mirno disanje bez forsiranja neudobnog istezanja ramena.|Hänge mit langen Armen und ruhiger Atmung, ohne die Schultern unangenehm zu dehnen.",
    "Return weight to the step before opening the hands; do not drop from a fatigued grip.|Vratite težinu na stepenik prije otvaranja šaka; ne padajte iz umornog hvata.|Übertrage das Gewicht vor dem Loslassen auf die Stufe und lasse dich nicht aus ermüdetem Griff fallen.",
  ],
);
const scapularpull = guide(
  "pullup",
  "Take a secure bar grip with long arms and use a foot support to reduce body weight if needed.|Sigurno uhvatite šipku dugih ruku i po potrebi oslonite stopala radi manjeg opterećenja.|Greife die Stange sicher mit langen Armen und nutze bei Bedarf Fußstütze zur Entlastung.",
  [
    "Without bending the elbows, gently draw the shoulders away from the ears to raise the trunk slightly.|Bez savijanja laktova blago odmaknite ramena od ušiju da malo podignete trup.|Ziehe ohne Ellenbogenbeugung die Schultern sanft von den Ohren weg und hebe den Rumpf klein.",
    "Pause without swinging or forcing the shoulder blades together.|Zadržite bez njihanja ili forsiranog spajanja lopatica.|Halte ohne Schwung oder erzwungenes Zusammenpressen der Schulterblätter.",
    "Release the shoulder movement slowly back toward the supported hang.|Polako otpustite ramena prema podržanom visu.|Löse die Schulterbewegung langsam zum gestützten Hang zurück.",
  ],
);
const facepull = guide(
  "row",
  "Set a rope attachment or secure band around upper-chest to face height and take a stable stance.|Postavite nastavak užeta ili sigurnu traku između gornjih prsa i lica i zauzmite stabilan stav.|Positioniere Seilgriff oder sicheres Band etwa zwischen oberer Brust und Gesicht und stehe stabil.",
  [
    "Pull toward the face while separating the hands and leading the elbows outward.|Povucite prema licu uz razdvajanje šaka i vođenje laktova prema van.|Ziehe zum Gesicht, führe die Hände auseinander und die Ellenbogen nach außen.",
    "Finish with the hands near the temples only as far as the shoulders stay comfortable.|Završite šakama blizu sljepoočnica samo dok je ramenima udobno.|Ende nur bei angenehmen Schultern mit Händen nahe den Schläfen.",
    "Extend the arms slowly without leaning backward to create more range.|Polako ispružite ruke bez naginjanja unazad radi većeg raspona.|Strecke die Arme langsam, ohne für mehr Weg zurückzulehnen.",
  ],
);
const uprighter = guide(
  "raise",
  "Take a comfortable grip in front of the thighs with light resistance and straight wrists.|Uhvatite udobno ispred bedara s laganim otporom i ravnim zapešćima.|Greife vor den Oberschenkeln angenehm mit leichtem Widerstand und geraden Handgelenken.",
  [
    "Lift the elbows outward and upward, guiding the resistance close to the torso.|Podignite laktove van i gore, vodeći otpor blizu trupa.|Führe die Ellenbogen nach außen und oben; der Widerstand bleibt körpernah.",
    "Stop before shoulder pinching and do not force the elbows far above shoulder height.|Stanite prije štipanja ramena i ne forsirajte laktove daleko iznad visine ramena.|Stoppe vor Schulterklemmen und erzwinge keine Ellenbogen weit über Schulterhöhe.",
    "Lower slowly to the thighs with the neck and trunk steady.|Polako spustite do bedara uz miran vrat i trup.|Senke langsam zu den Oberschenkeln bei ruhigem Hals und Rumpf.",
  ],
);
const frontlever = guide(
  "plank",
  "Use a secure pull-up bar and begin with a tucked-knee progression under instruction; do not start with a full straight-body lever.|Koristite sigurnu šipku i pod obukom počnite progresijom savijenih koljena; ne počinjite punom opruženom polugom.|Nutze eine sichere Klimmzugstange und beginne angeleitet mit angezogenen Knien statt voller gestreckter Hebelposition.",
  [
    "From a controlled hang, keep the elbows long and draw the tucked knees toward the trunk.|Iz kontrolisanog visa zadržite duge laktove i privucite savijena koljena trupu.|Halte aus kontrolliertem Hang die Ellenbogen lang und ziehe die gebeugten Knie zum Rumpf.",
    "Lean the trunk back toward a short horizontal tuck only as far as shoulders and pelvis stay controlled.|Nagnite trup nazad prema kratkom vodoravnom položaju samo dok kontrolišete ramena i karlicu.|Neige den Rumpf nur so weit in einen kurzen waagerechten Tuck zurück, wie Schultern und Becken kontrolliert bleiben.",
    "Return slowly to the supported hang; extend the lever only after the easier position is reliable.|Polako se vratite u podržan vis; produžite polugu tek nakon pouzdanog lakšeg položaja.|Kehre langsam zum gestützten Hang zurück und verlängere den Hebel erst nach sicherer leichter Position.",
  ],
);
const planche = guide(
  "plank",
  "Start with a supported planche lean on a non-slip floor or secure parallettes, with feet remaining down.|Počnite podržanim nagibom za planche na podu koji ne kliže ili sigurnim ručkama, uz stopala na podu.|Beginne mit gestütztem Planche-Lean auf rutschfestem Boden oder sicheren Parallettes; die Füße bleiben unten.",
  [
    "Keep the arms long and gently push the shoulder blades apart.|Zadržite duge ruke i blago razmaknite lopatice.|Halte die Arme lang und schiebe die Schulterblätter sanft auseinander.",
    "Lean the shoulders a small distance forward of the hands while keeping the feet supported and trunk braced.|Nagnite ramena malo ispred dlanova uz oslonjena stopala i učvršćen trup.|Neige die Schultern klein vor die Hände bei gestützten Füßen und angespanntem Rumpf.",
    "Hold briefly within comfortable wrist loading, then shift back; lifting the feet is a later coached progression.|Kratko držite uz udobno opterećenje zapešća, zatim se vratite; odizanje stopala je kasnija progresija uz obuku.|Halte kurz bei angenehmer Handgelenkslast und verlagere zurück; Abheben der Füße ist eine spätere angeleitete Steigerung.",
  ],
);
const humanflag = guide(
  "sideplank",
  "Use a purpose-built secure vertical pole or stall bars and professional instruction; begin with feet supported on the floor.|Koristite namjensku sigurnu vertikalnu šipku ili švedske ljestve i stručnu obuku; počnite stopalima na podu.|Nutze eine dafür sichere senkrechte Stange oder Sprossenwand mit fachlicher Anleitung; beginne mit Füßen am Boden.",
  [
    "Place one hand above the other at a comfortable separation and stabilize both shoulders.|Postavite jednu šaku iznad druge na udobnom razmaku i stabilizujte oba ramena.|Setze eine Hand angenehm über die andere und stabilisiere beide Schultern.",
    "Keep foot support while gently pulling with the upper arm and pushing with the lower arm to feel side-body tension.|Zadržite oslonac stopalima uz blago povlačenje gornjom i potisak donjom rukom do bočne napetosti.|Halte Fußkontakt und ziehe sanft mit dem oberen Arm, während der untere drückt, um seitliche Rumpfspannung zu spüren.",
    "Release slowly; unsupported tuck and horizontal holds require an individual progression and spotter.|Otpustite polako; nepodržan skupljen i vodoravan položaj zahtijevaju individualnu progresiju i asistenta.|Löse langsam; ungestützte Tuck- und waagerechte Haltepositionen benötigen individuellen Aufbau und Sicherung.",
  ],
);
const lsit = guide(
  "plank",
  "Use fixed parallel handles beside the hips and begin seated with knees bent and feet lightly supported.|Koristite fiksne paralelne ručke uz kukove i počnite sjedeći savijenih koljena s blago oslonjenim stopalima.|Nutze feste Parallelgriffe neben der Hüfte und beginne sitzend mit gebeugten Knien und leicht gestützten Füßen.",
  [
    "Press down into the handles with long arms to lift the hips a small distance.|Pritisnite ručke dolje dugim rukama da malo odignete kukove.|Drücke mit langen Armen in die Griffe und hebe die Hüfte klein an.",
    "Hold a supported tuck first; lift the feet and gradually extend the knees only while shoulders and trunk stay stable.|Prvo držite podržan skupljen položaj; odignite stopala i postepeno opružajte koljena samo uz stabilna ramena i trup.|Halte zuerst einen gestützten Tuck; hebe die Füße und strecke die Knie erst schrittweise bei stabilen Schultern und Rumpf.",
    "Lower the feet and hips gently before the shoulders or elbows lose support.|Spustite stopala i kukove lagano prije gubitka oslonca ramena ili laktova.|Setze Füße und Hüfte sanft ab, bevor Schulter- oder Ellenbogenstütze nachlässt.",
  ],
);
const battle = guide(
  "locomotion",
  "Check the heavy rope anchor and stand with feet apart, knees soft and one rope end in each hand.|Provjerite sidrište teškog užeta i stanite razmaknutih stopala, mekanih koljena i jednim krajem u svakoj šaci.|Prüfe den schweren Seilanker und stehe mit Füßen auseinander, weichen Knien und einem Ende je Hand.",
  [
    "Brace the trunk and move the hands up and down in short waves, alternating or together as named.|Učvrstite trup i pomjerajte šake gore-dolje kratkim valovima, naizmjenično ili zajedno prema nazivu.|Spanne den Rumpf an und bewege die Hände in kurzen Wellen auf und ab, je nach Name abwechselnd oder gemeinsam.",
    "For rotational waves, guide a small side-to-side arc with controlled hips and feet rather than wrenching the lower back.|Za rotacijske valove vodite mali bočni luk uz kontrolisane kukove i stopala bez uvrtanja donjih leđa.|Führe bei Drehwellen einen kleinen seitlichen Bogen mit kontrollierter Hüfte und Füßen statt den unteren Rücken zu verdrehen.",
    "Maintain a steady rhythm only while shoulders and grip stay controlled, then let the rope settle before releasing.|Održavajte ritam samo uz kontrolisana ramena i hvat, zatim pustite uže da se smiri prije puštanja.|Halte den Rhythmus nur bei kontrollierten Schultern und Griff und lasse das Seil vor dem Loslassen ruhen.",
  ],
);
battle.mistakes = [
  text(
    "Do not hunch the neck, throw the entire trunk or let the rope anchor move.|Ne skupljajte vrat, ne bacajte cijeli trup i ne dozvolite pomjeranje sidrišta.|Ziehe den Hals nicht ein, wirf nicht den ganzen Rumpf und lasse den Anker nicht wandern.",
  ),
];
const superman = guide(
  "birddog",
  "Lie face down with the forehead supported lightly and arms reaching forward, using no extra weight.|Lezite licem dolje s blago oslonjenim čelom i rukama naprijed, bez dodatnog tereta.|Liege bäuchlings mit leicht gestützter Stirn und Armen nach vorn, ohne Zusatzgewicht.",
  [
    "Brace gently and lift the arms and legs a small distance while keeping the neck long.|Blago učvrstite trup i malo podignite ruke i noge uz dug vrat.|Spanne leicht an und hebe Arme und Beine klein bei langem Hals.",
    "Stop before you need to throw the head backward or pinch the lower back.|Stanite prije potrebe da zabacite glavu ili stisnete donja leđa.|Stoppe vor einem Zurückwerfen des Kopfes oder Klemmen im unteren Rücken.",
    "Lower all limbs slowly and relax between repetitions.|Polako spustite sve udove i opustite se između ponavljanja.|Senke alle Gliedmaßen langsam und entspanne zwischen Wiederholungen.",
  ],
);
const overrides: Array<[number[], FamilyGuide]> = [
  [
    [291],
    {
      ...handstand,
      steps: [
        text(
          "From the supported handstand, bend the elbows slowly through a small range while keeping the head free of load.|Iz podržanog stava na rukama polako savijte laktove malim rasponom, bez opterećivanja glave.|Beuge aus dem gestützten Handstand die Ellenbogen langsam klein und halte den Kopf unbelastet.",
        ),
        text(
          "Stop well before control is lost; use an elevated pike push-up instead if you cannot press back up.|Stanite znatno prije gubitka kontrole; koristite pike sklek s povišenim osloncem ako se ne možete potisnuti nazad.|Stoppe deutlich vor Kontrollverlust; nutze bei fehlender Druckkraft stattdessen einen erhöhten Pike-Liegestütz.",
        ),
        text(
          "Press through the hands to extend the arms, stabilize fully, then use your rehearsed exit.|Pritisnite dlanovima do opružanja ruku, potpuno stabilizujte pa izađite uvježbanom metodom.|Drücke über die Hände bis zur Armstreckung, stabilisiere vollständig und nutze den geübten Ausstieg.",
        ),
      ],
    },
  ],
  [[277], frontlever],
  [[319], humanflag],
  [[465], planche],
  [[371], lsit],
  [[50, 51, 52], battle],
  [[703], superman],
  [[74, 95, 96], burpee],
  [[77, 434, 435], climber],
  [[324, 325, 326], inchworm],
  [[197, 536, 537], reversecrunch],
  [[420], mcgillcurl],
  [[689, 690], stepdown],
  [[639], sitstand],
  [[187], deadhang],
  [[564, 565], scapularpull],
  [[255, 256], facepull],
  [[137, 240, 749], uprighter],
  [[3, 716], rollout],
  [[31, 440], nordic],
  [[531, 544], reverseNordic],
  [[388, 691, 692], stepup],
  [[34, 322, 548], backextension],
  [[497, 655, 656], proneextension],
  [[317, 318], hollow],
  [[759], handstand],
  [[551, 552], ropeclimb],
  [[747], getup],
];
const byId = new Map(overrides.flatMap(([ids, value]) => ids.map((id) => [id, value] as const)));
export const specialGuide = (id: string) => byId.get(Number(id.slice(9, 13)));
