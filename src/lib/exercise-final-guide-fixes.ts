import type { FamilyGuide } from "./exercise-guide-content";
const triple = (value: string) => value.split("|") as [string, string, string];
const fixed = (setup: string, steps: string[]): FamilyGuide => ({
  setup: [triple(setup)],
  steps: steps.map(triple),
  mistakes: [
    triple(
      "Avoid momentum, an unstable support or a range you cannot control; reduce difficulty before technique changes.|Izbjegavajte zamah, nestabilan oslonac i raspon koji ne kontrolišete; smanjite zahtjev prije promjene tehnike.|Vermeide Schwung, unsichere Stützen und unkontrollierbare Bewegungswege; reduziere vor einem Technikverlust.",
    ),
  ],
  cues: [
    triple(
      "Keep the described contact points secure and move smoothly in both directions.|Zadržite opisane tačke oslonca sigurnim i krećite se glatko u oba smjera.|Halte die beschriebenen Kontaktpunkte sicher und bewege dich in beide Richtungen gleichmäßig.",
    ),
  ],
});
const legpress = fixed(
  "Sit or recline in the leg-press machine with the back and pelvis supported; place the whole working foot or both feet on the platform and set the safety stops.|Sjednite ili se zavalite u spravu za potisak nogama, s oslonjenim leđima i karlicom; postavite cijelo radno ili oba stopala na platformu i namjestite zaštite.|Sitze oder liege in der Beinpresse mit gestütztem Rücken und Becken; setze den ganzen Arbeitsfuß oder beide Füße auf die Platte und stelle die Sicherheitsstopps ein.",
  [
    "Release the carriage only after the feet and back are secure, then bend the knees slowly as the platform approaches.|Otpustite platformu tek nakon sigurnog oslonca stopala i leđa, zatim polako savijajte koljena dok se približava.|Entriegle den Schlitten erst bei sicheren Füßen und Rücken und beuge die Knie langsam beim Herankommen der Platte.",
    "Stop before the pelvis rolls off the pad, the heels lift or the knees become uncomfortable.|Stanite prije odizanja karlice s jastučića, podizanja peta ili nelagode koljena.|Stoppe vor einem Abrollen des Beckens vom Polster, abhebenden Fersen oder Kniebeschwerden.",
    "Press the platform away through the whole foot, finish with softly extended knees and re-engage the safeties before exiting.|Potisnite platformu cijelim stopalom, završite meko opruženih koljena i uključite zaštite prije izlaska.|Drücke die Platte über den ganzen Fuß weg, ende mit weich gestreckten Knien und verriegle vor dem Aussteigen die Sicherungen.",
  ],
);
const sissy = fixed(
  "Use a secure hand support and begin unloaded, with feet comfortable and hips extended; this variation intentionally allows the heels to rise.|Koristite siguran oslonac rukom i počnite bez tereta, s udobnim stopalima i opruženim kukovima; ova varijanta namjerno dopušta podizanje peta.|Nutze eine feste Handstütze und beginne unbelastet mit angenehmen Füßen und gestreckter Hüfte; bei dieser Variante dürfen die Fersen bewusst abheben.",
  [
    "Bend the knees forward as the body leans backward from the knees, maintaining a line through the thighs and trunk.|Savijajte koljena naprijed dok se tijelo naginje nazad iz koljena, uz liniju bedara i trupa.|Beuge die Knie nach vorn, während der Körper aus den Knien zurücklehnt; halte Oberschenkel und Rumpf in einer Linie.",
    "Use a short range with the heels allowed to rise, keeping the forefoot supported; stop before knee discomfort.|Koristite kratak raspon uz dozvoljeno podizanje peta i oslonjen prednji dio stopala; stanite prije nelagode koljena.|Nutze einen kurzen Weg mit abhebenden Fersen und gestütztem Vorfuß; stoppe vor Kniebeschwerden.",
    "Use the thighs and hand support to return upright; do not add a dumbbell or a single-leg version before the supported movement is reliable.|Bedrima i osloncem ruke vratite se uspravno; ne dodajte bučicu ili jednu nogu prije pouzdane podržane varijante.|Kehre mit Oberschenkeln und Handstütze aufrecht zurück; ergänze Hantel oder Einbeinigkeit erst nach sicherer gestützter Bewegung.",
  ],
);
const reversehyper = fixed(
  "Lie face down on a purpose-built reverse-hyper bench with the trunk and pelvis supported and the legs free to move behind; secure your grip.|Lezite licem dolje na namjensku klupu za obrnutu ekstenziju, uz oslonjen trup i karlicu te slobodne noge iza; sigurno uhvatite oslonac.|Liege bäuchlings auf einer geeigneten Reverse-Hyper-Bank mit gestütztem Rumpf und Becken und frei beweglichen Beinen dahinter; greife sicher.",
  [
    "Let the legs hang comfortably below the hips without traction or swinging.|Pustite noge da udobno vise ispod kukova bez povlačenja ili njihanja.|Lasse die Beine angenehm unter der Hüfte hängen, ohne Zug oder Schwingen.",
    "Lift the thighs backward from the hips only until the legs approach the trunk line; keep the pelvis against the support.|Podignite bedra nazad iz kukova samo do približne linije trupa; karlica ostaje uz oslonac.|Hebe die Oberschenkel aus der Hüfte nach hinten bis annähernd zur Rumpflinie; halte das Becken an der Stütze.",
    "Lower the legs slowly without kicking above the torso or using the lower back to gain height.|Polako spustite noge bez izbacivanja iznad trupa ili podizanja donjim leđima.|Senke die Beine langsam ohne Hochwerfen über den Rumpf oder Höhengewinn aus dem unteren Rücken.",
  ],
);
const ballBack = fixed(
  "Lie face down over a secured stability ball with the abdomen and hips supported and feet braced against a wall or stable non-slip surface.|Lezite licem dolje preko osigurane lopte s oslonjenim trbuhom i kukovima, a stopala učvrstite uz zid ili sigurnu podlogu.|Liege bäuchlings über einem gesicherten Gymnastikball mit gestütztem Bauch und Hüfte und Füßen an Wand oder fester rutschfreier Fläche.",
  [
    "Let the upper trunk lower a small distance over the ball while keeping the head aligned.|Pustite gornji trup da se malo spusti preko lopte uz poravnatu glavu.|Senke den oberen Rumpf bei ausgerichtetem Kopf klein über den Ball.",
    "Raise the chest only to the line of the legs, keeping the pelvis supported and the ball still.|Podignite prsa samo do linije nogu uz oslonjenu karlicu i mirnu loptu.|Hebe die Brust nur bis zur Beinlinie bei gestütztem Becken und ruhigem Ball.",
    "Lower slowly to the starting position; use a stable bench version if the ball cannot stay controlled.|Polako se spustite na početak; koristite stabilnu klupu ako ne kontrolišete loptu.|Senke langsam zurück; nutze eine feste Bank, wenn der Ball nicht kontrollierbar bleibt.",
  ],
);
const dragon = fixed(
  "Lie on a stable bench and hold a secure support behind the head. Begin with a bent-knee regression and keep support on the upper back, never on the neck.|Lezite na stabilnu klupu i držite siguran oslonac iza glave. Počnite lakšom varijantom savijenih koljena; oslonac je na gornjim leđima, nikad na vratu.|Liege auf einer festen Bank und halte eine sichere Stütze hinter dem Kopf. Beginne mit gebeugten Knien und stütze auf dem oberen Rücken statt dem Hals.",
  [
    "Brace and raise the bent legs and pelvis a small distance while the upper back remains supported.|Učvrstite trup i malo podignite savijene noge i karlicu uz oslonjena gornja leđa.|Spanne an und hebe gebeugte Beine und Becken klein bei gestütztem oberen Rücken.",
    "Lower the hips and legs slowly as one controlled lever, stopping before the lower back arches or the neck is loaded.|Spuštajte kukove i noge polako kao kontrolisanu polugu, do granice prije izvijanja donjih leđa ili opterećenja vrata.|Senke Hüfte und Beine langsam als kontrollierten Hebel und stoppe vor Hohlkreuz oder Halsbelastung.",
    "Return to the supported start or rest; lengthen the legs only with a reliable coached progression.|Vratite se u podržan početak ili odmor; opružajte noge tek uz pouzdanu progresiju i obuku.|Kehre zur gestützten Startposition zurück oder pausiere; verlängere die Beine erst mit sicherem angeleitetem Aufbau.",
  ],
);
const windmill = fixed(
  "Begin unloaded with feet comfortably wide and one arm pointing upward; turn the feet slightly away from that raised arm.|Počnite bez tereta s udobno širokim stopalima i jednom rukom gore; stopala blago okrenite od podignute ruke.|Beginne unbelastet mit angenehm breiten Füßen und einem Arm aufwärts; drehe die Füße leicht vom angehobenen Arm weg.",
  [
    "Keep the raised arm vertical as you shift the hips toward that side and hinge toward the opposite leg.|Zadržite podignutu ruku okomito dok pomjerate kukove prema toj strani i naginjete se prema suprotnoj nozi.|Halte den oberen Arm senkrecht, schiebe die Hüfte zu dieser Seite und beuge dich zum gegenüberliegenden Bein.",
    "Trace the lower hand down the inside leg and stop before shoulder, spine or balance control changes.|Donjom šakom klizite niz unutrašnju nogu i stanite prije promjene kontrole ramena, kičme ili ravnoteže.|Führe die untere Hand innen am Bein hinab und stoppe vor Verlust von Schulter-, Rücken- oder Gleichgewichtskontrolle.",
    "Drive the hips back beneath the trunk to rise while the upper arm stays overhead; add a light kettlebell only after controlled unloaded practice.|Vratite kukove ispod trupa za uspravljanje dok ruka ostaje gore; laganu girju dodajte tek nakon kontrolisane vježbe bez tereta.|Bringe die Hüfte zum Aufrichten unter den Rumpf zurück, während der Arm oben bleibt; ergänze eine leichte Kettlebell erst nach sicherer unbelasteter Übung.",
  ],
);
const extensionIso = fixed(
  "Lie or sit with the working leg supported in a comfortable long-knee position; no moving weight is needed for a quad set.|Lezite ili sjednite s radnom nogom oslonjenom u udobno opruženom položaju; izometrija kvadricepsa ne zahtijeva pokretni teret.|Liege oder sitze mit gestütztem Arbeitsbein und angenehm langem Knie; ein Quad-Set benötigt kein bewegtes Gewicht.",
  [
    "Gently tighten the front thigh while keeping the heel and pelvis supported.|Blago zategnite prednje bedro uz oslonjenu petu i karlicu.|Spanne die Oberschenkelvorderseite sanft bei gestützter Ferse und Becken an.",
    "Hold without visibly bending or repeatedly lifting the knee; breathe normally.|Zadržite bez vidljivog savijanja ili ponavljanog podizanja koljena; dišite normalno.|Halte ohne sichtbare Kniebeugung oder wiederholtes Anheben und atme normal.",
    "Release fully between efforts and use the dose agreed for your rehabilitation stage.|Potpuno otpustite između napora i koristite dozu dogovorenu za fazu oporavka.|Löse zwischen Anspannungen vollständig und nutze die vereinbarte Dosis deiner Rehabilitationsphase.",
  ],
);
const shortarc = fixed(
  "Lie or sit with a small roll under the working knee and the heel free to lift; keep the thigh supported.|Lezite ili sjednite s malim valjkom ispod radnog koljena i slobodnom petom za podizanje; bedro je oslonjeno.|Liege oder sitze mit kleiner Rolle unter dem Arbeitsknie und frei anhebbarer Ferse; der Oberschenkel bleibt gestützt.",
  [
    "Tighten the front thigh and slowly raise the heel by straightening the knee over the roll.|Učvrstite prednje bedro i polako podignite petu opružanjem koljena preko valjka.|Spanne die Oberschenkelvorderseite an und hebe die Ferse langsam durch Kniestreckung über der Rolle.",
    "Pause at a comfortable straight position without pushing the knee backward.|Zadržite u udobnom opruženom položaju bez guranja koljena nazad.|Halte angenehm gestreckt, ohne das Knie nach hinten zu drücken.",
    "Lower the heel slowly while keeping the knee in contact with its support.|Polako spustite petu uz koljeno koje ostaje na osloncu.|Senke die Ferse langsam bei Kniekontakt zur Stütze.",
  ],
);
const tke = fixed(
  "Stand with a stable hand support; if a band is prescribed, anchor it securely behind the working knee and use light tension.|Stanite uz stabilan oslonac rukom; ako je traka propisana, sigurno je učvrstite iza radnog koljena uz blagu napetost.|Stehe neben einer festen Handstütze; befestige ein verordnetes Band sicher hinter dem Arbeitsknie mit leichter Spannung.",
  [
    "Start with a slight bend in the working knee and the heel supported.|Počnite blago savijenim radnim koljenom i oslonjenom petom.|Beginne mit leicht gebeugtem Arbeitsknie und gestützter Ferse.",
    "Gently straighten the knee without snapping backward or shifting the pelvis away.|Blago opružite koljeno bez trzanja nazad ili udaljavanja karlice.|Strecke das Knie sanft ohne Zurückschnappen oder Wegschieben des Beckens.",
    "Allow the small knee bend to return slowly and repeat within your planned range.|Polako vratite mali pregib koljena i ponovite u planiranom rasponu.|Lasse die kleine Kniebeugung langsam zurückkehren und wiederhole im geplanten Bereich.",
  ],
);
const straightleg = fixed(
  "Lie on your back with the other knee bent and foot supported; the working leg starts long on the surface.|Lezite na leđa s drugim koljenom savijenim i oslonjenim stopalom; radna noga je opružena na podlozi.|Liege auf dem Rücken mit anderem Knie gebeugt und Fuß gestützt; das Arbeitsbein liegt lang auf.",
  [
    "Tighten the working thigh to keep the knee long, then lift the whole leg a small distance from the hip.|Učvrstite radno bedro da koljeno ostane opruženo, zatim malo podignite cijelu nogu iz kuka.|Spanne den Arbeitsoberschenkel für ein langes Knie an und hebe das ganze Bein klein aus der Hüfte.",
    "Stop before the knee bends, pelvis tilts or lower back arches.|Stanite prije savijanja koljena, naginjanja karlice ili izvijanja donjih leđa.|Stoppe vor Kniebeugung, Beckenkippen oder Hohlkreuz.",
    "Lower the straight leg slowly and relax the thigh on the support before repeating.|Polako spustite opruženu nogu i opustite bedro na osloncu prije ponavljanja.|Senke das gestreckte Bein langsam und entspanne den Oberschenkel vor der Wiederholung auf der Stütze.",
  ],
);
const marching = fixed(
  "Lie on your back with knees bent and both feet supported, arms relaxed beside the body.|Lezite na leđa savijenih koljena i oba stopala oslonjena, s opuštenim rukama uz tijelo.|Liege mit gebeugten Knien und beiden Füßen gestützt auf dem Rücken; die Arme liegen entspannt seitlich.",
  [
    "Brace gently and lift one foot just clear of the floor while keeping the knee bent.|Blago učvrstite trup i malo odignite jedno stopalo uz savijeno koljeno.|Spanne sanft an und hebe einen Fuß bei gebeugtem Knie knapp vom Boden.",
    "Keep the pelvis quiet; do not reach the leg or opposite arm away as in a dead bug.|Zadržite mirnu karlicu; ne pružajte nogu ni suprotnu ruku kao u dead bug vježbi.|Halte das Becken ruhig; strecke Bein oder Gegenarm nicht wie beim Dead Bug weg.",
    "Lower the foot gently and alternate sides in a slow march.|Lagano spustite stopalo i izmjenjujte strane sporim maršom.|Setze den Fuß sanft ab und wechsle langsam marschierend die Seite.",
  ],
);
const sidebend = fixed(
  "Stand tall or sit securely with the arms comfortable; begin without added weight.|Stanite uspravno ili sjednite stabilno s udobnim rukama; počnite bez dodatnog tereta.|Stehe aufrecht oder sitze sicher mit angenehmen Armen; beginne ohne Zusatzlast.",
  [
    "Slide the ribs gently sideways toward one hip while the chest continues facing forward.|Blago pomjerite rebra bočno prema jednom kuku dok prsa ostaju naprijed.|Schiebe die Rippen sanft seitlich zu einer Hüfte; die Brust zeigt weiter nach vorn.",
    "Use a small side-bending range without turning the trunk or shifting the pelvis sideways.|Koristite mali bočni pregib bez okretanja trupa ili bočnog pomjeranja karlice.|Nutze einen kleinen Seitneigebereich ohne Rumpfdrehung oder seitliches Beckenschieben.",
    "Return upright slowly and repeat to the other side if planned.|Polako se vratite uspravno i po planu ponovite drugom stranom.|Kehre langsam aufrecht zurück und wiederhole nach Plan zur anderen Seite.",
  ],
);
const aroundworld = fixed(
  "Lie on a stable bench with a light dumbbell in each hand, arms long beside the hips and a soft elbow bend.|Lezite na stabilnu klupu s laganom bučicom u svakoj šaci, dugim rukama uz kukove i blagim pregibom laktova.|Liege auf einer festen Bank mit leichter Kurzhantel je Hand, langen Armen neben der Hüfte und leicht gebeugten Ellenbogen.",
  [
    "Sweep the arms outward in a wide arc toward an overhead position while keeping the elbow bend nearly unchanged.|Vodite ruke prema van širokim lukom prema položaju iznad glave uz gotovo isti pregib laktova.|Führe die Arme in weitem Bogen nach außen Richtung Überkopfposition; der Ellenbogenwinkel bleibt nahezu gleich.",
    "Stop before the shoulders pinch or the ribs flare; a complete circle is not required.|Stanite prije štipanja ramena ili isturanja rebara; puni krug nije potreban.|Stoppe vor Schulterklemmen oder aufklappenden Rippen; ein voller Kreis ist nicht nötig.",
    "Reverse the same arc slowly back toward the hips without dropping the dumbbells below a comfortable shoulder range.|Polako obrnite isti luk prema kukovima bez spuštanja bučica ispod udobnog raspona ramena.|Kehre langsam auf demselben Bogen zu den Hüften zurück, ohne unter einen angenehmen Schulterbereich abzusenken.",
  ],
);
const drop = fixed(
  "Use a low stable platform and a clear landing area; first practice a drop without a rebound before depth-jump combinations.|Koristite nisku stabilnu platformu i slobodnu zonu doskoka; prvo uvježbajte pad bez povratnog skoka prije dubinskih kombinacija.|Nutze eine niedrige feste Plattform und freie Landefläche; übe zuerst das Herabfallen ohne Rücksprung vor Tiefsprungkombinationen.",
  [
    "Step off the platform; do not jump upward from it to add height.|Zakoračite s platforme; ne odskačite s nje gore radi veće visine.|Steige von der Plattform; springe nicht für mehr Höhe nach oben ab.",
    "Land quietly with hips and knees bending together and knees following the toes.|Doskočite tiho uz zajedničko savijanje kukova i koljena te koljena u smjeru prstiju.|Lande leise mit gemeinsam beugenden Hüften und Knien; die Knie folgen den Zehen.",
    "Stabilize and reset first; add an immediate vertical or broad rebound only after coached landing practice and as named in the plan.|Prvo stabilizujte i obnovite položaj; neposredni visoki ili dugi skok dodajte tek nakon uvježbanog doskoka uz obuku i prema planu.|Stabilisiere und setze zuerst neu an; ergänze einen unmittelbaren Hoch- oder Weitsprung erst nach angeleiteter Landepraxis gemäß Plan.",
  ],
);
const crab = fixed(
  "Sit with knees bent, feet supported and hands behind the hips in a comfortable wrist position; the chest faces upward.|Sjedite savijenih koljena, oslonjenih stopala i dlanova iza kukova u udobnom položaju zapešća; prsa su prema gore.|Sitze mit gebeugten Knien, gestützten Füßen und Händen hinter der Hüfte bei angenehmen Handgelenken; die Brust zeigt nach oben.",
  [
    "Press into the hands and feet and lift the hips only a little.|Pritisnite dlanovima i stopalima i malo podignite kukove.|Drücke in Hände und Füße und hebe die Hüfte nur klein.",
    "Take tiny opposite-hand-and-foot steps while keeping the shoulders comfortable and pelvis controlled.|Pravite sitne korake suprotnom rukom i stopalom uz udobna ramena i kontrolisanu karlicu.|Gehe mit winzigen Schritten von Gegenhand und -fuß bei angenehmen Schultern und kontrolliertem Becken.",
    "Lower the hips to sit and rest before the wrists or shoulders become strained.|Spustite kukove u sjedenje i odmorite prije naprezanja zapešća ili ramena.|Setze die Hüfte zum Sitzen ab und pausiere vor Belastung von Handgelenken oder Schultern.",
  ],
);
const copenhagen = fixed(
  "Lie on your side with the supporting forearm under the shoulder and the top knee resting on a low secured padded bench; begin with a bent-knee lever.|Lezite na bok s podlakticom ispod ramena i gornjim koljenom na niskoj osiguranoj podstavljenoj klupi; počnite kratkom polugom savijenog koljena.|Liege seitlich mit Unterarm unter der Schulter und oberem Knie auf niedriger fester gepolsterter Bank; beginne mit gebeugtem kurzem Kniehebel.",
  [
    "Press the forearm and supported top knee down to lift the hips gently.|Pritisnite podlakticu i oslonjeno gornje koljeno dolje da blago podignete kukove.|Drücke Unterarm und gestütztes oberes Knie hinunter, um die Hüfte sanft zu heben.",
    "Keep the chest and pelvis facing sideways and hold only while groin and shoulder loading remain comfortable.|Zadržite prsa i karlicu bočno i držite samo dok je opterećenje prepone i ramena udobno.|Halte Brust und Becken seitlich und nur bei angenehmer Leisten- und Schulterbelastung.",
    "Lower slowly and change sides; move the support toward the ankle only after a controlled shorter-lever progression.|Polako se spustite i promijenite stranu; pomjerajte oslonac prema zglobu tek nakon kontrolisane kratke poluge.|Senke langsam und wechsle; verschiebe die Stütze erst nach kontrolliertem kurzem Hebel Richtung Knöchel.",
  ],
);
const kneelingSide = fixed(
  "Lie on your side with knees bent and supporting elbow directly under the shoulder; keep the knees as the lower support.|Lezite na bok savijenih koljena i laktom direktno ispod ramena; donji oslonac su koljena.|Liege seitlich mit gebeugten Knien und Stützellenbogen direkt unter der Schulter; die Knie bleiben der untere Stützpunkt.",
  [
    "Press through the forearm and lower knee to lift the hips until shoulders, hips and knees align.|Pritisnite podlakticom i donjim koljenom da podignete kukove do linije ramena, kukova i koljena.|Drücke über Unterarm und unteres Knie und hebe bis zur Linie von Schultern, Hüfte und Knien.",
    "Hold with normal breathing without rolling the chest or pelvis forward.|Držite uz normalno disanje bez okretanja prsa ili karlice naprijed.|Halte bei normaler Atmung, ohne Brust oder Becken vorzurollen.",
    "Lower gently and follow the individual hold dose; this modified exercise is not a complete named treatment program.|Lagano se spustite i pratite individualno trajanje; ova modifikacija nije puni imenovani terapijski program.|Senke sanft und befolge die individuelle Haltedosis; die modifizierte Übung ist kein vollständiges benanntes Behandlungsprogramm.",
  ],
);
const pike = fixed(
  "Place the hands securely about shoulder width and feet on the floor; lift the hips into an inverted-V shape with knees soft.|Sigurno postavite dlanove blizu širine ramena i stopala na pod; podignite kukove u obrnuto V uz mekana koljena.|Setze Hände etwa schulterbreit sicher und Füße auf den Boden; hebe die Hüfte zum umgekehrten V mit weichen Knien.",
  [
    "Bend the elbows and lower the head toward a point slightly in front of the hands while keeping the hips high.|Savijte laktove i približite glavu tački malo ispred dlanova uz visoke kukove.|Beuge die Ellenbogen und senke den Kopf zu einem Punkt etwas vor den Händen bei hoher Hüfte.",
    "Stop before the head touches or shoulder control is lost; use a very short range first.|Stanite prije dodira glave ili gubitka kontrole ramena; prvo koristite vrlo kratak raspon.|Stoppe vor Kopfkontakt oder Schulterkontrollverlust; beginne mit sehr kurzem Weg.",
    "Press through the hands to return to long arms, then lower the knees to exit safely.|Pritisnite dlanovima do dugih ruku, zatim spustite koljena za siguran izlaz.|Drücke über die Hände zu langen Armen und setze die Knie für einen sicheren Ausstieg ab.",
  ],
);
const highpull = fixed(
  "Use an empty or light bar first with a secure overhand grip; begin standing with the bar close to the thighs.|Prvo koristite praznu ili laganu šipku sigurnim nathvatom; počnite stojeći sa šipkom blizu bedara.|Nutze zuerst eine leere oder leichte Stange mit sicherem Obergriff; beginne stehend mit Stange nahe den Oberschenkeln.",
  [
    "Dip through the hips and knees slightly, then extend the legs and hips to accelerate the bar close to the body.|Malo savijte kukove i koljena, zatim opružite noge i kukove da ubrzate šipku blizu tijela.|Beuge Hüfte und Knie leicht und strecke dann Beine und Hüfte, um die Stange körpernah zu beschleunigen.",
    "Guide the elbows upward and outward only as far as the shoulders remain comfortable; this is a pull without a catch.|Vodite laktove gore i van samo dok je ramenima udobno; ovo je povlačenje bez prihvata.|Führe die Ellenbogen nur bei angenehmen Schultern aufwärts und auswärts; dies ist ein Zug ohne Fangen.",
    "Lower the bar with control and reset before repeating; do not turn the finish into a heavy overhead catch.|Kontrolisano spustite šipku i obnovite položaj; ne pretvarajte završetak u težak prihvat iznad glave.|Senke kontrolliert und setze neu an; mache daraus kein schweres Überkopffangen.",
  ],
);
const tire = fixed(
  "Use a suitable training tire on a clear non-slip surface with instruction; keep fingers and feet away from the landing edge.|Koristite odgovarajuću trenažnu gumu na slobodnoj podlozi koja ne kliže uz obuku; prste i stopala držite dalje od ruba doskoka.|Nutze angeleitet einen geeigneten Trainingsreifen auf freier rutschfester Fläche; halte Finger und Füße von der Aufschlagkante fern.",
  [
    "Set a stable low stance close to the tire and use the grip and body position you have been taught.|Zauzmite stabilan nizak stav blizu gume uz naučen hvat i položaj tijela.|Nimm einen stabilen tiefen Stand nahe am Reifen mit erlerntem Griff und Körperposition ein.",
    "Drive with the legs and hips to bring the tire toward upright, then reposition the hands to push it away under the taught method.|Potisnite nogama i kukovima prema uspravnoj gumi, zatim namjestite dlanove za potisak od sebe naučenom metodom.|Drücke aus Beinen und Hüfte Richtung aufrechtem Reifen und setze die Hände zum Wegdrücken nach der erlernten Methode um.",
    "Step clear as it falls, let it settle fully and reset; do not try to catch a falling tire.|Odmaknite se dok pada, pustite da se potpuno smiri i obnovite položaj; ne pokušavajte uhvatiti padajuću gumu.|Tritt beim Fallen frei, lasse den Reifen vollständig ruhen und setze neu an; fange keinen fallenden Reifen.",
  ],
);
const sandbag = fixed(
  "Use a light purpose-built sandbag and clear the space behind and beside the shoulder; learn the loading sequence before adding weight.|Koristite laganu namjensku vreću i oslobodite prostor iza i uz rame; naučite sekvencu podizanja prije tereta.|Nutze einen leichten geeigneten Sandsack und räume hinter und neben der Schulter frei; lerne die Hebefolge vor Zusatzlast.",
  [
    "Hinge and bend the knees to grip the bag, then bring it securely to the lap with the trunk braced.|Nagnite se iz kukova i savijte koljena za hvat, zatim sigurno prenesite vreću u krilo uz učvršćen trup.|Greife den Sack über Hüft- und Kniebeuge und bringe ihn bei angespanntem Rumpf sicher auf den Schoß.",
    "Extend the legs and hips to guide the bag over one shoulder toward the clear area behind; do not twist under a heavy falling load.|Opružite noge i kukove da vodite vreću preko jednog ramena u slobodan prostor iza; ne uvrćite se pod teškim padajućim teretom.|Strecke Beine und Hüfte und führe den Sack über eine Schulter in den freien Raum dahinter; verdrehe dich nicht unter fallender schwerer Last.",
    "Move clear and let the bag settle before retrieving it; this is a release, not an overhead catch.|Odmaknite se i pustite vreću da se smiri prije uzimanja; ovo je ispuštanje, a ne prihvat iznad glave.|Gehe frei und lasse den Sack vor dem Aufheben ruhen; dies ist ein Abgeben statt Überkopffangen.",
  ],
);
const renegade = fixed(
  "Place two light, stable hex dumbbells on a firm non-slip floor; use handles that cannot roll and begin with feet wider than hip width in a high plank.|Postavite dvije lagane, stabilne šesterokutne bučice na čvrst pod koji ne kliže; ručke se ne smiju kotrljati, a počnite visokim plankom sa stopalima širim od kukova.|Stelle zwei leichte, stabile Sechskanthanteln auf festen rutschfreien Boden; nutze nicht rollende Griffe und beginne im hohen Stütz mit Füßen breiter als die Hüfte.",
  [
    "Brace the abdomen and glutes, keep shoulders over the handles and transfer weight gently into one supporting hand without rotating the pelvis.|Učvrstite trbuh i stražnjicu, zadržite ramena iznad ručki i blago prenesite težinu na jednu potpornu ruku bez okretanja karlice.|Spanne Bauch und Gesäß an, halte die Schultern über den Griffen und verlagere das Gewicht sanft auf eine Stützhand, ohne das Becken zu drehen.",
    "Row the other dumbbell toward the ribs with the elbow close to the body; stop before the hips twist or the supporting handle shifts.|Povucite drugu bučicu prema rebrima s laktom blizu tijela; stanite prije uvrtanja kukova ili pomjeranja potpornog oslonca.|Ziehe die andere Hantel mit körpernahem Ellenbogen zu den Rippen und stoppe vor Hüftdrehung oder Verrutschen des Stützgriffs.",
    "Place the dumbbell down slowly, restore even support and alternate arms; lower the knees for an easier supported version before control is lost.|Polako spustite bučicu, obnovite ravnomjeran oslonac i izmjenjujte ruke; prije gubitka kontrole spustite koljena za lakšu podržanu varijantu.|Setze die Hantel langsam ab, stelle gleichmäßigen Halt her und wechsle den Arm; setze vor Kontrollverlust die Knie für eine leichtere gestützte Variante ab.",
  ],
);
renegade.mistakes = [
  triple(
    "Avoid round dumbbells that can roll, sagging at the waist, pulling the elbow high behind the torso or turning the hips to lift the weight.|Izbjegavajte okrugle bučice koje se mogu kotrljati, propadanje struka, visoko povlačenje lakta iza trupa i okretanje kukova radi podizanja tereta.|Vermeide rollende Rundhanteln, Durchhängen in der Taille, hohes Ziehen des Ellenbogens hinter den Rumpf und Hüftdrehung zum Anheben.",
  ),
];
renegade.cues = [
  triple(
    "Keep both hip bones facing the floor; move one arm while the rest of the body stays quiet.|Obje kosti karlice ostaju prema podu; pomjerajte jednu ruku dok ostatak tijela miruje.|Halte beide Beckenknochen zum Boden gerichtet; ein Arm bewegt sich, der übrige Körper bleibt ruhig.",
  ),
];
const fixes: Array<[number[], FamilyGuide]> = [
  [[515], renegade],
  [[393, 635], legpress],
  [[235, 626, 638, 706], sissy],
  [[541], reversehyper],
  [[668], ballBack],
  [[215], dragon],
  [[362], windmill],
  [[510], extensionIso],
  [[585], shortarc],
  [[721, 722], tke],
  [[697], straightleg],
  [[704], marching],
  [[592], sidebend],
  [[217], aroundworld],
  [[16, 201, 202, 216], drop],
  [[174], crab],
  [[171], copenhagen],
  [[421], kneelingSide],
  [[462], pike],
  [[43], highpull],
  [[730, 731], tire],
  [[561], sandbag],
];
const byId = new Map(fixes.flatMap(([ids, value]) => ids.map((id) => [id, value] as const)));
export const correctedGuide = (id: string) => byId.get(Number(id.slice(9, 13)));
