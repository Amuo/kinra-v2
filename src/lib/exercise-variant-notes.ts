import type { Language } from "./i18n";
/** Specific setup and technique notes are original Kinra copy, not copied source instructions. */
const notes = {
  dumbbells:
    "Keep both dumbbells clear of your face and knees; use a load you can place down safely.|Držite obje bučice dalje od lica i koljena; koristite teret koji možete sigurno odložiti.|Halte beide Kurzhanteln von Gesicht und Knien fern; nutze eine Last, die du sicher ablegen kannst.",
  barbell:
    "Use secure collars and appropriate rack safeties; rehearse the bar path with an empty bar.|Koristite sigurne osigurače i odgovarajuće zaštite stalka; uvježbajte putanju praznom šipkom.|Nutze feste Verschlüsse und passende Sicherheitsablagen; übe die Bahn mit leerer Stange.",
  cable:
    "Set the pulley for the named line of pull; check that the pin and attachment are fully secured.|Namjestite kolotur za navedeni smjer povlačenja; provjerite osigurač i pričvršćenje nastavka.|Stelle die Rolle für die genannte Zugrichtung ein und prüfe Steckstift und Befestigung.",
  band: "Inspect the band and anchor before use; keep your face away from the recoil line and maintain light tension.|Provjerite traku i sidrište; lice držite dalje od putanje povratnog udara i održavajte blagu napetost.|Prüfe Band und Anker; halte das Gesicht aus der Rückschnellbahn und bewahre leichte Spannung.",
  machine:
    "Adjust the seat and pads to your body; align the moving joint with the machine pivot where applicable.|Prilagodite sjedište i jastučiće tijelu; gdje je primjenjivo, poravnajte zglob s osovinom sprave.|Passe Sitz und Polster an deinen Körper an; richte das bewegte Gelenk gegebenenfalls an der Geräteachse aus.",
  oneArm:
    "Work one arm at a time; keep both shoulders level and repeat with the other arm without twisting the trunk.|Radite jednom rukom; ramena ostaju ravna, zatim ponovite drugom rukom bez uvrtanja trupa.|Arbeite mit einem Arm; halte die Schultern auf gleicher Höhe und wechsle ohne Rumpfdrehung den Arm.",
  oneLeg:
    "Keep the pelvis level on the working leg; use a hand support and repeat on the other side.|Držite karlicu ravno na radnoj nozi; koristite oslonac rukom i ponovite na drugoj strani.|Halte das Becken über dem arbeitenden Bein waagerecht; nutze eine Handstütze und wechsle die Seite.",
  alternating:
    "Alternate sides deliberately; return one side under control before starting the other.|Namjerno izmjenjujte strane; kontrolisano vratite jednu prije početka druge.|Wechsle die Seiten bewusst; führe eine Seite kontrolliert zurück, bevor die andere beginnt.",
  seated:
    "Sit with feet supported and avoid rocking backward to move the resistance.|Sjedite s oslonjenim stopalima i ne naginjite se unazad radi pomjeranja otpora.|Sitze mit gestützten Füßen und kippe nicht nach hinten, um den Widerstand zu bewegen.",
  kneeling:
    "Use padding under the knees and keep the hips extended without arching the lower back.|Podstavite koljena i držite kukove opružene bez izvijanja donjih leđa.|Polstere die Knie und halte die Hüfte gestreckt, ohne ins Hohlkreuz zu gehen.",
  inclinePress:
    "Set a moderate bench incline and press upward over the upper chest; keep the feet and hips supported.|Postavite umjeren nagib klupe i potiskujte gore iznad gornjeg dijela prsa; stopala i kukovi su oslonjeni.|Stelle eine mäßige Bankneigung ein und drücke über der oberen Brust nach oben; Füße und Hüfte bleiben gestützt.",
  declinePress:
    "Secure the decline bench and leg supports before lifting; lower toward the lower chest without bouncing.|Provjerite negativni nagib klupe i oslonce nogu; spuštajte prema donjim prsima bez odskakivanja.|Sichere Schrägbank und Beinhalterungen; senke zur unteren Brust ab, ohne zu federn.",
  inclineFly:
    "Use a modest incline; bring the arms together above the upper chest without reaching far behind the shoulders.|Koristite blag nagib; spojite ruke iznad gornjih prsa bez dosezanja daleko iza ramena.|Nutze eine leichte Neigung; führe die Arme über der oberen Brust zusammen, ohne weit hinter die Schultern zu reichen.",
  declineFly:
    "Secure the decline position; bring the arms together over the lower chest within a comfortable shoulder range.|Osigurajte negativni nagib; spojite ruke iznad donjih prsa u udobnom rasponu ramena.|Sichere die abfallende Position; führe die Arme im angenehmen Schulterbereich über der unteren Brust zusammen.",
  highLow:
    "Start with high pulleys and sweep diagonally downward toward the lower chest, keeping elbows softly bent.|Počnite s visokim koloturima i vodite dijagonalno dolje prema donjim prsima uz blago savijene laktove.|Beginne an hohen Rollen und führe die Arme bei leicht gebeugten Ellenbogen diagonal zur unteren Brust.",
  lowHigh:
    "Start with low pulleys and sweep upward toward upper-chest height; do not shrug to gain height.|Počnite s niskim koloturima i vodite gore do gornjih prsa; ne podižite ramena radi veće visine.|Beginne an tiefen Rollen und führe die Arme zur oberen Brust; ziehe die Schultern nicht für mehr Höhe hoch.",
  frontRaise:
    "Raise the arms forward in front of the torso, with thumbs neutral or slightly upward.|Podignite ruke naprijed ispred trupa, s palčevima neutralno ili blago gore.|Hebe die Arme vor dem Rumpf nach vorn; die Daumen bleiben neutral oder leicht aufwärts gerichtet.",
  lateralRaise:
    "Lift the upper arms out to the sides, slightly forward of the torso; keep the hands from tipping sharply downward.|Podižite nadlaktice bočno, blago ispred trupa; ne obarajte šake naglo dolje.|Hebe die Oberarme seitlich leicht vor der Rumpfebene; kippe die Hände nicht stark nach unten.",
  behindRaise:
    "Place the low pulley behind you and start with the working hand just behind the hip; use a small comfortable shoulder arc.|Postavite niski kolotur iza sebe i počnite šakom malo iza kuka; koristite mali udoban luk ramena.|Positioniere die tiefe Rolle hinter dir und beginne mit der Hand knapp hinter der Hüfte; nutze einen kleinen angenehmen Schulterbogen.",
  leaningRaise:
    "Hold a fixed support with the free hand and lean as one unit; keep the working shoulder controlled.|Slobodnom rukom držite fiksni oslonac i nagnite se kao cjelina; kontrolišite radno rame.|Halte dich mit der freien Hand an einer festen Stütze und neige den Körper als Einheit; kontrolliere die arbeitende Schulter.",
  hammer:
    "Use a neutral grip with thumbs pointing up; keep this grip through the curl.|Koristite neutralan hvat s palčevima gore i zadržite ga kroz pregib.|Nutze einen neutralen Griff mit Daumen nach oben und behalte ihn beim Curl bei.",
  reverseGrip:
    "Keep palms facing down or away as named; lower the load if the wrists cannot stay aligned.|Dlanovi su prema dolje ili od tijela prema nazivu; smanjite teret ako zapešća gube položaj.|Halte die Handflächen wie angegeben nach unten oder weggerichtet; reduziere die Last bei instabilen Handgelenken.",
  underhand:
    "Use a palms-up grip with wrists straight; draw the elbows toward the ribs without forcing wrist rotation.|Koristite pothvat s ravnim zapešćima; laktove povlačite prema rebrima bez forsiranja rotacije šake.|Nutze einen Untergriff bei geraden Handgelenken; ziehe die Ellenbogen zu den Rippen, ohne die Handdrehung zu erzwingen.",
  closeGrip:
    "Use a comfortable narrow grip rather than squeezing the hands together; keep the forearms aligned under the resistance.|Koristite udoban uži hvat umjesto spajanja šaka; podlaktice poravnajte ispod otpora.|Nutze einen angenehm engen Griff statt zusammengepresster Hände; halte die Unterarme unter dem Widerstand ausgerichtet.",
  wideGrip:
    "Widen only as far as the shoulders remain comfortable; a wider grip does not require a deeper bottom position.|Raširite samo dok je ramenima udobno; širi hvat ne zahtijeva dublju donju poziciju.|Greife nur so breit, wie es angenehm bleibt; ein breiterer Griff verlangt keine tiefere Endposition.",
  overheadTriceps:
    "Point the upper arms upward beside the head; bend the elbows behind the head without flaring the ribs.|Usmjerite nadlaktice gore uz glavu; savijajte laktove iza glave bez isturanja rebara.|Richte die Oberarme neben dem Kopf aufwärts; beuge die Ellenbogen hinter den Kopf, ohne die Rippen aufzuklappen.",
  lyingTriceps:
    "Lie securely and hold the upper arms above you; lower the weight near the sides of the head, keeping a safe path clear of the face.|Lezite stabilno s nadlakticama iznad tijela; spuštajte teret uz strane glave, putanjom dalje od lica.|Liege stabil mit den Oberarmen über dir; senke die Last seitlich am Kopf vorbei und halte das Gesicht aus der Bahn.",
  tricepsKickback:
    "Hinge the trunk and hold the upper arm beside the ribs; extend the elbow backward without swinging the shoulder.|Nagnite trup iz kukova i držite nadlakticu uz rebra; ispružite lakat nazad bez njihanja ramena.|Beuge den Rumpf aus der Hüfte vor und halte den Oberarm an den Rippen; strecke den Ellenbogen nach hinten ohne Schulterschwung.",
  pushdown:
    "Set the pulley or band above you; keep the elbows beside the ribs as you straighten the arms downward.|Postavite kolotur ili traku iznad sebe; laktovi ostaju uz rebra dok opružate ruke dolje.|Positioniere Rolle oder Band über dir; halte die Ellenbogen an den Rippen und strecke die Arme nach unten.",
  preacher:
    "Support the whole upper arm on the pad and avoid forcing the elbow straight at the bottom.|Oslonite cijelu nadlakticu na jastučić i ne forsirajte potpuno opružanje lakta dolje.|Stütze den ganzen Oberarm auf dem Polster ab und erzwinge unten keine Ellenbogenstreckung.",
  chestSupport:
    "Keep the chest in contact with the bench or pad throughout; adjust it so the arms can move freely.|Prsa ostaju uz klupu ili jastučić cijelo vrijeme; podesite tako da se ruke slobodno kreću.|Halte die Brust durchgehend an Bank oder Polster; stelle die Höhe für frei bewegliche Arme ein.",
  latRow:
    "Guide the elbow close to the body toward the hip, stopping before the shoulder rolls forward or the trunk twists.|Vodite lakat uz tijelo prema kuku; zaustavite prije prevrtanja ramena naprijed ili uvrtanja trupa.|Führe den Ellenbogen körpernah zur Hüfte; stoppe vor nach vorn rollender Schulter oder Rumpfdrehung.",
  rearRow:
    "Guide the elbows wider toward the upper ribs, without hiking the shoulders or yanking the neck forward.|Vodite laktove šire prema gornjim rebrima bez podizanja ramena ili trzanja vrata naprijed.|Führe die Ellenbogen weiter seitlich zu den oberen Rippen, ohne Schulterhochziehen oder vorgeschobenen Hals.",
  straightKnee:
    "Keep the knee long but not forced backward; move through the ankle with the heel aligned.|Koljeno je opruženo, ali ne gurnuto unazad; krećite iz zgloba uz poravnatu petu.|Halte das Knie lang, ohne es nach hinten zu drücken; bewege aus dem Sprunggelenk bei ausgerichteter Ferse.",
  bentKnee:
    "Keep the knees bent throughout so the heel can move without the knees rising and falling.|Zadržite savijena koljena tako da se pete kreću bez podizanja i spuštanja koljena.|Halte die Knie gebeugt, damit sich die Fersen ohne Auf- und Abbewegen der Knie bewegen.",
  pulse:
    "Use small controlled pulses within the comfortable working range; stop before posture or joint alignment changes.|Koristite male kontrolisane pulseve u udobnom radnom rasponu; stanite prije promjene položaja ili poravnanja zgloba.|Nutze kleine kontrollierte Impulse im angenehmen Arbeitsbereich und stoppe vor einem Verlust von Haltung oder Gelenkausrichtung.",
  hold: "Enter the working position slowly and hold with steady breathing; exit before control is lost.|Polako zauzmite radni položaj i držite uz mirno disanje; izađite prije gubitka kontrole.|Nimm die Arbeitsposition langsam ein und halte bei ruhiger Atmung; löse vor einem Kontrollverlust.",
  partial:
    "Use a deliberately shortened range with light resistance; do not use partials to hide an uncontrolled full-range load.|Koristite namjerno skraćen raspon s laganim otporom; ne koristite djelimična ponavljanja za prikrivanje preteškog tereta.|Nutze einen bewusst verkürzten Bereich mit leichtem Widerstand; kaschiere damit keine unkontrollierbare Last über den ganzen Bewegungsweg.",
  unstable:
    "Secure the BOSU or ball against slipping and practice the stable-floor version first; reduce load for the unstable support.|Osigurajte BOSU ili loptu od klizanja i prvo uvježbajte stabilnu podlogu; smanjite teret na nestabilnom osloncu.|Sichere BOSU oder Ball gegen Wegrutschen und übe zuerst auf festem Boden; reduziere die Last auf instabiler Stütze.",
  clinical:
    "The rehabilitation or named-method label is not an individualized treatment plan; confirm range, dose and progression for your situation.|Rehabilitacijski naziv ili imenovana metoda nisu individualni terapijski plan; potvrdite raspon, dozu i napredovanje za svoju situaciju.|Die Rehabilitationsbezeichnung oder benannte Methode ist kein individueller Behandlungsplan; kläre Bereich, Dosis und Steigerung für deine Situation.",
  rotation180:
    "Rehearse a quarter-turn first, then rotate a half-turn in the air and face the landing direction before contact.|Prvo uvježbajte četvrt okreta, zatim pola okreta u zraku i usmjerite se prema doskoku prije kontakta.|Übe zuerst eine Vierteldrehung, drehe dann eine halbe Runde in der Luft und richte dich vor dem Kontakt zur Landung aus.",
  rotation360:
    "Practice smaller turns before a full turn; rotate in the air rather than twisting a planted knee.|Prije punog okreta uvježbajte manje; okrećite se u zraku, a ne preko oslonjenog koljena.|Übe kleinere Drehungen vor einer vollen Runde; drehe in der Luft statt über ein belastetes Knie.",
  boxJump:
    "Choose a low stable box; land with the full foot on top, stand balanced and step down rather than jumping down repeatedly.|Izaberite nisku stabilnu kutiju; doskočite cijelim stopalom na vrh, stabilizujte se i siđite korakom umjesto stalnog skakanja dolje.|Wähle eine niedrige feste Box; lande mit dem ganzen Fuß oben, stabilisiere dich und steige ab, statt wiederholt herunterzuspringen.",
  depth:
    "This is an advanced drop drill: step off a low platform rather than jumping up from it; first master a quiet landing without a rebound.|Ovo je napredan zadatak pada: zakoračite s niske platforme umjesto odskoka s nje; prvo savladajte tih doskok bez povratnog skoka.|Dies ist eine fortgeschrittene Fallübung: Steige von einer niedrigen Plattform statt abzuspringen; beherrsche zuerst eine leise Landung ohne Rücksprung.",
  lateralJump:
    "Push sideways and land over the receiving foot; keep the pelvis controlled before the next lateral takeoff.|Odgurnite se bočno i doskočite iznad prihvatnog stopala; kontrolišite karlicu prije novog bočnog odraza.|Drücke seitlich ab und lande über dem aufnehmenden Fuß; kontrolliere das Becken vor dem nächsten seitlichen Absprung.",
  broadJump:
    "Project forward with a two-foot takeoff and swing the arms naturally; land on both feet without falling backward.|Usmjerite se naprijed odrazom s obje noge i prirodnim zamahom ruku; doskočite na oba stopala bez pada unazad.|Springe beidbeinig nach vorn und schwinge die Arme natürlich; lande auf beiden Füßen, ohne rückwärts zu fallen.",
  pogo: "Use low ankle-driven hops with a tall trunk and soft knees; keep the contacts light rather than forcing locked-knee stiffness.|Koristite niske poskoke iz skočnog zgloba uz uspravan trup i mekana koljena; kontakti su laki, bez ukočenog zaključavanja.|Nutze niedrige Sprunggelenkshüpfer mit aufrechtem Rumpf und weichen Knien; halte die Kontakte leicht statt die Knie steif zu verriegeln.",
  backSquat:
    "Place the bar securely across the upper back, not on the neck; set rack safeties before unracking.|Postavite šipku sigurno preko gornjih leđa, ne na vrat; namjestite zaštite stalka prije skidanja.|Lege die Stange sicher auf den oberen Rücken, nicht auf den Hals; stelle die Sicherheitsablagen vor dem Herausheben ein.",
  frontSquat:
    "Support the bar across the front of the shoulders with elbows lifted; do not support the whole load in the wrists.|Oslonite šipku na prednju stranu ramena s podignutim laktovima; ne nosite cijeli teret zapešćima.|Stütze die Stange vorn auf den Schultern mit angehobenen Ellenbogen ab; trage die Last nicht allein in den Handgelenken.",
  goblet:
    "Hold the weight close to the chest with elbows beneath it; keep the load near as you descend.|Držite teret blizu prsa s laktovima ispod; zadržite ga blizu tokom spuštanja.|Halte das Gewicht nah an der Brust mit Ellenbogen darunter und bewahre die Nähe beim Absenken.",
  sumo: "Use a wider stance with toes turned out comfortably; the knees follow the toes and the feet remain fully supported.|Koristite širi stav s prstima udobno prema van; koljena prate prste, a stopala ostaju potpuno oslonjena.|Nutze einen breiteren Stand mit angenehm ausgedrehten Zehen; Knie folgen den Zehen, die Füße bleiben ganz belastet.",
  romanian:
    "Start standing and lower with softly bent knees; this variation does not require the weight to touch the floor.|Počnite stojeći i spuštajte uz blago savijena koljena; ova varijanta ne zahtijeva dodir tereta s podom.|Beginne aufrecht und senke mit leicht gebeugten Knien; die Last muss bei dieser Variante den Boden nicht berühren.",
  deadliftFloor:
    "Set the load over the midfoot, take the slack out of the arms and resistance, then lift from a braced start; reset between repetitions.|Postavite teret iznad sredine stopala, uklonite labavost ruku i otpora, zatim podignite iz učvršćenog početka; obnovite položaj između ponavljanja.|Positioniere die Last über dem Mittelfuß, nimm Spiel aus Armen und Widerstand und hebe aus einer angespannten Startposition; setze zwischen Wiederholungen neu an.",
  hipthrust:
    "Support the upper back on a secured bench and pad the load at the hips; finish with the trunk near horizontal.|Oslonite gornja leđa na osiguranu klupu i podstavite teret na kukovima; završite s trupom blizu vodoravnog položaja.|Stütze den oberen Rücken auf einer festen Bank ab und polstere die Last an der Hüfte; ende mit annähernd waagerechtem Rumpf.",
  reverseLunge:
    "Step backward to create the split stance, lower under control, then drive through the front foot to bring the rear foot back.|Zakoračite nazad u raskorak, kontrolisano se spustite i odgurnite prednjim stopalom za povratak zadnjeg.|Gehe rückwärts in den Ausfallschritt, senke kontrolliert ab und bringe den hinteren Fuß durch Druck aus dem vorderen Fuß zurück.",
  lateralLunge:
    "Step sideways and sit into the stepping hip while the other leg stays long; push back through the bent-leg foot.|Zakoračite bočno i sjednite u kuk te noge dok druga ostaje opružena; odgurnite se stopalom savijene noge.|Gehe seitlich und setze dich in die Hüfte des Schrittbeins; das andere Bein bleibt lang. Drücke über den Fuß des gebeugten Beins zurück.",
  bulgarian:
    "Place the rear foot on a low stable support; use the front leg as the main support and choose a stance that allows balance.|Postavite zadnje stopalo na nizak stabilan oslonac; prednja noga je glavni oslonac uz stav koji omogućava ravnotežu.|Lege den hinteren Fuß auf eine niedrige feste Stütze; das vordere Bein trägt hauptsächlich bei einem balancierbaren Stand.",
  curtsy:
    "Step the rear leg diagonally behind only as far as the front knee and pelvis remain comfortable and aligned.|Zakoračite zadnjom nogom dijagonalno iza samo dok prednje koljeno i karlica ostaju udobni i poravnati.|Setze das hintere Bein nur so weit diagonal zurück, wie vorderes Knie und Becken angenehm ausgerichtet bleiben.",
} as const;
export type VariantNote = keyof typeof notes;
export function variantNote(key: VariantNote, language: Language) {
  return notes[key].split("|")[{ en: 0, bs: 1, de: 2 }[language]]!;
}
