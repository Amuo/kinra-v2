// Full-message copy for branded Supabase Auth emails. No personal data or secrets.
export const emailLanguages = {
  bs: {
    common: {
      account: "TVOJ KINRA RAČUN",
      progress: "TVOJ NAPREDAK, NA JEDNOM MJESTU",
      fallback: "Dugme ne radi?",
      link: "Otvori sigurni link",
      train: "TRENIRAJ",
      fuel: "PREHRANA",
      recover: "OPORAVAK",
      momentum: "Mali koraci. Trajni zamah.",
      privateCode: "Čuvaj svoj kod privatnim.",
      privateLink: "Čuvaj svoj link za račun privatnim.",
    },
    confirmation: {
      subject: "Potvrdi svoju email adresu za Kinru",
      label: "DOBRO DOŠLI U KINRU",
      title: "Dobre navike.<br>Počinju ovdje.",
      intro:
        "Još jedan mali korak do novog poglavlja. Potvrdi email adresu i poveži trening, prehranu i oporavak.",
      action: "Potvrdi email adresu",
      note: "Malo sigurnosti, mnogo mogućnosti. Ovaj potvrdni link može se koristiti samo jednom.",
      footer: "Ako nisi kreirao/la Kinra račun, zanemari ovaj email.",
    },
    recovery: {
      subject: "Promijeni svoju Kinra lozinku",
      label: "OPORAVAK RAČUNA",
      title: "Vrati se<br>svom ritmu.",
      intro:
        "Vratimo te u aplikaciju. Odaberi novu lozinku i nastavi pratiti trening, prehranu i oporavak.",
      action: "Promijeni lozinku",
      note: "Samo za tebe. Važi jednom. Ako je link istekao, zatraži novi na Kinra ekranu za prijavu.",
      footer: "Ako ovo nisi zatražio/la, zanemari email. Tvoja lozinka ostaje ista.",
    },
    magic_link: {
      subject: "Tvoj Kinra link za prijavu",
      label: "TVOJ POVRATAK",
      title: "Spremni smo<br>kad i ti.",
      intro: "Koristi ovaj sigurni link za prijavu na Kinra račun i nastavi gdje je stalo.",
      action: "Prijavi se u Kinru",
      note: "Link važi jednom. Otvori ga na uređaju na kojem želiš koristiti Kinru.",
      footer: "Ako nisi zatražio/la link za prijavu, zanemari ovaj email.",
    },
    invite: {
      subject: "Pozivnica za Kinru",
      label: "MJESTO ZA TVOJ NAPREDAK",
      title: "Tvoja pozivnica<br>počinje ovdje.",
      intro:
        "Pozvan/a si da kreiraš Kinra račun. Otvori pozivnicu i započni s treningom, prehranom i oporavkom na jednom mjestu.",
      action: "Prihvati pozivnicu",
      note: "Ova pozivnica daje pristup računu. Ne daje treneru dozvolu za pregled tvojih zapisa.",
      footer: "Ako nisi očekivao/la ovu pozivnicu, zanemari email.",
    },
    email_change: {
      subject: "Potvrdi promjenu email adrese za Kinru",
      label: "PODACI RAČUNA",
      title: "Nova adresa.<br>Isti ti.",
      intro:
        "Zatražena je promjena email adrese za tvoj Kinra račun. Potvrdi ovu adresu za nastavak. Možda je potrebna potvrda iz oba sandučića.",
      action: "Potvrdi promjenu emaila",
      note: "Potvrdi samo ako je ovo tvoj zahtjev. Link važi jednom.",
      footer: "Ako nisi zatražio/la promjenu, ne koristi link. Provjeri sigurnost računa u Kinri.",
    },
    reauthentication: {
      subject: "Tvoj Kinra kod za provjeru",
      label: "BRZA SIGURNOSNA PROVJERA",
      title: "Jedna provjera.<br>I spremno je.",
      intro:
        "Unesi ovaj kod na Kinra ekranu za provjeru identiteta prije nastavka zatražene promjene računa.",
      note: "Koristi kod samo na ekranu za provjeru koji si otvorio/la. Ne dijeli ga ni s kim.",
      footer: "Ako nisi zatražio/la kod, zanemari ovaj email.",
    },
  },
  de: {
    common: {
      account: "DEIN KINRA-KONTO",
      progress: "DEIN FORTSCHRITT, AN EINEM ORT",
      fallback: "Der Button funktioniert nicht?",
      link: "Sicheren Link öffnen",
      train: "TRAINIEREN",
      fuel: "ERNÄHRUNG",
      recover: "ERHOLUNG",
      momentum: "Kleine Schritte. Dauerhafter Fortschritt.",
      privateCode: "Halte deinen Code geheim.",
      privateLink: "Halte deinen Kontolink geheim.",
    },
    confirmation: {
      subject: "Bestätige deine E-Mail-Adresse für Kinra",
      label: "WILLKOMMEN BEI KINRA",
      title: "Gute Gewohnheiten.<br>Beginnen hier.",
      intro:
        "Ein kleiner Schritt vor deinem nächsten Kapitel. Bestätige deine E-Mail-Adresse und verbinde Training, Ernährung und Erholung.",
      action: "E-Mail-Adresse bestätigen",
      note: "Ein wenig Sicherheit, viele Möglichkeiten. Dieser Bestätigungslink kann nur einmal verwendet werden.",
      footer: "Wenn du kein Kinra-Konto erstellt hast, kannst du diese E-Mail ignorieren.",
    },
    recovery: {
      subject: "Setze dein Kinra-Passwort zurück",
      label: "KONTO WIEDERHERSTELLEN",
      title: "Zurück in<br>deinen Rhythmus.",
      intro:
        "Zurück in die App: Wähle ein neues Passwort und kehre zu Training, Ernährung und Erholung zurück.",
      action: "Passwort zurücksetzen",
      note: "Nur für dich. Einmal gültig. Wenn der Link abgelaufen ist, fordere auf der Kinra-Anmeldeseite einen neuen an.",
      footer:
        "Wenn du dies nicht angefordert hast, ignoriere diese E-Mail. Dein Passwort bleibt unverändert.",
    },
    magic_link: {
      subject: "Dein Kinra-Anmeldelink",
      label: "DEIN WEG ZURÜCK",
      title: "Bereit, wenn<br>du es bist.",
      intro:
        "Melde dich über diesen sicheren Link bei deinem Kinra-Konto an und mache dort weiter, wo du aufgehört hast.",
      action: "Bei Kinra anmelden",
      note: "Dieser Link ist einmal gültig. Öffne ihn auf dem Gerät, auf dem du Kinra nutzen möchtest.",
      footer: "Wenn du keinen Anmeldelink angefordert hast, kannst du diese E-Mail ignorieren.",
    },
    invite: {
      subject: "Du bist zu Kinra eingeladen",
      label: "RAUM FÜR DEINEN FORTSCHRITT",
      title: "Deine Einladung<br>beginnt hier.",
      intro:
        "Du wurdest eingeladen, ein Kinra-Konto zu erstellen. Öffne deine Einladung und starte mit Training, Ernährung und Erholung an einem Ort.",
      action: "Einladung annehmen",
      note: "Diese Einladung ermöglicht den Kontozugang. Sie erteilt einem Coach keine Erlaubnis, deine Einträge einzusehen.",
      footer: "Wenn du diese Einladung nicht erwartet hast, kannst du diese E-Mail ignorieren.",
    },
    email_change: {
      subject: "Bestätige die E-Mail-Änderung für Kinra",
      label: "KONTODATEN",
      title: "Neue Adresse.<br>Gleiches Ich.",
      intro:
        "Du hast eine Änderung der E-Mail-Adresse für dein Kinra-Konto angefordert. Bestätige diese Adresse, um fortzufahren. Möglicherweise musst du die Änderung in beiden Postfächern bestätigen.",
      action: "E-Mail-Änderung bestätigen",
      note: "Bestätige nur, wenn du diese Änderung angefordert hast. Dieser Link ist einmal gültig.",
      footer:
        "Wenn du diese Änderung nicht angefordert hast, verwende diesen Link nicht. Prüfe die Sicherheit deines Kinra-Kontos.",
    },
    reauthentication: {
      subject: "Dein Kinra-Bestätigungscode",
      label: "KURZE SICHERHEITSPRÜFUNG",
      title: "Einmal prüfen.<br>Dann geht’s weiter.",
      intro:
        "Gib diesen Code in der Kinra-Bestätigungsansicht ein, um deine Identität vor der angeforderten Kontoänderung zu bestätigen.",
      note: "Verwende diesen Code nur in der von dir geöffneten Bestätigungsansicht. Teile ihn niemals mit anderen.",
      footer: "Wenn du diesen Code nicht angefordert hast, kannst du diese E-Mail ignorieren.",
    },
  },
};
