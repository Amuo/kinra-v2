import type { Language } from "./i18n";
/** These notes describe the particular variant, supplementing its movement-family guide. */
const entries: Array<[number[], string]> = [
  [
    [7],
    "Use a flat agility ladder and rehearse one foot in each square at walking speed. Keep contacts light and eyes forward before increasing cadence.|Koristite ravne koordinacijske ljestve i uvježbajte jedno stopalo u svakom polju hodom. Kontakti su lagani i pogled naprijed prije povećavanja ritma.|Nutze eine flache Koordinationsleiter und übe gehend einen Fuß pro Feld. Halte Kontakte leicht und den Blick vorn, bevor du die Frequenz erhöhst.",
  ],
  [
    [33],
    "Use a relaxed skipping rhythm: lift one knee, extend the lower leg forward briefly, then sweep the foot down beneath the hips. Keep the sweep controlled rather than kicking forcefully.|Koristite opušten ritam poskoka: podignite jedno koljeno, kratko pružite potkoljenicu naprijed i spustite stopalo ispod kukova. Kontrolišite zamah umjesto snažnog udarca.|Nutze einen lockeren Hüpfrhythmus: Hebe ein Knie, strecke den Unterschenkel kurz vor und führe den Fuß unter die Hüfte. Kontrolliere die Bewegung statt kräftig zu treten.",
  ],
  [
    [37, 89, 90],
    "Take a comfortable boxing stance with soft knees and hands near the face. Extend a controlled punch without locking the elbow, rotate through the hips and feet as appropriate, then return to guard; learn unfamiliar combinations with instruction.|Zauzmite udoban bokserski stav mekanih koljena i šaka blizu lica. Kontrolisano udarite bez zaključavanja lakta, po potrebi rotirajte kukove i stopala pa vratite gard; nepoznate kombinacije učite uz obuku.|Nimm einen angenehmen Boxstand mit weichen Knien und Händen am Gesicht ein. Strecke einen kontrollierten Schlag ohne Ellenbogenverriegelung, drehe gegebenenfalls Hüfte und Füße mit und kehre zur Deckung zurück; lerne neue Kombinationen angeleitet.",
  ],
  [
    [69],
    "From a forearm plank, place the feet on sliders or a towel suitable for the floor. Glide the body a small distance backward and forward from the shoulders while keeping the trunk rigid; do not slide into a lower-back arch.|Iz planka na podlakticama postavite stopala na klizače ili peškir za podlogu. Klizite tijelom malo nazad i naprijed iz ramena uz čvrst trup; ne klizite u izvijanje donjih leđa.|Setze im Unterarmstütz die Füße auf geeignete Gleiter oder ein Handtuch. Gleite klein aus den Schultern zurück und vor bei festem Rumpf, ohne in ein Hohlkreuz zu rutschen.",
  ],
  [
    [86],
    "Choose a low stable obstacle you can clear without tucking excessively. Jump across and land softly on the far side, then walk around to reset rather than rushing repeated rebounds.|Izaberite nisku stabilnu prepreku koju prelazite bez pretjeranog skupljanja. Preskočite i mekano doskočite na drugu stranu, zatim obiđite za novi početak umjesto žurnih odskoka.|Wähle ein niedriges festes Hindernis, das du ohne starkes Anhocken überquerst. Springe darüber, lande weich auf der anderen Seite und gehe zum Neustart herum statt hastig zurückzufedern.",
  ],
  [
    [97, 98],
    "Jog gently in place or forward and alternately bring a heel toward the buttock. Keep the knees mostly beneath the hips and avoid arching the back or forcing heel contact.|Lagano trčkarajte u mjestu ili naprijed i naizmjenično približite petu stražnjici. Koljena su uglavnom ispod kukova; ne izvijajte leđa niti forsirajte dodir pete.|Trabe locker am Platz oder vorwärts und führe abwechselnd eine Ferse zum Gesäß. Halte die Knie überwiegend unter der Hüfte und erzwinge weder Hohlkreuz noch Fersenkontakt.",
  ],
  [
    [162, 478],
    "First master a controlled incline or floor push-up. Push forcefully enough for a brief hand release only when ready; land on soft elbows and reset before another repetition. A clap is optional, not the target of safe landing.|Prvo savladajte kontrolisan sklek na povišenju ili podu. Potisnite za kratko odvajanje dlanova tek kada ste spremni; doskočite mekanim laktovima i obnovite položaj. Pljesak je opcija, a ne cilj sigurnog doskoka.|Beherrsche zuerst kontrollierte erhöhte oder Bodenliegestütze. Drücke erst bei Bereitschaft für kurzes Handabheben kräftig; lande mit weichen Ellenbogen und setze neu an. Klatschen ist optional statt Ziel einer sicheren Landung.",
  ],
  [
    [174],
    "Sit with knees bent, feet supported and hands behind the hips in a comfortable wrist position. Lift the hips a little and take tiny opposite-hand-and-foot steps while facing upward; lower the hips to rest before shoulder strain.|Sjedite savijenih koljena, oslonjenih stopala i dlanova iza kukova uz udobna zapešća. Malo podignite kukove i pravite sitne suprotne korake ruke i stopala licem gore; spustite prije naprezanja ramena.|Sitze mit gebeugten Knien, gestützten Füßen und Händen hinter der Hüfte bei angenehmen Handgelenken. Hebe die Hüfte klein und gehe mit winzigen gegenüberliegenden Hand-Fuß-Schritten nach oben gewandt; lege vor Schulterbelastung ab.",
  ],
  [
    [244],
    "Use a secure hand support and begin on a flat surface unless your plan specifies a step. Rise with both feet if needed, shift toward the working side and lower the heel slowly; do not force a painful drop below the forefoot.|Koristite siguran oslonac rukom i počnite na ravnom osim ako plan traži stepenik. Po potrebi podignite se oba stopala, prenesite na radnu stranu i polako spustite petu; ne forsirajte bolan pad ispod prednjeg stopala.|Nutze eine sichere Handstütze und beginne eben, sofern dein Plan keine Stufe vorgibt. Hebe bei Bedarf beidbeinig an, verlagere zur Arbeitsseite und senke die Ferse langsam; erzwinge kein schmerzhaftes Absenken unter den Vorfuß.",
  ],
  [
    [300, 301, 374, 661],
    "March first, lifting one knee while the opposite arm moves forward. Add a light skip or jogging rhythm only after balance is steady; keep contacts beneath the body rather than reaching far ahead.|Prvo marširajte podižući jedno koljeno uz suprotnu ruku naprijed. Dodajte lagan poskok ili trčkaranje nakon stabilne ravnoteže; kontakti su ispod tijela, a ne daleko ispred.|Marschiere zuerst mit einem angehobenen Knie und gegenüberliegendem Arm vorn. Ergänze erst bei stabilem Gleichgewicht leichtes Hüpfen oder Traben; lande unter dem Körper statt weit vorn.",
  ],
  [
    [353, 354],
    "Begin with feet together and arms at the sides. Step or jump the feet apart while raising the arms, then return together; keep the arms below any uncomfortable shoulder range.|Počnite spojenih stopala i ruku uz tijelo. Korakom ili skokom razmaknite stopala uz podizanje ruku, zatim ih spojite; ruke ostaju ispod neudobnog raspona ramena.|Beginne mit Füßen zusammen und Armen seitlich. Öffne die Füße per Schritt oder Sprung bei angehobenen Armen und schließe wieder; bleibe unter unangenehmen Schulterbereichen.",
  ],
  [
    [362],
    "Begin unloaded with a wide stance and one arm pointing upward. Turn the feet slightly away from the raised arm, hinge toward the other hip and trace the lower hand down the inside leg; keep the raised shoulder stable and stop before losing alignment.|Počnite bez tereta širokim stavom i jednom rukom gore. Stopala blago okrenite od podignute ruke, nagnite se prema drugom kuku i donjom šakom klizite niz unutrašnju nogu; stabilizujte gornje rame i stanite prije gubitka položaja.|Beginne unbelastet im breiten Stand mit einem Arm aufwärts. Drehe die Füße leicht vom oberen Arm weg, beuge dich zur anderen Hüfte und führe die untere Hand innen am Bein hinab; halte die obere Schulter stabil und stoppe vor Ausrichtungsverlust.",
  ],
  [
    [372],
    "Hold the legs forward only to the height that leaves your pelvis and shoulders controlled; begin with bent knees before a straight-leg L-sit pull-up.|Držite noge naprijed samo do visine uz kontrolisana ramena i karlicu; počnite savijenih koljena prije opruženog L-sit zgiba.|Halte die Beine nur so hoch vorn, wie Becken und Schultern kontrolliert bleiben; beginne vor dem gestreckten L-Sit-Klimmzug mit gebeugten Knien.",
  ],
  [
    [386, 387],
    "Face forward in a soft athletic stance and take short sideways steps without crossing the feet. Push from the trailing foot and slow before changing direction.|Gledajte naprijed u mekanom sportskom stavu i pravite kratke bočne korake bez ukrštanja stopala. Odgurnite se zadnjim stopalom i usporite prije promjene smjera.|Blicke in weichem sportlichem Stand nach vorn und gehe kurz seitwärts ohne Fußkreuzen. Drücke vom hinteren Fuß ab und bremse vor dem Richtungswechsel.",
  ],
  [
    [468, 469, 470],
    "From a stable plank, widen the feet enough to resist rotation. For a drag, pull a light load across with one hand; for a tap, touch the opposite shoulder; for a leg lift, lift one foot slightly. Return the moving limb before alternating.|Iz stabilnog planka raširite stopala za otpor rotaciji. Za povlačenje prebacite lagan teret rukom, za dodir dotaknite suprotno rame, za podizanje noge malo odignite stopalo. Vratite ud prije izmjene.|Öffne aus stabilem Stütz die Füße gegen Rotation. Ziehe bei der Zugvariante eine leichte Last quer, tippe bei der Tippvariante die Gegenschulter oder hebe bei Beinheben einen Fuß klein. Setze vor dem Wechsel zurück.",
  ],
  [
    [475],
    "Pinch the plate securely between the fingers and thumb with a straight wrist. Hold it beside the body over a clear area and set it down before the grip starts slipping; this is a stationary hold.|Sigurno uhvatite ploču između prstiju i palca uz ravno zapešće. Držite uz tijelo nad slobodnim prostorom i odložite prije klizanja hvata; ovo je statičko držanje.|Klemme die Scheibe sicher zwischen Fingern und Daumen bei geradem Handgelenk. Halte seitlich über freiem Raum und lege vor Griffgleiten ab; dies ist ein statischer Halt.",
  ],
  [
    [508, 584, 760],
    "Keep the elbows straight for the plus phase and gently push the chest farther away from the hands by moving the shoulder blades around the ribs. Return the shoulder blades under control without sagging the trunk.|Za plus fazu zadržite ispružene laktove i blago odgurnite prsa dalje od dlanova pomjeranjem lopatica oko rebara. Kontrolisano vratite lopatice bez propadanja trupa.|Halte für die Plus-Phase die Ellenbogen gestreckt und drücke die Brust durch Schulterblattbewegung um die Rippen weiter von den Händen weg. Kehre kontrolliert ohne Rumpfdurchhängen zurück.",
  ],
  [
    [510, 585, 721, 722],
    "For quad sets, support the long leg and gently tighten the front thigh without lifting the heel. For short-arc work, support the knee over a small roll and lift the heel to straighten it. For TKE, begin with a slight knee bend and straighten gently against the secured band behind the knee; never snap backward.|Za izometriju kvadricepsa oslonite dugu nogu i blago učvrstite prednje bedro bez odizanja pete. Za kratki luk podstavite koljeno malim valjkom i podignite petu do opružanja. Za TKE počnite blago savijenog koljena i nježno opružite protiv sigurne trake iza koljena; ne trzajte nazad.|Stütze für Quad-Sets das lange Bein und spanne die Oberschenkelvorderseite sanft ohne Fersenheben an. Stütze beim kurzen Bogen das Knie auf kleiner Rolle und hebe die Ferse zur Streckung. Strecke bei TKE aus leichter Beugung sanft gegen das gesicherte Band hinter dem Knie; schnappe nie nach hinten.",
  ],
  [
    [591, 660],
    "Warm up with easy jogging and gradual accelerations. Run a short clear lane with relaxed arms and controlled foot contacts; leave enough room to decelerate and walk back before repeating.|Zagrijte se laganim trčkaranjem i postepenim ubrzanjima. Trčite kratkom slobodnom stazom opuštenih ruku i kontrolisanih kontakata; ostavite prostor za usporavanje i vratite se hodom.|Wärme dich mit lockerem Traben und allmählichem Beschleunigen auf. Laufe eine kurze freie Bahn mit entspannten Armen und kontrollierten Kontakten; lasse Platz zum Abbremsen und gehe zurück.",
  ],
  [
    [671, 694],
    "Secure the ball and first master a static supported plank. For pike, keep hands on the floor and roll the ball toward the hands by lifting the hips; for stir-the-pot, keep forearms on the ball and draw tiny circles while the pelvis stays quiet.|Osigurajte loptu i prvo savladajte statički podržan plank. Za pike dlanovi su na podu, a podizanjem kukova kotrljajte loptu prema rukama; za stir-the-pot podlaktice su na lopti i crtaju sitne krugove uz mirnu karlicu.|Sichere den Ball und beherrsche zuerst statischen Stütz. Beim Pike bleiben die Hände am Boden und die Hüfte hebt zum Heranrollen des Balls; beim Rühren liegen die Unterarme auf dem Ball und kreisen winzig bei ruhigem Becken.",
  ],
  [
    [704],
    "Lie on your back with both feet supported and knees bent. Lift one foot just off the floor without rocking the pelvis, lower it gently and alternate as a slow march.|Lezite na leđa s oba stopala oslonjena i savijenim koljenima. Malo odignite jedno stopalo bez njihanja karlice, lagano spustite i izmjenjujte kao spori marš.|Liege mit beiden Füßen gestützt und gebeugten Knien auf dem Rücken. Hebe einen Fuß knapp ohne Beckenschaukeln, setze sanft ab und wechsle wie beim langsamen Marsch.",
  ],
  [
    [710],
    "Hold a ball lightly between the hands and thighs in the bent-knee starting position. Reach one arm and the opposite leg away while keeping gentle pressure through the remaining hand and thigh, then return and change sides.|Blago držite loptu između dlanova i bedara u početnom položaju savijenih koljena. Pružite jednu ruku i suprotnu nogu uz blag pritisak preostalog dlana i bedra, zatim se vratite i promijenite stranu.|Halte einen Ball leicht zwischen Händen und Oberschenkeln bei gebeugten Knien. Strecke einen Arm und das Gegenbein weg bei sanftem Druck von verbleibender Hand und Oberschenkel; kehre zurück und wechsle.",
  ],
  [
    [712],
    "Support the upper back on a secured ball, feet flat and wide enough for balance. Raise and lower the hips while keeping the head and shoulders comfortably supported and the ball from rolling away.|Oslonite gornja leđa na osiguranu loptu, uz ravna i dovoljno široka stopala za ravnotežu. Podižite i spuštajte kukove uz udobno oslonjenu glavu i ramena, bez bježanja lopte.|Stütze den oberen Rücken auf einem gesicherten Ball bei flachen, ausreichend breiten Füßen ab. Hebe und senke die Hüfte bei angenehm gestütztem Kopf und Schultern, ohne dass der Ball wegrollt.",
  ],
  [
    [761, 763],
    "Place the back against a wall and walk the feet forward a little. Slide down only to a comfortable knee angle and hold with normal breathing, then slide up; a right-angle knee bend is not mandatory.|Oslonite leđa na zid i malo odmaknite stopala naprijed. Spustite se samo do udobnog ugla koljena i držite uz normalan dah, zatim klizite gore; pravi ugao nije obavezan.|Lehne den Rücken an eine Wand und stelle die Füße etwas vor. Gleite nur bis zu einem angenehmen Kniewinkel hinab, halte bei normaler Atmung und gleite hoch; ein rechter Kniewinkel ist nicht nötig.",
  ],
  [
    [774],
    "Hold the roller with forearms supported or arms at a comfortable low height. Turn one wrist then the other to wind the cord and raise a light load; reverse slowly to lower it without letting it unwind freely.|Držite valjak oslonjenim podlakticama ili rukama na udobnoj niskoj visini. Okrećite jedno pa drugo zapešće da namotate uže i podignete lagan teret; polako obrnite za spuštanje bez slobodnog odmotavanja.|Halte den Roller mit gestützten Unterarmen oder Armen in angenehmer niedriger Höhe. Drehe abwechselnd die Handgelenke zum Aufwickeln und Heben einer leichten Last; wickle langsam ab statt frei laufen zu lassen.",
  ],
  [
    [4],
    "Use easy walking, gentle cycling or comfortable mobility for an active recovery session. Keep effort low enough for relaxed conversation and finish feeling able to do more.|Za aktivni oporavak koristite lagano hodanje, nježnu vožnju bicikla ili udobnu mobilnost. Napor ostaje dovoljno nizak za opušten razgovor i završite s osjećajem da možete još.|Nutze lockeres Gehen, sanftes Radfahren oder angenehme Mobilität zur aktiven Erholung. Halte die Belastung gesprächsfähig und beende mit Reserven.",
  ],
  [
    [17],
    "For an AMRAP, agree the movement list and a time cap before starting. Complete as many technically sound rounds as fit the time, rest as needed and count partial rounds honestly.|Za AMRAP prije početka dogovorite listu pokreta i vremensku granicu. Završite onoliko tehnički urednih krugova koliko stane u vrijeme, odmarajte po potrebi i tačno brojite djelimične krugove.|Lege für ein AMRAP Übungsliste und Zeitgrenze vorher fest. Absolviere so viele technisch saubere Runden wie möglich, pausiere bei Bedarf und zähle Teilrunden ehrlich.",
  ],
  [
    [158],
    "Choose a small circuit of familiar cardio movements with planned transitions and rest. Rehearse the route and keep each station controllable before adding speed or more rounds.|Izaberite mali krug poznatih kardio pokreta s planiranim prelazima i odmorom. Uvježbajte raspored i kontrolišite svaku stanicu prije dodavanja brzine ili krugova.|Wähle einen kleinen Zirkel vertrauter Kardiobewegungen mit geplanten Wechseln und Pausen. Übe den Ablauf und kontrolliere jede Station vor mehr Tempo oder Runden.",
  ],
  [
    [165],
    "Use a brief sequence of familiar light drills and progressively faster, low-volume efforts before the main work. This label does not define a measurable nervous-system readiness test or justify maximal fatigue.|Koristite kratku sekvencu poznatih laganih zadataka i postepeno bržih napora malog obima prije glavnog rada. Naziv ne određuje mjerljiv test spremnosti nervnog sistema niti opravdava maksimalan umor.|Nutze vor der Hauptbelastung eine kurze Folge vertrauter leichter Übungen und zunehmend schneller, geringer Umfänge. Der Name definiert keinen messbaren Nervensystemtest und rechtfertigt keine maximale Ermüdung.",
  ],
  [
    [170, 486],
    "Gradually slow to an easy walk or march, then settle into ordinary relaxed breathing. Allow heart rate and comfort to settle before changing to floor-based recovery work.|Postepeno usporite do laganog hoda ili marširanja, zatim pređite na opušteno disanje. Dopustite pulsu i udobnosti da se smire prije rada oporavka na podu.|Reduziere allmählich zu lockerem Gehen oder Marschieren und entspannter Atmung. Lasse Puls und Wohlbefinden zur Ruhe kommen, bevor du auf den Boden wechselst.",
  ],
  [
    [246],
    "For EMOM, start the agreed task at the beginning of each minute and rest for the remainder. Choose a dose that leaves recovery time; reduce it if repetitions spill into the next minute.|Za EMOM počnite dogovoreni zadatak početkom svake minute i odmarajte preostalo vrijeme. Izaberite dozu koja ostavlja odmor; smanjite ako ponavljanja prelaze u novu minutu.|Beginne beim EMOM die vereinbarte Aufgabe zu Beginn jeder Minute und pausiere im Rest. Wähle eine Dosis mit Erholungszeit und reduziere, wenn Wiederholungen in die nächste Minute reichen.",
  ],
  [
    [259],
    "Alternate comfortable running with short controlled faster sections chosen by landmarks or the plan. Return to an easy pace between efforts rather than turning every section into a sprint.|Izmjenjujte udobno trčanje s kratkim kontrolisanim bržim dionicama prema orijentirima ili planu. Između napora vratite lagan tempo umjesto sprinta u svakoj dionici.|Wechsle angenehmes Laufen mit kurzen kontrollierten schnelleren Abschnitten nach Wegmarken oder Plan. Kehre dazwischen zum lockeren Tempo zurück, statt jeden Abschnitt zu sprinten.",
  ],
  [
    [267],
    "Choose familiar joint movements and link them slowly with stable transitions. Begin with small ranges, increase only where control stays smooth and avoid rushing from the floor to standing.|Izaberite poznate zglobne pokrete i polako ih povežite stabilnim prelazima. Počnite malim rasponima, povećavajte samo uz glatku kontrolu i ne žurite s poda u stajanje.|Verbinde vertraute Gelenkbewegungen langsam mit stabilen Übergängen. Beginne klein, vergrößere nur bei gleichmäßiger Kontrolle und hetze nicht vom Boden zum Stand.",
  ],
  [
    [304, 351],
    "A common Tabata-style timer uses 20 seconds of work and 10 seconds of rest for eight rounds. This format alone does not reproduce the original research protocol or determine a suitable intensity; choose the movement and effort for your ability.|Uobičajen Tabata tajmer koristi 20 sekundi rada i 10 sekundi odmora kroz osam krugova. Sam format ne reprodukuje izvorni istraživački protokol niti određuje prikladan intenzitet; izaberite pokret i napor prema sposobnosti.|Ein verbreiteter Tabata-Timer nutzt 20 Sekunden Arbeit und 10 Sekunden Pause für acht Runden. Das Format allein reproduziert weder das ursprüngliche Forschungsprotokoll noch bestimmt es passende Intensität; wähle Bewegung und Belastung nach deinem Können.",
  ],
  [
    [433, 248],
    "Choose a few comfortable stretches for the areas that feel stiff, moving in and out gently. Treat this as a relaxed sequence and skip any position that creates sharp pain, tingling or strain.|Izaberite nekoliko udobnih istezanja ukočenih područja, uz nježan ulazak i izlazak. Ovo je opuštena sekvenca; preskočite položaj koji izaziva oštar bol, trnce ili naprezanje.|Wähle wenige angenehme Dehnungen für steife Bereiche und gehe sanft hinein und heraus. Nutze die Folge entspannt und überspringe Positionen mit stechendem Schmerz, Kribbeln oder Überlastung.",
  ],
  [
    [487],
    "Begin with easy walking, then use gentle calf, front-thigh and hip stretches as comfortable. A cool-down should not add another hard leg session or force fatigued joints into deep positions.|Počnite laganim hodom, zatim po udobnosti blago istegnite listove, prednja bedra i kukove. Hlađenje ne treba biti još jedan težak trening nogu niti forsirati umorne zglobove duboko.|Beginne mit lockerem Gehen und sanften Waden-, vorderen Oberschenkel- und Hüftdehnungen nach Wohlbefinden. Das Abwärmen soll keine weitere schwere Beineinheit oder erzwungene tiefe Gelenkstellung sein.",
  ],
  [
    [488],
    "Use easy arm movements and gentle chest, upper-back and shoulder stretches after the session. Keep the shoulders comfortable rather than stretching deeply under fatigue.|Nakon sesije koristite lagane pokrete ruku i nježna istezanja prsa, gornjih leđa i ramena. Ramena ostaju udobna umjesto dubokog istezanja pod umorom.|Nutze nach dem Training lockere Armbewegungen und sanfte Brust-, obere Rücken- und Schulterdehnungen. Halte die Schultern angenehm, statt unter Ermüdung tief zu dehnen.",
  ],
  [
    [490],
    "Use a varied sequence of comfortable upper-back mobility, scapular control and general strength work. There is no single posture this label diagnoses or one mandatory correction; choose movements for comfort and task demands.|Koristite raznovrsnu sekvencu udobne mobilnosti gornjih leđa, kontrole lopatica i opšte snage. Naziv ne dijagnostikuje jednu posturu ni obaveznu korekciju; birajte prema udobnosti i potrebama zadatka.|Nutze abwechslungsreiche angenehme Mobilität des oberen Rückens, Schulterblattkontrolle und allgemeine Kraft. Der Name diagnostiziert keine bestimmte Haltung oder zwingende Korrektur; wähle nach Wohlbefinden und Aufgabe.",
  ],
  [
    [653],
    "Before a main lift, rehearse the same movement with an empty implement or light load. Add load in manageable steps while reducing warm-up repetitions as appropriate, keeping fatigue low before working sets.|Prije glavnog lifta uvježbajte isti pokret praznim rekvizitom ili malim teretom. Dodajte teret u razumnim koracima uz prilagođeno smanjivanje ponavljanja zagrijavanja i mali umor prije radnih serija.|Übe vor der Haupthebung dieselbe Bewegung mit leerem Gerät oder leichter Last. Steigere in überschaubaren Schritten und reduziere bei Bedarf Aufwärmwiederholungen; halte die Ermüdung vor Arbeitssätzen niedrig.",
  ],
  [
    [775],
    "Link easy supported positions such as child's pose, gentle cat-cow and comfortable lying twists. Move slowly between positions and return to ordinary breathing rather than forcing end-range flexibility.|Povežite lagane podržane položaje poput dječije poze, blage mačke-krave i udobnih ležećih rotacija. Prelazite polako uz običan dah umjesto forsiranja krajnje fleksibilnosti.|Verbinde leichte gestützte Positionen wie Kindhaltung, sanfte Katze-Kuh und angenehme liegende Drehungen. Wechsle langsam bei normaler Atmung statt erzwungener Endbeweglichkeit.",
  ],
  [
    [777],
    "Choose a steady cyclic activity at an easy conversational effort. Heart-rate zones depend on the method and individual; do not infer a precise personal zone from the label or an estimated maximum alone.|Izaberite ravnomjernu cikličnu aktivnost uz lagan napor za razgovor. Zone pulsa zavise od metode i osobe; ne zaključujte tačnu ličnu zonu samo iz naziva ili procijenjenog maksimuma.|Wähle eine gleichmäßige zyklische Aktivität bei lockerer Gesprächsintensität. Pulszonen hängen von Methode und Person ab; leite keine genaue persönliche Zone allein aus Name oder geschätztem Maximum ab.",
  ],
  [
    [9],
    "Alfredson is a named Achilles-loading protocol, not simply any heel drop. Tendon location, current symptoms and your individual plan determine whether a step, flat surface or modified loading is appropriate; this entry does not prescribe its original dose.|Alfredson je imenovani protokol opterećenja Ahilove tetive, a ne bilo koje spuštanje pete. Mjesto tetivnih tegoba, trenutni simptomi i individualni plan određuju stepenik, ravnu podlogu ili izmijenjen teret; ovaj unos ne propisuje izvornu dozu.|Alfredson ist ein benanntes Achillessehnen-Belastungsprotokoll statt beliebigem Fersenabsenken. Beschwerdeort, aktuelle Symptome und individueller Plan bestimmen Stufe, flache Fläche oder angepasste Last; dieser Eintrag verordnet nicht die Originaldosis.",
  ],
  [
    [22],
    "A proprioception program may progress from supported standing to selected balance tasks. The surface, eyes-open or closed condition and progression must come from your rehabilitation plan, not from the program title.|Program propriocepcije može napredovati od stajanja uz oslonac do odabranih zadataka ravnoteže. Podloga, otvorene ili zatvorene oči i progresija dolaze iz rehabilitacijskog plana, a ne naslova.|Ein Propriozeptionsprogramm kann von gestütztem Stehen zu ausgewählten Gleichgewichtsaufgaben führen. Untergrund, offene oder geschlossene Augen und Steigerung müssen aus dem Rehabilitationsplan stammen, nicht aus dem Titel.",
  ],
  [
    [147],
    "Cervical isometrics use gentle resistance without visible head movement. The direction, effort and hold duration require your individual plan; do not apply a strong self-resisted force to the neck.|Vratna izometrija koristi blag otpor bez vidljivog pokreta glave. Smjer, napor i trajanje zahtijevaju individualni plan; ne primjenjujte jak vlastiti otpor na vrat.|Halsisometrie nutzt sanften Widerstand ohne sichtbare Kopfbewegung. Richtung, Kraft und Haltedauer erfordern deinen individuellen Plan; wende keinen starken Eigenwiderstand am Hals an.",
  ],
  [
    [148],
    "Do not improvise cervical traction with a towel, band, hanging weight or an unassessed device. Confirm suitability and learn the exact equipment setup directly from the professional responsible for your care.|Ne improvizujte vratnu trakciju peškirom, trakom, visećim teretom ili neprocijenjenim uređajem. Potvrdite prikladnost i naučite tačno postavljanje opreme direktno od stručne osobe koja vodi njegu.|Improvisiere keine Halswirbelsäulentraktion mit Handtuch, Band, Hängegewicht oder ungeprüftem Gerät. Kläre Eignung und lerne die genaue Einstellung direkt von der behandelnden Fachperson.",
  ],
  [
    [479, 480, 481, 482, 483, 484],
    "PNF combines a positioned stretch with a selected contraction and release. The contraction direction, effort, duration and partner assistance need instruction; do not use maximal force or a partner pushing beyond your comfortable range.|PNF kombinuje položaj istezanja s odabranom kontrakcijom i opuštanjem. Smjer, napor, trajanje i pomoć partnera zahtijevaju obuku; ne koristite maksimalnu silu ni guranje preko udobnog raspona.|PNF kombiniert eine Dehnposition mit gewählter Anspannung und Lösung. Richtung, Kraft, Dauer und Partnerhilfe benötigen Anleitung; nutze keine Maximalkraft und kein Drücken über deinen angenehmen Bereich.",
  ],
  [
    [489],
    "A postoperative program is specific to the operation, tissue, healing stage and surgeon's restrictions. Obtain that plan before exercising; this broad catalogue label cannot supply a universal postoperative progression.|Postoperativni program zavisi od operacije, tkiva, faze zarastanja i ograničenja hirurga. Pribavite taj plan prije vježbanja; širok naziv ne može dati univerzalnu postoperativnu progresiju.|Ein postoperatives Programm hängt von Eingriff, Gewebe, Heilungsphase und chirurgischen Vorgaben ab. Hole diesen Plan vor dem Üben ein; dieser breite Name liefert keine universelle Nachbehandlungssteigerung.",
  ],
  [
    [8, 182, 514, 658, 673],
    "Set the saddle so the knee stays slightly bent at the farthest pedal position. Pedal smoothly without rocking the hips; on an air bike, coordinate a controlled push-pull of the handles with the legs.|Podesite sjedište tako da koljeno ostaje blago savijeno u najudaljenijem položaju pedale. Pedalajte glatko bez njihanja kukova; na zračnom biciklu uskladite kontrolisan potisak i povlačenje ručki s nogama.|Stelle den Sattel für leicht gebeugtes Knie an der entferntesten Pedalposition ein. Tritt gleichmäßig ohne Hüftschaukeln; koordiniere am Airbike kontrolliertes Schieben und Ziehen der Griffe mit den Beinen.",
  ],
  [
    [25, 709],
    "Use a supervised water setting suited to your swimming ability. For water walking, keep the feet in contact with the pool floor and walk easily; swimming technique and water safety require instruction beyond this general guide.|Koristite nadzirane vodene uslove prema plivačkoj sposobnosti. Za hodanje u vodi držite stopala na dnu bazena i hodajte lagano; tehnika plivanja i sigurnost zahtijevaju obuku izvan ovog vodiča.|Nutze eine beaufsichtigte Wasserumgebung passend zu deinem Schwimmvermögen. Halte beim Wassergehen Bodenkontakt und gehe locker; Schwimmtechnik und Wassersicherheit erfordern zusätzliche Anleitung.",
  ],
  [
    [88],
    "Use a low fixed step and place the full foot on it. Step up and down rhythmically, alternating the lead leg without bouncing off the trailing foot.|Koristite nizak fiksni stepenik i oslonite cijelo stopalo. Ritmično se penjite i silazite, izmjenjujući vodeću nogu bez odskoka zadnjim stopalom.|Nutze eine niedrige feste Stufe mit vollem Fußkontakt. Steige rhythmisch auf und ab und wechsle das Führungsbein ohne Abspringen vom hinteren Fuß.",
  ],
  [
    [178, 245],
    "Step onto the stationary pedals and hold the handles lightly. Build an even elliptical rhythm while keeping the feet supported and the trunk tall; let the machine stop before stepping off.|Stanite na nepomične pedale i lagano držite ručke. Uspostavite ravnomjeran eliptični ritam uz oslonjena stopala i visok trup; pustite da sprava stane prije silaska.|Steige auf die ruhenden Pedale und halte die Griffe leicht. Finde einen gleichmäßigen elliptischen Rhythmus mit gestützten Füßen und aufrechtem Rumpf; steige erst im Stillstand ab.",
  ],
  [
    [290],
    "Adjust the arm crank near shoulder height and sit securely with feet supported. Turn the handles smoothly without shrugging or swaying the torso; reverse direction only after slowing down.|Podesite ručni mehanizam blizu visine ramena i sjednite sigurno s oslonjenim stopalima. Okrećite ručke glatko bez podizanja ramena ili njihanja trupa; smjer mijenjajte nakon usporavanja.|Stelle die Armkurbel etwa auf Schulterhöhe und sitze sicher mit gestützten Füßen. Kurble gleichmäßig ohne Schulterhochziehen oder Rumpfschwung; wechsle die Richtung erst nach dem Abbremsen.",
  ],
  [
    [558, 764],
    "Secure the feet, begin with arms long and knees bent. Drive with the legs, lean the trunk slightly back and then pull the handle to the lower ribs; return arms first, then trunk, then bend the knees.|Osigurajte stopala, počnite dugih ruku i savijenih koljena. Potisnite nogama, blago nagnite trup nazad pa povucite ručku donjim rebrima; vraćajte prvo ruke, zatim trup pa savijte koljena.|Sichere die Füße und beginne mit langen Armen und gebeugten Knien. Drücke aus den Beinen, neige den Rumpf leicht zurück und ziehe dann den Griff zu den unteren Rippen; kehre Arme, Rumpf und zuletzt Knie um.",
  ],
  [
    [642],
    "Stand with soft knees and take the overhead handles. Pull down using the trunk and arms while hinging slightly at the hips, then recover upward smoothly without yanking the shoulders.|Stanite mekanih koljena i uhvatite ručke iznad glave. Povucite dolje trupom i rukama uz blagi pregib kuka, zatim glatko vratite gore bez trzanja ramena.|Stehe mit weichen Knien und greife die oberen Griffe. Ziehe mit Rumpf und Armen bei leichter Hüftbeuge nach unten und kehre gleichmäßig ohne Schulterriss nach oben zurück.",
  ],
  [
    [693, 752],
    "Start with a slow climbing rhythm and light hand support. Place enough of the foot on each step or pedal for secure contact; do not support your body weight by hanging on the rails.|Počnite sporim ritmom penjanja i laganim osloncem rukama. Dovoljno stopala oslonite na stepenik ili pedalu za siguran kontakt; ne nosite težinu viseći na rukohvatima.|Beginne mit langsamem Kletterrhythmus und leichter Handstütze. Setze genügend Fußfläche sicher auf Stufe oder Pedal; trage das Körpergewicht nicht hängend an den Schienen.",
  ],
  [
    [739, 740, 741],
    "Start the belt slowly, attach the safety clip if available and walk or run near the center without holding the rails. Change speed or incline gradually and slow the belt fully before stepping off.|Počnite sporom trakom, pričvrstite sigurnosnu kopču ako postoji i hodajte ili trčite blizu sredine bez držanja rukohvata. Brzinu i nagib mijenjajte postepeno i potpuno usporite prije silaska.|Starte das Band langsam, befestige falls vorhanden den Sicherheitsclip und gehe oder laufe mittig ohne Festhalten. Ändere Tempo und Steigung allmählich und bremse vor dem Absteigen vollständig ab.",
  ],
  [
    [5],
    "On hands and one knee, extend the other leg sideways with the foot supported. Keep the spine long and rock the hips back until a mild inner-thigh stretch appears, then return.|Oslonite dlanove i jedno koljeno, drugu nogu pružite bočno s oslonjenim stopalom. Uz izduženu kičmu pomjerite kukove nazad do blagog istezanja unutrašnjeg bedra, zatim se vratite.|Stütze dich auf Hände und ein Knie, strecke das andere Bein seitlich mit gestütztem Fuß aus. Schiebe die Hüfte bei langem Rücken bis zu einer milden Dehnung der Oberschenkelinnenseite zurück und kehre zurück.",
  ],
  [
    [6, 571],
    "Sit tall with the soles together and knees comfortably apart. Hinge forward slightly from the hips without pressing the knees down.|Sjedite uspravno sa spojenim tabanima i udobno razmaknutim koljenima. Blago se nagnite iz kukova bez pritiskanja koljena dolje.|Sitze aufrecht mit zusammengelegten Fußsohlen und angenehm geöffneten Knien. Neige dich leicht aus der Hüfte vor, ohne die Knie hinunterzudrücken.",
  ],
  [
    [18],
    "Sit with the lower leg supported and trace small letters in the air with the toes. Move at the ankle rather than drawing the letters with the whole leg.|Sjedite s oslonjenom potkoljenicom i prstima crtajte mala slova u zraku. Pokret dolazi iz skočnog zgloba, a ne cijele noge.|Sitze mit gestütztem Unterschenkel und zeichne kleine Buchstaben mit den Zehen in die Luft. Bewege aus dem Sprunggelenk statt aus dem ganzen Bein.",
  ],
  [
    [19, 23],
    "Support the lower leg and draw a slow circle with the foot in each direction. Keep the knee still and avoid forcing the inward or outward edge.|Oslonite potkoljenicu i stopalom polako kružite u oba smjera. Koljeno ostaje mirno; ne forsirajte unutrašnji ni vanjski rub.|Stütze den Unterschenkel und kreise langsam mit dem Fuß in beide Richtungen. Halte das Knie ruhig und erzwinge weder Innen- noch Außenkante.",
  ],
  [
    [20, 459],
    "Support the heel and keep the knee facing forward. Turn the sole gently outward and back; for strengthening, use only the light resistance specified in your plan.|Oslonite petu i držite koljeno naprijed. Lagano okrenite taban prema van i vratite; za jačanje koristite samo lagan otpor naveden u planu.|Stütze die Ferse und halte das Knie nach vorn. Drehe die Fußsohle sanft nach außen und zurück; nutze zur Kräftigung nur den leichten Widerstand deines Plans.",
  ],
  [
    [27, 28],
    "Stand with arms out at a comfortable height and draw small circles from the shoulders. Start without weight; if using weights, keep them very light and the circles small.|Stanite s rukama na udobnoj visini i pravite male krugove iz ramena. Počnite bez tereta; s teretom koristite vrlo lagan otpor i male krugove.|Stehe mit den Armen auf angenehmer Höhe und kreise klein aus den Schultern. Beginne ohne Gewicht; halte Zusatzgewichte sehr leicht und die Kreise klein.",
  ],
  [
    [38],
    "Use a low anchored band around the front of the ankle, below the joint line, only after learning the setup. Keep the heel down while the knee travels gently over the toes; do not use the band to force the joint.|Koristite nisko učvršćenu traku oko prednjeg dijela zgloba, ispod zglobne linije, tek nakon učenja postavke. Peta ostaje dolje dok koljeno lagano ide preko prstiju; ne forsirajte zglob trakom.|Nutze ein tief verankertes Band vorn am Sprunggelenk unterhalb der Gelenklinie erst nach Einweisung. Halte die Ferse unten, während das Knie sanft über die Zehen wandert; erzwinge keine Gelenkbewegung mit dem Band.",
  ],
  [
    [39],
    "Use only a lightly tensioned, secure band and a shoulder position you have been shown. Step away just enough for gentle traction, keep the trunk steady and release tension slowly.|Koristite samo blago zategnutu sigurnu traku i položaj ramena koji vam je pokazan. Odmaknite se tek za blago povlačenje, zadržite miran trup i polako otpustite napetost.|Nutze nur ein leicht gespanntes, sicheres Band und eine dir gezeigte Schulterposition. Gehe nur für einen sanften Zug zurück, halte den Rumpf ruhig und löse die Spannung langsam.",
  ],
  [
    [64],
    "Place the palm or forearm on a wall with the arm below shoulder height. Turn the chest away slightly until the front of the upper arm feels a mild stretch; do not force the elbow back.|Postavite dlan ili podlakticu na zid s rukom ispod visine ramena. Blago okrenite prsa od zida do blagog istezanja prednje nadlaktice; ne gurajte lakat nazad.|Lege Handfläche oder Unterarm unter Schulterhöhe an die Wand. Drehe die Brust leicht weg, bis die vordere Oberarmseite mild gedehnt wird; drücke den Ellenbogen nicht zurück.",
  ],
  [
    [72, 601],
    "Lie on your side with knees bent and supported together. Open the top arm toward the other side, rotating the upper back while keeping the knees together; follow the hand only as the neck tolerates.|Lezite na bok sa savijenim i zajedno oslonjenim koljenima. Otvorite gornju ruku na drugu stranu rotiranjem gornjih leđa, a koljena zadržite zajedno; pratite šaku samo koliko vrat dopušta.|Liege seitlich mit gebeugten, gemeinsam gestützten Knien. Öffne den oberen Arm zur Gegenseite und drehe den oberen Rücken bei zusammenbleibenden Knien; folge der Hand nur, soweit der Nacken es erlaubt.",
  ],
  [
    [83],
    "If comfortable, use a gentle four-part rhythm: inhale, pause, exhale, pause. Keep each phase easy and shorten or omit pauses if air hunger appears; a fixed four-second count is optional.|Ako je udobno, koristite blag ritam u četiri dijela: udah, pauza, izdah, pauza. Svaka faza je lagana; skratite ili izostavite pauze kod manjka zraka; četiri sekunde nisu obavezne.|Nutze bei Wohlbefinden einen sanften vierteiligen Rhythmus: einatmen, pausieren, ausatmen, pausieren. Halte jede Phase leicht und verkürze oder entferne Pausen bei Luftmangel; vier Sekunden sind optional.",
  ],
  [
    [141, 681],
    "Face a wall in a split stance, keep the rear heel down and bend the rear knee gently. Move the body forward slightly to feel the lower calf stretch without lifting the heel.|Okrenite se zidu u raskoraku, zadržite zadnju petu dolje i blago savijte zadnje koljeno. Pomjerite tijelo malo naprijed do istezanja donjeg lista bez podizanja pete.|Stehe im Ausfallschritt vor einer Wand, halte die hintere Ferse unten und beuge das hintere Knie sanft. Verlagere den Körper leicht vor, bis die untere Wade gedehnt wird, ohne die Ferse zu heben.",
  ],
  [
    [142, 680],
    "Face a wall in a split stance with the rear knee straight and heel down. Lean forward from the ankles until the back of the calf feels a gentle stretch.|Stanite prema zidu u raskoraku sa zadnjim koljenom opruženim i petom dolje. Nagnite se naprijed iz skočnih zglobova do blagog istezanja zadnje strane lista.|Stehe im Ausfallschritt vor einer Wand mit gestrecktem hinterem Knie und Ferse unten. Neige dich aus den Sprunggelenken vor, bis die Wade sanft gedehnt wird.",
  ],
  [
    [143, 723],
    "On hands and knees, slowly round the upper back on the exhale, then gently open the chest on the inhale. Keep the movement small and distributed rather than hinging sharply at one spinal segment.|Četveronožno, polako zaoblite gornja leđa na izdah, zatim blago otvorite prsa na udah. Pokret je mali i raspoređen, bez oštrog pregiba u jednom segmentu kičme.|Runde im Vierfüßlerstand beim Ausatmen langsam den oberen Rücken und öffne beim Einatmen sanft die Brust. Verteile die kleine Bewegung, statt an einem Wirbelsäulenabschnitt stark abzuknicken.",
  ],
  [
    [144, 437],
    "Sit tall and move the head through a small, slow comfortable arc. Use separate nodding, turning and side-bending movements instead of forcing a full neck circle or dropping the head far backward.|Sjedite uspravno i pomjerajte glavu malim, sporim udobnim lukom. Koristite odvojeno klimanje, okretanje i bočno savijanje umjesto forsiranja punog kruga ili dubokog zabacivanja glave.|Sitze aufrecht und bewege den Kopf in einem kleinen langsamen angenehmen Bogen. Nutze getrenntes Nicken, Drehen und Seitneigen statt eines erzwungenen Halskreises oder starken Zurücklegens.",
  ],
  [
    [145, 156, 198],
    "Keep the head level and glide the chin gently backward as if making a small double chin. Do not tilt the face down, press hard or lift the head; release the glide slowly.|Držite glavu ravno i blago povucite bradu nazad kao mali podbradak. Ne spuštajte lice, ne pritišćite snažno i ne podižite glavu; polako otpustite.|Halte den Kopf waagerecht und schiebe das Kinn sanft zurück wie für ein kleines Doppelkinn. Neige das Gesicht nicht hinunter, drücke nicht stark und hebe den Kopf nicht; löse langsam.",
  ],
  [
    [146],
    "Sit upright with the shoulders still. Turn the head slowly to look to one side, return to center and turn to the other side without tipping or forcing the end range.|Sjedite uspravno s mirnim ramenima. Polako okrenite glavu na jednu stranu, vratite u sredinu pa na drugu, bez naginjanja ili forsiranja krajnjeg raspona.|Sitze aufrecht mit ruhigen Schultern. Drehe den Kopf langsam zu einer Seite, zurück zur Mitte und zur anderen Seite, ohne Neigung oder erzwungene Endstellung.",
  ],
  [
    [149],
    "Stand tall and loosely join the hands behind the pelvis. Gently lengthen the arms backward without lifting them high or arching the back.|Stanite uspravno i labavo spojite šake iza karlice. Blago izdužite ruke nazad bez visokog podizanja ili izvijanja leđa.|Stehe aufrecht und verbinde die Hände locker hinter dem Becken. Führe die Arme sanft nach hinten, ohne sie hochzuheben oder ins Hohlkreuz zu gehen.",
  ],
  [
    [154, 155],
    "From kneeling, sit the hips toward the heels and reach the hands forward, using padding as needed. For the side-reach version, walk both hands a little to one side without lifting the opposite hip.|Iz kleka spustite kukove prema petama i pružite dlanove naprijed uz podstavu po potrebi. Za bočni doseg pomjerite oba dlana malo u stranu bez podizanja suprotnog kuka.|Setze aus dem Kniestand die Hüfte Richtung Fersen und reiche mit den Händen nach vorn; polstere bei Bedarf. Führe für die Seitenvariante beide Hände leicht seitlich, ohne die gegenüberliegende Hüfte anzuheben.",
  ],
  [
    [159, 160, 161],
    "Lie on your side with hips and knees bent, feet together and pelvis stacked. Open the top knee without separating the feet or rolling the pelvis backward, then close it slowly.|Lezite na bok sa savijenim kukovima i koljenima, spojenim stopalima i poravnatom karlicom. Otvorite gornje koljeno bez razdvajanja stopala ili prevrtanja karlice nazad, zatim polako zatvorite.|Liege seitlich mit gebeugten Hüften und Knien, Füßen zusammen und gestapeltem Becken. Öffne das obere Knie ohne die Füße zu trennen oder das Becken zurückzurollen und schließe langsam.",
  ],
  [
    [172],
    "Kneel on padding with the rear shin supported against a low couch or wall. Gently bring the hips upright with the ribs controlled; move away from the support if the knee is compressed.|Kleknite na podstavu sa zadnjom potkoljenicom uz nisku sofu ili zid. Blago uspravite kukove uz kontrolisana rebra; odmaknite se ako je koljeno pritisnuto.|Knie gepolstert mit hinterem Schienbein an niedriger Couch oder Wand. Richte die Hüfte bei stabilen Rippen sanft auf; gehe bei Kniedruck weiter von der Stütze weg.",
  ],
  [
    [179],
    "Bring one arm across the chest below shoulder height and support it above the elbow with the other arm. Draw it gently across without raising the shoulder.|Prebacite jednu ruku preko prsa ispod visine ramena i drugom je oslonite iznad lakta. Blago približite bez podizanja ramena.|Führe einen Arm unter Schulterhöhe quer vor die Brust und stütze ihn oberhalb des Ellenbogens mit dem anderen Arm. Ziehe sanft quer, ohne die Schulter hochzuziehen.",
  ],
  [
    [211, 212],
    "Rest a forearm against a door frame with the elbow at or below shoulder height. Take a small step through until a mild chest stretch appears; do not push the shoulder forward.|Oslonite podlakticu na dovratak s laktom u visini ramena ili niže. Malo zakoračite kroz vrata do blagog istezanja prsa; ne gurajte rame naprijed.|Lege einen Unterarm mit Ellenbogen auf oder unter Schulterhöhe an den Türrahmen. Mache einen kleinen Schritt hindurch bis zu einer milden Brustdehnung; schiebe die Schulter nicht nach vorn.",
  ],
  [
    [247],
    "Raise light or unloaded arms slightly forward of the side plane, preferably with thumbs up in the full-can position. Stop below any pinching range; do not force a thumbs-down position.|Podižite lagane ili neopterećene ruke malo ispred bočne ravni, po mogućnosti s palčevima gore u full-can položaju. Stanite ispod raspona štipanja; ne forsirajte palčeve dolje.|Hebe leichte oder unbeladene Arme etwas vor der Seitenebene, vorzugsweise mit Daumen nach oben in der Full-Can-Position. Stoppe vor einem klemmenden Bereich und erzwinge keine Daumen-unten-Position.",
  ],
  [
    [250, 251, 599],
    "Keep the upper arm beside the ribs with the elbow bent about a right angle. Rotate the forearm outward while the elbow stays in place; in side lying, work with the top arm and support the head.|Držite nadlakticu uz rebra s laktom blizu pravog ugla. Rotirajte podlakticu prema van dok lakat ostaje na mjestu; na boku radite gornjom rukom i oslonite glavu.|Halte den Oberarm an den Rippen bei etwa rechtwinkligem Ellenbogen. Drehe den Unterarm nach außen, während der Ellenbogen bleibt; in Seitenlage arbeitet der obere Arm bei gestütztem Kopf.",
  ],
  [
    [260, 261, 403, 463],
    "Lie on your back and place one ankle across the opposite thigh, away from the knee joint. Draw the supporting thigh toward the chest until the crossed-side buttock feels a gentle stretch.|Lezite na leđa i postavite jedan zglob preko suprotnog bedra, dalje od koljena. Približite oslonjeno bedro prsima do blagog istezanja stražnjice prekrižene strane.|Lege dich auf den Rücken und einen Knöchel auf den gegenüberliegenden Oberschenkel, fern vom Kniegelenk. Ziehe den gestützten Oberschenkel zur Brust, bis das Gesäß der gekreuzten Seite mild gedehnt wird.",
  ],
  [
    [263, 264],
    "From hands and knees, keep one knee bent and lift that thigh sideways through a small arc. Keep the pelvis facing the floor, then bring the knee back under the hip.|Četveronožno, držite jedno koljeno savijeno i podignite to bedro bočno malim lukom. Karlica ostaje prema podu, zatim vratite koljeno ispod kuka.|Hebe aus dem Vierfüßlerstand einen gebeugten Oberschenkel in einem kleinen Bogen seitlich. Halte das Becken zum Boden gerichtet und bringe das Knie unter die Hüfte zurück.",
  ],
  [
    [269, 724],
    "Lie with the roller across the upper back, support the head and keep the hips comfortably supported. Gently extend the upper back over the roller without hinging through the lower back or pulling the neck.|Lezite s valjkom poprečno ispod gornjih leđa, oslonite glavu i udobno kukove. Blago opružite gornja leđa preko valjka bez pregiba donjih leđa ili povlačenja vrata.|Lege die Rolle quer unter den oberen Rücken und stütze Kopf und Hüfte angenehm. Strecke den oberen Rücken sanft über die Rolle, ohne in den unteren Rücken auszuweichen oder am Hals zu ziehen.",
  ],
  [
    [270],
    "Sit with the roller under one calf and hands supporting the trunk. Roll a small area between the Achilles region and below the knee, keeping pressure off the back of the knee.|Sjedite s valjkom ispod jednog lista i dlanovima oslonite trup. Pređite malim područjem između Ahilove regije i ispod koljena, bez pritiska iza koljena.|Sitze mit der Rolle unter einer Wade und Händen als Rumpfstütze. Rolle klein zwischen Achillessehnenbereich und unterhalb des Knies, ohne Druck in die Kniekehle.",
  ],
  [
    [271],
    "Sit with the roller under the back of the thigh and support yourself with the hands and other foot. Use short passes over the muscle, avoiding direct pressure into the back of the knee.|Sjedite s valjkom ispod zadnjeg bedra i oslonite se rukama i drugim stopalom. Pravite kratke prelaze preko mišića bez pritiska iza koljena.|Sitze mit der Rolle unter der Oberschenkelrückseite und stütze dich auf Hände und anderen Fuß. Rolle kurz über den Muskel, ohne direkt in die Kniekehle zu drücken.",
  ],
  [
    [272],
    "Face down with forearms supported, place the roller under the front thigh. Use short controlled passes over the muscle, staying away from the kneecap and front hip bone.|Licem prema podu i oslonjeni podlakticama postavite valjak ispod prednjeg bedra. Pravite kratke kontrolisane prelaze preko mišića, dalje od čašice koljena i prednje kosti kuka.|Lege in Bauchlage mit Unterarmstütz die Rolle unter den vorderen Oberschenkel. Rolle kurz kontrolliert über den Muskel, fern von Kniescheibe und vorderem Hüftknochen.",
  ],
  [
    [273],
    "Place the roller across the upper back and support the head lightly. Move a short distance over the upper-back muscles without rolling onto the neck or lower back.|Postavite valjak poprečno ispod gornjih leđa i blago oslonite glavu. Pređite kratku udaljenost preko gornjih leđnih mišića bez prelaska na vrat ili donja leđa.|Lege die Rolle quer unter den oberen Rücken und stütze den Kopf leicht. Rolle kurz über die obere Rückenmuskulatur, ohne Hals oder unteren Rücken zu überrollen.",
  ],
  [
    [275],
    "Lie on your back with the soles together and knees comfortably open. Lift the hips through a small range while the feet remain in place; do not force the knees toward the floor.|Lezite na leđa sa spojenim tabanima i udobno otvorenim koljenima. Podignite kukove malim rasponom uz nepomična stopala; ne gurajte koljena prema podu.|Liege auf dem Rücken mit Fußsohlen zusammen und angenehm geöffneten Knien. Hebe die Hüfte klein bei ruhigen Füßen; drücke die Knie nicht zum Boden.",
  ],
  [
    [276],
    "Use padding under both knees and open them comfortably in a wide kneeling stance. Keep the pelvis neutral and rock back gently; reduce the width if the groin or knees feel strained.|Podstavite oba koljena i udobno ih otvorite u širokom kleku. Karlica je neutralna; blago se pomjerite nazad i smanjite širinu kod napetosti prepone ili koljena.|Polstere beide Knie und öffne sie angenehm im breiten Kniestand. Halte das Becken neutral und schiebe es sanft zurück; verringere bei Leisten- oder Kniebelastung die Breite.",
  ],
  [
    [279, 431],
    "Place the mini band above the knees or at the ankles as planned. With soft knees, take small sideways steps while the trailing foot follows without snapping inward.|Postavite mini traku iznad koljena ili na zglobove prema planu. Uz mekana koljena pravite male bočne korake; zadnje stopalo prati bez naglog povlačenja unutra.|Lege das Miniband wie geplant über die Knie oder an die Knöchel. Gehe mit weichen Knien klein seitwärts; der nachfolgende Fuß folgt ohne Zurückschnappen.",
  ],
  [
    [287, 512, 583, 726, 727],
    "Stabilize the pelvis in the named kneeling, quadruped or seated position. Turn the breastbone and upper back slowly to one side, allowing the eyes to follow without pulling on the neck.|Stabilizujte karlicu u navedenom klečećem, četveronožnom ili sjedećem položaju. Polako okrenite prsnu kost i gornja leđa na stranu, uz praćenje pogledom bez povlačenja vrata.|Stabilisiere das Becken in der genannten Knie-, Vierfüßler- oder Sitzposition. Drehe Brustbein und oberen Rücken langsam seitwärts; die Augen folgen ohne Zug am Nacken.",
  ],
  [
    [305],
    "Sit with the front and rear knees bent roughly to right angles, using hand support. Rotate between sides slowly without forcing either knee toward the floor.|Sjedite s prednjim i zadnjim koljenom blizu pravog ugla, uz oslonac rukama. Polako rotirajte između strana bez guranja koljena prema podu.|Sitze mit vorderem und hinterem Knie ungefähr rechtwinklig und nutze Handstützen. Drehe langsam zwischen den Seiten, ohne ein Knie zum Boden zu drücken.",
  ],
  [
    [310],
    "Use a hand support and hinge on one leg. Rotate the pelvis open and closed through a small range while the standing foot remains grounded and the trunk stays long.|Koristite oslonac rukom i nagnite se iz kuka na jednoj nozi. Malim rasponom otvorite i zatvorite karlicu uz oslonjeno stajno stopalo i dug trup.|Nutze eine Handstütze und beuge dich auf einem Bein aus der Hüfte vor. Drehe das Becken klein auf und zu, während der Standfuß belastet und der Rumpf lang bleibt.",
  ],
  [
    [311, 312],
    "Hold a stable support and keep the pelvis facing forward. Draw a slow circle from one hip with the knee bent, using only a range that does not twist the lower back.|Držite stabilan oslonac i karlicu naprijed. Polako kružite iz jednog kuka sa savijenim koljenom, samo u rasponu bez uvrtanja donjih leđa.|Halte eine feste Stütze und richte das Becken nach vorn. Kreise langsam aus einer Hüfte mit gebeugtem Knie, ohne den unteren Rücken zu verdrehen.",
  ],
  [
    [314, 315, 683],
    "Take a supported half-kneeling or split stance and gently tuck the pelvis. Shift forward slightly while keeping the ribs over the hips to feel the front of the rear hip, not pressure in the lower back.|Zauzmite podržan poluklek ili raskorak i blago podvucite karlicu. Malo se pomjerite naprijed s rebrima iznad kukova do istezanja prednjeg zadnjeg kuka, bez pritiska donjih leđa.|Nimm einen gestützten Halbkniestand oder Ausfallschritt ein und kippe das Becken leicht nach hinten. Verlagere dich bei Rippen über der Hüfte etwas vor, bis die vordere hintere Hüfte statt des unteren Rückens gedehnt wird.",
  ],
  [
    [344],
    "With the upper arm beside the ribs and elbow bent, rotate the forearm inward against the band. Keep the elbow in place and return outward slowly.|Uz nadlakticu uz rebra i savijen lakat rotirajte podlakticu unutra protiv trake. Lakat ostaje na mjestu, a povratak prema van je spor.|Drehe bei Oberarm an den Rippen und gebeugtem Ellenbogen den Unterarm gegen das Band nach innen. Halte den Ellenbogen fest und kehre langsam nach außen zurück.",
  ],
  [
    [347],
    "Use light pressure on the adjacent outer-thigh and gluteal muscles rather than grinding along the bony outer knee or trying to force the IT band to lengthen.|Blago pritisnite susjedne vanjske bedrene i glutealne mišiće umjesto pritiskanja koštanog vanjskog koljena ili forsiranja produženja IT trake.|Nutze leichten Druck auf angrenzende äußere Oberschenkel- und Gesäßmuskeln statt auf das knöcherne Außenknie zu drücken oder eine Verlängerung des IT-Bands zu erzwingen.",
  ],
  [
    [363],
    "Use a small supported knee bend and gently explore a small arc while the feet stay grounded. Do not twist forcefully through a locked knee.|Blago savijte koljena uz oslonac i istražite mali luk s oslonjenim stopalima. Ne uvrćite snažno zaključano koljeno.|Beuge die Knie mit Stütze leicht und erkunde einen kleinen Bogen bei belasteten Füßen. Verdrehe kein verriegeltes Knie gewaltsam.",
  ],
  [
    [365],
    "Lie on your back and gently guide one thigh toward the chest, holding behind the thigh or over the shin. Keep the other leg comfortable and the head supported.|Lezite na leđa i blago približite jedno bedro prsima držeći iza bedra ili preko potkoljenice. Druga noga je udobna, a glava oslonjena.|Liege auf dem Rücken und führe einen Oberschenkel sanft zur Brust, mit Griff hinter dem Oberschenkel oder am Schienbein. Halte das andere Bein angenehm und den Kopf gestützt.",
  ],
  [
    [373],
    "Place the massage ball against the fleshy part of the buttock, using the hands and feet to limit pressure. Avoid direct pressure where it produces electric, radiating or numb sensations.|Postavite masažnu lopticu na mišićni dio stražnjice, uz ograničavanje pritiska rukama i stopalima. Izbjegavajte pritisak koji izaziva električne, šireće ili utrnule osjete.|Positioniere den Massageball am weichen Gesäßmuskel und dosiere den Druck mit Händen und Füßen. Vermeide Druck bei elektrischen, ausstrahlenden oder tauben Empfindungen.",
  ],
  [
    [378],
    "Hold a stable support overhead or reach sideways with one arm. Shift the hips gently away while keeping the ribs controlled, feeling the side of the upper back rather than forcing the shoulder.|Držite stabilan oslonac iznad glave ili posegnite bočno jednom rukom. Blago udaljite kukove uz kontrolisana rebra do istezanja bočnih gornjih leđa bez forsiranja ramena.|Halte eine feste Stütze über Kopf oder reiche mit einem Arm seitwärts. Verlagere die Hüfte bei stabilen Rippen sanft weg und dehne die seitliche obere Rückenseite ohne Schulterzwang.",
  ],
  [
    [385],
    "Take a wide stance and bend one knee while keeping the other leg long. Sit gently into the bent-leg hip until the straight-leg inner thigh feels a mild stretch.|Zauzmite širok stav i savijte jedno koljeno dok druga noga ostaje duga. Blago sjednite u kuk savijene noge do istezanja unutrašnjeg bedra opružene.|Nimm einen breiten Stand ein und beuge ein Knie bei langem anderen Bein. Setze dich sanft in die Hüfte des gebeugten Beins, bis die Innenseite des langen Beins mild gedehnt wird.",
  ],
  [
    [389],
    "Stand side-on to a wall and press the outer side of the raised knee lightly into it. Keep the standing pelvis level; hold gently, then release and change sides.|Stanite bočno prema zidu i vanjskom stranom podignutog koljena blago pritisnite zid. Karlica stajne noge ostaje ravna; lagano držite, otpustite i promijenite stranu.|Stehe seitlich zur Wand und drücke die Außenseite des angehobenen Knies leicht dagegen. Halte das Becken über dem Standbein waagerecht; halte sanft, löse und wechsle die Seite.",
  ],
  [
    [396],
    "Hold a fixed support and swing one leg gently across and away from the body. Keep the pelvis facing forward and the swing small enough to control.|Držite fiksni oslonac i blago zamahujte jednom nogom preko tijela i bočno od njega. Karlica ostaje naprijed, a zamah dovoljno mali za kontrolu.|Halte eine feste Stütze und schwinge ein Bein sanft quer vor und seitlich vom Körper weg. Halte das Becken vorn und den Schwung kontrollierbar klein.",
  ],
  [
    [397],
    "Hold a fixed support and swing one leg gently forward and backward from the hip. Keep the trunk tall rather than arching the back to increase height.|Držite fiksni oslonac i blago zamahujte nogom naprijed i nazad iz kuka. Trup je visok bez izvijanja leđa radi veće visine.|Halte eine feste Stütze und schwinge ein Bein sanft aus der Hüfte vor und zurück. Halte den Rumpf aufrecht, statt für mehr Höhe ins Hohlkreuz zu gehen.",
  ],
  [
    [398],
    "Sit tall, turn the head slightly away from the stretching side and look gently toward the opposite armpit. Keep the shoulder relaxed and avoid pulling hard on the head.|Sjedite uspravno, malo okrenite glavu od strane koju istežete i blago pogledajte prema suprotnom pazuhu. Rame je opušteno; ne povlačite glavu snažno.|Sitze aufrecht, drehe den Kopf leicht von der Dehnseite weg und blicke sanft zur gegenüberliegenden Achsel. Halte die Schulter entspannt und ziehe nicht stark am Kopf.",
  ],
  [
    [404, 580],
    "Support the heel with the knee comfortably long and hinge gently from the hip; for the lying version, use a strap behind the foot and lift the thigh without pulling the toes hard backward.|Oslonite petu s udobno opruženim koljenom i blago se nagnite iz kuka; ležeći koristite traku oko stopala i podignite bedro bez snažnog povlačenja prstiju nazad.|Stütze die Ferse bei angenehm langem Knie und neige dich sanft aus der Hüfte vor; nutze in Rückenlage ein Band am Fuß und hebe den Oberschenkel, ohne die Zehen stark zurückzuziehen.",
  ],
  [
    [438],
    "Sit tall and tilt one ear gently toward the same-side shoulder while keeping both shoulders relaxed. Use the weight of the head rather than pulling on it.|Sjedite uspravno i blago približite uho istom ramenu, uz opuštena oba ramena. Koristite težinu glave umjesto povlačenja.|Sitze aufrecht und neige ein Ohr sanft zur gleichseitigen Schulter; beide Schultern bleiben entspannt. Nutze das Eigengewicht des Kopfes statt daran zu ziehen.",
  ],
  [
    [455],
    "Lie with knees bent and feet supported. Gently rock the pelvis to slightly flatten and release the lower-back arch, then find a relaxed middle position without squeezing hard.|Lezite savijenih koljena i oslonjenih stopala. Blago njišite karlicu da malo smanjite pa otpustite luk donjih leđa; pronađite opuštenu sredinu bez snažnog stiskanja.|Liege mit gebeugten Knien und gestützten Füßen. Kippe das Becken sanft, um die Lendenwölbung leicht abzuflachen und zu lösen; finde ohne starkes Anspannen eine entspannte Mitte.",
  ],
  [
    [458],
    "Lean forward with the other hand on a table and let the affected arm hang loosely. Use a small body sway to create tiny arm circles; keep the shoulder muscles relaxed and add no weight unless prescribed.|Nagnite se s drugom rukom na stolu i pustite zahvaćenu ruku da slobodno visi. Malim njihanjem tijela napravite sitne krugove; rame ostaje opušteno i bez tereta osim ako je propisan.|Beuge dich mit der anderen Hand auf einem Tisch vor und lasse den betroffenen Arm locker hängen. Erzeuge durch kleines Körperschaukeln winzige Armkreise; die Schulter bleibt entspannt und ohne verordnetes Gewicht unbelastet.",
  ],
  [
    [460, 461],
    "Support the front hip on padding with the front knee bent and the rear leg extending back. Keep the front shin at a comfortable angle rather than forcing it parallel to the front edge; use a lying figure-four instead if the knee feels strained.|Oslonite prednji kuk na podstavu, savijte prednje koljeno i pružite zadnju nogu. Prednja potkoljenica je pod udobnim uglom, bez forsiranja paralelnog položaja; kod napetosti koljena koristite ležeću četvorku.|Polstere die vordere Hüfte bei gebeugtem vorderen Knie und nach hinten gestrecktem Bein. Halte das vordere Schienbein angenehm statt erzwungen parallel zur Vorderkante; nutze bei Kniebelastung eine liegende Viererposition.",
  ],
  [
    [471, 732],
    "Sit and support the ankle across the other leg. Gently draw the toes back with the hand until a mild stretch appears under the foot; avoid cranking the ankle or pulling painfully on one toe.|Sjedite i oslonite zglob preko druge noge. Blago povucite prste nazad rukom do istezanja ispod stopala; ne uvijajte zglob i ne povlačite bolno jedan prst.|Sitze mit einem Knöchel auf dem anderen Bein. Ziehe die Zehen sanft mit der Hand zurück, bis die Fußsohle mild gedehnt wird; verdrehe das Sprunggelenk nicht und ziehe nicht schmerzhaft an einem Zeh.",
  ],
  [
    [492],
    "Kneel with the forearms or hands resting on a bench and gently move the hips back. Let the upper chest soften toward the floor without forcing the shoulders or arching the lower back.|Kleknite s podlakticama ili dlanovima na klupi i blago pomjerite kukove nazad. Spustite gornja prsa prema podu bez forsiranja ramena ili izvijanja donjih leđa.|Knie mit Unterarmen oder Händen auf einer Bank und schiebe die Hüfte sanft zurück. Lasse die obere Brust zum Boden sinken, ohne Schulterzwang oder ein Hohlkreuz.",
  ],
  [
    [494],
    "Starting at the feet, gently tense one muscle group and then release it fully before moving upward. Use a low effort and skip any area that cramps or is painful; this is relaxation, not a maximal contraction.|Počevši od stopala blago napnite jednu grupu mišića pa je potpuno opustite prije prelaska gore. Koristite mali napor i preskočite bolno područje ili grč; ovo je opuštanje, a ne maksimalno stiskanje.|Spanne von den Füßen aufwärts jeweils eine Muskelgruppe sanft an und löse sie vollständig. Nutze geringe Kraft und überspringe krampfende oder schmerzende Bereiche; dies ist Entspannung statt Maximalkontraktion.",
  ],
  [
    [498, 687, 755],
    "Bend one knee and guide the heel toward the buttock while keeping the knees near each other and the pelvis gently tucked. Use a strap or hand support rather than pulling the heel hard; for walking, release before the next step.|Savijte jedno koljeno i približite petu stražnjici uz bliska koljena i blago podvučenu karlicu. Koristite traku ili oslonac umjesto snažnog povlačenja; pri hodanju otpustite prije novog koraka.|Beuge ein Knie und führe die Ferse bei nahen Knien und leicht gekipptem Becken zum Gesäß. Nutze Band oder Stütze statt kräftigem Ziehen; löse bei der Gehvariante vor dem nächsten Schritt.",
  ],
  [
    [499, 500, 501, 502],
    "Lie face down with forehead supported. Lift the arms a small distance in a T, Y or bent-elbow W shape as named, keeping the neck relaxed and avoiding an arch through the lower back.|Lezite licem dolje s oslonjenim čelom. Malo podignite ruke u oblik T, Y ili W sa savijenim laktovima prema nazivu; vrat je opušten, bez izvijanja donjih leđa.|Liege bäuchlings mit gestützter Stirn. Hebe die Arme je nach Name klein in T-, Y- oder gebeugter W-Form; der Nacken bleibt entspannt und der untere Rücken ohne Überstreckung.",
  ],
  [
    [511],
    "From hands and knees, keep the pelvis still and gently lower the upper chest between the arms. Return by pressing the hands into the floor without collapsing the lower back.|Četveronožno zadržite mirnu karlicu i blago spustite gornja prsa između ruku. Vratite se pritiskom dlanova u pod bez propadanja donjih leđa.|Halte im Vierfüßlerstand das Becken ruhig und senke die obere Brust sanft zwischen die Arme. Kehre durch Druck der Hände in den Boden zurück, ohne den unteren Rücken absinken zu lassen.",
  ],
  [
    [562],
    "Lie comfortably with the legs and arms supported. Move your attention slowly from one body region to the next and release unnecessary tension without judging or forcing any sensation.|Lezite udobno s oslonjenim nogama i rukama. Polako usmjeravajte pažnju s jednog dijela tijela na drugi i otpustite nepotrebnu napetost bez procjenjivanja ili forsiranja osjeta.|Liege bequem mit gestützten Armen und Beinen. Lenke die Aufmerksamkeit langsam von einem Körperbereich zum nächsten und löse unnötige Spannung, ohne Empfindungen zu bewerten oder zu erzwingen.",
  ],
  [
    [579],
    "Sit with one ankle resting across the other thigh. Keep the back long and hinge forward slightly from the hips until a mild buttock stretch appears; do not push the crossed knee down.|Sjedite s jednim zglobom preko drugog bedra. Izdužite leđa i blago se nagnite iz kukova do istezanja stražnjice; ne gurajte prekriženo koljeno dolje.|Sitze mit einem Knöchel auf dem anderen Oberschenkel. Halte den Rücken lang und neige dich aus der Hüfte leicht vor bis zu einer milden Gesäßdehnung; drücke das gekreuzte Knie nicht hinunter.",
  ],
  [
    [586],
    "Stand tall, keep ribs and pelvis still and draw a slow comfortable circle with one arm from the shoulder. Reduce the arc whenever you would need to arch the back or shrug forcefully.|Stanite uspravno uz mirna rebra i karlicu i polako kružite jednom rukom iz ramena. Smanjite luk kada biste morali izviti leđa ili snažno podići rame.|Stehe aufrecht bei ruhigen Rippen und Becken und kreise langsam mit einem Arm aus der Schulter. Verkleinere den Bogen, sobald Hohlkreuz oder starkes Schulterhochziehen nötig wären.",
  ],
  [
    [587, 588, 756, 762],
    "Face a wall or stand with your back near it as appropriate, and slide the hands upward only within a comfortable shoulder range. Keep the ribs down and allow natural shoulder-blade movement; do not force every part of the arm to touch the wall.|Stanite prema zidu ili leđima blizu njega prema varijanti i klizite dlanovima gore samo u udobnom rasponu ramena. Rebra ostaju mirna uz prirodan pokret lopatica; ne forsirajte dodir cijele ruke sa zidom.|Stehe je nach Variante vor oder mit dem Rücken nahe an einer Wand und gleite mit den Händen nur angenehm weit hoch. Halte die Rippen ruhig und erlaube natürliche Schulterblattbewegung; erzwinge keinen vollständigen Armkontakt zur Wand.",
  ],
  [
    [589],
    "Keep the arm comfortably beside the body and press lightly into a wall or the other hand in the direction specified by your plan. The shoulder should not visibly move; release gradually without straining.|Držite ruku udobno uz tijelo i blago pritisnite zid ili drugu ruku u smjeru plana. Rame se ne treba vidljivo pomjerati; postepeno otpustite bez naprezanja.|Halte den Arm angenehm am Körper und drücke leicht gegen Wand oder andere Hand in die im Plan genannte Richtung. Die Schulter bewegt sich nicht sichtbar; löse allmählich ohne Pressen.",
  ],
  [
    [602],
    "Lie on your side with hips and knees bent and knees together. Keeping the top knee supported, lift the top foot slightly away from the lower foot to rotate at the hip, without rolling the pelvis backward.|Lezite na bok sa savijenim kukovima i koljenima koja ostaju zajedno. Uz oslonjeno gornje koljeno malo podignite gornje stopalo od donjeg za rotaciju kuka, bez prevrtanja karlice nazad.|Liege seitlich mit gebeugten Hüften und zusammenliegenden Knien. Hebe bei gestütztem oberen Knie den oberen Fuß leicht vom unteren, um aus der Hüfte zu drehen, ohne das Becken zurückzurollen.",
  ],
  [
    [648],
    "Lie on the stretching side with the upper arm supported in front and elbow bent. Use the other hand to guide the forearm gently toward the floor only if the shoulder stays comfortable; do not push through pinching.|Lezite na stranu koju istežete s nadlakticom oslonjenom ispred i savijenim laktom. Drugom rukom blago vodite podlakticu prema podu samo dok je ramenu udobno; ne gurajte kroz štipanje.|Liege auf der Dehnseite mit vorn gestütztem Oberarm und gebeugtem Ellenbogen. Führe den Unterarm mit der anderen Hand nur bei angenehmer Schulter sanft zum Boden; drücke nicht durch ein Klemmen.",
  ],
  [
    [697],
    "Lie on your back with the other knee bent and foot supported. Tighten the working thigh, keep that knee long and lift the straight leg a small distance; lower without letting the knee bend or the back arch.|Lezite na leđa s drugim koljenom savijenim i stopalom oslonjenim. Učvrstite radno bedro, zadržite opruženo koljeno i malo podignite nogu; spustite bez savijanja koljena ili izvijanja leđa.|Liege auf dem Rücken mit anderem Knie gebeugt und Fuß gestützt. Spanne den arbeitenden Oberschenkel an, halte das Knie lang und hebe das gestreckte Bein klein; senke ohne Kniebeugung oder Hohlkreuz.",
  ],
  [
    [705],
    "Lie on your back with knees bent and together. Let the knees roll a small distance to one side while the shoulders remain comfortably supported, then return slowly and change sides.|Lezite na leđa sa savijenim i spojenim koljenima. Spustite koljena malo na jednu stranu uz udobno oslonjena ramena, polako vratite i promijenite stranu.|Liege auf dem Rücken mit gebeugten Knien zusammen. Lasse sie bei angenehm gestützten Schultern klein zu einer Seite rollen, kehre langsam zurück und wechsle.",
  ],
  [
    [725],
    "Support the elbows or hands on a stable bench and gently move the hips backward as the chest lowers. Seek movement through the upper back while keeping the lower ribs controlled.|Oslonite laktove ili dlanove na stabilnu klupu i blago pomjerite kukove nazad dok se prsa spuštaju. Pokret tražite u gornjim leđima uz kontrolisana donja rebra.|Stütze Ellenbogen oder Hände auf einer festen Bank und schiebe die Hüfte sanft zurück, während die Brust sinkt. Bewege aus dem oberen Rücken bei kontrollierten unteren Rippen.",
  ],
  [
    [728],
    "From hands and knees, slide one arm beneath the opposite arm and let the upper back turn. Use a soft support under the head if needed and return without loading the neck.|Četveronožno provucite jednu ruku ispod suprotne i dopustite okret gornjih leđa. Po potrebi podstavite glavu i vratite se bez opterećivanja vrata.|Schiebe im Vierfüßlerstand einen Arm unter dem anderen durch und drehe den oberen Rücken. Polstere bei Bedarf den Kopf und kehre ohne Halsbelastung zurück.",
  ],
  [
    [735, 736],
    "Sit with the heel on the floor and a small towel under the toes. Gather the towel with gentle toe curls, then spread and relax the toes; do not claw so hard that the foot cramps.|Sjedite s petom na podu i malim peškirom ispod prstiju. Laganim pregibima prstiju skupljajte peškir, zatim raširite i opustite prste; ne stišćite do grča.|Sitze mit Ferse am Boden und kleinem Handtuch unter den Zehen. Raffe es mit sanften Zehenbeugungen und spreize und entspanne anschließend; greife nicht bis zum Krampf.",
  ],
  [
    [743],
    "Raise one arm, bend the elbow and let the hand reach behind the head. Support the upper arm gently with the other hand without pulling the head forward or arching the back.|Podignite jednu ruku, savijte lakat i pružite šaku iza glave. Drugom rukom blago oslonite nadlakticu bez povlačenja glave naprijed ili izvijanja leđa.|Hebe einen Arm, beuge den Ellenbogen und führe die Hand hinter den Kopf. Stütze den Oberarm sanft mit der anderen Hand, ohne Kopfvorziehen oder Hohlkreuz.",
  ],
  [
    [748],
    "Reach both arms forward at chest height, gently separate the shoulder blades and let the upper back round slightly. Keep the shoulders away from the ears and avoid pulling on the neck.|Pružite obje ruke naprijed u visini prsa, blago razmaknite lopatice i malo zaoblite gornja leđa. Ramena su dalje od ušiju bez povlačenja vrata.|Reiche mit beiden Armen auf Brusthöhe nach vorn, schiebe die Schulterblätter sanft auseinander und runde den oberen Rücken leicht. Halte die Schultern weg von den Ohren und ziehe nicht am Hals.",
  ],
  [
    [753],
    "Walk slowly and guide one knee toward the chest with the hands while the standing leg stays balanced. Release the knee before stepping forward and alternate sides without leaning backward.|Hodajte polako i rukama približite jedno koljeno prsima uz stabilnu stajnu nogu. Otpustite prije koraka naprijed i izmjenjujte strane bez naginjanja unazad.|Gehe langsam und führe ein Knie mit den Händen zur Brust bei stabilem Standbein. Löse vor dem nächsten Schritt und wechsle ohne Zurücklehnen die Seite.",
  ],
  [
    [757],
    "Face a wall with one foot close to it. Keep the heel down and guide the knee toward the wall over the toes; move the foot closer if the heel lifts.|Stanite prema zidu s jednim stopalom blizu. Peta ostaje dolje dok koljeno ide prema zidu preko prstiju; približite stopalo ako se peta podiže.|Stehe vor einer Wand mit einem Fuß nahe daran. Halte die Ferse unten und führe das Knie über die Zehen zur Wand; gehe näher heran, wenn die Ferse abhebt.",
  ],
  [
    [766],
    "Sit tall with legs comfortably apart and knees soft. Hinge slightly forward from the hips without rounding aggressively or forcing a wide split.|Sjedite uspravno s udobno razmaknutim nogama i mekanim koljenima. Malo se nagnite iz kukova bez jakog zaobljavanja ili forsiranja špage.|Sitze aufrecht mit angenehm geöffneten Beinen und weichen Knien. Neige dich leicht aus der Hüfte vor, ohne stark zu runden oder einen Spagat zu erzwingen.",
  ],
  [
    [769, 770],
    "Step into a supported long lunge, place the hands inside the front foot and gently open the chest toward that leg. Return the hand, shift the hips back for a mild hamstring stretch, then step out and change sides.|Zakoračite u podržan dug iskorak, postavite dlanove unutar prednjeg stopala i blago otvorite prsa prema toj nozi. Vratite dlan, pomjerite kukove nazad do blagog istezanja zadnje lože, zatim izađite i promijenite stranu.|Gehe in einen gestützten langen Ausfallschritt, setze die Hände innen neben den vorderen Fuß und öffne die Brust sanft zu diesem Bein. Setze die Hand zurück, schiebe die Hüfte für eine milde hintere Oberschenkeldehnung zurück und wechsle die Seite.",
  ],
  [
    [771],
    "Support the forearm and slowly circle the wrist in both directions with the fingers relaxed. Keep the elbow still and use a smaller circle near stiffness rather than forcing it.|Oslonite podlakticu i polako kružite zapešćem u oba smjera uz opuštene prste. Lakat ostaje miran; kod ukočenosti smanjite krug umjesto forsiranja.|Stütze den Unterarm und kreise langsam in beide Richtungen mit entspannten Fingern. Halte den Ellenbogen ruhig und verkleinere bei Steifheit den Kreis statt zu erzwingen.",
  ],
  [
    [772],
    "Extend the arm with the palm facing down and gently bend the wrist so the fingers point toward the floor. Use the other hand for light assistance, keeping the elbow comfortably long.|Pružite ruku dlanom dolje i blago savijte zapešće da prsti idu prema podu. Drugom rukom lagano pomozite uz udobno opružen lakat.|Strecke den Arm mit Handfläche nach unten und beuge das Handgelenk sanft, sodass die Finger zum Boden zeigen. Hilf leicht mit der anderen Hand bei angenehm langem Ellenbogen.",
  ],
  [
    [773],
    "Extend the arm with the palm up and gently guide the fingers downward and back with the other hand. Keep the elbow soft and stop before tingling or finger-joint pain.|Pružite ruku dlanom gore i drugom rukom blago vodite prste dolje i nazad. Lakat je mekan; stanite prije trnaca ili bola zglobova prstiju.|Strecke den Arm mit Handfläche nach oben und führe die Finger mit der anderen Hand sanft abwärts und zurück. Halte den Ellenbogen weich und stoppe vor Kribbeln oder Fingergelenkschmerz.",
  ],
];
const byId = new Map(entries.flatMap(([ids, text]) => ids.map((id) => [id, text] as const)));
export const specificTechnique = (id: string, language: Language) =>
  byId.get(Number(id.slice(9, 13)))?.split("|")[{ en: 0, bs: 1, de: 2 }[language]];
