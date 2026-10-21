import fs from "node:fs";
const base = JSON.parse(fs.readFileSync("src/data/exercises.json", "utf8"));
const guidance = JSON.parse(fs.readFileSync("src/data/exercise-guidance.json", "utf8"));
// Each row was semantically reviewed, not accepted from a fuzzy name match.
// English / Bosnian / German names and original variant instructions.
const rows = [
  [
    "Dumbbell Bench Press;FLAT DUMBBELL PRESS",
    "Flat Dumbbell Bench Press|Potisak bučicama na ravnoj klupi|Kurzhantel-Bankdrücken flach",
    60,
    "Dumbbells,Bench",
    "Lie on a flat bench with one dumbbell in each hand. Lower beside the chest with forearms under the weights; press both up without striking them together.|Lezite na ravnu klupu s bučicom u svakoj ruci. Spustite ih pored prsa, podlaktice ispod tereta; potisnite bez sudaranja bučica.|Liege auf einer flachen Bank mit je einer Kurzhantel. Senke sie neben die Brust mit Unterarmen unter den Gewichten und drücke ohne Zusammenstoßen hoch.",
  ],
  [
    "Decline Dumbbell Press",
    "Decline Dumbbell Press|Potisak bučicama na spuštenoj klupi|Kurzhanteldrücken auf der Negativbank",
    189,
    "Dumbbells,Bench",
    "Secure the leg support before lying on the decline bench. Arrange a safe handoff and exit for the dumbbells; lower beside the lower chest without reaching behind the shoulders.|Osigurajte oslonac nogu na spuštenoj klupi. Dogovorite sigurno dodavanje i odlaganje bučica; spuštajte pored donjih prsa bez posezanja iza ramena.|Sichere die Beinstütze der Negativbank. Plane eine sichere Übergabe und Ablage der Hanteln; senke neben die untere Brust ohne hinter die Schultern zu reichen.",
  ],
  [
    "Incline Machine Press",
    "Incline Machine Chest Press|Kosi potisak za prsa na spravi|Schrägbank-Brustpresse an der Maschine",
    330,
    "Machine",
    "Adjust the inclined backrest and seat so handles start near the upper chest. Keep your back supported and follow the machine path without raising the shoulders.|Podesite kosi naslon i sjedište tako da ručke kreću blizu gornjih prsa. Leđa ostaju oslonjena; pratite putanju sprave bez podizanja ramena.|Stelle Schräglehne und Sitz so ein, dass die Griffe nahe der oberen Brust beginnen. Halte den Rücken gestützt und folge der Gerätebahn ohne Schulterhochziehen.",
  ],
  [
    "Decline Machine Press",
    "Decline Machine Chest Press|Spušteni potisak za prsa na spravi|Negative Brustpresse an der Maschine",
    189,
    "Machine",
    "Set the machine for a downward pressing path with handles near the lower chest. Keep the pelvis on the pad and stop the return before the shoulders are pulled behind their comfortable range.|Podesite spravu za potisak prema dolje s ručkama blizu donjih prsa. Karlica ostaje na podlozi; zaustavite povratak prije neugodnog povlačenja ramena nazad.|Stelle das Gerät für eine abwärts gerichtete Druckbahn nahe der unteren Brust ein. Halte das Becken am Polster und beende den Rückweg vor unangenehmem Zurückziehen der Schultern.",
  ],
  [
    "Assisted Chest Dip",
    "Machine-Assisted Chest Dip|Dip za prsa uz pomoć sprave|Brustdip mit Maschinenunterstützung",
    206,
    "Machine,Parallel bars",
    "Set the assistance high enough to control the descent. Mount the support using the steps, lean forward slightly and lower only within a comfortable shoulder range; keep the platform controlled when exiting.|Podesite dovoljnu pomoć za kontrolisano spuštanje. Popnite se stepenicama na oslonac, blago nagnite naprijed i spuštajte do udobnog raspona ramena; kontrolišite platformu pri silasku.|Wähle genügend Unterstützung für kontrolliertes Absenken. Steige über die Stufen auf die Stütze, neige dich leicht vor und senke im angenehmen Schulterbereich; kontrolliere die Plattform beim Absteigen.",
  ],
  [
    "Reverse Grip Bench Press",
    "Reverse-Grip Bench Press|Potisak s klupe obrnutim hvatom|Bankdrücken im Untergriff",
    60,
    "Barbell,Bench",
    "Use safeties and a competent handoff for the underhand grip. Keep wrists supported, start light and lower toward the lower chest; stop if the grip or shoulders feel insecure.|Koristite zaštite i stručno dodavanje za pothvat. Zapešća su oslonjena; počnite lagano i spuštajte prema donjim prsima; stanite ako su hvat ili ramena nesigurni.|Nutze Sicherheitsablagen und eine sichere Übergabe für den Untergriff. Halte die Handgelenke gestützt, beginne leicht und senke zur unteren Brust; stoppe bei unsicherem Griff oder Schultergefühl.",
  ],
  [
    "Single Arm Cable Press",
    "Single-Arm Cable Chest Press|Jednoručni potisak za prsa na sajli|Einarmige Kabel-Brustpresse",
    676,
    "Cable machine",
    "Set one handle at chest height and use a staggered stance facing away. Press with one hand while keeping the ribs and pelvis facing forward; return without twisting toward the stack.|Postavite ručku u visinu prsa i zauzmite raskoračni stav leđima sajli. Potisnite jednom rukom uz rebra i karlicu naprijed; vratite bez uvrtanja prema utezima.|Stelle einen Griff auf Brusthöhe und stehe versetzt mit dem Rücken zum Kabel. Drücke einarmig bei nach vorn gerichteten Rippen und Becken; kehre ohne Drehung zum Stapel zurück.",
  ],
  [
    "Deficit Push Up",
    "Deficit Push-Up|Sklek s povećanim rasponom|Liegestütz mit erhöhten Griffen",
    478,
    "Push-up handles",
    "Use two fixed handles of equal height on a non-slip surface. Lower the chest slightly below hand level only if the shoulders stay comfortable; keep the body in one line.|Koristite dvije fiksne ručke jednake visine na neklizajućoj podlozi. Spustite prsa malo ispod dlanova samo uz udobna ramena; tijelo ostaje u liniji.|Nutze zwei gleich hohe feste Griffe auf rutschfestem Boden. Senke die Brust nur bei angenehmen Schultern leicht unter Handhöhe; halte den Körper in einer Linie.",
  ],
  [
    "Ring Push Up",
    "Ring Push-Up|Sklek na karikama|Liegestütz an Ringen",
    478,
    "Gymnastic rings",
    "Secure equal-length rings and begin with them high enough for an easy incline. Keep rings close to the ribs as you lower and press; reduce the incline only after you can stop them drifting apart.|Osigurajte karike jednake dužine i počnite dovoljno visoko za lagan nagib. Držite ih blizu rebara pri spuštanju i potisku; spuštajte visinu tek kada ne bježe u stranu.|Sichere gleich lange Ringe und beginne erhöht mit leichtem Winkel. Halte die Ringe beim Absenken und Drücken nahe den Rippen; senke die Höhe erst bei kontrolliertem seitlichem Abdriften.",
  ],
  [
    "Suspension Chest Press",
    "Suspension Chest Press|Potisak za prsa na suspenzijskim trakama|Brustdrücken am Schlingentrainer",
    478,
    "Suspension trainer",
    "Check the overhead anchor and equal strap lengths. Face away with handles near the chest, lean into straight straps and bend the elbows; press back while keeping the straps clear of your neck.|Provjerite gornje sidrište i jednaku dužinu traka. Okrenite leđa sidrištu, ručke blizu prsa, nagnite se u zategnute trake i savijte laktove; potisnite uz trake udaljene od vrata.|Prüfe den hohen Anker und gleiche Bandlängen. Stehe abgewandt mit Griffen nahe der Brust, lehne in gespannte Bänder und beuge die Ellenbogen; drücke zurück mit Abstand der Bänder zum Hals.",
  ],
  [
    "Smith Machine Bench Press",
    "Smith Machine Flat Bench Press|Ravni potisak na Smith spravi|Flaches Bankdrücken an der Smithmaschine",
    60,
    "Smith machine,Bench",
    "Position a flat bench so the fixed bar reaches the middle chest without forcing the shoulders. Set stops above the chest, rehearse the hook rotation unloaded and keep feet supported.|Namjestite ravnu klupu da fiksna šipka dolazi do srednjih prsa bez forsiranja ramena. Zaštite su iznad prsa; uvježbajte okret kuka bez tereta uz oslonjena stopala.|Positioniere die flache Bank für eine feste Stangenbahn zur mittleren Brust ohne Schulterzwang. Stelle Stopps über der Brust ein, übe das Einhaken unbelastet und halte die Füße gestützt.",
  ],
  [
    "Barbell Floor Press",
    "Barbell Floor Press|Potisak šipkom s poda|Langhantel-Floor-Press",
    60,
    "Barbell",
    "Use floor-press supports and safeties or a qualified handoff. Lie on the floor and lower until the upper arms gently meet it; pause without bouncing, then press and return the bar securely.|Koristite nosače i zaštite za potisak s poda ili stručno dodavanje. Lezite i spuštajte dok nadlaktice blago ne dotaknu pod; zadržite bez odskoka, potisnite i sigurno vratite šipku.|Nutze Bodenpressenablagen und Sicherungen oder eine sichere Übergabe. Liege am Boden und senke bis zum sanften Kontakt der Oberarme; pausiere ohne Federn, drücke und lege sicher ab.",
  ],
  [
    "Dumbbell Floor Press",
    "Dumbbell Floor Press|Potisak bučicama s poda|Kurzhantel-Floor-Press",
    60,
    "Dumbbells",
    "Lie on the floor with knees bent and dumbbells over the chest. Lower until the upper arms touch down softly; keep forearms upright and press without bouncing off the floor.|Lezite na pod savijenih koljena i s bučicama iznad prsa. Spustite do mekog dodira nadlaktica s podom; podlaktice su uspravne i potisak je bez odskoka.|Liege mit gebeugten Knien und Hanteln über der Brust am Boden. Senke bis zum sanften Oberarmkontakt; halte die Unterarme senkrecht und drücke ohne Abfedern hoch.",
  ],
  [
    "Single Arm Dumbbell Press",
    "Single-Arm Dumbbell Bench Press|Jednoručni potisak bučicom s klupe|Einarmiges Kurzhantel-Bankdrücken",
    60,
    "Dumbbells,Bench",
    "On a flat bench hold one dumbbell over the working shoulder. Widen the feet for support and press without rotating the trunk or lifting the opposite hip; use a lighter load than the two-arm version.|Na ravnoj klupi držite jednu bučicu iznad radnog ramena. Raširite stopala i potisnite bez rotacije trupa ili podizanja suprotnog kuka; koristite lakši teret nego s dvije ruke.|Halte auf einer flachen Bank eine Hantel über der arbeitenden Schulter. Stelle die Füße breiter und drücke ohne Rumpfdrehung oder Anheben der Gegenhüfte; wähle weniger Last als beidarmig.",
  ],
  [
    "Weighted Push Up",
    "Weighted Push-Up|Sklek s dodatnim opterećenjem|Liegestütz mit Zusatzgewicht",
    478,
    "Weighted vest",
    "First control a bodyweight push-up. Add a securely fitted vest that does not shift toward the neck; keep the same body line and stop before the extra load changes your range.|Prvo kontrolišite sklek bez tereta. Dodajte čvrsto pričvršćen prsluk koji ne klizi prema vratu; zadržite liniju tijela i stanite prije promjene raspona zbog tereta.|Beherrsche zuerst den Liegestütz ohne Zusatzlast. Ergänze eine fest sitzende Weste, die nicht zum Hals rutscht; halte die Körperlinie und stoppe vor lastbedingter Verkürzung des Weges.",
  ],
  [
    "Resistance Band Chest Press",
    "Standing Resistance-Band Chest Press|Stojeći potisak za prsa s elastičnom trakom|Brustdrücken im Stand mit Widerstandsband",
    676,
    "Resistance band",
    "Inspect the band and anchor it behind you at chest height. Stand staggered beyond the slack, press forward without arching the back and return slowly; keep the band away from the face.|Pregledajte traku i pričvrstite iza tijela u visini prsa. U raskoračnom stavu zategnite traku, potisnite bez izvijanja leđa i polako vratite; traka je dalje od lica.|Prüfe das Band und verankere es hinter dir auf Brusthöhe. Stehe versetzt ohne Bandschlappheit, drücke ohne Hohlkreuz vor und kehre langsam zurück; halte das Band vom Gesicht fern.",
  ],
  [
    "CLEAN",
    "Squat Clean|Nabačaj u čučanj|Umsetzen in die tiefe Hocke",
    491,
    "Barbell",
    "Practise with a qualified weightlifting coach and an empty bar first. Start from the floor, extend the legs and hips, then receive the bar on the front shoulders in a controlled squat; stand before resetting.|Prvo vježbajte s trenerom dizanja tegova i praznom šipkom. Krenite s poda, opružite noge i kukove, zatim prihvatite šipku na prednja ramena u kontrolisan čučanj; ustanite prije novog početka.|Übe zunächst mit qualifizierter Gewichtheberanleitung und leerer Stange. Starte am Boden, strecke Beine und Hüfte und fange auf den vorderen Schultern in kontrollierter Hocke; stehe vor dem Neustart auf.",
  ],
  [
    "LANDMINE SQUAT",
    "Landmine Squat|Čučanj s landmine šipkom|Landmine-Kniebeuge",
    284,
    "Landmine attachment,Barbell",
    "Secure one end of the bar in a rated landmine. Hold the free end near the chest with both hands; squat while following its arc, keeping the whole foot supported, then stand without pressing overhead.|Učvrstite jedan kraj šipke u odgovarajuće landmine sidrište. Držite slobodni kraj uz prsa objema rukama; čučnite prateći luk uz cijelo stopalo na podu, pa ustanite bez potiska iznad glave.|Sichere ein Stangenende in einer geeigneten Landmine. Halte das freie Ende beidarmig an der Brust, beuge entlang des Bogens mit ganzen Füßen am Boden und stehe ohne Überkopfdrücken auf.",
  ],
  [
    "CLEAN AND JERK (NABAČAJ I IZBAČAJ)",
    "Clean and Jerk|Nabačaj i izbačaj|Stoßen",
    491,
    "Barbell",
    "Learn the clean and jerk separately with qualified coaching and a light bar. Receive the clean on the front shoulders, settle your balance, then dip and drive into the coached overhead catch; recover the feet before lowering.|Učite nabačaj i izbačaj odvojeno uz stručni nadzor i laganu šipku. Prihvatite nabačaj na prednja ramena, uspostavite ravnotežu pa čučnite plitko i izbacite u naučeni prihvat iznad glave; sastavite stopala prije spuštanja.|Lerne Umsetzen und Ausstoßen getrennt mit Anleitung und leichter Stange. Fange auf den vorderen Schultern, stabilisiere dich und tauche kurz zum angeleiteten Überkopffangen ab; stelle vor dem Absenken die Füße zurück.",
  ],
  [
    "SNATCH (TRZAJ)",
    "Barbell Snatch|Trzaj šipkom|Reißen",
    491,
    "Barbell",
    "Use qualified weightlifting instruction, a clear platform and a light practice bar. With a wide grip, accelerate from the floor through leg and hip extension, receive overhead in the coached squat and stand once balanced.|Koristite stručnu obuku, slobodnu platformu i laganu šipku. Širokim hvatom ubrzajte s poda opružanjem nogu i kukova, prihvatite iznad glave u naučeni čučanj i ustanite nakon ravnoteže.|Nutze qualifizierte Anleitung, eine freie Plattform und eine leichte Übungsstange. Beschleunige mit breitem Griff vom Boden durch Bein- und Hüftstreckung, fange über Kopf in angeleiteter Hocke und stehe bei Balance auf.",
  ],
  [
    "WALKING LUNGES (Dumbbell / Kettlebell)",
    "Loaded Walking Lunge|Hodajući iskorak s teretom|Gehender Ausfallschritt mit Zusatzlast",
    754,
    "Dumbbells,Kettlebell",
    "Hold equal loads beside the body and use a clear walking lane. Step forward, lower under control and push through the front foot into the next step; stop and reset when the weights disturb balance.|Držite jednake terete uz tijelo i koristite slobodnu stazu. Iskoračite, kontrolisano se spustite i odgurnite prednjim stopalom u sljedeći korak; zastanite ako tereti remete ravnotežu.|Halte gleiche Lasten seitlich und nutze eine freie Gehstrecke. Schreite vor, senke kontrolliert und drücke über den Vorderfuß zum nächsten Schritt; setze bei gestörter Balance neu an.",
  ],
  [
    "DUMBBELL CLEAN AND JERK",
    "Dumbbell Clean and Jerk|Nabačaj i izbačaj bučicama|Umsetzen und Ausstoßen mit Kurzhanteln",
    491,
    "Dumbbells",
    "Learn with qualified instruction and light dumbbells. Drive from a hip hinge to receive the dumbbells at the shoulders; settle, then dip and drive under them overhead, keeping each hand independent and controlled.|Učite uz stručnu obuku i lagane bučice. Iz pregiba kukova prihvatite bučice na ramena; stabilizujte se pa plitko savijte noge i izbacite iznad glave uz neovisan i kontrolisan rad ruku.|Lerne angeleitet mit leichten Kurzhanteln. Setze aus der Hüftbeuge auf die Schultern um; stabilisiere dich, tauche kurz ab und fange über Kopf mit unabhängig kontrollierten Händen.",
  ],
  [
    "DEFICIT DEADLIFT",
    "Deficit Deadlift|Mrtvo dizanje s povišenja|Defizit-Kreuzheben",
    169,
    "Barbell,Platform",
    "Stand on a low, fixed platform with the whole foot supported. Use a lighter load and only enough extra height to reach the bar without rounding the back; lift and lower with the bar close.|Stanite na nisku fiksnu platformu cijelim stopalom. Koristite lakši teret i samo visinu koja omogućava dohvat bez zaobljavanja leđa; podižite i spuštajte šipku uz tijelo.|Stehe mit dem ganzen Fuß auf einer niedrigen festen Plattform. Wähle weniger Last und nur so viel Höhe, dass du ohne Rundrücken greifen kannst; hebe und senke körpernah.",
  ],
  [
    "PAUSE SQUAT",
    "Pause Back Squat|Stražnji čučanj s pauzom|Kniebeuge hinten mit Pause",
    35,
    "Barbell",
    "Use a rack with safeties and reduce your usual squat load. Pause briefly at a controlled depth while keeping the trunk braced and feet supported; rise without relaxing or bouncing during the pause.|Koristite stalak sa zaštitama i smanjite uobičajeni teret. Kratko zastanite na kontrolisanoj dubini uz čvrst trup i oslonjena stopala; ustanite bez opuštanja ili odskoka u pauzi.|Nutze einen Rack mit Sicherungen und weniger Last. Pausiere kurz in kontrollierter Tiefe mit festem Rumpf und belasteten Füßen; stehe ohne Entspannen oder Federn auf.",
  ],
  [
    "PUSH JERK",
    "Push Jerk|Izbačaj s paralelnim stopalima|Standstoßen",
    491,
    "Barbell",
    "Practise with a qualified coach and an empty bar. From the front rack, dip vertically and drive, then re-bend the knees to receive the bar overhead with feet approximately parallel; stand and stabilize before lowering.|Vježbajte s trenerom i praznom šipkom. S prednjih ramena plitko savijte noge i izbacite, pa ponovo savijte koljena da prihvatite iznad glave s približno paralelnim stopalima; uspravite se i stabilizujte prije spuštanja.|Übe mit Anleitung und leerer Stange. Tauche aus der Frontablage senkrecht ab, treibe hoch und beuge erneut zum Überkopffangen mit annähernd parallelen Füßen; stehe vor dem Absenken stabil auf.",
  ],
  [
    "SPLIT JERK",
    "Split Jerk|Izbačaj u raskorak|Ausstoßen im Ausfallschritt",
    491,
    "Barbell",
    "Rehearse the split and recovery without load under qualified instruction. Dip and drive from the front rack, receive overhead with one foot forward and one back, then recover the feet in the coached sequence before lowering.|Uvježbajte raskorak i povratak bez tereta uz stručnu obuku. S prednjih ramena plitko savijte noge i izbacite, prihvatite iznad glave jednom nogom naprijed i drugom nazad, pa vratite stopala naučenim redoslijedom prije spuštanja.|Übe Ausfallschritt und Rückführung unbelastet unter Anleitung. Tauche aus der Frontablage ab und treibe hoch, fange über Kopf mit einem Fuß vorn und einem hinten und führe die Füße vor dem Absenken angeleitet zurück.",
  ],
  [
    "HANG SNATCH",
    "Hang Snatch|Trzaj iz visa|Reißen aus dem Hang",
    491,
    "Barbell",
    "With qualified coaching, start standing with a wide grip and lower the light bar to the taught hang position. Extend legs and hips and receive overhead; reset the hang between repetitions rather than bouncing.|Uz stručni nadzor počnite stojeći širokim hvatom i spustite laganu šipku u naučeni vis. Opružite noge i kukove i prihvatite iznad glave; obnovite vis između ponavljanja bez odskoka.|Beginne angeleitet stehend mit breitem Griff und senke die leichte Stange in die erlernte Hangposition. Strecke Beine und Hüfte und fange über Kopf; setze den Hang zwischen Wiederholungen ohne Federn neu an.",
  ],
  [
    "SUITCASE DEADLIFT",
    "Suitcase Deadlift|Mrtvo dizanje s teretom uz jednu stranu|Koffer-Kreuzheben",
    169,
    "Kettlebell",
    "Place one kettlebell beside the midfoot. Hinge and bend the knees to grip it, then stand without leaning toward or away from the weight; lower to the same spot and change sides after the set.|Stavite kettlebell uz sredinu stopala. Savijte kukove i koljena do hvata, pa ustanite bez naginjanja prema teretu ili od njega; vratite na isto mjesto i promijenite stranu nakon serije.|Stelle eine Kettlebell seitlich neben den Mittelfuß. Beuge Hüfte und Knie zum Griff und stehe ohne Seitneigung auf; senke an denselben Ort und wechsle nach dem Satz die Seite.",
  ],
  [
    "BARBELL THRUSTER",
    "Barbell Thruster|Čučanj s potiskom šipke|Langhantel-Thruster",
    729,
    "Barbell",
    "Hold the bar in a secure front rack. Squat within your controlled range, then use the upward leg drive to continue into an overhead press; lower to the front rack and regain balance before the next squat.|Držite šipku sigurno na prednjim ramenima. Čučnite u kontrolisanom rasponu pa potisak nogu nastavite u potisak iznad glave; vratite na ramena i obnovite ravnotežu prije sljedećeg čučnja.|Halte die Stange sicher in der Frontablage. Beuge im kontrollierten Bereich und nutze den Beinantrieb zum Überkopfdrücken; senke zur Frontablage und stabilisiere dich vor der nächsten Kniebeuge.",
  ],
  [
    "JEFFERSON DEADLIFT",
    "Jefferson Deadlift|Jefferson mrtvo dizanje|Jefferson-Kreuzheben",
    169,
    "Barbell",
    "Begin light with qualified instruction. Straddle the bar with one foot on either side, adjust the stance for a comfortable grip and stand while resisting trunk rotation; lower under control and practise both orientations.|Počnite lagano uz stručnu obuku. Opkoračite šipku stopalima s obje strane, podesite stav za udoban hvat i ustanite bez rotiranja trupa; kontrolisano spustite i vježbajte oba položaja.|Beginne leicht unter Anleitung. Stehe über der Stange mit je einem Fuß auf einer Seite, passe den Stand für einen angenehmen Griff an und stehe gegen Rumpfdrehung auf; senke kontrolliert und übe beide Ausrichtungen.",
  ],
];
const entries = rows.map(([headings, names, donor, equipment, note], i) => {
  const [en, bs, de] = names.split("|");
  const original = base.find((e) => Number(e.id.split("-")[1]) === donor);
  if (!original) throw new Error(`Missing donor ${donor}`);
  const meta = structuredClone(guidance[original.id]);
  delete meta.media;
  meta.equipment = equipment.split(",");
  meta.variants = [];
  meta.alternatives = [];
  if (donor === 478) {
    meta.family = "pushup";
    meta.movement = "Push up";
  }
  if (donor === 491) meta.difficulty = "advanced";
  const slug = en
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-$/, "");
  const muscles = ["press", "pushup", "dip"].includes(meta.family)
    ? ["Prsa"]
    : ["squat", "lunge", "olympic"].includes(meta.family)
      ? ["Kvadricepsi", "Gluteusi"]
      : meta.family === "hinge"
        ? ["Gluteusi", "Zadnja loža"]
        : ["Ramena"];
  return {
    id: `kinra-exercise-${slug}`,
    name: en,
    aliases: headings.split(";"),
    // Every reviewed addition is a multijoint variation; donor categories are
    // preserved capture evidence, not a reliable taxonomy for new content.
    category: "Složene",
    muscles,
    sourceUrl: "/exercise-guidance.html",
    observedDate: "2026-10-21",
    coverage: "metadata",
    instructions: null,
    media: null,
    sourceHeadings: headings.split(";"),
    displayNames: { en, bs, de },
    guidance: meta,
    variantInstruction: note.split("|"),
  };
});
fs.writeFileSync("src/data/exercise-additions.json", JSON.stringify(entries, null, 2) + "\n");
