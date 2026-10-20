import type { Language } from "./i18n";

/** Independently authored movement guidance. Triplets are English / Bosnian / German. */
type Text = [string, string, string];
const tr = (value: string): Text => value.split("|") as Text;
const lines = (...values: string[]) => values.map(tr);
export interface FamilyGuide {
  setup: Text[];
  steps: Text[];
  mistakes: Text[];
  cues: Text[];
}
const family = (setup: string, steps: string[], mistakes: string, cues: string): FamilyGuide => ({
  setup: lines(setup),
  steps: lines(...steps),
  mistakes: lines(mistakes),
  cues: lines(cues),
});
export const guideFamilies = {
  squat: family(
    "Set your feet at a comfortable width, with the whole foot supported; brace before descending.|Postavite stopala u udoban raskorak s cijelim stopalom na podlozi; učvrstite trup prije spuštanja.|Stelle die Füße angenehm breit auf, belaste den ganzen Fuß und spanne den Rumpf vor dem Absenken an.",
    [
      "Bend hips and knees together, letting the knees follow the direction of the toes.|Savijajte kukove i koljena zajedno; koljena prate smjer prstiju.|Beuge Hüfte und Knie gleichzeitig; die Knie folgen der Richtung der Zehen.",
      "Lower only as far as you can keep your heels down and your trunk controlled.|Spustite se samo dok pete ostaju na podlozi, a trup pod kontrolom.|Senke dich nur so weit ab, wie Fersen und Rumpf stabil bleiben.",
      "Push through the whole foot to stand; finish tall without leaning back.|Odgurnite se cijelim stopalom i uspravite se bez zabacivanja unazad.|Drücke dich über den ganzen Fuß hoch und stehe aufrecht, ohne ins Hohlkreuz zu gehen.",
    ],
    "Avoid collapsing the knees inward, lifting the heels or bouncing out of the bottom.|Izbjegavajte propadanje koljena prema unutra, podizanje peta i odskakivanje iz donje pozicije.|Vermeide nach innen kippende Knie, abhebende Fersen und Federn am tiefsten Punkt.",
    "Keep three contact points: heel, base of the big toe and base of the little toe.|Zadržite tri tačke oslonca: petu, korijen palca i korijen malog prsta.|Halte drei Kontaktpunkte: Ferse, Großzehenballen und Kleinzehenballen.",
  ),
  lunge: family(
    "Use a stable split stance with enough side-to-side space for balance.|Zauzmite stabilan raskoračni stav s dovoljno bočnog razmaka za ravnotežu.|Nimm einen stabilen Ausfallschritt mit ausreichend seitlichem Abstand ein.",
    [
      "Transfer weight onto the working foot and bend both knees under control.|Prenesite težinu na radno stopalo i kontrolisano savijte oba koljena.|Verlagere das Gewicht auf den arbeitenden Fuß und beuge beide Knie kontrolliert.",
      "Lower the rear knee toward the floor while the front heel stays supported.|Spuštajte zadnje koljeno prema podu, dok prednja peta ostaje oslonjena.|Senke das hintere Knie Richtung Boden; die vordere Ferse bleibt belastet.",
      "Drive through the front foot to return; reset balance before the next repetition.|Odgurnite se prednjim stopalom i vratite se; obnovite ravnotežu prije sljedećeg ponavljanja.|Drücke dich über den vorderen Fuß zurück und stabilisiere dich vor der nächsten Wiederholung.",
    ],
    "Do not place both feet on one narrow line or let the front knee collapse inward.|Ne postavljajte stopala na jednu usku liniju i ne dozvolite propadanje prednjeg koljena prema unutra.|Stelle die Füße nicht auf eine einzige schmale Linie und lasse das vordere Knie nicht nach innen kippen.",
    "Think of lowering between your feet rather than diving forward.|Spuštajte se između stopala umjesto naglog naginjanja naprijed.|Senke dich zwischen die Füße, statt nach vorn zu fallen.",
  ),
  hinge: family(
    "Stand close to the load with a comfortable stance; keep your spine in its natural shape.|Stanite blizu opterećenja u udoban stav; zadržite prirodan položaj kičme.|Stelle dich mit angenehmem Stand dicht an die Last und halte die natürliche Form der Wirbelsäule.",
    [
      "Soften the knees and send the hips backward while keeping the load close.|Blago savijte koljena i pomjerite kukove nazad, držeći opterećenje blizu tijela.|Beuge die Knie leicht und schiebe die Hüfte nach hinten; die Last bleibt körpernah.",
      "Stop the descent before your lower back rounds or you lose tension in the hamstrings.|Zaustavite spuštanje prije zaobljavanja donjeg dijela leđa ili gubitka napetosti zadnje lože.|Beende das Absenken, bevor der untere Rücken rund wird oder die Spannung in der Oberschenkelrückseite verloren geht.",
      "Press the floor away and extend the hips to stand; lower with the same controlled path.|Odgurnite pod i ispružite kukove do stajanja; spuštajte istom kontrolisanom putanjom.|Drücke den Boden weg und strecke die Hüfte zum Aufrichten; senke die Last auf demselben kontrollierten Weg.",
    ],
    "Avoid jerking the load, reaching it away from the legs or leaning back at lockout.|Izbjegavajte trzanje, udaljavanje tereta od nogu i zabacivanje pri uspravljanju.|Vermeide ruckartiges Anheben, Abstand zwischen Last und Beinen sowie Zurücklehnen am oberen Punkt.",
    "Move at the hip crease; keep ribs stacked over the pelvis.|Pokret pravite u pregibu kuka; rebra držite iznad karlice.|Bewege dich aus der Hüftfalte; halte die Rippen über dem Becken.",
  ),
  bridge: family(
    "Start with knees bent and feet firmly supported; position any load over the padded hip crease.|Počnite sa savijenim koljenima i čvrsto oslonjenim stopalima; teret postavite preko podstavljenog pregiba kuka.|Beginne mit gebeugten Knien und festen Füßen; platziere eine Last gepolstert in der Hüftfalte.",
    [
      "Exhale gently and brace without pushing the lower back into a large arch.|Lagano izdahnite i učvrstite trup bez pretjeranog izvijanja donjih leđa.|Atme sanft aus und spanne den Rumpf an, ohne den unteren Rücken stark zu überstrecken.",
      "Drive through the feet and lift the hips until the torso and thighs form a line.|Odgurnite se stopalima i podignite kukove dok trup i bedra ne budu u liniji.|Drücke über die Füße und hebe die Hüfte, bis Rumpf und Oberschenkel eine Linie bilden.",
      "Pause with the glutes engaged, then lower the hips slowly.|Kratko zadržite aktivnu stražnjicu, zatim polako spustite kukove.|Halte kurz mit angespanntem Gesäß und senke die Hüfte langsam ab.",
    ],
    "Do not finish by arching the back or let the knees drift far apart or inward.|Ne završavajte pokret izvijanjem leđa i ne dozvolite veliko razmicanje ili propadanje koljena.|Beende die Bewegung nicht durch ein Hohlkreuz; lasse die Knie weder stark auseinander noch nach innen wandern.",
    "Lift through the hips, not through the lower back.|Podizanje dolazi iz kukova, a ne iz donjih leđa.|Hebe aus der Hüfte, nicht aus dem unteren Rücken.",
  ),
  row: family(
    "Set a stable stance or support your chest; reach for the handle without rounding your lower back.|Zauzmite stabilan stav ili oslonite prsa; dohvatite ručku bez zaobljavanja donjih leđa.|Stelle dich stabil hin oder stütze die Brust ab; greife den Griff ohne Rundung im unteren Rücken.",
    [
      "Begin with arms long and shoulders comfortably forward, keeping your trunk still.|Počnite ispruženih ruku i opušteno pruženih ramena; trup ostaje miran.|Beginne mit langen Armen und angenehm vorgelagerten Schultern; der Rumpf bleibt ruhig.",
      "Pull the elbows back toward your sides while bringing the handle toward your ribs.|Povucite laktove nazad uz tijelo i ručku približite rebrima.|Ziehe die Ellenbogen seitlich nach hinten und den Griff in Richtung Rippen.",
      "Pause without shrugging, then extend the arms slowly and allow a controlled shoulder reach.|Zadržite bez podizanja ramena, zatim polako ispružite ruke uz kontrolisan doseg ramena.|Halte kurz ohne Schulterhochziehen und strecke die Arme langsam mit kontrolliertem Vorreichen der Schultern.",
    ],
    "Avoid swinging the torso, craning the neck or jerking the handle with the lower back.|Izbjegavajte njihanje trupa, isturanje vrata i trzanje ručke donjim leđima.|Vermeide Rumpfschwung, einen vorgeschobenen Hals und Ziehen aus dem unteren Rücken.",
    "Guide the elbows; keep your chest and pelvis facing the same direction.|Vodite laktovima; prsa i karlica ostaju usmjereni isto.|Führe mit den Ellenbogen; Brust und Becken zeigen in dieselbe Richtung.",
  ),
  pulldown: family(
    "Secure the high handle or overhead anchor and settle into a stable seated, standing or kneeling position.|Provjerite visoku ručku ili sidrište iznad glave i zauzmite stabilan sjedeći, stojeći ili klečeći položaj.|Sichere den hohen Griff oder den Anker über Kopf und nimm eine stabile Sitz-, Stand- oder Kniestellung ein.",
    [
      "Reach overhead within a comfortable shoulder range and keep the ribs controlled.|Posegnite iznad glave u udobnom rasponu ramena i kontrolišite rebra.|Greife in einem angenehmen Schulterbereich nach oben und halte die Rippen stabil.",
      "Bring the elbows down toward the sides of the ribs, drawing the handle in front of you.|Spuštajte laktove prema bočnim rebrima i povlačite ručku ispred tijela.|Ziehe die Ellenbogen seitlich zu den Rippen und führe den Griff vor dem Körper nach unten.",
      "Return slowly overhead without letting the weight pull you off your support.|Polako vratite ruke gore, bez dozvole da vas teret odvoji od oslonca.|Kehre langsam nach oben zurück, ohne dich von der Last aus der Position ziehen zu lassen.",
    ],
    "Avoid pulling behind the neck, rocking backward or using a load that prevents a controlled return.|Ne povlačite iza vrata, ne zabacujte se i ne birajte teret koji onemogućava kontrolisan povratak.|Vermeide Ziehen hinter den Nacken, starkes Zurückschwingen und eine Last, die keinen kontrollierten Rückweg erlaubt.",
    "Bring elbows toward the pockets without forcing the shoulders down.|Usmjerite laktove prema džepovima bez nasilnog spuštanja ramena.|Führe die Ellenbogen zu den Hosentaschen, ohne die Schultern gewaltsam nach unten zu drücken.",
  ),
  pullup: family(
    "Use a fixed bar or secure handles; choose assistance if you cannot control the full movement.|Koristite fiksnu šipku ili sigurne ručke; koristite pomoć ako ne možete kontrolisati cijeli pokret.|Nutze eine feste Stange oder sichere Griffe; wähle Unterstützung, wenn du die Bewegung nicht kontrollieren kannst.",
    [
      "Start from a comfortable long-arm hang with a steady trunk.|Počnite iz udobnog visa ispruženih ruku i mirnog trupa.|Beginne in einem angenehmen Hang mit langen Armen und ruhigem Rumpf.",
      "Pull the elbows down and lift the chest toward the bar without kicking.|Povucite laktove dolje i podignite prsa prema šipci bez zamaha nogama.|Ziehe die Ellenbogen nach unten und hebe die Brust ohne Beinschwung zur Stange.",
      "Lower smoothly back to the starting hang; step onto a support to dismount.|Kontrolisano se spustite u početni vis; za silazak stanite na oslonac.|Senke dich gleichmäßig in den Ausgangshang und nutze zum Absteigen eine Stütze.",
    ],
    "Do not crane the chin over the bar, bounce from the shoulders or drop suddenly.|Ne gurajte bradu preko šipke, ne odskačite iz ramena i ne padajte naglo.|Schiebe das Kinn nicht gewaltsam über die Stange, federe nicht aus den Schultern und lasse dich nicht fallen.",
    "Keep the legs quiet and let the elbows lead.|Noge ostaju mirne, a laktovi vode pokret.|Halte die Beine ruhig und führe mit den Ellenbogen.",
  ),
  press: family(
    "Secure the bench, handles or bar supports; align wrists over forearms and choose a controllable load.|Provjerite klupu, ručke ili nosače šipke; poravnajte zapešća s podlakticama i izaberite teret koji kontrolišete.|Sichere Bank, Griffe oder Ablagen; richte Handgelenke über den Unterarmen aus und wähle eine kontrollierbare Last.",
    [
      "Set the shoulders comfortably and brace the trunk before moving the load.|Namjestite ramena udobno i učvrstite trup prije pokreta.|Positioniere die Schultern angenehm und spanne den Rumpf vor der Bewegung an.",
      "Press the load away along the intended path while keeping wrists supported and elbows controlled.|Potisnite teret predviđenom putanjom, uz oslonjena zapešća i kontrolisane laktove.|Drücke die Last auf der vorgesehenen Bahn weg; halte die Handgelenke stabil und kontrolliere die Ellenbogen.",
      "Lower slowly until you reach a comfortable shoulder range, then repeat without bouncing.|Spuštajte polako do udobnog raspona ramena, zatim ponovite bez odskakivanja.|Senke die Last langsam bis zu einer angenehmen Schulterposition und wiederhole ohne Federn.",
    ],
    "Avoid losing wrist alignment, flaring the elbows forcefully or lifting a load you cannot safely rerack.|Izbjegavajte lomljenje zapešća, nasilno širenje laktova i teret koji ne možete sigurno vratiti na nosač.|Vermeide abgeknickte Handgelenke, erzwungenes Ausstellen der Ellenbogen und eine Last, die du nicht sicher ablegen kannst.",
    "Keep forearms under the load and use a smooth reversal.|Držite podlaktice ispod tereta i glatko mijenjajte smjer.|Halte die Unterarme unter der Last und wechsle die Richtung gleichmäßig.",
  ),
  overhead: family(
    "Start with the load near shoulder height, forearms supporting it, feet stable and ribs over pelvis.|Počnite s teretom blizu ramena, oslonjenim na podlaktice; stopala su stabilna, a rebra iznad karlice.|Beginne mit der Last auf Schulterhöhe, gestützten Unterarmen, festem Stand und Rippen über dem Becken.",
    [
      "Brace and press the load upward, allowing the shoulder blades to rotate naturally.|Učvrstite trup i potisnite gore, dopuštajući prirodno okretanje lopatica.|Spanne den Rumpf an und drücke nach oben; die Schulterblätter dürfen sich natürlich mitdrehen.",
      "Finish only as high as you can reach without arching your lower back.|Završite samo onoliko visoko koliko možete bez izvijanja donjih leđa.|Drücke nur so hoch, wie es ohne Überstreckung im unteren Rücken möglich ist.",
      "Lower the load slowly back toward the shoulders, keeping a clear path around the head.|Polako vratite teret prema ramenima, vodeći putanju mimo glave.|Senke die Last langsam zu den Schultern; halte die Bahn am Kopf vorbei frei.",
    ],
    "Do not turn the movement into a standing backbend or force through a pinching shoulder range.|Ne pretvarajte pokret u izvijanje leđa i ne forsirajte raspon koji štipa rame.|Vermeide starkes Zurückbeugen und erzwinge keinen klemmenden Schulterbereich.",
    "Reach upward with a steady trunk; exhale through the effort.|Posegnite gore uz miran trup; izdahnite tokom napora.|Reiche bei stabilem Rumpf nach oben und atme während der Anstrengung aus.",
  ),
  pushup: family(
    "Place your hands on a secure surface near shoulder width and choose an incline or knee support if needed.|Postavite dlanove na sigurnu podlogu blizu širine ramena; po potrebi povisite oslonac ili oslonite koljena.|Setze die Hände etwa schulterbreit auf eine sichere Fläche; nutze bei Bedarf eine Erhöhung oder die Knie.",
    [
      "Make a long line through your trunk and brace the abdomen and glutes.|Izdužite trup i učvrstite trbuh i stražnjicu.|Bilde eine lange Linie durch den Rumpf und spanne Bauch und Gesäß an.",
      "Bend the elbows and lower the chest between the hands while keeping hips with the shoulders.|Savijte laktove i spustite prsa između dlanova; kukovi prate ramena.|Beuge die Ellenbogen und senke die Brust zwischen die Hände; Hüfte und Schultern bewegen sich gemeinsam.",
      "Push the surface away and return to long arms without sagging through the lower back.|Odgurnite podlogu i ispružite ruke bez propadanja donjih leđa.|Drücke die Unterlage weg und strecke die Arme, ohne im unteren Rücken durchzuhängen.",
    ],
    "Avoid leading with the head, sagging hips or flaring the elbows straight sideways.|Izbjegavajte vođenje glavom, propadanje kukova i potpuno bočno širenje laktova.|Vermeide einen vorausgeschobenen Kopf, sinkende Hüften und vollständig seitlich ausgestellte Ellenbogen.",
    "Move as one unit and spread pressure across the whole hand.|Krećite se kao jedna cjelina i rasporedite pritisak preko cijelog dlana.|Bewege dich als Einheit und verteile den Druck über die ganze Hand.",
  ),
  fly: family(
    "Set the handles around chest height for the intended angle and keep a small, stable bend in the elbows.|Namjestite ručke u visinu prsa za odabrani ugao i zadržite mali, stabilan pregib laktova.|Stelle die Griffe für den gewünschten Winkel etwa auf Brusthöhe ein und halte die Ellenbogen leicht und gleichmäßig gebeugt.",
    [
      "Open the arms only to a comfortable chest stretch, keeping the shoulders controlled.|Otvorite ruke samo do udobnog istezanja prsa, uz kontrolisana ramena.|Öffne die Arme nur bis zu einer angenehmen Brustdehnung und kontrolliere die Schultern.",
      "Bring the arms together in a wide hugging arc without turning the movement into a press.|Spojite ruke širokim lukom zagrljaja, bez pretvaranja pokreta u potisak.|Führe die Arme in einem weiten Umarmungsbogen zusammen, ohne daraus eine Druckbewegung zu machen.",
      "Return along the same arc slowly, keeping the elbow bend nearly unchanged.|Polako se vratite istim lukom uz gotovo nepromijenjen pregib laktova.|Kehre langsam auf demselben Bogen zurück; der Ellenbogenwinkel bleibt nahezu gleich.",
    ],
    "Do not chase a deep stretch with heavy weights or allow the shoulders to roll forward at the finish.|Ne forsirajte duboko istezanje velikim teretom i ne dozvolite ramenima da pobjegnu naprijed na kraju.|Erzwinge mit schweren Gewichten keine tiefe Dehnung und lasse die Schultern am Ende nicht nach vorn rollen.",
    "Think of bringing the upper arms together; keep the neck relaxed.|Približavajte nadlaktice jednu drugoj; vrat ostaje opušten.|Denke daran, die Oberarme zusammenzuführen; der Nacken bleibt entspannt.",
  ),
  reversefly: family(
    "Support or hinge the torso and start with the arms in front, using a light resistance.|Oslonite ili nagnite trup iz kukova i počnite rukama ispred tijela, uz lagan otpor.|Stütze den Rumpf ab oder beuge dich aus der Hüfte vor; beginne mit den Armen vorn und leichtem Widerstand.",
    [
      "Keep a small elbow bend and open the upper arms outward.|Blago savijte laktove i otvarajte nadlaktice prema van.|Halte die Ellenbogen leicht gebeugt und öffne die Oberarme nach außen.",
      "Stop when the upper arms are in line with the torso or before shoulder discomfort.|Zaustavite kada su nadlaktice u liniji trupa ili prije nelagode u ramenu.|Stoppe, wenn die Oberarme auf Rumpfhöhe sind, oder früher bei Schulterbeschwerden.",
      "Bring the arms forward slowly without rounding and straightening your spine each repetition.|Vratite ruke polako naprijed bez ponavljanog savijanja i ispravljanja kičme.|Führe die Arme langsam nach vorn, ohne die Wirbelsäule bei jeder Wiederholung zu beugen und zu strecken.",
    ],
    "Avoid shrugging, swinging the weight or pulling far behind the torso.|Ne podižite ramena, ne zamahujte teretom i ne povlačite daleko iza trupa.|Vermeide Schulterhochziehen, Schwung und ein weites Ziehen hinter den Rumpf.",
    "Lead with the upper arms; keep the chest still.|Vodite nadlakticama; prsa ostaju mirna.|Führe mit den Oberarmen; die Brust bleibt ruhig.",
  ),
  raise: family(
    "Stand or sit securely with light resistance, long arms and a soft elbow bend.|Stanite ili sjednite stabilno s laganim otporom, dugim rukama i blago savijenim laktovima.|Stehe oder sitze stabil mit leichtem Widerstand, langen Armen und leicht gebeugten Ellenbogen.",
    [
      "Brace gently and lift the arms in the direction named by the variation.|Blago učvrstite trup i podignite ruke u smjeru navedenom u varijanti.|Spanne den Rumpf leicht an und hebe die Arme in die für die Variante genannte Richtung.",
      "Stop near shoulder height or earlier if you start shrugging or feel pinching.|Zaustavite blizu visine ramena ili ranije ako podižete ramena ili osjetite štipanje.|Stoppe etwa auf Schulterhöhe oder früher, wenn du die Schultern hochziehst oder ein Klemmen spürst.",
      "Lower slowly to the starting position without swinging into the next repetition.|Spustite polako u početni položaj bez zamaha u sljedeće ponavljanje.|Senke die Arme langsam ab, ohne Schwung für die nächste Wiederholung zu holen.",
    ],
    "Avoid leaning back, shrugging or throwing the weights upward.|Izbjegavajte naginjanje unazad, podizanje ramena i bacanje tereta gore.|Vermeide Zurücklehnen, Schulterhochziehen und Hochwerfen der Gewichte.",
    "Keep your neck long and move only as far as the shoulder stays comfortable.|Izdužite vrat i krećite se samo u udobnom rasponu ramena.|Halte den Nacken lang und bleibe im angenehmen Schulterbereich.",
  ),
  curl: family(
    "Take the specified grip, keep wrists in line with the forearms and stabilize the upper arms.|Uhvatite navedenim hvatom, poravnajte zapešća s podlakticama i stabilizujte nadlaktice.|Nutze den angegebenen Griff, halte Handgelenke und Unterarme in einer Linie und stabilisiere die Oberarme.",
    [
      "Begin with the elbows comfortably extended, without forcing them into lockout.|Počnite udobno ispruženih laktova bez nasilnog zaključavanja.|Beginne mit angenehm gestreckten Ellenbogen, ohne sie in die Endstellung zu drücken.",
      "Bend the elbows to curl the resistance upward while the upper arms stay mostly still.|Savijte laktove i podignite otpor dok nadlaktice ostaju uglavnom mirne.|Beuge die Ellenbogen und hebe den Widerstand; die Oberarme bleiben weitgehend ruhig.",
      "Lower slowly until the elbows return to the starting position.|Polako spuštajte do početnog položaja laktova.|Senke langsam ab, bis die Ellenbogen wieder in der Ausgangsposition sind.",
    ],
    "Do not swing the hips, bend the wrists to finish or let the elbows drift forward to lift more.|Ne zamahujte kukovima, ne savijajte zapešća za završetak i ne gurajte laktove naprijed radi većeg tereta.|Vermeide Hüftschwung, Abknicken der Handgelenke und Vorschieben der Ellenbogen für mehr Gewicht.",
    "Keep the wrist quiet and let the elbow do the bending.|Zapešće ostaje mirno, a savijanje se odvija u laktu.|Halte das Handgelenk ruhig; die Beugung erfolgt im Ellenbogen.",
  ),
  triceps: family(
    "Secure the handle or weight and place the upper arms in the position specified for this variation.|Provjerite ručku ili teret i postavite nadlaktice u položaj naveden za ovu varijantu.|Sichere Griff oder Gewicht und bringe die Oberarme in die für diese Variante angegebene Position.",
    [
      "Keep the trunk steady and bend the elbows under control.|Zadržite miran trup i kontrolisano savijte laktove.|Halte den Rumpf ruhig und beuge die Ellenbogen kontrolliert.",
      "Extend the elbows to move the resistance, leaving the upper arms nearly still.|Ispružite laktove i pomjerite otpor, dok nadlaktice ostaju gotovo mirne.|Strecke die Ellenbogen gegen den Widerstand; die Oberarme bleiben nahezu ruhig.",
      "Return slowly without letting the resistance snap the elbows into a deep bend.|Polako se vratite bez naglog povlačenja laktova u duboko savijanje.|Kehre langsam zurück, ohne die Ellenbogen durch den Widerstand ruckartig stark beugen zu lassen.",
    ],
    "Avoid swinging the shoulders, flaring the ribs or snapping into elbow lockout.|Izbjegavajte njihanje ramena, isturanje rebara i naglo zaključavanje laktova.|Vermeide Schulterschwung, aufklappende Rippen und ruckartiges Durchstrecken der Ellenbogen.",
    "Move around the elbow; keep the grip firm but wrists neutral.|Pokret je oko lakta; hvat je čvrst, a zapešća neutralna.|Bewege aus dem Ellenbogen; greife fest bei neutralen Handgelenken.",
  ),
  dip: family(
    "Use stable parallel bars or a fixed bench; begin with arms supporting you and shoulders comfortable.|Koristite stabilne paralelne ručke ili fiksnu klupu; počnite oslonjeni rukama s ramenima u udobnom položaju.|Nutze stabile Parallelholme oder eine feste Bank; stütze dich mit angenehm positionierten Schultern ab.",
    [
      "Bend the elbows slowly and lower only through a shoulder range you can control.|Polako savijte laktove i spustite se samo kroz raspon ramena koji kontrolišete.|Beuge die Ellenbogen langsam und senke dich nur so weit, wie du den Schulterbereich kontrollieren kannst.",
      "Keep the shoulders from tipping sharply forward at the bottom.|Ne dozvolite naglo prevrtanje ramena naprijed u donjoj poziciji.|Lasse die Schultern am tiefsten Punkt nicht stark nach vorn kippen.",
      "Press into the support and straighten the arms smoothly.|Pritisnite oslonac i glatko ispružite ruke.|Drücke in die Stütze und strecke die Arme gleichmäßig.",
    ],
    "Do not drop into a deep shoulder stretch or bounce out of the bottom.|Ne padajte u duboko istezanje ramena i ne odskačite iz donje pozicije.|Lasse dich nicht in eine tiefe Schulterdehnung fallen und federe nicht aus dem unteren Punkt.",
    "Use foot or machine assistance before adding load.|Koristite pomoć stopala ili sprave prije dodavanja tereta.|Nutze Fuß- oder Maschinenunterstützung, bevor du Zusatzgewicht verwendest.",
  ),
  pullover: family(
    "Choose a light resistance and a stable torso position; keep a soft elbow bend.|Izaberite lagan otpor i stabilan položaj trupa; laktovi su blago savijeni.|Wähle leichten Widerstand und eine stabile Rumpfposition; halte die Ellenbogen leicht gebeugt.",
    [
      "Reach the arms overhead only while keeping the ribs controlled.|Pružite ruke iznad glave samo dok kontrolišete rebra.|Führe die Arme nur so weit über Kopf, wie die Rippen stabil bleiben.",
      "Draw the upper arms toward the trunk in an arc, keeping the elbow angle nearly fixed.|Povucite nadlaktice lukom prema trupu, uz gotovo isti ugao laktova.|Ziehe die Oberarme in einem Bogen zum Rumpf; der Ellenbogenwinkel bleibt nahezu gleich.",
      "Return slowly through the same shoulder arc; stop before your lower back arches.|Polako se vratite istim lukom ramena; zaustavite prije izvijanja donjih leđa.|Kehre langsam auf demselben Schulterbogen zurück und stoppe vor einer Überstreckung des unteren Rückens.",
    ],
    "Avoid turning this into an elbow extension or using the lower back to create extra range.|Ne pretvarajte pokret u opružanje lakta i ne povećavajte raspon donjim leđima.|Mache daraus keine Ellenbogenstreckung und vergrößere den Bewegungsweg nicht aus dem unteren Rücken.",
    "Bring the upper arms toward the hips while keeping the ribs quiet.|Približite nadlaktice kukovima uz mirna rebra.|Führe die Oberarme zu den Hüften; die Rippen bleiben ruhig.",
  ),
  calf: family(
    "Place the forefoot firmly on a level surface or secured step and use hand support for balance.|Čvrsto oslonite prednji dio stopala na ravnu podlogu ili siguran stepenik i koristite oslonac rukom.|Setze den Vorfuß fest auf den Boden oder eine sichere Stufe und nutze eine Handstütze für das Gleichgewicht.",
    [
      "Rise through the ball of the foot while keeping pressure across the toes.|Podignite petu preko prednjeg dijela stopala, uz ravnomjeran pritisak kroz prste.|Hebe die Ferse über den Fußballen; verteile den Druck über die Zehen.",
      "Pause at the top without rolling the ankle outward.|Zadržite gore bez prevrtanja skočnog zgloba prema van.|Halte oben kurz, ohne das Sprunggelenk nach außen kippen zu lassen.",
      "Lower the heel slowly through a comfortable range and repeat without bouncing.|Polako spustite petu kroz udoban raspon i ponovite bez odskakivanja.|Senke die Ferse langsam im angenehmen Bereich ab und wiederhole ohne Federn.",
    ],
    "Avoid bouncing off the bottom or letting the ankle roll to the outer edge of the foot.|Ne odskačite iz donje pozicije i ne prevrćite zglob na vanjski rub stopala.|Vermeide Federn am unteren Punkt und ein Abrollen über die Außenkante des Fußes.",
    "Lift vertically and keep the big-toe base in contact.|Podižite se okomito i zadržite oslonac korijena palca.|Hebe dich senkrecht und halte Kontakt zum Großzehenballen.",
  ),
  legcurl: family(
    "Align the knee with the machine pivot or secure the band/ball; stabilize hips before bending.|Poravnajte koljeno s osovinom sprave ili provjerite traku/loptu; stabilizujte kukove prije savijanja.|Richte das Knie an der Maschinenachse aus oder sichere Band beziehungsweise Ball; stabilisiere die Hüfte vor dem Beugen.",
    [
      "Bend the knee to bring the heel toward the buttock against resistance.|Savijte koljeno i približite petu stražnjici protiv otpora.|Beuge das Knie und führe die Ferse gegen den Widerstand zum Gesäß.",
      "Pause without lifting or twisting the pelvis to gain range.|Zadržite bez podizanja ili okretanja karlice radi većeg raspona.|Halte kurz, ohne das Becken für mehr Bewegungsweg anzuheben oder zu verdrehen.",
      "Extend the knee slowly and stop before the resistance pulls the joint abruptly straight.|Polako ispružite koljeno i zaustavite prije naglog povlačenja u opružanje.|Strecke das Knie langsam und stoppe, bevor der Widerstand das Gelenk ruckartig durchzieht.",
    ],
    "Avoid arching the back, moving the hips or jerking the pad with momentum.|Izbjegavajte izvijanje leđa, pomjeranje kukova i trzanje jastučića zamahom.|Vermeide ein Hohlkreuz, Hüftbewegungen und ruckartiges Bewegen des Polsters mit Schwung.",
    "Keep your pelvis quiet and feel the knee bend smoothly.|Karlica ostaje mirna, a koljeno se savija glatko.|Halte das Becken ruhig und beuge das Knie gleichmäßig.",
  ),
  legextension: family(
    "Support the thigh, align the knee with the pivot and place the pad above the ankle, not on the foot.|Oslonite bedro, poravnajte koljeno s osovinom i postavite jastučić iznad zgloba, a ne preko stopala.|Stütze den Oberschenkel ab, richte das Knie an der Achse aus und platziere das Polster oberhalb des Sprunggelenks, nicht auf dem Fuß.",
    [
      "Brace lightly and extend the knee against the resistance.|Blago učvrstite trup i ispružite koljeno protiv otpora.|Spanne den Rumpf leicht an und strecke das Knie gegen den Widerstand.",
      "Stop at a comfortable straight-knee position without snapping into it.|Zaustavite u udobnoj opruženoj poziciji bez naglog zaključavanja.|Stoppe in einer angenehm gestreckten Knieposition, ohne hineinzuschnappen.",
      "Bend the knee slowly to return while keeping the thigh supported.|Polako savijte koljeno za povratak, dok bedro ostaje oslonjeno.|Beuge das Knie langsam zurück; der Oberschenkel bleibt unterstützt.",
    ],
    "Do not kick the load up, lift the hips or force a painful end range.|Ne izbacujte teret, ne podižite kukove i ne forsirajte bolan krajnji raspon.|Kicke die Last nicht hoch, hebe die Hüfte nicht an und erzwinge keinen schmerzhaften Endbereich.",
    "Make the knee movement smooth in both directions.|Pokret koljena neka bude gladak u oba smjera.|Bewege das Knie in beide Richtungen gleichmäßig.",
  ),
  hipabduction: family(
    "Keep the pelvis level and choose a stable support; point the working leg comfortably forward.|Držite karlicu ravno i izaberite stabilan oslonac; radna noga je usmjerena udobno naprijed.|Halte das Becken waagerecht und nutze eine stabile Stütze; das arbeitende Bein zeigt angenehm nach vorn.",
    [
      "Move the working thigh away from the midline without leaning the trunk.|Odmaknite radno bedro od sredine tijela bez naginjanja trupa.|Führe den arbeitenden Oberschenkel von der Körpermitte weg, ohne den Rumpf zu neigen.",
      "Pause before the pelvis starts to hike or rotate.|Zaustavite prije podizanja ili rotiranja karlice.|Stoppe, bevor das Becken hochzieht oder rotiert.",
      "Bring the leg back slowly while keeping the resistance under control.|Polako vratite nogu uz kontrolu otpora.|Führe das Bein langsam zurück und kontrolliere den Widerstand.",
    ],
    "Avoid swinging the leg, turning the toes upward or rolling the pelvis backward.|Ne zamahujte nogom, ne okrećite prste gore i ne prevrćite karlicu nazad.|Vermeide Beinschwung, nach oben gedrehte Zehen und ein nach hinten rollendes Becken.",
    "Keep both hip bones facing forward; use a small clean range.|Obje kosti karlice usmjerite naprijed; koristite mali, čist raspon.|Halte beide Beckenknochen nach vorn ausgerichtet und nutze einen kleinen, sauberen Bewegungsweg.",
  ),
  hipadduction: family(
    "Stabilize the pelvis and position the working leg so it can move toward the midline freely.|Stabilizujte karlicu i postavite radnu nogu tako da se može slobodno približiti sredini tijela.|Stabilisiere das Becken und positioniere das arbeitende Bein so, dass es sich frei zur Körpermitte bewegen kann.",
    [
      "Draw the thigh inward against resistance without twisting the pelvis.|Približite bedro prema unutra protiv otpora bez uvrtanja karlice.|Ziehe den Oberschenkel gegen den Widerstand nach innen, ohne das Becken zu verdrehen.",
      "Pause with controlled inner-thigh tension rather than squeezing with the whole trunk.|Zadržite kontrolisanu napetost unutrašnje strane bedra bez stiskanja cijelim trupom.|Halte kurz mit kontrollierter Spannung an der Oberschenkelinnenseite, ohne den ganzen Rumpf anzuspannen.",
      "Return slowly and do not let the resistance pull the legs too far apart.|Vratite se polako i ne dozvolite otporu pretjerano razmicanje nogu.|Kehre langsam zurück und lasse die Beine nicht durch den Widerstand zu weit auseinanderziehen.",
    ],
    "Avoid swinging across the body or pushing through groin pain.|Ne zamahujte preko tijela i ne radite kroz bol u preponi.|Vermeide Schwung quer vor dem Körper und trainiere nicht durch Leistenschmerzen hindurch.",
    "Move the thigh; keep the waist and pelvis still.|Pomjerajte bedro; struk i karlica ostaju mirni.|Bewege den Oberschenkel; Taille und Becken bleiben ruhig.",
  ),
  kickback: family(
    "Use hand or forearm support and set the trunk steady with hips facing the floor or forward.|Koristite oslonac dlanovima ili podlakticama i stabilizujte trup, s kukovima prema podu ili naprijed.|Nutze Hand- oder Unterarmstützen und stabilisiere den Rumpf; die Hüfte zeigt zum Boden oder nach vorn.",
    [
      "Move the working thigh backward from the hip without arching the spine.|Pomjerite radno bedro nazad iz kuka bez izvijanja kičme.|Führe den arbeitenden Oberschenkel aus der Hüfte nach hinten, ohne die Wirbelsäule zu überstrecken.",
      "Stop as soon as the pelvis would need to turn or the lower back would extend.|Zaustavite čim bi se karlica morala okrenuti ili donja leđa izviti.|Stoppe, sobald sich das Becken drehen oder der untere Rücken überstrecken müsste.",
      "Return the leg slowly and repeat with the same controlled hip path.|Polako vratite nogu i ponovite istom kontrolisanom putanjom kuka.|Führe das Bein langsam zurück und wiederhole auf derselben kontrollierten Hüftbahn.",
    ],
    "Avoid chasing height with the lower back or rotating the trunk away from the working leg.|Ne povećavajte visinu donjim leđima i ne okrećite trup od radne noge.|Erzeuge Höhe nicht aus dem unteren Rücken und drehe den Rumpf nicht vom arbeitenden Bein weg.",
    "Keep the front of the pelvis quiet; move from the glute.|Prednji dio karlice ostaje miran; pokret dolazi iz stražnjice.|Halte die Vorderseite des Beckens ruhig und bewege aus dem Gesäß.",
  ),
  plank: family(
    "Place the specified hands or forearms on a stable surface; set shoulders over the support.|Postavite navedeni oslonac dlanovima ili podlakticama na stabilnu podlogu; ramena su iznad oslonca.|Setze Hände oder Unterarme wie angegeben auf eine stabile Fläche; die Schultern stehen über der Stütze.",
    [
      "Extend the legs and make a long line from the head through the hips.|Ispružite noge i napravite dugu liniju od glave kroz kukove.|Strecke die Beine und bilde eine lange Linie vom Kopf über die Hüfte.",
      "Brace the abdomen and glutes while continuing to breathe quietly.|Učvrstite trbuh i stražnjicu uz mirno disanje.|Spanne Bauch und Gesäß an und atme ruhig weiter.",
      "Hold or perform the specified limb movement without losing trunk alignment; lower to rest before form breaks.|Zadržite ili izvedite navedeni pokret udova bez gubitka položaja trupa; spustite se na odmor prije kvarenja forme.|Halte die Position oder führe die genannte Gliedmaßenbewegung ohne Verlust der Rumpflinie aus; lege vor einem Technikverlust ab.",
    ],
    "Do not sag at the waist, push the hips high or hold your breath to prolong the set.|Ne propadajte u struku, ne podižite kukove previsoko i ne zadržavajte dah radi duže serije.|Vermeide Durchhängen in der Taille, zu hohe Hüften und Luftanhalten zur Verlängerung des Satzes.",
    "Shorten the hold or raise the support surface when alignment becomes difficult.|Skratite zadržavanje ili povisite oslonac kada položaj postane težak.|Verkürze die Haltezeit oder erhöhe die Stützfläche, wenn die Ausrichtung schwierig wird.",
  ),
  sideplank: family(
    "Lie on your side with the supporting elbow beneath the shoulder; stack or stagger the feet.|Lezite na bok s laktom ispod ramena; stopala složite jedno na drugo ili ih razmaknite.|Lege dich seitlich mit dem Stützellenbogen unter die Schulter; lege die Füße übereinander oder versetzt auf.",
    [
      "Press the forearm or hand into the floor and lift the hips.|Pritisnite podlakticom ili dlanom u pod i podignite kukove.|Drücke Unterarm oder Hand in den Boden und hebe die Hüfte.",
      "Keep the chest and pelvis facing sideways while you hold and breathe.|Zadržite prsa i karlicu usmjerene bočno dok držite i dišete.|Halte Brust und Becken seitlich ausgerichtet, während du hältst und atmest.",
      "Lower the hips gently and change sides with control.|Lagano spustite kukove i kontrolisano promijenite stranu.|Senke die Hüfte sanft ab und wechsle kontrolliert die Seite.",
    ],
    "Avoid letting the waist sink, rolling the shoulders forward or pressing painfully into the elbow.|Ne dozvolite propadanje struka, okretanje ramena naprijed ili bolan pritisak na lakat.|Vermeide eine absinkende Taille, nach vorn rollende Schultern und schmerzhaften Druck auf den Ellenbogen.",
    "Use bent-knee support to reduce the lever when needed.|Po potrebi oslonite savijena koljena da skratite polugu.|Nutze bei Bedarf gebeugte Knie als Stütze, um den Hebel zu verkürzen.",
  ),
  coreflexion: family(
    "Set up on a comfortable support with the neck relaxed and the pelvis controlled.|Namjestite se na udoban oslonac s opuštenim vratom i kontrolisanom karlicom.|Richte dich auf einer angenehmen Unterlage mit entspanntem Nacken und kontrolliertem Becken ein.",
    [
      "Exhale and bring the ribs toward the pelvis with a small controlled curl.|Izdahnite i približite rebra karlici malim kontrolisanim pregibom.|Atme aus und nähere die Rippen dem Becken mit einer kleinen kontrollierten Einrollbewegung.",
      "Pause without pulling the head or using a swing of the arms.|Zadržite bez povlačenja glave ili zamaha rukama.|Halte kurz, ohne am Kopf zu ziehen oder mit den Armen zu schwingen.",
      "Lower slowly and reset the breathing before the next repetition.|Spustite se polako i obnovite disanje prije sljedećeg ponavljanja.|Senke langsam ab und ordne die Atmung vor der nächsten Wiederholung.",
    ],
    "Do not yank on the neck, rush the lowering phase or force a large spinal bend.|Ne povlačite vrat, ne žurite spuštanje i ne forsirajte velik pregib kičme.|Ziehe nicht am Nacken, hetze die Absenkphase nicht und erzwinge keine starke Wirbelsäulenbeugung.",
    "Use abdominal control rather than speed.|Koristite kontrolu trbuha umjesto brzine.|Nutze Bauchkontrolle statt Geschwindigkeit.",
  ),
  legraise: family(
    "Choose a secure lying, seated or hanging support; bend the knees if the long-leg lever is too demanding.|Izaberite siguran ležeći, sjedeći ili viseći oslonac; savijte koljena ako je opružena noga prezahtjevna.|Wähle eine sichere Liege-, Sitz- oder Hangposition; beuge die Knie, wenn der lange Beinhebel zu anspruchsvoll ist.",
    [
      "Brace the abdomen and raise the knees or legs without swinging the torso.|Učvrstite trbuh i podignite koljena ili noge bez njihanja trupa.|Spanne den Bauch an und hebe Knie oder Beine, ohne den Rumpf zu schwingen.",
      "Move only as high as you can maintain control through the pelvis.|Podignite samo dok možete kontrolisati karlicu.|Hebe nur so hoch, wie du das Becken kontrollieren kannst.",
      "Lower slowly and stop before the lower back arches or the body starts swinging.|Spustite polako i zaustavite prije izvijanja donjih leđa ili njihanja tijela.|Senke langsam ab und stoppe vor einem Hohlkreuz oder Körperschwung.",
    ],
    "Avoid throwing the legs up, dropping them suddenly or holding a painful hanging position.|Ne izbacujte noge, ne spuštajte ih naglo i ne ostajte u bolnom visu.|Vermeide Hochwerfen oder Fallenlassen der Beine sowie eine schmerzhafte Hangposition.",
    "Shorten the lever before increasing the range.|Skratite polugu prije povećavanja raspona.|Verkürze den Hebel, bevor du den Bewegungsweg vergrößerst.",
  ),
  deadbug: family(
    "Lie on your back with hips and knees bent and arms reaching upward; keep the ribs relaxed.|Lezite na leđa sa savijenim kukovima i koljenima, ruke pružite gore; rebra ostaju mirna.|Lege dich mit gebeugten Hüften und Knien auf den Rücken und strecke die Arme nach oben; die Rippen bleiben entspannt.",
    [
      "Exhale and gently brace while keeping the pelvis steady.|Izdahnite i blago učvrstite trup uz mirnu karlicu.|Atme aus und spanne den Rumpf leicht an; das Becken bleibt ruhig.",
      "Reach one arm and the opposite leg away only as far as your back stays controlled.|Pružite jednu ruku i suprotnu nogu samo dok leđa ostaju pod kontrolom.|Führe einen Arm und das gegenüberliegende Bein nur so weit weg, wie der Rücken kontrolliert bleibt.",
      "Return to the start, breathe and alternate sides slowly.|Vratite se na početak, udahnite i polako promijenite stranu.|Kehre zurück, atme und wechsle langsam die Seite.",
    ],
    "Avoid flaring the ribs, arching the back or extending farther than you can stabilize.|Ne isturajte rebra, ne izvijajte leđa i ne pružajte dalje nego što možete stabilizovati.|Vermeide aufklappende Rippen, ein Hohlkreuz und einen zu großen Bewegungsweg.",
    "Keep the trunk quiet while the limbs move.|Trup ostaje miran dok se udovi kreću.|Der Rumpf bleibt ruhig, während sich die Gliedmaßen bewegen.",
  ),
  birddog: family(
    "Start on hands and knees, wrists under shoulders and knees under hips.|Počnite četveronožno, sa zapešćima ispod ramena i koljenima ispod kukova.|Beginne im Vierfüßlerstand, Hände unter den Schultern und Knie unter den Hüften.",
    [
      "Brace gently and slide one leg backward as the opposite arm reaches forward.|Blago učvrstite trup i pružite jednu nogu nazad, a suprotnu ruku naprijed.|Spanne den Rumpf leicht an und schiebe ein Bein nach hinten, während der gegenüberliegende Arm nach vorn reicht.",
      "Lift only to trunk height, keeping both hip bones facing the floor.|Podignite samo do visine trupa, s obje kosti karlice prema podu.|Hebe nur bis auf Rumpfhöhe; beide Beckenknochen zeigen zum Boden.",
      "Return hand and knee softly, then change sides.|Vratite dlan i koljeno mekano, zatim promijenite stranu.|Setze Hand und Knie sanft ab und wechsle die Seite.",
    ],
    "Avoid lifting too high, twisting the hips or letting the lower back sag.|Ne podižite previsoko, ne uvrćite kukove i ne dozvolite propadanje donjih leđa.|Vermeide zu hohes Anheben, Hüftverdrehung und Durchhängen im unteren Rücken.",
    "Reach long rather than high; keep an imaginary glass balanced on the pelvis.|Pružajte se u dužinu, ne u visinu; zamišljena čaša ostaje mirna na karlici.|Reiche lang statt hoch; ein gedachtes Glas bleibt auf dem Becken stehen.",
  ),
  rotation: family(
    "Set a stable base with softly bent knees and place the resistance close enough to control.|Zauzmite stabilan oslonac s blago savijenim koljenima i postavite otpor dovoljno blizu za kontrolu.|Stelle dich mit leicht gebeugten Knien stabil hin und halte den Widerstand kontrollierbar nah.",
    [
      "Rotate through the intended trunk and hip range without jerking the lower back.|Rotirajte kroz predviđeni raspon trupa i kukova bez trzanja donjih leđa.|Drehe dich im vorgesehenen Rumpf- und Hüftbereich, ohne den unteren Rücken ruckartig zu verdrehen.",
      "Guide the hands through the named diagonal or horizontal path while staying balanced.|Vodite ruke navedenom dijagonalnom ili vodoravnom putanjom uz ravnotežu.|Führe die Hände auf der angegebenen diagonalen oder waagerechten Bahn und bleibe im Gleichgewicht.",
      "Return slowly, then repeat the same number on the other side when appropriate.|Vratite se polako, zatim po potrebi ponovite isti broj na drugoj strani.|Kehre langsam zurück und wiederhole gegebenenfalls die gleiche Anzahl auf der anderen Seite.",
    ],
    "Avoid twisting forcefully through a fixed knee or pulling with momentum.|Ne uvijajte snažno preko nepomičnog koljena i ne povlačite zamahom.|Vermeide kräftiges Verdrehen über ein feststehendes Knie und Ziehen mit Schwung.",
    "Let the feet pivot if the variation includes whole-body rotation.|Dopustite okret stopala ako varijanta uključuje rotaciju cijelog tijela.|Lasse die Füße mitdrehen, wenn die Variante eine Ganzkörperdrehung umfasst.",
  ),
  antirotation: family(
    "Secure a band or cable around chest height and stand or kneel side-on to the anchor.|Učvrstite traku ili sajlu blizu visine prsa i stanite ili kleknite bočno prema sidrištu.|Befestige Band oder Kabel etwa auf Brusthöhe und stelle oder knie dich seitlich zum Anker.",
    [
      "Hold the handle at the chest and brace without rotating toward the anchor.|Držite ručku uz prsa i učvrstite trup bez okretanja prema sidrištu.|Halte den Griff vor der Brust und spanne an, ohne dich zum Anker zu drehen.",
      "Press the hands forward while keeping shoulders and hips facing straight ahead.|Potisnite dlanove naprijed, dok ramena i kukovi ostaju usmjereni pravo.|Drücke die Hände nach vorn; Schultern und Hüfte bleiben geradeaus ausgerichtet.",
      "Pause, bring the hands back to the chest slowly, then change sides.|Zadržite, polako vratite dlanove uz prsa, zatim promijenite stranu.|Halte kurz, führe die Hände langsam zur Brust zurück und wechsle dann die Seite.",
    ],
    "Do not lean away from the anchor or use so much resistance that the trunk rotates.|Ne naginjite se od sidrišta i ne birajte otpor koji okreće trup.|Lehne dich nicht vom Anker weg und nutze keinen Widerstand, der den Rumpf verdreht.",
    "The arms move; the breastbone and belt buckle stay still.|Ruke se kreću; prsna kost i kopča pojasa ostaju mirne.|Die Arme bewegen sich; Brustbein und Gürtelschnalle bleiben ruhig.",
  ),
  carry: family(
    "Pick up a manageable load with a stable stance and clear the walking path.|Podignite teret koji kontrolišete iz stabilnog stava i oslobodite put za hodanje.|Nimm eine kontrollierbare Last mit stabilem Stand auf und räume den Gehweg frei.",
    [
      "Stand tall with the ribs over the pelvis and shoulders naturally positioned.|Uspravite se s rebrima iznad karlice i ramenima u prirodnom položaju.|Stehe aufrecht mit Rippen über dem Becken und natürlich positionierten Schultern.",
      "Take short controlled steps, or hold still if the entry specifies a static hold.|Pravite kratke kontrolisane korake ili ostanite mirni ako je navedeno statičko držanje.|Gehe mit kurzen kontrollierten Schritten oder bleibe bei einer Haltevariante stehen.",
      "Stop before grip or posture fails and lower the load under control.|Stanite prije popuštanja hvata ili položaja i kontrolisano spustite teret.|Stoppe vor einem Verlust von Griff oder Haltung und setze die Last kontrolliert ab.",
    ],
    "Avoid leaning toward or away from the load, rushing turns or holding the breath for the whole carry.|Ne naginjite se prema teretu ili od njega, ne žurite okrete i ne zadržavajte dah cijelo nošenje.|Vermeide seitliches Lehnen, hastige Wendungen und Luftanhalten während des gesamten Tragens.",
    "Walk quietly with a level pelvis and steady breathing.|Hodajte tiho, s ravnom karlicom i ujednačenim disanjem.|Gehe ruhig mit waagerechtem Becken und gleichmäßiger Atmung.",
  ),
  jump: family(
    "Use a clear, non-slip landing area; practice a low jump and a controlled landing first.|Koristite slobodnu podlogu koja ne kliže; prvo uvježbajte nizak skok i kontrolisan doskok.|Nutze eine freie rutschfeste Landefläche; übe zuerst einen niedrigen Sprung mit kontrollierter Landung.",
    [
      "Bend hips and knees slightly, then push through the floor in the intended direction.|Blago savijte kukove i koljena, zatim se odgurnite od poda u predviđenom smjeru.|Beuge Hüfte und Knie leicht und drücke dich in die vorgesehene Richtung vom Boden ab.",
      "Land with softly bent knees and hips, keeping the knees aligned with the toes.|Doskočite mekano savijenih koljena i kukova, s koljenima u smjeru prstiju.|Lande mit weich gebeugten Knien und Hüften; die Knie folgen den Zehen.",
      "Regain balance before repeating; end the set when landing control or jump height declines.|Obnovite ravnotežu prije ponavljanja; završite seriju kada oslabi kontrola doskoka ili visina skoka.|Stabilisiere dich vor der Wiederholung und beende den Satz, wenn Landekontrolle oder Sprunghöhe nachlassen.",
    ],
    "Avoid stiff-legged landings, knees collapsing inward or adding height before landing skill.|Ne doskačite ukočenih nogu, ne puštajte koljena unutra i ne povećavajte visinu prije sigurnog doskoka.|Vermeide steife Landungen, nach innen kippende Knie und mehr Höhe vor sicherer Landetechnik.",
    "Land quietly and absorb with both hips and knees.|Doskočite tiho i ublažite kukovima i koljenima.|Lande leise und federe mit Hüften und Knien ab.",
  ),
  cardio: family(
    "Choose a clear route or adjust the machine to your body; start at an easy pace.|Izaberite slobodnu rutu ili prilagodite spravu tijelu; počnite laganim tempom.|Wähle eine freie Strecke oder passe das Gerät an deinen Körper an; beginne locker.",
    [
      "Build a comfortable rhythm while keeping posture relaxed and breathing regular.|Uspostavite udoban ritam uz opušten položaj i redovno disanje.|Finde einen angenehmen Rhythmus bei entspannter Haltung und gleichmäßiger Atmung.",
      "Adjust speed or resistance to the session target; reduce it if technique starts to deteriorate.|Prilagodite brzinu ili otpor cilju sesije; smanjite kada tehnika počne slabiti.|Passe Tempo oder Widerstand an das Trainingsziel an und reduziere bei nachlassender Technik.",
      "Ease down gradually before stopping and step away only when the equipment is still.|Postepeno usporite prije zaustavljanja i siđite tek kada sprava miruje.|Reduziere allmählich und steige erst ab, wenn das Gerät stillsteht.",
    ],
    "Avoid starting at maximum effort, gripping supports tightly or letting speed override control.|Ne počinjite maksimalnim naporom, ne stežite oslonce i ne dajte brzini prednost nad kontrolom.|Vermeide einen Start mit Maximalbelastung, verkrampftes Festhalten und Tempo auf Kosten der Kontrolle.",
    "Use the talk test for an easy session: you should be able to speak in sentences.|Za laganu sesiju koristite test razgovora: trebate moći govoriti u rečenicama.|Nutze für lockere Einheiten den Sprechtest: Ganze Sätze sollten möglich sein.",
  ),
  locomotion: family(
    "Clear a short lane and begin slowly enough to learn the footwork.|Oslobodite kratku stazu i počnite dovoljno sporo da usvojite rad stopala.|Räume eine kurze Bahn frei und beginne langsam genug, um die Schrittfolge zu lernen.",
    [
      "Adopt an athletic posture with softly bent knees and a relaxed upper body.|Zauzmite sportski stav s blago savijenim koljenima i opuštenim gornjim dijelom tijela.|Nimm eine sportliche Haltung mit leicht gebeugten Knien und entspanntem Oberkörper ein.",
      "Perform the named stepping or skipping pattern with light contacts under the body.|Izvodite navedeni obrazac koraka ili poskoka s laganim kontaktima ispod tijela.|Führe das genannte Schritt- oder Hüpfschema mit leichten Kontakten unter dem Körper aus.",
      "Slow down to turn or stop; repeat only while the footwork stays accurate.|Usporite za okret ili zaustavljanje; ponavljajte samo dok su koraci precizni.|Verlangsame zum Wenden oder Stoppen und wiederhole nur mit präziser Schrittfolge.",
    ],
    "Avoid looking down continuously, crossing the feet unintentionally or accelerating before coordination is stable.|Ne gledajte stalno dolje, ne ukrštajte stopala nenamjerno i ne ubrzavajte prije stabilne koordinacije.|Vermeide ständiges Hinunterschauen, unbeabsichtigtes Überkreuzen der Füße und Beschleunigen vor stabiler Koordination.",
    "Quiet feet first, speed second.|Prvo tihi koraci, zatim brzina.|Zuerst leise Füße, dann Tempo.",
  ),
  crawl: family(
    "Start on a clear floor with hands beneath shoulders and knees beneath hips.|Počnite na slobodnom podu s dlanovima ispod ramena i koljenima ispod kukova.|Beginne auf freiem Boden mit Händen unter den Schultern und Knien unter den Hüften.",
    [
      "Brace the trunk and set the knee height specified for the variation.|Učvrstite trup i postavite koljena na visinu navedenu za varijantu.|Spanne den Rumpf an und halte die Knie auf der für die Variante vorgesehenen Höhe.",
      "Move opposite hand and foot in small steps, keeping the pelvis level.|Pomjerajte suprotnu ruku i stopalo malim koracima uz ravnu karlicu.|Bewege gegenüberliegende Hand und Fuß in kleinen Schritten bei waagerechtem Becken.",
      "Stop to reset if the hips start rocking or the shoulders lose support.|Stanite i obnovite položaj ako se kukovi počnu njihati ili ramena izgube oslonac.|Halte an und richte dich neu aus, wenn die Hüfte schaukelt oder die Schultern den Halt verlieren.",
    ],
    "Avoid large steps, sagging through the waist or rushing over the hands.|Izbjegavajte velike korake, propadanje struka i žurbu preko dlanova.|Vermeide große Schritte, Durchhängen in der Taille und hastiges Verlagern über die Hände.",
    "Keep steps short enough that the trunk barely moves.|Koraci su dovoljno kratki da se trup jedva pomjera.|Halte die Schritte so kurz, dass sich der Rumpf kaum bewegt.",
  ),
  balance: family(
    "Stand near a stable hand support on a level surface before using an unstable surface.|Stanite blizu stabilnog oslonca za ruku na ravnoj podlozi prije nestabilne podloge.|Stelle dich auf ebenem Boden neben eine feste Handstütze, bevor du eine instabile Fläche nutzt.",
    [
      "Shift weight onto the working foot with a soft knee and level pelvis.|Prenesite težinu na radno stopalo uz blago savijeno koljeno i ravnu karlicu.|Verlagere das Gewicht auf den Standfuß mit weichem Knie und waagerechtem Becken.",
      "Hold the intended position or perform small controlled reaches without grabbing for balance.|Zadržite položaj ili pravite male kontrolisane dosege bez naglog hvatanja ravnoteže.|Halte die Position oder führe kleine kontrollierte Reichbewegungen aus, ohne nach dem Gleichgewicht zu greifen.",
      "Use the support and reset when needed; lower the other foot gently to finish.|Po potrebi koristite oslonac i obnovite položaj; lagano spustite drugo stopalo za završetak.|Nutze bei Bedarf die Stütze und beginne neu; setze zum Abschluss den anderen Fuß sanft ab.",
    ],
    "Do not lock the standing knee or close the eyes before the supported version is steady.|Ne zaključavajte stajno koljeno i ne zatvarajte oči prije stabilne podržane varijante.|Verriegele das Standknie nicht und schließe die Augen erst bei sicherer gestützter Variante.",
    "Look at a fixed point and keep the toes relaxed.|Gledajte fiksnu tačku i opustite prste stopala.|Blicke auf einen festen Punkt und entspanne die Zehen.",
  ),
  stretch: family(
    "Use a comfortable support and enter the named position gradually, with no bouncing.|Koristite udoban oslonac i postepeno zauzmite navedeni položaj, bez odskakivanja.|Nutze eine angenehme Stütze und nimm die genannte Position langsam ohne Federn ein.",
    [
      "Move toward a mild, local stretch in the target area, keeping adjacent joints supported.|Pomjerite se do blagog lokalnog istezanja ciljane regije, uz oslonjene susjedne zglobove.|Bewege dich bis zu einer milden lokalen Dehnung im Zielbereich und stütze benachbarte Gelenke ab.",
      "Breathe normally and keep the position gentle; do not seek pain or tingling.|Dišite normalno i zadržite blag položaj; ne tražite bol ili trnce.|Atme normal und halte die Position sanft; suche weder Schmerz noch Kribbeln.",
      "Release slowly and compare sides without forcing equal range.|Otpustite polako i uporedite strane bez forsiranja istog raspona.|Löse langsam und vergleiche die Seiten, ohne gleiche Beweglichkeit zu erzwingen.",
    ],
    "Avoid bouncing, pulling hard on a joint or using numbness as a sign of a productive stretch.|Ne odskačite, ne povlačite snažno zglob i ne tumačite utrnulost kao korisno istezanje.|Vermeide Federn, starkes Ziehen an einem Gelenk und die Deutung von Taubheit als wirksame Dehnung.",
    "A gentle stretch should ease when you reduce the position.|Blago istezanje treba popustiti kada smanjite položaj.|Eine sanfte Dehnung sollte nachlassen, wenn du die Position verringerst.",
  ),
  mobility: family(
    "Set a supported position for the named joint and begin with a small comfortable range.|Zauzmite podržan položaj za navedeni zglob i počnite malim udobnim rasponom.|Nimm für das genannte Gelenk eine gestützte Position ein und beginne mit einem kleinen angenehmen Bewegungsweg.",
    [
      "Move the target joint slowly while keeping the neighboring body segments as still as possible.|Polako pomjerajte ciljani zglob, dok susjedni dijelovi tijela ostaju što mirniji.|Bewege das Zielgelenk langsam und halte benachbarte Körperabschnitte möglichst ruhig.",
      "Pause before pain, pinching or compensation; use a smaller arc if needed.|Zaustavite prije bola, štipanja ili kompenzacije; po potrebi smanjite luk.|Stoppe vor Schmerz, Klemmen oder Ausweichbewegungen und verkleinere bei Bedarf den Bogen.",
      "Return through the same controlled range and repeat in the other direction when relevant.|Vratite se istim kontrolisanim rasponom i po potrebi ponovite u drugom smjeru.|Kehre im gleichen kontrollierten Bereich zurück und wiederhole gegebenenfalls in die andere Richtung.",
    ],
    "Do not force the end range or borrow movement from another joint to make the circle larger.|Ne forsirajte krajnji raspon i ne povećavajte krug pokretom drugog zgloba.|Erzwinge keine Endstellung und vergrößere den Kreis nicht durch Bewegung in einem anderen Gelenk.",
    "Move slowly enough to notice where control changes.|Krećite se dovoljno sporo da primijetite gdje se mijenja kontrola.|Bewege dich langsam genug, um Änderungen der Kontrolle wahrzunehmen.",
  ),
  rolling: family(
    "Place a roller or massage ball under the named muscle, using the limbs to control body weight.|Postavite valjak ili masažnu lopticu ispod navedenog mišića i udovima kontrolišite težinu tijela.|Lege Rolle oder Massageball unter den genannten Muskel und dosiere das Körpergewicht mit den Gliedmaßen.",
    [
      "Apply light pressure to the muscle belly, away from bones, joints and the front of the neck.|Blago pritisnite mišićni trbuh, dalje od kostiju, zglobova i prednje strane vrata.|Übe leichten Druck auf den Muskelbauch aus, fern von Knochen, Gelenken und der Vorderseite des Halses.",
      "Roll a short distance slowly or hold light pressure while breathing normally.|Polako pređite kratku udaljenost ili zadržite blag pritisak uz normalno disanje.|Rolle langsam über eine kurze Strecke oder halte leichten Druck bei normaler Atmung.",
      "Reduce pressure and come off the tool gradually; stop if there is numbness or sharp pain.|Smanjite pritisak i postepeno se odmaknite; stanite kod utrnulosti ili oštrog bola.|Verringere den Druck und löse dich langsam vom Hilfsmittel; stoppe bei Taubheit oder stechendem Schmerz.",
    ],
    "Avoid rolling directly over a joint, pressing into bruises or treating severe pain as necessary.|Ne prelazite direktno preko zgloba, ne pritiskajte modrice i ne smatrajte jak bol potrebnim.|Rolle nicht direkt über Gelenke, drücke nicht in Blutergüsse und betrachte starke Schmerzen nicht als notwendig.",
    "More pressure is not automatically more useful.|Veći pritisak nije automatski korisniji.|Mehr Druck ist nicht automatisch hilfreicher.",
  ),
  breathing: family(
    "Sit or lie comfortably in a quiet position with shoulders relaxed.|Udobno sjednite ili lezite u mirnom položaju s opuštenim ramenima.|Setze oder lege dich bequem hin und entspanne die Schultern.",
    [
      "Notice the natural rhythm of breathing without forcing a deep breath.|Primijetite prirodan ritam disanja bez forsiranja dubokog udaha.|Nimm den natürlichen Atemrhythmus wahr, ohne einen tiefen Atemzug zu erzwingen.",
      "Breathe gently into the lower ribs and allow a comfortable, unhurried exhale.|Blago udahnite u donja rebra i dopustite udoban, nežuran izdah.|Atme sanft in die unteren Rippen und lasse die Ausatmung angenehm und ruhig ausfließen.",
      "Return to ordinary breathing if you feel dizzy, strained or short of air.|Vratite se običnom disanju ako osjetite vrtoglavicu, napetost ili nedostatak zraka.|Kehre bei Schwindel, Anspannung oder Luftmangel zur normalen Atmung zurück.",
    ],
    "Avoid repeated oversized breaths or holding the breath through discomfort.|Izbjegavajte ponavljane prevelike udahe i zadržavanje daha kroz nelagodu.|Vermeide wiederholt übergroße Atemzüge und Luftanhalten bei Unbehagen.",
    "Comfort and a smooth exhale matter more than a particular count.|Udobnost i gladak izdah važniji su od određenog brojanja.|Wohlbefinden und eine ruhige Ausatmung sind wichtiger als eine bestimmte Zählzahl.",
  ),
  protocol: family(
    "This entry names a session or protocol rather than a single exercise. Review its purpose and the written session plan first.|Ovaj unos označava sesiju ili protokol, a ne jednu vježbu. Prvo pregledajte cilj i pisani plan sesije.|Dieser Eintrag bezeichnet eine Einheit oder ein Protokoll statt einer einzelnen Übung. Prüfe zuerst Ziel und schriftlichen Ablauf.",
    [
      "Choose the movements, work intervals and recovery periods from your agreed plan.|Izaberite pokrete, radne intervale i periode oporavka iz dogovorenog plana.|Wähle Bewegungen, Arbeitsintervalle und Erholungszeiten aus deinem vereinbarten Plan.",
      "Rehearse each movement at low effort before starting the full sequence.|Uvježbajte svaki pokret lagano prije početka cijele sekvence.|Übe jede Bewegung mit geringer Belastung, bevor du die vollständige Folge beginnst.",
      "Record the work actually completed; reduce or stop the session when technique or tolerance changes.|Zabilježite stvarno završeni rad; smanjite ili prekinite sesiju kada se promijene tehnika ili tolerancija.|Dokumentiere die tatsächlich absolvierte Arbeit und reduziere oder beende die Einheit bei veränderter Technik oder Verträglichkeit.",
    ],
    "Do not assume the label provides a complete individualized dose or that every round must be completed.|Ne pretpostavljajte da naziv daje potpunu individualnu dozu ili da se svaki krug mora završiti.|Nimm nicht an, dass die Bezeichnung eine vollständige individuelle Dosierung vorgibt oder jede Runde abgeschlossen werden muss.",
    "Preserve movement quality and distinguish planned work from completed work.|Očuvajte kvalitet pokreta i razlikujte planirani od završenog rada.|Erhalte die Bewegungsqualität und unterscheide geplante von abgeschlossener Arbeit.",
  ),
  clinical: family(
    "This clinical or named rehabilitation entry needs an individual plan. The label alone does not establish suitability, loading or stage of recovery.|Ovaj klinički ili imenovani rehabilitacijski unos zahtijeva individualni plan. Sam naziv ne određuje prikladnost, opterećenje ni fazu oporavka.|Dieser klinische oder benannte Rehabilitationseintrag benötigt einen individuellen Plan. Der Name allein legt Eignung, Belastung oder Heilungsphase nicht fest.",
    [
      "Confirm the exact movement, permitted range and any restrictions with the professional responsible for your care.|Potvrdite tačan pokret, dozvoljeni raspon i ograničenja sa stručnom osobom koja vodi vaš oporavak.|Kläre die genaue Bewegung, den erlaubten Bereich und Einschränkungen mit der behandelnden Fachperson.",
      "Use only the prescribed support, load and dose; do not substitute a generic fitness progression.|Koristite samo propisani oslonac, opterećenje i dozu; ne zamjenjujte ih opštom fitnes progresijom.|Nutze nur die verordnete Unterstützung, Last und Dosierung; ersetze sie nicht durch eine allgemeine Fitnesssteigerung.",
      "Record the response and follow the plan's stop or review criteria before progressing.|Zabilježite reakciju i pratite kriterije plana za prekid ili kontrolu prije napredovanja.|Dokumentiere die Reaktion und beachte vor einer Steigerung die Abbruch- und Kontrollkriterien des Plans.",
    ],
    "Do not infer a treatment prescription from an exercise title or use a library alternative as a clinical equivalent.|Ne zaključujte terapijski recept iz naziva vježbe i ne koristite alternativu iz biblioteke kao klinički ekvivalent.|Leite aus dem Übungsnamen keine Behandlung ab und behandle eine Bibliotheksalternative nicht als klinisch gleichwertig.",
    "Keep the agreed restrictions visible beside your session plan.|Držite dogovorena ograničenja vidljivim uz plan sesije.|Halte vereinbarte Einschränkungen neben dem Trainingsplan sichtbar.",
  ),
  thermal: family(
    "This is a heat or cold exposure entry, not a movement prescription. Check the facility instructions and your personal suitability first.|Ovo je izlaganje toploti ili hladnoći, a ne propisani pokret. Prvo provjerite upute objekta i ličnu prikladnost.|Dies ist ein Wärme- oder Kältereiz und keine Bewegungsanweisung. Prüfe zuerst die Regeln vor Ort und deine persönliche Eignung.",
    [
      "Use the supervised setting and exposure limits agreed for you; the library does not prescribe a temperature or duration.|Koristite nadzirane uslove i granice izlaganja dogovorene za vas; biblioteka ne propisuje temperaturu ni trajanje.|Nutze die betreute Umgebung und die für dich vereinbarten Grenzen; die Bibliothek gibt keine Temperatur oder Dauer vor.",
      "Enter and leave gradually with secure footing; keep an easy exit available.|Ulazite i izlazite postepeno uz siguran oslonac; zadržite mogućnost lakog izlaska.|Gehe mit sicherem Tritt langsam hinein und hinaus; halte einen einfachen Ausstieg frei.",
      "Leave immediately if you feel faint, unwell, confused or unable to tolerate the exposure.|Odmah izađite ako osjetite slabost, mučninu, zbunjenost ili nepodnošljivost izlaganja.|Verlasse den Bereich sofort bei Schwäche, Unwohlsein, Verwirrtheit oder mangelnder Verträglichkeit.",
    ],
    "Do not turn exposure into an endurance contest or use it while impaired.|Ne pretvarajte izlaganje u takmičenje izdržljivosti i ne koristite ga pod utjecajem opojnih sredstava.|Mache daraus keinen Ausdauerwettbewerb und nutze es nicht unter beeinträchtigenden Substanzen.",
    "A recovery label does not guarantee benefit or suitability.|Oznaka oporavka ne garantuje korist ni prikladnost.|Die Bezeichnung Erholung garantiert weder Nutzen noch Eignung.",
  ),
  olympic: family(
    "Learn this technical lift with qualified instruction and an unloaded implement before adding weight; clear the space around you.|Ovaj tehnički lift učite uz stručnu obuku i neopterećen rekvizit prije dodavanja tereta; oslobodite prostor oko sebe.|Lerne diese technische Hebung mit fachlicher Anleitung und unbeladenem Gerät, bevor du Gewicht ergänzt; räume den Bereich frei.",
    [
      "Set the grip and start position for the named lift; brace with the implement close to the body.|Postavite hvat i početni položaj za navedeni lift; učvrstite trup s rekvizitom blizu tijela.|Nimm Griff und Ausgangsposition der genannten Hebung ein und spanne bei körpernahem Gerät an.",
      "Drive through the legs and extend the hips, guiding the implement close rather than swinging it away.|Odgurnite se nogama i ispružite kukove; vodite rekvizit blizu umjesto zamaha od tijela.|Drücke aus den Beinen, strecke die Hüfte und führe das Gerät körpernah statt weit wegzuschwingen.",
      "Receive the implement in the position named by the variation, stabilize fully, then return under the taught method.|Prihvatite rekvizit u položaju navedenom za varijantu, potpuno stabilizujte i vratite naučenom tehnikom.|Fange das Gerät in der für die Variante genannten Position, stabilisiere vollständig und führe es mit der erlernten Methode zurück.",
    ],
    "Avoid learning a heavy catch from text alone, yanking with the arms or losing balance under the load.|Ne učite težak prihvat samo iz teksta, ne trzajte rukama i ne gubite ravnotežu ispod tereta.|Lerne ein schweres Umsetzen nicht allein aus Text, reiße nicht mit den Armen und verliere unter der Last nicht das Gleichgewicht.",
    "Keep early practice light, precise and low in fatigue.|Rane vježbe neka budu lagane, precizne i bez velikog umora.|Halte frühe Übungseinheiten leicht, präzise und ermüdungsarm.",
  ),
  swing: family(
    "Place the kettlebell in front of you and hinge to grip it with a long, braced spine.|Postavite girju ispred sebe i pregibom u kukovima uhvatite je uz izduženu, učvršćenu kičmu.|Stelle die Kettlebell vor dich und greife sie über eine Hüftbeuge mit langem, angespanntem Rücken.",
    [
      "Hike the bell back high between the thighs while keeping the knees softly bent.|Zamahnite girju nazad visoko između bedara uz blago savijena koljena.|Schwinge die Kugel hoch zwischen die Oberschenkel zurück; die Knie bleiben leicht gebeugt.",
      "Drive the hips forward to float the bell toward chest height; keep the arms as guides.|Potisnite kukove naprijed da girja odleti do blizine prsa; ruke samo vode.|Strecke die Hüfte, sodass die Kugel etwa auf Brusthöhe schwebt; die Arme führen nur.",
      "Let it return into the hip hinge, then park it on the floor with control to finish.|Dopustite povratak u pregib kuka, zatim za završetak kontrolisano odložite na pod.|Lasse sie in die Hüftbeuge zurückkehren und stelle sie zum Abschluss kontrolliert auf den Boden.",
    ],
    "Avoid squatting the swing, lifting mainly with the shoulders or leaning back at the top.|Ne pretvarajte zamah u čučanj, ne podižite prvenstveno ramenima i ne zabacujte se gore.|Vermeide eine Kniebeuge statt Hüftschwung, Heben aus den Schultern und Zurücklehnen am oberen Punkt.",
    "Snap the hips, then let the bell float.|Ispružite kukove, zatim pustite girju da lebdi.|Strecke die Hüfte zügig und lasse die Kugel schweben.",
  ),
  throw: family(
    "Use a suitable medicine ball and a clear throwing zone; confirm whether the ball rebounds.|Koristite odgovarajuću medicinku i slobodnu zonu bacanja; provjerite da li se lopta odbija.|Nutze einen geeigneten Medizinball und eine freie Wurfzone; prüfe, ob der Ball zurückspringt.",
    [
      "Set the ball in the start position named by the variation and brace with a stable base.|Postavite loptu u početni položaj naveden za varijantu i učvrstite stabilan oslonac.|Bringe den Ball in die genannte Startposition und spanne bei stabilem Stand an.",
      "Drive with the legs and trunk to throw in the intended direction, keeping the landing area clear.|Potisnite nogama i trupom za bacanje u predviđenom smjeru, uz slobodnu zonu doskoka lopte.|Erzeuge den Wurf in die vorgesehene Richtung aus Beinen und Rumpf; halte die Auftreffzone frei.",
      "Allow the ball to settle before retrieving; reset posture for each throw.|Dopustite lopti da se smiri prije uzimanja; obnovite položaj za svako bacanje.|Lasse den Ball vor dem Aufheben zur Ruhe kommen und richte dich für jeden Wurf neu aus.",
    ],
    "Do not stand over a rebounding ball or sacrifice trunk control for a heavier ball.|Ne stojte iznad lopte koja se odbija i ne žrtvujte kontrolu trupa radi teže lopte.|Stehe nicht über einem zurückspringenden Ball und opfere die Rumpfkontrolle nicht für einen schwereren Ball.",
    "Use a load you can accelerate cleanly and a target you can hit safely.|Koristite teret koji možete čisto ubrzati i metu koju možete sigurno pogoditi.|Nutze ein Gewicht, das du sauber beschleunigen kannst, und ein sicher erreichbares Ziel.",
  ),
  sled: family(
    "Clear a straight lane and select a sled load you can move without jerking.|Oslobodite ravnu stazu i izaberite teret sanjki koji možete pokrenuti bez trzaja.|Räume eine gerade Bahn frei und wähle eine Schlittenlast, die du ohne Ruck bewegen kannst.",
    [
      "Take the specified push handles or pulling straps and brace with a stable trunk.|Uhvatite navedene ručke za guranje ili trake za povlačenje i učvrstite trup.|Greife die vorgesehenen Schiebegriffe oder Zugschlaufen und stabilisiere den Rumpf.",
      "Move with short steps, keeping the direction of force aligned with your body.|Krećite se kratkim koracima, uz smjer sile poravnat s tijelom.|Bewege dich mit kurzen Schritten und richte die Kraft entlang des Körpers aus.",
      "Slow to a controlled stop before changing direction or releasing the handles.|Usporite do kontrolisanog zaustavljanja prije promjene smjera ili puštanja ručki.|Verlangsame kontrolliert, bevor du die Richtung wechselst oder die Griffe loslässt.",
    ],
    "Avoid rounding the back under strain, sprinting into slack straps or turning a loaded sled sharply.|Ne zaobljavajte leđa pod naporom, ne sprintajte u labave trake i ne okrećite opterećene sanjke naglo.|Vermeide einen runden Rücken unter Last, Anlaufen in lose Gurte und scharfe Wendungen mit beladenem Schlitten.",
    "Keep steps deliberate and resistance consistent.|Koraci su namjerni, a otpor ujednačen.|Halte die Schritte bewusst und den Widerstand gleichmäßig.",
  ),
  rope: family(
    "Choose a rope length and clear space appropriate for the drill; begin with low, relaxed jumps.|Izaberite dužinu užeta i slobodan prostor za zadatak; počnite niskim, opuštenim skokovima.|Wähle eine passende Seillänge und freie Fläche; beginne mit niedrigen entspannten Sprüngen.",
    [
      "Keep elbows near the sides and turn the rope mainly with the wrists.|Držite laktove uz tijelo i okrećite uže uglavnom zapešćima.|Halte die Ellenbogen seitlich nah und drehe das Seil überwiegend aus den Handgelenken.",
      "Jump only high enough to clear the rope and land softly under the body.|Skočite samo dovoljno da uže prođe i doskočite mekano ispod tijela.|Springe nur so hoch, dass das Seil passieren kann, und lande weich unter dem Körper.",
      "Maintain an even rhythm; stop and reset if timing or landing quality is lost.|Održavajte ravnomjeran ritam; stanite i obnovite položaj ako se izgubi tajming ili kvalitet doskoka.|Halte einen gleichmäßigen Rhythmus und setze bei Verlust von Timing oder Landetechnik neu an.",
    ],
    "Avoid large arm circles, high stiff jumps or continuing after repeated catches of the rope.|Ne pravite velike krugove rukama, visoke ukočene skokove i ne nastavite nakon ponavljanog zapinjanja užeta.|Vermeide große Armkreise, hohe steife Sprünge und Weitermachen bei wiederholtem Hängenbleiben.",
    "Small jumps, soft ankles and quiet shoulders.|Mali skokovi, mekani zglobovi i mirna ramena.|Kleine Sprünge, weiche Sprunggelenke und ruhige Schultern.",
  ),
  wrist: family(
    "Support the forearm with the wrist free to move and use a light load or gentle resistance.|Oslonite podlakticu, a zapešće ostavite slobodno za pokret; koristite lagan teret ili blag otpor.|Stütze den Unterarm ab, lasse das Handgelenk frei und nutze eine leichte Last oder sanften Widerstand.",
    [
      "Move the wrist through the named direction while the forearm remains supported.|Pomjerajte zapešće u navedenom smjeru uz oslonjenu podlakticu.|Bewege das Handgelenk in die genannte Richtung; der Unterarm bleibt gestützt.",
      "Pause within a comfortable range without gripping harder than needed.|Zadržite u udobnom rasponu bez jačeg stiskanja nego što je potrebno.|Halte im angenehmen Bereich kurz, ohne stärker als nötig zu greifen.",
      "Return slowly and keep the elbow and shoulder out of the movement.|Polako se vratite bez uključivanja lakta i ramena.|Kehre langsam zurück und halte Ellenbogen und Schulter aus der Bewegung heraus.",
    ],
    "Do not use momentum, force the end range or let a weight fall into the fingers.|Ne koristite zamah, ne forsirajte krajnji raspon i ne puštajte teret da padne u prste.|Vermeide Schwung, erzwungene Endstellungen und ein Fallenlassen des Gewichts in die Finger.",
    "Let the wrist move while the rest of the arm stays still.|Zapešće se kreće, a ostatak ruke ostaje miran.|Das Handgelenk bewegt sich, der übrige Arm bleibt ruhig.",
  ),
  shrug: family(
    "Hold the load at your sides or in the specified position with arms long and neck neutral.|Držite teret uz tijelo ili u navedenom položaju, s dugim rukama i neutralnim vratom.|Halte die Last seitlich oder in der genannten Position mit langen Armen und neutralem Nacken.",
    [
      "Lift the shoulders upward without bending the elbows.|Podignite ramena gore bez savijanja laktova.|Hebe die Schultern an, ohne die Ellenbogen zu beugen.",
      "Pause briefly without projecting the head forward.|Kratko zadržite bez isturanja glave naprijed.|Halte kurz, ohne den Kopf vorzuschieben.",
      "Lower the shoulders slowly to the natural starting position.|Polako spustite ramena u prirodan početni položaj.|Senke die Schultern langsam in die natürliche Ausgangsposition.",
    ],
    "Avoid rolling the shoulders in circles, bouncing the load or jutting the chin.|Ne kružite ramenima, ne odskačite teretom i ne isturajte bradu.|Vermeide Schulterkreisen, Federn mit der Last und ein vorgeschobenes Kinn.",
    "Move straight up and down with a quiet head.|Krećite se pravo gore i dolje uz mirnu glavu.|Bewege gerade auf und ab; der Kopf bleibt ruhig.",
  ),
} satisfies Record<string, FamilyGuide>;

export type GuideFamily = keyof typeof guideFamilies;
export const localized = (value: Text, language: Language) =>
  value[({ en: 0, bs: 1, de: 2 } as const)[language]];
export const guideLines = (values: Text[], language: Language) =>
  values.map((value) => localized(value, language));
