import type { LegalLocaleCatalog, LegalProviderLink } from './legalUi';

type EasternLegalLocale = 'sr' | 'sq' | 'ka' | 'zh-cn' | 'ja' | 'ko' | 'he' | 'ar';

const UPDATED_DATE = '2026-07-14';

function providerLinks(labels: readonly [string, string, string, string, string]): LegalProviderLink[] {
  return [
    { label: labels[0], url: 'https://www.cloudflare.com/privacypolicy/' },
    { label: labels[1], url: 'https://clerk.com/legal/privacy' },
    { label: labels[2], url: 'https://policies.google.com/privacy' },
    { label: labels[3], url: 'https://plausible.io/data-policy' },
    { label: labels[4], url: 'https://proton.me/legal/privacy' }
  ];
}

export const easternLegalCatalogs: Record<EasternLegalLocale, LegalLocaleCatalog> = {
  sr: {
    footer: {
      navigation: 'Pravne informacije i podrška',
      privacy: 'Privatnost',
      terms: 'Uslovi',
      contact: 'Kontakt',
      disclaimer: 'Samo pomoć za planiranje — nije pravni savet niti garancija ulaska. Proverite zvanične izvore.',
      copyright: '© 2026 SCHNGN'
    },
    privacy: {
      navLabel: 'Odeljci politike privatnosti',
      title: 'Politika privatnosti',
      metaDescription: 'Kako SCHNGN postupa sa lokalnim podacima o putovanjima, opcionom sinhronizacijom naloga, Google prijavom, analitikom, zahtevima za podršku i vašim izborima privatnosti.',
      intro: 'SCHNGN je osmišljen da računa planove putovanja bez obaveznog naloga. Ova politika objašnjava šta ostaje u vašem pregledaču, šta se obrađuje kada izaberete opcione onlajn funkcije i koje kontrole su vam dostupne.',
      updatedLabel: 'Poslednje ažuriranje',
      updatedDate: UPDATED_DATE,
      summaryTitle: 'Ukratko',
      summaryItems: [
        'Podaci o putovanjima gosta ostaju u vašem pregledaču, osim ako izričito izaberete sinhronizaciju naloga.',
        'Google prijava preko Clerk-a omogućava pravljenje i pristup opcionom SCHNGN nalogu; sinhronizacija putovanja ostaje izričit izbor.',
        'Plausible može primiti grube kategorije korišćenja i rezultata, ali nikada datume, oznake ili zemlje putovanja, imejl niti ID naloga.',
        'Možete izvesti trenutnu kopiju putovanja iz pregledača i izbrisati aktivni snimak putovanja sačuvan na nalogu.'
      ],
      sections: [
        {
          id: 'scope',
          title: '1. Na šta se ova politika odnosi',
          paragraphs: [
            'Ova politika obuhvata schngn.com, veb-aplikaciju SCHNGN i njene funkcije naloga, sinhronizacije, analitike i podrške. SCHNGN je kalkulator za planiranje i u okviru svojih uobičajenih funkcija ne traži pristup GPS-u, ne skenira pasoše i ne prikuplja brojeve viza niti dokumenata o boravku.'
          ]
        },
        {
          id: 'responsibility',
          title: '2. Ko je odgovoran i zašto se podaci obrađuju',
          paragraphs: [
            'SCHNGN upravlja sajtom schngn.com i odgovoran je za obradu specifičnu za aplikaciju koja je ovde opisana. Za pitanja o privatnosti pišite na support@schngn.com. Podatke o nalogu, sinhronizaciji i podršci obrađujemo da bismo pružili funkcije koje tražite; ograničene analitičke i bezbednosne podatke da bismo razumeli i zaštitili uslugu; podatke zasnovane na pristanku kada je pristanak potreban; i podatke potrebne za ispunjavanje primenljivih zakonskih obaveza.'
          ]
        },
        {
          id: 'guest-data',
          title: '3. Korišćenje bez naloga i skladištenje u pregledaču',
          paragraphs: [
            'Kada koristite SCHNGN kao gost, datumi i oznake putovanja, opcioni podaci o graničnim zemljama, rasponi boravka, status i rezultati proračuna ostaju u vašem pregledaču. Proračuni i nesačuvane simulacije izvršavaju se na vašem uređaju. Opciono pitanje o pasošu koristi samo zemlju izdavanja u privremenoj memoriji pregledača kako bi prikazalo obaveštenje o mogućem bilateralnom sporazumu; taj podatak se ne čuva uz putovanja niti šalje analitici. Skladište pregledača čuva i funkcionalna podešavanja kao što su jezik, odgovor o prethodnom putovanju i testna cenovna kategorija; javne datoteke aplikacije mogu biti keširane za rad van mreže. JSON rezervna kopija pravi se i čita lokalno pod vašom kontrolom i ne otprema se samim izvozom ili uvozom.'
          ],
          items: [
            'Podaci o putovanjima u pregledaču ostaju dok ih ne obrišete ili zamenite, ili dok ne obrišete podatke sajta.',
            'Kolačić za izbor jezika traje do godinu dana.',
            'Lokalne JSON rezervne kopije su obične datoteke; vi ste odgovorni za njihovo bezbedno čuvanje.'
          ]
        },
        {
          id: 'accounts-google',
          title: '4. Opcioni nalozi i Google prijava',
          paragraphs: [
            'Clerk se učitava na javnim stranicama kako bi proverio da li ste prijavljeni i može obrađivati neophodne podatke o sesiji, uređaju i mreži. Ako izaberete Google prijavu, Google šalje Clerk-u osnovne podatke o identitetu, kao što su stabilni identifikator, imejl adresa, ime ili profilna slika kada su dostupni, kao i OAuth odgovor. Clerk prema sopstvenoj politici upravlja akreditivima i tokenima provajdera i sesijom. SCHNGN prima nastalu Clerk sesiju i korisnički ID da prepozna aktivni nalog, prikaže status prijave i imejl i poveže putovanja koja izričito sačuvate. Uz putovanja za koja ste dali pristanak u Cloudflare D1 čuva se samo Clerk korisnički ID, a ne Google imejl, ime, profilna slika ili tokeni provajdera. SCHNGN ne traži pristup Gmail-u, Google Drive-u, Calendar-u, kontaktima, vašoj Google lozinci niti drugom Google sadržaju; ne prodaje Google korisničke podatke niti ih koristi za oglašavanje.'
          ]
        },
        {
          id: 'account-sync',
          title: '5. Opciona sinhronizacija putovanja, izvoz i brisanje',
          paragraphs: [
            'Dovršavanje jasno označene radnje registracije i čuvanja, ili zasebno uključivanje sinhronizacije dok ste prijavljeni, šalje trenutni provereni snimak putovanja u Cloudflare D1. Taj snimak sadrži potvrđeni Clerk korisnički ID, sve sačuvane podatke o putovanjima, metapodatke o reviziji i pristanku, kao i vremenske oznake. Kada se sinhronizacija uključi, kasnije sačuvane izmene ili uvozi mogu da se sinhronizuju. Radi podrške sinhronizaciji, lokalno skladište pregledača čuva i Clerk korisnički ID, reviziju servera, stanje sinhronizacije ili pauze i otisak putovanja; skladište sesije može privremeno čuvati nameru registracije i čuvanja. Ti metapodaci nisu uključeni u JSON izvoz i uklanjaju se izričitom radnjom „Odjavi se i obriši ovaj pregledač” ili brisanjem podataka sajta. JSON izvoz sadrži trenutnu kopiju putovanja iz pregledača, a ne sve podatke o identitetu, podršci, evidenciji ili podatke koje čuvaju pružaoci usluga. „Izbriši putovanja sačuvana na nalogu” uklanja aktivni D1 snimak, ali ne briše putovanja iz pregledača niti Clerk nalog. Brisanje Clerk naloga pokreće uklanjanje snimka i pravi jednosmerno heširanu zaštitnu oznaku o brisanju naloga koja se koristi 30 dana da zastarela sesija ne bi ponovo napravila podatke; posle toga se zanemaruje i uklanja pri pogodnoj narednoj operaciji čišćenja.'
          ]
        },
        {
          id: 'analytics',
          title: '6. Zbirna analitika',
          paragraphs: [
            'Na produkcionom sajtu Plausible može primati samo dozvoljene događaje, kao što su pregled stranice, pokretanje kalkulatora, dodavanje putovanja, pokretanje simulacije i interesovanje za otključavanje, zajedno sa grubim kategorijama kao što su raspon broja putovanja, ocena rezultata, raspon bezbedne rezerve, izvor ili testna cenovna kategorija. SCHNGN uklanja upitne nizove i heš delove URL-a i zabranjuje datume, oznake i zemlje putovanja, vremenske linije, izbor pasoša, imejl i identifikatore naloga. Plausible analitika je podešena bez analitičkih kolačića i bez automatskog praćenja obrazaca, preuzimanja i odlaznih veza. Plausible ipak može obrađivati uobičajene mrežne podatke radi izrade zbirne statistike.'
          ]
        },
        {
          id: 'support-security',
          title: '7. Podrška, bezbednost i tehnički podaci',
          paragraphs: [
            'Ako nas kontaktirate, SCHNGN šalje vrstu zahteva, opciono ime, imejl adresu, poruku i izabrani jezik preko Cloudflare imejl usluga u naše Proton sanduče za podršku. Turnstile token se zasebno proverava kod Cloudflare-a i ne uključuje se u imejl podršci. Istorija putovanja se nikada ne prilaže automatski, ali ćemo primiti sve što sami unesete u poruku. Cloudflare koristi IP adresu veze za ograničavanje učestalosti zahteva i Turnstile proveru, a pri isporuci i zaštiti sajta obrađuje uobičajene metapodatke o zahtevima, uređaju, pregledaču, bezbednosti i greškama. SCHNGN ne koristi Sentry, a njegovi aplikacioni dnevnici ne smeju sadržati tela putovanja, imejl adrese naloga niti Clerk korisničke ID-jeve.'
          ]
        },
        {
          id: 'providers',
          title: '8. Pružaoci usluga i međunarodna obrada',
          paragraphs: [
            'SCHNGN koristi Cloudflare za hosting, skladištenje, bezbednost i isporuku imejla; Clerk za identitet i sesije; Google samo kada izaberete Google prijavu; Plausible za ograničenu zbirnu analitiku; i Proton za sanduče podrške. Ovi pružaoci mogu obrađivati podatke u zemljama izvan vaše. Njihova objavljena obaveštenja opisuju lokacije, rokove čuvanja i zaštitne mere za prenose. Podatke delimo samo koliko je potrebno da pružimo ove funkcije, zaštitimo uslugu, sledimo vaša uputstva ili poštujemo zakon; lične podatke ne prodajemo.'
          ]
        },
        {
          id: 'retention-security',
          title: '9. Čuvanje, brisanje i bezbednost',
          paragraphs: [
            'Podaci u pregledaču ostaju dok ih vi ili vaš pregledač ne uklonite. Aktivna sinhronizovana putovanja ostaju dok se ne zamene ili izbrišu. Poruke u Proton sandučetu ostaju dok ih SCHNGN ne izbriše; trenutno ne obećavamo fiksni rok čuvanja. Treba ih ukloniti kada više nisu razumno potrebne za dalju komunikaciju, bezbednost, sporove ili pravne obaveze. Rezervne kopije pružalaca, operativni zapisi, podaci naloga i zbirna analitika prate podešene rokove čuvanja tih pružalaca i mogu nestati tek nakon određenog vremena od brisanja aktivnih podataka. SCHNGN koristi kontrole pristupa, proverene unose, autentifikovano vlasništvo i šifrovane HTTPS veze, ali nijedan način onlajn ili lokalnog čuvanja nije potpuno bezbedan.'
          ]
        },
        {
          id: 'rights-changes',
          title: '10. Vaši izbori, prava i izmene politike',
          paragraphs: [
            'Kalkulator možete koristiti bez naloga, obrisati podatke pregledača, izvesti putovanja iz pregledača, izbrisati aktivni snimak putovanja na nalogu ili upravljati Clerk nalogom i izbrisati ga. U zavisnosti od primenljivog prava, možete tražiti pristup, ispravku, brisanje, ograničenje ili prenosivost, uložiti prigovor na određenu obradu, povući pristanak kada je on osnov obrade i podneti pritužbu lokalnom organu za zaštitu podataka. Davanje podataka za nalog ili podršku je opciono, ali te funkcije bez njih ne mogu raditi. SCHNGN ne donosi automatizovane odluke sa pravnim dejstvom: rezultati kalkulatora su procene za planiranje. Ažuriraćemo ovu stranicu pre nego što suštinski promenimo način korišćenja podataka.'
          ]
        }
      ],
      contactTitle: 'Pitanja ili zahtevi u vezi sa privatnošću',
      contactBody: 'Pišite na support@schngn.com. Opišite zahtev bez slanja brojeva pasoša, vize ili drugih osetljivih dokumenata. Pre postupanja možemo morati da potvrdimo zahtev koji se odnosi na nalog.',
      contactLinkLabel: 'Kontaktirajte SCHNGN podršku',
      providerLinksTitle: 'Informacije pružalaca o privatnosti',
      providerLinks: providerLinks([
        'Cloudflare politika privatnosti',
        'Clerk politika privatnosti',
        'Google politika privatnosti',
        'Plausible politika podataka',
        'Proton politika privatnosti'
      ])
    },
    terms: {
      navLabel: 'Odeljci uslova',
      title: 'Uslovi korišćenja',
      metaDescription: 'Uslovi korišćenja SCHNGN kalkulatora za šengensko pravilo 90/180 dana, lokalnog čuvanja putovanja i opcionih funkcija naloga.',
      intro: 'Ovi Uslovi uređuju korišćenje sajta schngn.com i veb-aplikacije SCHNGN. Napisani su da očuvaju glavno obećanje proizvoda: koristan alat za planiranje sa jasnim ograničenjima i opcionim nalozima.',
      updatedLabel: 'Poslednje ažuriranje',
      updatedDate: UPDATED_DATE,
      summaryTitle: 'Najvažnije',
      summaryItems: [
        'Kalkulator je dostupan bez naloga; onlajn čuvanje putovanja je opciono.',
        'SCHNGN je pomoć za planiranje, a ne pravni savet niti garancija ulaska.',
        'Odgovorni ste za tačne datume i proveru zvaničnih izvora pre putovanja.',
        'Koristite uslugu zakonito i zaštitite pristup svakom nalogu.'
      ],
      sections: [
        {
          id: 'using-schngn',
          title: '1. Korišćenje SCHNGN-a',
          paragraphs: [
            'Korišćenjem SCHNGN-a prihvatate ove Uslove i Politiku privatnosti. Kalkulator možete koristiti kao gost. Ako napravite nalog, morate biti pravno sposobni da prihvatite ove Uslove; svako ko nema tu sposobnost treba da koristi SCHNGN samo uz roditelja, staratelja ili drugo ovlašćeno lice. Ako se ne slažete, nemojte koristiti uslugu.'
          ]
        },
        {
          id: 'planning-aid',
          title: '2. Samo pomoć za planiranje',
          paragraphs: [
            'SCHNGN procenjuje uobičajene kratke boravke prema šengenskom pravilu 90/180 dana. Nije pravni ni imigracioni savet i ne garantuje ulazak, zakonit boravak niti bilo koju odluku graničnog, viznog ili imigracionog organa. Možda ne uzima u obzir boravišne dozvole, dugoročne ili nacionalne vize, bilateralne sporazume o izuzeću, izuzetke prema državljanstvu, radni, studentski, azilantski ili status privremene zaštite, prelazna pravila niti službenu diskreciju. Obaveštenje vezano za pasoš ili zemlju o mogućem bilateralnom sporazumu samo je informativno i ne menja osnovni proračun niti utvrđuje da se produženje primenjuje. Pre rezervacije ili putovanja proverite svoj slučaj u zvaničnim izvorima i kod nadležnih organa.'
          ]
        },
        {
          id: 'responsibilities',
          title: '3. Vaše odgovornosti',
          paragraphs: [
            'Odgovorni ste da unesete potpune i tačne datume, protumačite rezultat u odnosu na sopstveni status, čuvate potrebne rezervne kopije i samostalno proveravate važeća pravila. Dokazi o ulasku i izlasku, uslovi vize i uputstva organa imaju prednost nad SCHNGN-om. Ne oslanjajte se na keširani, izvezeni ili ranije izračunati rezultat nakon promene planova ili primenljivih pravila.'
          ]
        },
        {
          id: 'storage-accounts',
          title: '4. Lokalno čuvanje, nalozi i sinhronizacija',
          paragraphs: [
            'Putovanja gosta čuvaju se u pregledaču i mogu biti izgubljena ako se obrišu podaci sajta, uređaj otkaže ili drugo lice promeni profil pregledača. Opcione naloge obezbeđuje Clerk. Označena radnja registracije i čuvanja ili zaseban izbor sinhronizacije ovlašćuje SCHNGN da sačuva provereni snimak putovanja za taj nalog. Zaštitite pristup nalogu, odjavite se i po potrebi obrišite podatke pregledača na deljenim uređajima, i pročitajte Politiku privatnosti za pojedinosti o izvozu, brisanju i pružaocima.'
          ]
        },
        {
          id: 'acceptable-use',
          title: '5. Prihvatljivo korišćenje',
          paragraphs: [
            'Nemojte zloupotrebljavati SCHNGN, ometati njegov rad ili bezbednost, ispitivati ili zaobilaziti kontrole pristupa, slati nezakonit ili štetan sadržaj, automatizovati zloupotrebljavajući saobraćaj, predstavljati se kao drugo lice, pristupati tuđem nalogu niti koristiti uslugu za prevaru ili nezakonito putovanje. Za razumno bezbednosno testiranje potrebna je prethodna pisana dozvola. Možemo ograničiti pristup kada je to potrebno da zaustavimo zloupotrebu, zaštitimo korisnike ili poštujemo zakon.'
          ]
        },
        {
          id: 'ownership-third-parties',
          title: '6. SCHNGN sadržaj i usluge trećih strana',
          paragraphs: [
            'Naziv SCHNGN, dizajn, softver i originalni sadržaj zaštićeni su primenljivim zakonima o intelektualnoj svojini. Ovi Uslovi daju vam ograničeno, opozivo i neisključivo pravo da koristite uslugu za lično planiranje; ne prenose vlasništvo. Veze ka zvaničnim izvorima, Clerk, Google, Cloudflare, Plausible i druge usluge trećih strana imaju sopstvene uslove i politike. SCHNGN nije institucija EU i Evropska unija ga ne podržava niti sertifikuje.'
          ]
        },
        {
          id: 'availability-changes',
          title: '7. Dostupnost i izmene',
          paragraphs: [
            'Nastojimo da SCHNGN bude tačan i dostupan, ali usluga može biti prekinuta, odložena ili izmenjena. Funkcije, pružaoci, podržana pravila ili besplatna dostupnost mogu se promeniti, a sadržaj možemo ispraviti ili ukloniti. Kada je to razumno moguće, bitne promene koje utiču na podatke sačuvane na nalogu biće objašnjene pre stupanja na snagu. Čuvajte nezavisnu evidenciju za svaku važnu odluku o putovanju.'
          ]
        },
        {
          id: 'disclaimers-liability',
          title: '8. Odricanja i odgovornost',
          paragraphs: [
            'U najvećoj meri dozvoljenoj zakonom, SCHNGN se pruža „takav kakav jeste” i „prema dostupnosti”, bez obećanja da će svaki rezultat, izvor, pružalac ili funkcija uvek biti potpuni, aktuelni ili bez greške. SCHNGN nije odgovoran za odluke organa, odbijen ulazak, prekoračenje boravka, kazne, putne troškove, propuštene rezervacije, izgubljene lokalne podatke niti posredne gubitke nastale oslanjanjem na uslugu tamo gde zakon dopušta takvo ograničenje. Ništa u ovim Uslovima ne isključuje odgovornost koja se zakonski ne može isključiti niti ograničava obavezna prava potrošača.'
          ]
        },
        {
          id: 'ending-rights-contact',
          title: '9. Prestanak korišćenja, primenljiva prava i kontakt',
          paragraphs: [
            'SCHNGN možete prestati da koristite u bilo kom trenutku i možete obrisati lokalne podatke, aktivni sinhronizovani snimak putovanja, te zasebno upravljati Clerk nalogom ili ga izbrisati. Možemo obustaviti zloupotrebljavajuće ili nezakonito korišćenje. Primenljivo obavezno pravo i zaštita potrošača ostaju na snazi; ovi Uslovi ne biraju sud niti ukidaju prava koja vam zakon daje. Uslove možemo ažurirati kada se usluga ili pravni zahtevi promene, uz datum prikazan iznad. Pitanja možete poslati na support@schngn.com.'
          ]
        }
      ],
      contactTitle: 'Pitanja o ovim Uslovima',
      contactBody: 'Pišite na support@schngn.com ako imate pitanje o SCHNGN-u ili ovim Uslovima. Podrška za proizvod ne može odlučivati o vašem imigracionom statusu niti pružati pravni savet.',
      contactLinkLabel: 'Kontaktirajte SCHNGN podršku'
    }
  },
  sq: {
    footer: {
      navigation: 'Informacion ligjor dhe mbështetje',
      privacy: 'Privatësia',
      terms: 'Kushtet',
      contact: 'Kontakti',
      disclaimer: 'Vetëm ndihmë për planifikim — jo këshillë ligjore dhe as garanci hyrjeje. Verifikoni me burime zyrtare.',
      copyright: '© 2026 SCHNGN'
    },
    privacy: {
      navLabel: 'Seksionet e politikës së privatësisë',
      title: 'Politika e privatësisë',
      metaDescription: 'Si i trajton SCHNGN të dhënat lokale të udhëtimeve, sinkronizimin opsional të llogarisë, hyrjen me Google, analitikën, kërkesat për mbështetje dhe zgjedhjet tuaja të privatësisë.',
      intro: 'SCHNGN është projektuar për të llogaritur planet e udhëtimit pa kërkuar llogari. Kjo politikë shpjegon çfarë mbetet në shfletuesin tuaj, çfarë përpunohet kur zgjidhni funksione opsionale në internet dhe çfarë kontrollesh keni në dispozicion.',
      updatedLabel: 'Përditësimi i fundit',
      updatedDate: UPDATED_DATE,
      summaryTitle: 'Versioni i shkurtër',
      summaryItems: [
        'Të dhënat e udhëtimeve si vizitor mbeten në shfletuesin tuaj, përveçse kur zgjidhni shprehimisht sinkronizimin e llogarisë.',
        'Hyrja me Google përmes Clerk mundëson krijimin dhe qasjen në një llogari opsionale SCHNGN; sinkronizimi i udhëtimeve mbetet një zgjedhje e shprehur.',
        'Plausible mund të marrë kategori të përgjithshme të përdorimit dhe rezultateve, por kurrë datat, etiketat ose vendet e udhëtimeve, emailin apo ID-në e llogarisë suaj.',
        'Mund të eksportoni kopjen aktuale të udhëtimeve nga shfletuesi dhe të fshini pamjen aktive të udhëtimeve të ruajtur në llogarinë tuaj.'
      ],
      sections: [
        {
          id: 'scope',
          title: '1. Çfarë mbulon kjo politikë',
          paragraphs: [
            'Kjo politikë mbulon schngn.com, aplikacionin ueb SCHNGN dhe funksionet e tij për llogarinë, sinkronizimin, analitikën dhe mbështetjen. SCHNGN është një llogaritës planifikimi dhe, si pjesë e funksioneve të zakonshme, nuk kërkon qasje në GPS, nuk skanon pasaporta dhe nuk mbledh numra vizash apo dokumentesh lejeqëndrimi.'
          ]
        },
        {
          id: 'responsibility',
          title: '2. Kush është përgjegjës dhe pse përpunohen të dhënat',
          paragraphs: [
            'SCHNGN operon schngn.com dhe është përgjegjës për përpunimin specifik të aplikacionit që përshkruhet këtu. Për pyetje rreth privatësisë kontaktoni support@schngn.com. Ne përpunojmë të dhëna të llogarisë, sinkronizimit dhe mbështetjes për të ofruar funksionet që kërkoni; të dhëna të kufizuara analitike dhe sigurie për të kuptuar dhe mbrojtur shërbimin; të dhëna të bazuara në pëlqim kur kërkohet pëlqimi; dhe të dhëna të nevojshme për të përmbushur detyrimet ligjore të zbatueshme.'
          ]
        },
        {
          id: 'guest-data',
          title: '3. Përdorimi si vizitor dhe ruajtja në shfletues',
          paragraphs: [
            'Kur përdorni SCHNGN si vizitor, datat dhe etiketat e udhëtimeve, konteksti opsional i vendeve kufitare, periudhat e qëndrimit, statusi dhe rezultatet e llogaritjeve mbeten në shfletuesin tuaj. Llogaritjet dhe simulimet e paruajtura kryhen në pajisjen tuaj. Pyetja opsionale për pasaportën përdor vetëm vendin lëshues në kujtesën e përkohshme të shfletuesit për të shfaqur një njoftim për një marrëveshje të mundshme dypalëshe; ajo nuk ruhet me udhëtimet dhe nuk dërgohet në analitikë. Hapësira e shfletuesit ruan edhe preferenca funksionale, si gjuha, përgjigjja për udhëtimet e mëparshme dhe një kategori testuese çmimi; skedarët publikë të aplikacionit mund të ruhen në memorien e përkohshme për përdorim pa internet. Një kopje rezervë JSON krijohet dhe lexohet lokalisht nën kontrollin tuaj dhe nuk ngarkohet vetëm pse e eksportoni ose importoni.'
          ],
          items: [
            'Të dhënat e udhëtimeve në shfletues mbeten derisa t’i pastroni, t’i zëvendësoni ose të pastroni të dhënat e sajtit.',
            'Cookie i preferencës së gjuhës zgjat deri në një vit.',
            'Kopjet rezervë lokale JSON janë skedarë të thjeshtë; ju jeni përgjegjës për ruajtjen e tyre të sigurt.'
          ]
        },
        {
          id: 'accounts-google',
          title: '4. Llogaritë opsionale dhe hyrja me Google',
          paragraphs: [
            'Clerk ngarkohet në faqet publike për të kontrolluar nëse jeni të identifikuar dhe mund të përpunojë të dhëna thelbësore të seancës, pajisjes dhe rrjetit. Nëse zgjidhni hyrjen me Google, Google i dërgon Clerk të dhëna bazë identiteti, si identifikuesi i qëndrueshëm, adresa e emailit, emri ose fotografia e profilit kur janë të disponueshme, si edhe përgjigjen OAuth. Clerk menaxhon kredencialet dhe tokenët e ofruesit dhe seancën sipas politikës së vet. SCHNGN merr seancën dhe ID-në e përdoruesit Clerk që rezultojnë, për të identifikuar llogarinë aktive, për të shfaqur statusin e hyrjes dhe emailin dhe për të lidhur udhëtimet që ruani shprehimisht. Në Cloudflare D1 ruhet me udhëtimet e miratuara vetëm ID-ja e përdoruesit Clerk, jo emaili, emri, fotografia e profilit e Google ose tokenët e ofruesit. SCHNGN nuk kërkon qasje në Gmail, Google Drive, Calendar, kontakte, fjalëkalimin tuaj të Google ose përmbajtje tjetër të Google; nuk shet të dhëna të përdoruesit të Google dhe nuk i përdor për reklamim.'
          ]
        },
        {
          id: 'account-sync',
          title: '5. Sinkronizimi opsional i udhëtimeve, eksporti dhe fshirja',
          paragraphs: [
            'Përfundimi i një veprimi të shënuar qartë për regjistrim dhe ruajtje, ose aktivizimi më vete i sinkronizimit ndërsa jeni të identifikuar, dërgon pamjen aktuale të vërtetuar të udhëtimeve në Cloudflare D1. Kjo pamje përfshin ID-në e verifikuar të përdoruesit Clerk, hollësitë e plota të udhëtimeve të ruajtura, metadatat e rishikimit dhe pëlqimit dhe vulat kohore. Pasi aktivizohet, ndryshimet ose importet e ruajtura më vonë mund të sinkronizohen. Për të mbështetur sinkronizimin, hapësira lokale e shfletuesit ruan gjithashtu ID-në e përdoruesit Clerk, rishikimin e serverit, gjendjen e sinkronizimit ose pezullimit dhe gjurmën e udhëtimeve; hapësira e seancës mund të ruajë përkohësisht qëllimin për regjistrim dhe ruajtje. Këto metadata nuk përfshihen në eksportin JSON dhe hiqen me veprimin e shprehur “Dil dhe pastro këtë shfletues” ose duke pastruar të dhënat e sajtit. Eksporti JSON përmban kopjen aktuale të udhëtimeve të shfletuesit, jo të gjitha të dhënat e identitetit, mbështetjes, regjistrave ose të dhënat që mbahen nga ofruesit. “Fshi udhëtimet e ruajtura në llogari” heq pamjen aktive D1, por nuk fshin udhëtimet e shfletuesit ose llogarinë Clerk. Fshirja e llogarisë Clerk nis pastrimin e pamjes dhe krijon një shenjë mbrojtëse me hash njëdrejtimësh të fshirjes së llogarisë që përdoret për 30 ditë për të penguar rikrijimin nga një seancë e vjetërsuar; më pas shpërfillet dhe pastrohet kur paraqitet një mundësi e mëvonshme pastrimi.'
          ]
        },
        {
          id: 'analytics',
          title: '6. Analitika e përmbledhur',
          paragraphs: [
            'Në sajtin në prodhim, Plausible mund të marrë ngjarje të lejuara si shikimi i faqes, nisja e llogaritësit, shtimi i udhëtimit, ekzekutimi i simulimit dhe interesi për zhbllokim, bashkë me kategori të përgjithshme si intervali i numrit të udhëtimeve, rezultati, intervali i rezervës së sigurt, burimi ose kategoria testuese e çmimit. SCHNGN heq vargjet e pyetjeve dhe fragmentet pas # dhe ndalon datat, etiketat dhe vendet e udhëtimeve, vijat kohore, zgjedhjen e pasaportës, emailin dhe identifikuesit e llogarisë. Analitika Plausible është konfiguruar pa cookie analitike dhe pa gjurmim automatik të formularëve, shkarkimeve dhe lidhjeve dalëse. Plausible mund të përpunojë ende informacion të zakonshëm të rrjetit për të prodhuar statistika të përmbledhura.'
          ]
        },
        {
          id: 'support-security',
          title: '7. Mbështetja, siguria dhe të dhënat teknike',
          paragraphs: [
            'Nëse na kontaktoni, SCHNGN dërgon llojin e kërkesës, emrin opsional, adresën e emailit, mesazhin dhe gjuhën e zgjedhur përmes shërbimeve të emailit Cloudflare në kutinë tonë të mbështetjes në Proton. Tokeni Turnstile verifikohet veçmas me Cloudflare dhe nuk përfshihet në emailin e mbështetjes. Historia e udhëtimeve nuk bashkëngjitet kurrë automatikisht, megjithëse do të marrim çdo gjë që shkruani në mesazh. Cloudflare përdor adresën IP të lidhjes për kufizimin e kërkesave dhe verifikimin Turnstile dhe përpunon metadatën e zakonshme të kërkesës, pajisjes, shfletuesit, sigurisë dhe gabimeve kur shpërndan dhe mbron sajtin. SCHNGN nuk përdor Sentry dhe regjistrat e aplikacionit të tij nuk duhet të përmbajnë përmbajtjen e udhëtimeve, emailet e llogarive ose ID-të e përdoruesve Clerk.'
          ]
        },
        {
          id: 'providers',
          title: '8. Ofruesit e shërbimit dhe përpunimi ndërkombëtar',
          paragraphs: [
            'SCHNGN përdor Cloudflare për hostim, ruajtje, siguri dhe shpërndarje emaili; Clerk për identitetin dhe seancat; Google vetëm kur zgjidhni hyrjen me Google; Plausible për analitikë të kufizuar dhe të përmbledhur; dhe Proton për kutinë e mbështetjes. Këta ofrues mund t’i përpunojnë të dhënat në vende jashtë vendit tuaj. Njoftimet e tyre të publikuara përshkruajnë vendndodhjet, afatet e ruajtjes dhe masat mbrojtëse të transferimeve. Ne i ndajmë të dhënat vetëm aq sa nevojitet për të ofruar këto funksione, për të mbrojtur shërbimin, për të ndjekur udhëzimet tuaja ose për të respektuar ligjin; nuk shesim të dhëna personale.'
          ]
        },
        {
          id: 'retention-security',
          title: '9. Ruajtja, fshirja dhe siguria',
          paragraphs: [
            'Të dhënat në shfletues mbeten derisa t’i hiqni ju ose shfletuesi juaj. Udhëtimet aktive të sinkronizuara mbeten derisa të zëvendësohen ose fshihen. Mesazhet në kutinë Proton mbeten derisa SCHNGN t’i fshijë; aktualisht nuk premtojmë një afat të caktuar ruajtjeje. Ato duhet të hiqen kur nuk nevojiten më në mënyrë të arsyeshme për komunikim vijues, siguri, mosmarrëveshje ose detyrime ligjore. Kopjet rezervë të ofruesve, regjistrat operativë, të dhënat e llogarisë dhe analitika e përmbledhur ndjekin afatet e konfiguruara të ruajtjes së ofruesve dhe mund të kërkojnë kohë për të skaduar pasi fshihen të dhënat aktive. SCHNGN përdor kontrolle qasjeje, hyrje të vërtetuara, pronësi të autentifikuar dhe lidhje të enkriptuara HTTPS, por asnjë mënyrë ruajtjeje në internet ose lokale nuk është plotësisht e sigurt.'
          ]
        },
        {
          id: 'rights-changes',
          title: '10. Zgjedhjet, të drejtat dhe ndryshimet e politikës',
          paragraphs: [
            'Mund ta përdorni llogaritësin pa llogari, të pastroni të dhënat e shfletuesit, të eksportoni udhëtimet e shfletuesit, të fshini pamjen aktive të udhëtimeve të llogarisë ose të menaxhoni dhe fshini llogarinë Clerk. Në varësi të ligjit të zbatueshëm, mund të kërkoni qasje, korrigjim, fshirje, kufizim ose transferueshmëri, të kundërshtoni përpunime të caktuara, të tërhiqni pëlqimin kur pëlqimi është baza dhe të ankoheni te autoriteti juaj vendor i mbrojtjes së të dhënave. Dhënia e të dhënave të llogarisë ose mbështetjes është opsionale, por këto funksione nuk mund të punojnë pa to. SCHNGN nuk merr vendime të automatizuara me rëndësi ligjore: rezultatet e llogaritësit janë vlerësime planifikimi. Ne do ta përditësojmë këtë faqe përpara se të ndryshojmë në mënyrë thelbësore përdorimin e të dhënave.'
          ]
        }
      ],
      contactTitle: 'Pyetje ose kërkesa për privatësinë',
      contactBody: 'Dërgoni email në support@schngn.com. Përshkruani kërkesën pa dërguar numra pasaporte, vize ose dokumentesh të tjera të ndjeshme. Mund të na duhet të verifikojmë një kërkesë për llogari para se të veprojmë.',
      contactLinkLabel: 'Kontaktoni mbështetjen e SCHNGN',
      providerLinksTitle: 'Informacioni i privatësisë i ofruesve',
      providerLinks: providerLinks([
        'Politika e privatësisë e Cloudflare',
        'Politika e privatësisë e Clerk',
        'Politika e privatësisë e Google',
        'Politika e të dhënave e Plausible',
        'Politika e privatësisë e Proton'
      ])
    },
    terms: {
      navLabel: 'Seksionet e kushteve',
      title: 'Kushtet e përdorimit',
      metaDescription: 'Kushtet për përdorimin e llogaritësit SCHNGN për rregullin Shengen 90/180 ditë, ruajtjen lokale të udhëtimeve dhe funksionet opsionale të llogarisë.',
      intro: 'Këto Kushte rregullojnë përdorimin tuaj të schngn.com dhe aplikacionit ueb SCHNGN. Ato janë shkruar për të ruajtur premtimin kryesor të produktit: një mjet i dobishëm planifikimi me kufij të qartë dhe llogari opsionale.',
      updatedLabel: 'Përditësimi i fundit',
      updatedDate: UPDATED_DATE,
      summaryTitle: 'Pikat thelbësore',
      summaryItems: [
        'Llogaritësi është i disponueshëm pa llogari; ruajtja e udhëtimeve në internet është opsionale.',
        'SCHNGN është ndihmë për planifikim, jo këshillë ligjore dhe as garanci hyrjeje.',
        'Ju jeni përgjegjës për datat e sakta dhe për kontrollimin e burimeve zyrtare para udhëtimit.',
        'Përdoreni shërbimin në mënyrë të ligjshme dhe mbajeni të sigurt çdo qasje në llogari.'
      ],
      sections: [
        {
          id: 'using-schngn',
          title: '1. Përdorimi i SCHNGN',
          paragraphs: [
            'Duke përdorur SCHNGN, pranoni këto Kushte dhe Politikën e privatësisë. Mund ta përdorni llogaritësin si vizitor. Nëse krijoni llogari, duhet të keni aftësinë ligjore për t’i pranuar këto Kushte; kushdo që nuk e ka këtë aftësi duhet ta përdorë SCHNGN vetëm me një prind, kujdestar ose person tjetër të autorizuar. Nëse nuk jeni dakord, mos e përdorni shërbimin.'
          ]
        },
        {
          id: 'planning-aid',
          title: '2. Vetëm ndihmë për planifikim',
          paragraphs: [
            'SCHNGN vlerëson qëndrimet e zakonshme afatshkurtra sipas rregullit Shengen 90/180 ditë. Nuk është këshillë ligjore ose emigracioni dhe as garanci hyrjeje, qëndrimi të ligjshëm ose ndonjë vendimi nga autoritetet kufitare, të vizave apo emigracionit. Mund të mos marrë parasysh lejet e qëndrimit, vizat afatgjata ose kombëtare, marrëveshjet dypalëshe të përjashtimit, përjashtimet sipas shtetësisë, statusin e punës, studimit, azilit ose mbrojtjes së përkohshme, kalimet e rregullave apo diskrecionin zyrtar. Një njoftim specifik për pasaportën ose vendin rreth një marrëveshjeje të mundshme dypalëshe është vetëm informues dhe nuk ndryshon llogaritjen bazë ose përcakton se zbatohet një zgjatje. Verifikoni situatën tuaj me burime zyrtare dhe autoritetet përkatëse para rezervimit ose udhëtimit.'
          ]
        },
        {
          id: 'responsibilities',
          title: '3. Përgjegjësitë tuaja',
          paragraphs: [
            'Ju jeni përgjegjës për futjen e datave të plota dhe të sakta, interpretimin e rezultatit në dritën e statusit tuaj, ruajtjen e kopjeve rezervë që ju duhen dhe kontrollimin e pavarur të rregullave aktuale. Provat e hyrjes dhe daljes, kushtet e vizës dhe udhëzimet e autoriteteve kanë përparësi ndaj SCHNGN. Mos u mbështetni te një rezultat i ruajtur në memorien e përkohshme, i eksportuar ose i llogaritur më parë pasi planet ose rregullat e zbatueshme ndryshojnë.'
          ]
        },
        {
          id: 'storage-accounts',
          title: '4. Ruajtja lokale, llogaritë dhe sinkronizimi',
          paragraphs: [
            'Udhëtimet si vizitor ruhen në shfletuesin tuaj dhe mund të humbin nëse pastrohen të dhënat e sajtit, pajisja dështon ose një person tjetër ndryshon profilin e shfletuesit. Llogaritë opsionale ofrohen përmes Clerk. Një veprim i shënuar regjistrimi dhe ruajtjeje ose një zgjedhje e veçantë sinkronizimi autorizon SCHNGN të ruajë pamjen e vërtetuar të udhëtimeve për atë llogari. Mbajeni të sigurt qasjen në llogari, dilni dhe pastroni të dhënat e shfletuesit në pajisjet e përbashkëta kur është e përshtatshme dhe rishikoni Politikën e privatësisë për hollësi rreth eksportit, fshirjes dhe ofruesve.'
          ]
        },
        {
          id: 'acceptable-use',
          title: '5. Përdorimi i pranueshëm',
          paragraphs: [
            'Mos e keqpërdorni SCHNGN, mos ndërhyni në funksionimin ose sigurinë e tij, mos testoni ose anashkaloni kontrollet e qasjes, mos dërgoni materiale të paligjshme ose të dëmshme, mos automatizoni trafik abuziv, mos u paraqitni si dikush tjetër, mos hyni në një llogari tjetër dhe mos e përdorni shërbimin për të lehtësuar mashtrimin ose udhëtimin e paligjshëm. Testimi i arsyeshëm i sigurisë kërkon leje paraprake me shkrim. Mund të kufizojmë qasjen e nevojshme për të ndalur keqpërdorimin, për të mbrojtur përdoruesit ose për të respektuar ligjin.'
          ]
        },
        {
          id: 'ownership-third-parties',
          title: '6. Përmbajtja e SCHNGN dhe shërbimet e palëve të treta',
          paragraphs: [
            'Emri, dizajni, softueri dhe përmbajtja origjinale e SCHNGN mbrohen nga ligjet e zbatueshme të pronësisë intelektuale. Këto Kushte ju japin një të drejtë të kufizuar, të revokueshme dhe joekskluzive për ta përdorur shërbimin për planifikim personal; ato nuk transferojnë pronësinë. Lidhjet me burime zyrtare, Clerk, Google, Cloudflare, Plausible dhe shërbime të tjera të palëve të treta kanë kushtet dhe politikat e tyre. SCHNGN nuk është institucion i BE-së dhe nuk mbështetet ose certifikohet nga Bashkimi Evropian.'
          ]
        },
        {
          id: 'availability-changes',
          title: '7. Disponueshmëria dhe ndryshimet',
          paragraphs: [
            'Synojmë ta mbajmë SCHNGN të saktë dhe të disponueshëm, por shërbimi mund të ndërpritet, vonohet ose ndryshohet. Funksionet, ofruesit, rregullat e mbështetura ose disponueshmëria falas mund të ndryshojnë dhe ne mund të korrigjojmë ose heqim përmbajtje. Kur është arsyeshëm e mundur, ndryshimet thelbësore që prekin të dhënat e ruajtura në llogari do të shpjegohen para se të hyjnë në fuqi. Mbani regjistra të pavarur për çdo vendim udhëtimi që ka rëndësi për ju.'
          ]
        },
        {
          id: 'disclaimers-liability',
          title: '8. Mohimet dhe përgjegjësia',
          paragraphs: [
            'Në masën më të plotë të lejuar nga ligji, SCHNGN ofrohet “siç është” dhe “sipas disponueshmërisë”, pa premtim se çdo rezultat, burim, ofrues ose funksion do të jetë gjithmonë i plotë, aktual ose pa gabime. SCHNGN nuk përgjigjet për vendimet e autoriteteve, hyrjen e refuzuar, tejkalimin e qëndrimit, gjobat, kostot e udhëtimit, rezervimet e humbura, të dhënat lokale të humbura ose humbjet e tërthorta të shkaktuara nga mbështetja te shërbimi, kur ligji e lejon këtë kufizim. Asgjë në këto Kushte nuk përjashton përgjegjësi që ligjërisht nuk mund të përjashtohet dhe nuk kufizon të drejtat e detyrueshme të konsumatorit.'
          ]
        },
        {
          id: 'ending-rights-contact',
          title: '9. Përfundimi i përdorimit, të drejtat e zbatueshme dhe kontakti',
          paragraphs: [
            'Mund të ndaloni përdorimin e SCHNGN në çdo kohë dhe mund të pastroni të dhënat lokale, të fshini pamjen aktive të sinkronizuar të udhëtimeve dhe të menaxhoni ose fshini më vete llogarinë Clerk. Mund të pezullojmë përdorimin abuziv ose të paligjshëm. Ligji i detyrueshëm i zbatueshëm dhe mbrojtjet e konsumatorit mbeten në fuqi; këto Kushte nuk zgjedhin gjykatë dhe nuk heqin të drejtat që ju jep ligji. Mund t’i përditësojmë këto Kushte kur ndryshon shërbimi ose kërkesat ligjore, me datën e treguar më sipër. Pyetjet mund të dërgohen në support@schngn.com.'
          ]
        }
      ],
      contactTitle: 'Pyetje rreth këtyre Kushteve',
      contactBody: 'Kontaktoni support@schngn.com nëse keni pyetje rreth SCHNGN ose këtyre Kushteve. Mbështetja e produktit nuk mund të vendosë statusin tuaj të emigracionit ose të japë këshillë ligjore.',
      contactLinkLabel: 'Kontaktoni mbështetjen e SCHNGN'
    }
  },
  ka: {
    footer: {
      navigation: 'სამართლებრივი ინფორმაცია და მხარდაჭერა',
      privacy: 'კონფიდენციალურობა',
      terms: 'პირობები',
      contact: 'კონტაქტი',
      disclaimer: 'მხოლოდ დაგეგმვის დამხმარე საშუალება — არა იურიდიული კონსულტაცია ან ქვეყანაში შესვლის გარანტია. გადაამოწმეთ ოფიციალურ წყაროებში.',
      copyright: '© 2026 SCHNGN'
    },
    privacy: {
      navLabel: 'კონფიდენციალურობის პოლიტიკის სექციები',
      title: 'კონფიდენციალურობის პოლიტიკა',
      metaDescription: 'როგორ ამუშავებს SCHNGN ბრაუზერში შენახულ მოგზაურობის მონაცემებს, ანგარიშის არასავალდებულო სინქრონიზაციას, Google-ით შესვლას, ანალიტიკას, მხარდაჭერის მოთხოვნებსა და თქვენს კონფიდენციალურობის არჩევანს.',
      intro: 'SCHNGN შექმნილია ისე, რომ მოგზაურობის გეგმები ანგარიშის მოთხოვნის გარეშე გამოთვალოს. ეს პოლიტიკა განმარტავს, რა რჩება თქვენს ბრაუზერში, რა მუშავდება არასავალდებულო ონლაინფუნქციების არჩევისას და რა კონტროლის საშუალებები გაქვთ.',
      updatedLabel: 'ბოლო განახლება',
      updatedDate: UPDATED_DATE,
      summaryTitle: 'მოკლედ',
      summaryItems: [
        'სტუმრის მოგზაურობის დეტალები თქვენს ბრაუზერში რჩება, თუ ანგარიშის სინქრონიზაციას პირდაპირ არ აირჩევთ.',
        'Clerk-ის მეშვეობით Google-ით შესვლა არასავალდებულო SCHNGN ანგარიშის შექმნასა და მასზე წვდომას უზრუნველყოფს; მოგზაურობების სინქრონიზაცია კვლავ მკაფიო არჩევანია.',
        'Plausible-მა შეიძლება მიიღოს გამოყენებისა და შედეგების ზოგადი კატეგორიები, მაგრამ არასოდეს — მოგზაურობის თარიღები, ნიშნულები, ქვეყნები, ელფოსტა ან ანგარიშის ID.',
        'შეგიძლიათ ბრაუზერში არსებული მოგზაურობების ასლი გაიტანოთ და ანგარიშზე შენახული აქტიური მოგზაურობის სურათი წაშალოთ.'
      ],
      sections: [
        {
          id: 'scope',
          title: '1. რას მოიცავს ეს პოლიტიკა',
          paragraphs: [
            'ეს პოლიტიკა ვრცელდება schngn.com-ზე, SCHNGN ვებაპლიკაციასა და მის ანგარიშის, სინქრონიზაციის, ანალიტიკისა და მხარდაჭერის ფუნქციებზე. SCHNGN დაგეგმვის კალკულატორია და ჩვეულებრივი ფუნქციების ფარგლებში არ ითხოვს GPS-ზე წვდომას, არ ასკანერებს პასპორტებს და არ აგროვებს ვიზის ან ბინადრობის დოკუმენტების ნომრებს.'
          ]
        },
        {
          id: 'responsibility',
          title: '2. ვინ არის პასუხისმგებელი და რატომ მუშავდება მონაცემები',
          paragraphs: [
            'SCHNGN მართავს schngn.com-ს და პასუხისმგებელია აქ აღწერილ, აპლიკაციასთან დაკავშირებულ მონაცემთა დამუშავებაზე. კონფიდენციალურობის საკითხებზე მოგვწერეთ support@schngn.com-ზე. ანგარიშის, სინქრონიზაციისა და მხარდაჭერის მონაცემებს ვამუშავებთ თქვენ მიერ მოთხოვნილი ფუნქციების მისაწოდებლად; შეზღუდულ ანალიტიკურ და უსაფრთხოების მონაცემებს — სერვისის გასაგებად და დასაცავად; თანხმობაზე დაფუძნებულ მონაცემებს — როცა თანხმობა აუცილებელია; და მონაცემებს, რომლებიც მოქმედი სამართლებრივი ვალდებულებების შესასრულებლად გვჭირდება.'
          ]
        },
        {
          id: 'guest-data',
          title: '3. სტუმრად გამოყენება და ბრაუზერში შენახვა',
          paragraphs: [
            'როდესაც SCHNGN-ს სტუმრად იყენებთ, მოგზაურობის თარიღები, ნიშნულები, საზღვრის ქვეყნების არასავალდებულო კონტექსტი, ყოფნის პერიოდები, სტატუსი და გამოთვლის შედეგები თქვენს ბრაუზერში რჩება. გამოთვლები და შეუნახავი სიმულაციები თქვენს მოწყობილობაზე სრულდება. პასპორტის არასავალდებულო კითხვა ბრაუზერის დროებით მეხსიერებაში მხოლოდ გამცემი ქვეყნის მონაცემს იყენებს, რათა შესაძლო ორმხრივი შეთანხმების შეტყობინება აჩვენოს; ის მოგზაურობებთან ერთად არ ინახება და ანალიტიკაში არ იგზავნება. ბრაუზერის საცავი ასევე ინახავს ფუნქციურ პარამეტრებს, მაგალითად ენას, წინა მოგზაურობის შესახებ პასუხსა და სატესტო ფასის კატეგორიას; აპლიკაციის საჯარო ფაილები ოფლაინგამოყენებისთვის შეიძლება დაკეშირდეს. JSON სარეზერვო ასლი თქვენს კონტროლქვეშ ადგილობრივად იქმნება და იკითხება და მხოლოდ ექსპორტის ან იმპორტის გამო არ იტვირთება სერვერზე.'
          ],
          items: [
            'ბრაუზერში შენახული მოგზაურობის მონაცემები რჩება, სანამ არ გაასუფთავებთ, ჩაანაცვლებთ ან საიტის მონაცემებს არ წაშლით.',
            'ენის პარამეტრის cookie ერთ წლამდე მოქმედებს.',
            'ადგილობრივი JSON სარეზერვო ასლები ჩვეულებრივი ფაილებია; მათ უსაფრთხო შენახვაზე თქვენ ხართ პასუხისმგებელი.'
          ]
        },
        {
          id: 'accounts-google',
          title: '4. არასავალდებულო ანგარიშები და Google-ით შესვლა',
          paragraphs: [
            'Clerk საჯარო გვერდებზე იტვირთება იმის შესამოწმებლად, შესული ხართ თუ არა, და შეიძლება დაამუშაოს სესიის, მოწყობილობისა და ქსელის აუცილებელი მონაცემები. თუ Google-ით შესვლას აირჩევთ, Google Clerk-ს უგზავნის პირადობის ძირითად მონაცემებს, როგორიცაა სტაბილური იდენტიფიკატორი, ელფოსტის მისამართი, სახელი ან პროფილის სურათი, როცა ხელმისაწვდომია, და OAuth პასუხს. Clerk საკუთარი პოლიტიკის შესაბამისად მართავს პროვაიდერის ავტორიზაციის მონაცემებსა და ტოკენებს და სესიას. SCHNGN იღებს მიღებულ Clerk სესიასა და მომხმარებლის ID-ს, რათა ამოიცნოს აქტიური ანგარიში, აჩვენოს შესვლის სტატუსი და ელფოსტა და დაუკავშიროს თქვენ მიერ მკაფიოდ შენახული მოგზაურობები. Cloudflare D1-ში თანხმობით შენახულ მოგზაურობებთან ერთად ინახება მხოლოდ Clerk მომხმარებლის ID და არა Google ელფოსტა, სახელი, პროფილის სურათი ან პროვაიდერის ტოკენები. SCHNGN არ ითხოვს Gmail-ზე, Google Drive-ზე, Calendar-ზე, კონტაქტებზე, თქვენს Google პაროლზე ან Google-ის სხვა კონტენტზე წვდომას; არ ყიდის Google მომხმარებლის მონაცემებს და არ იყენებს მათ რეკლამისთვის.'
          ]
        },
        {
          id: 'account-sync',
          title: '5. მოგზაურობების არასავალდებულო სინქრონიზაცია, ექსპორტი და წაშლა',
          paragraphs: [
            'მკაფიოდ მონიშნული რეგისტრაციისა და შენახვის მოქმედების დასრულება, ან სისტემაში შესვლის შემდეგ სინქრონიზაციის ცალკე ჩართვა, მოგზაურობების მიმდინარე, შემოწმებულ სურათს Cloudflare D1-ში აგზავნის. ეს სურათი მოიცავს დადასტურებულ Clerk მომხმარებლის ID-ს, შენახული მოგზაურობების სრულ დეტალებს, რევიზიისა და თანხმობის მეტამონაცემებს და დროის ნიშნულებს. ჩართვის შემდეგ მოგვიანებით შენახული ცვლილებები ან იმპორტები შეიძლება დასინქრონდეს. სინქრონიზაციის უზრუნველსაყოფად ბრაუზერის ადგილობრივი საცავი ასევე ინახავს Clerk მომხმარებლის ID-ს, სერვერის რევიზიას, სინქრონიზაციის ან დაპაუზების მდგომარეობას და მოგზაურობების ციფრულ ანაბეჭდს; სესიის საცავმა შეიძლება დროებით შეინახოს რეგისტრაციისა და შენახვის განზრახვა. ეს მეტამონაცემები JSON ექსპორტში არ შედის და იშლება მკაფიო მოქმედებით „გამოსვლა და ამ ბრაუზერის გასუფთავება“ ან საიტის მონაცემების გასუფთავებით. JSON ექსპორტი შეიცავს ბრაუზერში მოგზაურობების მიმდინარე ასლს და არა პირადობის, მხარდაჭერის, ჟურნალების ან პროვაიდერებთან შენახულ ყველა მონაცემს. „ანგარიშზე შენახული მოგზაურობების წაშლა“ აქტიურ D1 სურათს შლის, მაგრამ ბრაუზერის მოგზაურობებს ან Clerk ანგარიშს არ აუქმებს. Clerk ანგარიშის წაშლა იწვევს სურათის გასუფთავებას და ქმნის ანგარიშის წაშლის ცალმხრივად ჰეშირებულ დამცავ ჩანაწერს, რომელიც 30 დღის განმავლობაში გამოიყენება მოძველებული სესიის მიერ მონაცემების ხელახლა შექმნის შესაჩერებლად; შემდეგ ის უგულებელყოფილია და მომდევნო ხელსაყრელი გასუფთავების ოპერაციისას იშლება.'
          ]
        },
        {
          id: 'analytics',
          title: '6. შეჯამებული ანალიტიკა',
          paragraphs: [
            'პროდუქციულ საიტზე Plausible-მა შეიძლება მიიღოს მხოლოდ ნებადართული მოვლენები, როგორიცაა გვერდის ნახვა, კალკულატორის დაწყება, მოგზაურობის დამატება, სიმულაციის გაშვება და განბლოკვისადმი ინტერესი, ასევე ზოგადი კატეგორიები — მოგზაურობების რაოდენობის დიაპაზონი, შედეგის შეფასება, უსაფრთხო მარაგის დიაპაზონი, წყარო ან სატესტო ფასის კატეგორია. SCHNGN შლის მოთხოვნის სტრიქონებსა და ჰეშ-ფრაგმენტებს და კრძალავს მოგზაურობის თარიღებს, ნიშნულებს, ქვეყნებს, დროის ხაზებს, პასპორტის არჩევანს, ელფოსტასა და ანგარიშის იდენტიფიკატორებს. Plausible ანალიტიკა კონფიგურირებულია ანალიტიკური cookie-ების და ფორმების, ჩამოტვირთვებისა და გარე ბმულების ავტომატური თვალთვალის გარეშე. შეჯამებული სტატისტიკის შესაქმნელად Plausible-მა შეიძლება მაინც დაამუშაოს ჩვეულებრივი ქსელური ინფორმაცია.'
          ]
        },
        {
          id: 'support-security',
          title: '7. მხარდაჭერა, უსაფრთხოება და ტექნიკური მონაცემები',
          paragraphs: [
            'თუ დაგვიკავშირდებით, SCHNGN თქვენი მოთხოვნის ტიპს, არასავალდებულო სახელს, ელფოსტის მისამართს, შეტყობინებასა და არჩეულ ენას Cloudflare-ის ელფოსტის სერვისებით ჩვენს Proton მხარდაჭერის საფოსტო ყუთში აგზავნის. Turnstile ტოკენი Cloudflare-თან ცალკე მოწმდება და მხარდაჭერის ელფოსტაში არ შედის. მოგზაურობის ისტორია ავტომატურად არასოდეს ერთვის, თუმცა მივიღებთ ყველაფერს, რასაც შეტყობინებაში თავად ჩაწერთ. Cloudflare დაკავშირების IP მისამართს მოთხოვნების სიხშირის შეზღუდვისა და Turnstile შემოწმებისთვის იყენებს და საიტის მიწოდებისა და დაცვისას ამუშავებს მოთხოვნის, მოწყობილობის, ბრაუზერის, უსაფრთხოებისა და შეცდომების ჩვეულებრივ მეტამონაცემებს. SCHNGN არ იყენებს Sentry-ს და მის აპლიკაციის ჟურნალებში არ უნდა მოხვდეს მოგზაურობის სრული ჩანაწერები, ანგარიშის ელფოსტა ან Clerk მომხმარებლის ID-ები.'
          ]
        },
        {
          id: 'providers',
          title: '8. სერვისის პროვაიდერები და საერთაშორისო დამუშავება',
          paragraphs: [
            'SCHNGN იყენებს Cloudflare-ს ჰოსტინგის, შენახვის, უსაფრთხოებისა და ელფოსტის მიწოდებისთვის; Clerk-ს — პირადობისა და სესიებისთვის; Google-ს — მხოლოდ Google-ით შესვლის არჩევისას; Plausible-ს — შეზღუდული შეჯამებული ანალიტიკისთვის; და Proton-ს — მხარდაჭერის საფოსტო ყუთისთვის. ამ პროვაიდერებმა შეიძლება მონაცემები თქვენი ქვეყნის ფარგლებს გარეთ დაამუშაონ. მათი გამოქვეყნებული შეტყობინებები აღწერს ადგილმდებარეობებს, შენახვის ვადებსა და გადაცემის დამცავ ზომებს. მონაცემებს ვაზიარებთ მხოლოდ იმდენად, რამდენადაც საჭიროა ამ ფუნქციების მისაწოდებლად, სერვისის დასაცავად, თქვენი მითითებების შესასრულებლად ან კანონის დასაცავად; პირად მონაცემებს არ ვყიდით.'
          ]
        },
        {
          id: 'retention-security',
          title: '9. შენახვა, წაშლა და უსაფრთხოება',
          paragraphs: [
            'ბრაუზერის მონაცემები რჩება, სანამ თქვენ ან თქვენი ბრაუზერი არ წაშლით. აქტიური დასინქრონებული მოგზაურობები რჩება მათ ჩანაცვლებამდე ან წაშლამდე. Proton საფოსტო ყუთში შეტყობინებები რჩება, სანამ SCHNGN არ წაშლის; ამჟამად ფიქსირებულ შენახვის ვადას არ ვპირდებით. ისინი უნდა წაიშალოს, როცა შემდგომი მიმოწერის, უსაფრთხოების, დავების ან სამართლებრივი ვალდებულებებისთვის გონივრულად საჭირო აღარ არის. პროვაიდერების სარეზერვო ასლები, საოპერაციო ჩანაწერები, ანგარიშის მონაცემები და შეჯამებული ანალიტიკა მათი კონფიგურირებული შენახვის ვადებით იმართება და აქტიური მონაცემების წაშლის შემდეგ მათ ამოწურვას შეიძლება დრო დასჭირდეს. SCHNGN იყენებს წვდომის კონტროლს, შემოწმებულ შენატანებს, ავთენტიფიცირებულ მფლობელობასა და დაშიფრულ HTTPS კავშირებს, თუმცა ონლაინ ან ადგილობრივი შენახვის არც ერთი მეთოდი არ არის სრულიად უსაფრთხო.'
          ]
        },
        {
          id: 'rights-changes',
          title: '10. თქვენი არჩევანი, უფლებები და პოლიტიკის ცვლილებები',
          paragraphs: [
            'შეგიძლიათ კალკულატორი ანგარიშის გარეშე გამოიყენოთ, ბრაუზერის მონაცემები გაასუფთავოთ, ბრაუზერის მოგზაურობები გაიტანოთ, ანგარიშზე მოგზაურობების აქტიური სურათი წაშალოთ ან Clerk ანგარიში მართოთ და წაშალოთ. მოქმედი კანონის მიხედვით, შეიძლება გქონდეთ წვდომის, გასწორების, წაშლის, შეზღუდვის ან გადატანის მოთხოვნის, გარკვეულ დამუშავებაზე უარის თქმის, თანხმობის გაუქმების, როცა დამუშავების საფუძველი თანხმობაა, და ადგილობრივ მონაცემთა დაცვის ორგანოში საჩივრის შეტანის უფლება. ანგარიშის ან მხარდაჭერის მონაცემების მიწოდება არასავალდებულოა, თუმცა შესაბამისი ფუნქციები მათ გარეშე ვერ იმუშავებს. SCHNGN არ იღებს სამართლებრივად მნიშვნელოვან ავტომატიზებულ გადაწყვეტილებებს: კალკულატორის შედეგები დაგეგმვის შეფასებებია. მონაცემთა გამოყენების არსებით ცვლილებამდე ამ გვერდს განვაახლებთ.'
          ]
        }
      ],
      contactTitle: 'კონფიდენციალურობის კითხვები ან მოთხოვნები',
      contactBody: 'მოგვწერეთ support@schngn.com-ზე. აღწერეთ მოთხოვნა პასპორტის, ვიზის ან სხვა სენსიტიური დოკუმენტის ნომრების გამოგზავნის გარეშე. მოქმედებამდე შეიძლება ანგარიშთან დაკავშირებული მოთხოვნის გადამოწმება დაგვჭირდეს.',
      contactLinkLabel: 'დაუკავშირდით SCHNGN მხარდაჭერას',
      providerLinksTitle: 'პროვაიდერების ინფორმაცია კონფიდენციალურობის შესახებ',
      providerLinks: providerLinks([
        'Cloudflare-ის კონფიდენციალურობის პოლიტიკა',
        'Clerk-ის კონფიდენციალურობის პოლიტიკა',
        'Google-ის კონფიდენციალურობის პოლიტიკა',
        'Plausible-ის მონაცემთა პოლიტიკა',
        'Proton-ის კონფიდენციალურობის პოლიტიკა'
      ])
    },
    terms: {
      navLabel: 'პირობების სექციები',
      title: 'გამოყენების პირობები',
      metaDescription: 'SCHNGN შენგენის 90/180 დღის კალკულატორის, მოგზაურობების ადგილობრივი შენახვისა და ანგარიშის არასავალდებულო ფუნქციების გამოყენების პირობები.',
      intro: 'ეს პირობები არეგულირებს schngn.com-ისა და SCHNGN ვებაპლიკაციის გამოყენებას. ისინი დაწერილია პროდუქტის მთავარი დაპირების შესანარჩუნებლად: სასარგებლო დაგეგმვის საშუალება გამჭვირვალე შეზღუდვებითა და არასავალდებულო ანგარიშებით.',
      updatedLabel: 'ბოლო განახლება',
      updatedDate: UPDATED_DATE,
      summaryTitle: 'მთავარი საკითხები',
      summaryItems: [
        'კალკულატორი ხელმისაწვდომია ანგარიშის გარეშე; მოგზაურობების ონლაინ შენახვა არასავალდებულოა.',
        'SCHNGN დაგეგმვის დამხმარე საშუალებაა და არა იურიდიული კონსულტაცია ან ქვეყანაში შესვლის გარანტია.',
        'თქვენ ხართ პასუხისმგებელი ზუსტ თარიღებსა და მოგზაურობამდე ოფიციალური წყაროების შემოწმებაზე.',
        'გამოიყენეთ სერვისი კანონიერად და დაიცავით ანგარიშზე წვდომა.'
      ],
      sections: [
        {
          id: 'using-schngn',
          title: '1. SCHNGN-ის გამოყენება',
          paragraphs: [
            'SCHNGN-ის გამოყენებით ეთანხმებით ამ პირობებსა და კონფიდენციალურობის პოლიტიკას. კალკულატორი შეგიძლიათ სტუმრად გამოიყენოთ. თუ ანგარიშს ქმნით, სამართლებრივად უნდა შეგეძლოთ ამ პირობებზე დათანხმება; ვისაც ეს უნარი არ აქვს, SCHNGN მხოლოდ მშობელთან, მეურვესთან ან სხვა უფლებამოსილ პირთან ერთად უნდა გამოიყენოს. თუ არ ეთანხმებით, ნუ გამოიყენებთ სერვისს.'
          ]
        },
        {
          id: 'planning-aid',
          title: '2. მხოლოდ დაგეგმვის დამხმარე საშუალება',
          paragraphs: [
            'SCHNGN აფასებს ჩვეულებრივ მოკლევადიან ყოფნას შენგენის 90/180 დღის წესის მიხედვით. ის არ არის იურიდიული ან საიმიგრაციო კონსულტაცია და არ იძლევა ქვეყანაში შესვლის, კანონიერი ყოფნის ან სასაზღვრო, სავიზო თუ საიმიგრაციო ორგანოს რაიმე გადაწყვეტილების გარანტიას. შესაძლოა არ ითვალისწინებდეს ბინადრობის ნებართვებს, გრძელვადიან ან ეროვნულ ვიზებს, ორმხრივ უვიზო შეთანხმებებს, მოქალაქეობასთან დაკავშირებულ გამონაკლისებს, სამუშაოს, სწავლის, თავშესაფრის ან დროებითი დაცვის სტატუსს, წესების გარდამავალ პერიოდებს ან ოფიციალურ დისკრეციას. პასპორტთან ან ქვეყანასთან დაკავშირებული შეტყობინება შესაძლო ორმხრივ შეთანხმებაზე მხოლოდ საინფორმაციოა და არ ცვლის ძირითად გამოთვლას ან არ ადგენს, რომ გახანგრძლივება თქვენზე ვრცელდება. დაჯავშნამდე ან მოგზაურობამდე გადაამოწმეთ თქვენი მდგომარეობა ოფიციალურ წყაროებსა და შესაბამის ორგანოებთან.'
          ]
        },
        {
          id: 'responsibilities',
          title: '3. თქვენი პასუხისმგებლობა',
          paragraphs: [
            'თქვენ ხართ პასუხისმგებელი სრული და ზუსტი თარიღების შეყვანაზე, საკუთარი სტატუსის გათვალისწინებით შედეგის განმარტებაზე, საჭირო სარეზერვო ასლების შენახვასა და მოქმედი წესების დამოუკიდებლად შემოწმებაზე. ქვეყანაში შესვლისა და გასვლის მტკიცებულებებს, ვიზის პირობებსა და ორგანოების მითითებებს SCHNGN-ზე უპირატესი ძალა აქვს. გეგმების ან მოქმედი წესების შეცვლის შემდეგ ნუ დაეყრდნობით დაკეშილ, ექსპორტირებულ ან ადრე გამოთვლილ შედეგს.'
          ]
        },
        {
          id: 'storage-accounts',
          title: '4. ადგილობრივი შენახვა, ანგარიშები და სინქრონიზაცია',
          paragraphs: [
            'სტუმრის მოგზაურობები თქვენს ბრაუზერში ინახება და შეიძლება დაიკარგოს, თუ საიტის მონაცემები გასუფთავდება, მოწყობილობა მწყობრიდან გამოვა ან სხვა პირი ბრაუზერის პროფილს შეცვლის. არასავალდებულო ანგარიშებს Clerk უზრუნველყოფს. მონიშნული რეგისტრაციისა და შენახვის მოქმედება ან სინქრონიზაციის ცალკე არჩევანი SCHNGN-ს უფლებას აძლევს, ამ ანგარიშისთვის მოგზაურობების შემოწმებული სურათი შეინახოს. დაიცავით ანგარიშზე წვდომა, საერთო მოწყობილობაზე საჭიროებისას გამოდით და ბრაუზერის მონაცემები გაასუფთავეთ, ხოლო ექსპორტის, წაშლისა და პროვაიდერების დეტალებისთვის გაეცანით კონფიდენციალურობის პოლიტიკას.'
          ]
        },
        {
          id: 'acceptable-use',
          title: '5. მისაღები გამოყენება',
          paragraphs: [
            'ნუ გამოიყენებთ SCHNGN-ს ბოროტად, ხელს ნუ შეუშლით მის მუშაობას ან უსაფრთხოებას, ნუ გამოიკვლევთ ან აუვლით გვერდს წვდომის კონტროლს, ნუ გაგზავნით უკანონო ან საზიანო მასალას, ნუ შექმნით ავტომატიზებულ ბოროტად გამოყენების ტრაფიკს, თავს ნუ გაასაღებთ სხვა პირად, ნუ შეხვალთ სხვის ანგარიშზე და ნუ გამოიყენებთ სერვისს თაღლითობის ან უკანონო მოგზაურობის ხელშესაწყობად. გონივრული უსაფრთხოების ტესტირებისთვის წინასწარი წერილობითი ნებართვაა საჭირო. შეიძლება შევზღუდოთ წვდომა, როცა ეს აუცილებელია ბოროტად გამოყენების შესაჩერებლად, მომხმარებლების დასაცავად ან კანონის შესასრულებლად.'
          ]
        },
        {
          id: 'ownership-third-parties',
          title: '6. SCHNGN-ის კონტენტი და მესამე მხარის სერვისები',
          paragraphs: [
            'SCHNGN-ის სახელი, დიზაინი, პროგრამული უზრუნველყოფა და ორიგინალური კონტენტი დაცულია ინტელექტუალური საკუთრების მოქმედი კანონებით. ეს პირობები გაძლევთ შეზღუდულ, გაუქმებად და არაექსკლუზიურ უფლებას, სერვისი პირადი დაგეგმვისთვის გამოიყენოთ; ისინი საკუთრებას არ გადმოგცემთ. ოფიციალური წყაროების ბმულებს, Clerk-ს, Google-ს, Cloudflare-ს, Plausible-სა და მესამე მხარის სხვა სერვისებს საკუთარი პირობები და პოლიტიკები აქვთ. SCHNGN არ არის ევროკავშირის ინსტიტუტი და ევროკავშირი მას არ უჭერს მხარს ან არ სერტიფიცირებს.'
          ]
        },
        {
          id: 'availability-changes',
          title: '7. ხელმისაწვდომობა და ცვლილებები',
          paragraphs: [
            'ვცდილობთ, SCHNGN ზუსტი და ხელმისაწვდომი იყოს, თუმცა სერვისი შეიძლება შეწყდეს, დაგვიანდეს ან შეიცვალოს. ფუნქციები, პროვაიდერები, მხარდაჭერილი წესები ან უფასო ხელმისაწვდომობა შეიძლება შეიცვალოს, ხოლო კონტენტი შეიძლება გავასწოროთ ან წავშალოთ. როცა გონივრულად შესაძლებელია, ანგარიშზე შენახულ მონაცემებზე მოქმედ არსებით ცვლილებებს ძალაში შესვლამდე განვმარტავთ. თქვენთვის მნიშვნელოვანი ნებისმიერი სამოგზაურო გადაწყვეტილებისთვის დამოუკიდებელი ჩანაწერები შეინახეთ.'
          ]
        },
        {
          id: 'disclaimers-liability',
          title: '8. პასუხისმგებლობის უარყოფა და პასუხისმგებლობა',
          paragraphs: [
            'კანონით მაქსიმალურად ნებადართული ფარგლებში SCHNGN მოწოდებულია „როგორც არის“ და „ხელმისაწვდომობის მიხედვით“, ყოველგვარი დაპირების გარეშე, რომ თითოეული შედეგი, წყარო, პროვაიდერი ან ფუნქცია ყოველთვის სრული, აქტუალური ან უშეცდომო იქნება. SCHNGN არ არის პასუხისმგებელი ორგანოების გადაწყვეტილებებზე, ქვეყანაში შესვლაზე უარზე, ნებადართული ვადის გადაცილებაზე, ჯარიმებზე, მგზავრობის ხარჯებზე, გამოტოვებულ ჯავშნებზე, დაკარგულ ადგილობრივ მონაცემებზე ან სერვისზე დაყრდნობით გამოწვეულ არაპირდაპირ ზარალზე, როცა კანონი ასეთ შეზღუდვას უშვებს. ამ პირობებში არაფერი გამორიცხავს პასუხისმგებლობას, რომლის გამორიცხვაც კანონით შეუძლებელია, ან ზღუდავს მომხმარებლის სავალდებულო უფლებებს.'
          ]
        },
        {
          id: 'ending-rights-contact',
          title: '9. გამოყენების დასრულება, მოქმედი უფლებები და კონტაქტი',
          paragraphs: [
            'SCHNGN-ის გამოყენება ნებისმიერ დროს შეგიძლიათ შეწყვიტოთ; შეგიძლიათ ადგილობრივი მონაცემები გაასუფთავოთ, აქტიური დასინქრონებული მოგზაურობის სურათი წაშალოთ და Clerk ანგარიში ცალკე მართოთ ან გააუქმოთ. შეიძლება შევაჩეროთ ბოროტად ან უკანონოდ გამოყენება. მოქმედი სავალდებულო კანონი და მომხმარებელთა დაცვა ძალაში რჩება; ეს პირობები არ ირჩევს სასამართლოს და არ გართმევთ კანონით მონიჭებულ უფლებებს. სერვისის ან სამართლებრივი მოთხოვნების ცვლილებისას შეიძლება ეს პირობები განვაახლოთ, ზემოთ მითითებული თარიღით. კითხვები გამოგზავნეთ support@schngn.com-ზე.'
          ]
        }
      ],
      contactTitle: 'კითხვები ამ პირობების შესახებ',
      contactBody: 'SCHNGN-ის ან ამ პირობების შესახებ შეკითხვისთვის მოგვწერეთ support@schngn.com-ზე. პროდუქტის მხარდაჭერა ვერ განსაზღვრავს თქვენს საიმიგრაციო სტატუსს და ვერ გაგიწევთ იურიდიულ კონსულტაციას.',
      contactLinkLabel: 'დაუკავშირდით SCHNGN მხარდაჭერას'
    }
  },
  'zh-cn': {
    footer: {
      navigation: '法律信息与支持',
      privacy: '隐私',
      terms: '条款',
      contact: '联系',
      disclaimer: '仅供规划参考——不构成法律建议，也不保证获准入境。请通过官方来源核实。',
      copyright: '© 2026 SCHNGN'
    },
    privacy: {
      navLabel: '隐私政策章节',
      title: '隐私政策',
      metaDescription: 'SCHNGN 如何处理本地行程数据、可选账户同步、Google 登录、分析数据、支持请求以及您的隐私选择。',
      intro: 'SCHNGN 的设计目标是在无需账户的情况下计算旅行计划。本政策说明哪些信息会保留在您的浏览器中、选择可选在线功能时会处理哪些信息，以及您可以使用哪些控制方式。',
      updatedLabel: '最后更新',
      updatedDate: UPDATED_DATE,
      summaryTitle: '简要说明',
      summaryItems: [
        '访客的行程详情会保留在您的浏览器中，除非您明确选择账户同步。',
        '通过 Clerk 使用 Google 登录可创建和访问可选的 SCHNGN 账户；行程同步仍需您明确选择。',
        'Plausible 可能会收到粗略的使用情况和结果类别，但绝不会收到您的行程日期、标签、国家、电子邮件地址或账户 ID。',
        '您可以导出浏览器中当前的行程副本，并删除保存在账户中的活动行程快照。'
      ],
      sections: [
        {
          id: 'scope',
          title: '1. 本政策的适用范围',
          paragraphs: [
            '本政策适用于 schngn.com、SCHNGN 网页应用及其账户、同步、分析和支持功能。SCHNGN 是一款规划计算器；在正常功能中，它不会请求 GPS 访问权限、扫描护照，也不会收集签证或居留证件号码。'
          ]
        },
        {
          id: 'responsibility',
          title: '2. 谁负责以及为何处理数据',
          paragraphs: [
            'SCHNGN 运营 schngn.com，并负责此处所述的应用特定处理。如有隐私问题，请联系 support@schngn.com。我们处理账户、同步和支持数据，以提供您所请求的功能；处理有限的分析和安全数据，以了解并保护服务；在需要同意时处理基于同意的数据；以及处理履行适用法律义务所需的数据。'
          ]
        },
        {
          id: 'guest-data',
          title: '3. 访客使用和浏览器存储',
          paragraphs: [
            '当您以访客身份使用 SCHNGN 时，行程日期、标签、可选的边境国家信息、停留区间、状态和计算结果会保留在您的浏览器中。计算和未保存的模拟在您的设备上运行。可选的护照问题只会在浏览器临时内存中使用签发国，以显示可能存在的双边协议提示；该信息不会随行程保存，也不会发送至分析服务。浏览器存储还会保留语言、过往旅行回答和测试价格区间等功能偏好；应用的公共文件可能会被缓存以供离线使用。JSON 备份在您的控制下于本地创建和读取，不会仅仅因为您导出或导入它而被上传。'
          ],
          items: [
            '浏览器中的行程数据会一直保留，直至您将其清除、替换或清除网站数据。',
            '语言偏好 Cookie 最长保留一年。',
            '本地 JSON 备份是普通文件；您有责任妥善保管。'
          ]
        },
        {
          id: 'accounts-google',
          title: '4. 可选账户和 Google 登录',
          paragraphs: [
            'Clerk 会在公共页面上加载以检查您是否已登录，并可能处理必要的会话、设备和网络数据。如果您选择 Google 登录，Google 会向 Clerk 发送基本身份数据，例如稳定标识符、电子邮件地址以及在可用时的姓名或头像，并发送 OAuth 响应。Clerk 根据其自身政策管理身份提供商凭据、令牌和会话。SCHNGN 会收到由此产生的 Clerk 会话和用户 ID，用于识别活动账户、显示登录状态和电子邮件地址，并关联您明确保存的行程。Cloudflare D1 只会将 Clerk 用户 ID 与经您同意保存的行程一起存储，不会存储 Google 电子邮件地址、姓名、头像或身份提供商令牌。SCHNGN 不会请求访问 Gmail、Google Drive、Calendar、联系人、您的 Google 密码或其他 Google 内容；不会出售 Google 用户数据或将其用于广告。'
          ]
        },
        {
          id: 'account-sync',
          title: '5. 可选行程同步、导出和删除',
          paragraphs: [
            '完成明确标示的注册并保存操作，或在登录后另行启用同步，会将当前经过验证的行程快照发送至 Cloudflare D1。该快照包含经过验证的 Clerk 用户 ID、完整的已保存行程详情、修订与同意元数据以及时间戳。启用后，日后保存的编辑或导入内容可以同步。为了支持同步，浏览器本地存储还会保存 Clerk 用户 ID、服务器修订号、同步或暂停状态以及行程指纹；会话存储可能会暂时保存注册并保存意向。这些元数据不会包含在 JSON 导出中，并会在您明确选择“退出登录并清除此浏览器”或清除网站数据时被移除。JSON 导出包含浏览器中当前的行程副本，而不包含所有身份、支持、日志或服务提供商持有的数据。“删除账户中保存的行程”会移除活动 D1 快照，但不会删除浏览器行程或 Clerk 账户。删除 Clerk 账户会触发快照清理，并创建一个经过单向哈希处理的账户删除保护标记；该标记会使用 30 天以阻止过期会话重新创建数据，此后将被忽略，并在后续适当的清理操作中删除。'
          ]
        },
        {
          id: 'analytics',
          title: '6. 汇总分析',
          paragraphs: [
            '在生产网站上，Plausible 可能会收到允许列表中的事件，例如页面浏览、开始使用计算器、添加行程、运行模拟和解锁意向，以及行程数量区间、判断结果、安全余量区间、来源或测试价格区间等粗略类别。SCHNGN 会移除查询字符串和哈希片段，并禁止发送行程日期、标签、国家、时间线、护照选择、电子邮件地址和账户标识符。Plausible 分析配置为不使用分析 Cookie，也不自动跟踪表单、下载和出站链接。Plausible 仍可能处理普通网络信息，以生成汇总统计数据。'
          ]
        },
        {
          id: 'support-security',
          title: '7. 支持、安全和技术数据',
          paragraphs: [
            '如果您联系我们，SCHNGN 会通过 Cloudflare 电子邮件服务，将您的请求类型、可选姓名、电子邮件地址、消息和所选语言发送至我们的 Proton 支持邮箱。Turnstile 令牌会由 Cloudflare 另行验证，不会包含在支持邮件中。行程历史绝不会自动附加，但您在消息中自行输入的任何内容都会被接收。Cloudflare 使用连接 IP 地址进行速率限制和 Turnstile 验证，并在交付和保护网站时处理常规的请求、设备、浏览器、安全和错误元数据。SCHNGN 不使用 Sentry，其应用日志不得包含完整行程内容、账户电子邮件地址或 Clerk 用户 ID。'
          ]
        },
        {
          id: 'providers',
          title: '8. 服务提供商和跨境处理',
          paragraphs: [
            'SCHNGN 使用 Cloudflare 提供托管、存储、安全和电子邮件交付；使用 Clerk 提供身份和会话；仅在您选择 Google 登录时使用 Google；使用 Plausible 提供受限的汇总分析；并使用 Proton 提供支持邮箱。这些提供商可能会在您所在国家或地区以外处理数据。其公开声明说明了处理地点、保留期限和传输保障措施。我们只会在提供这些功能、保护服务、遵循您的指示或遵守法律所必需的范围内共享数据；我们不会出售个人数据。'
          ]
        },
        {
          id: 'retention-security',
          title: '9. 保留、删除和安全',
          paragraphs: [
            '浏览器数据会一直保留，直至您或浏览器将其删除。活动的已同步行程会一直保留，直至被替换或删除。Proton 邮箱中的消息会保留到 SCHNGN 将其删除为止；我们目前不承诺固定的保留期限。当这些消息不再是后续沟通、安全、争议或法律义务所合理需要时，应将其删除。提供商备份、运营记录、账户数据和汇总分析按照提供商配置的保留期限处理，并且在活动数据删除后可能需要一段时间才会失效。SCHNGN 使用访问控制、经过验证的输入、经身份验证的所有权和加密的 HTTPS 连接，但任何在线或本地存储方式都无法做到绝对安全。'
          ]
        },
        {
          id: 'rights-changes',
          title: '10. 您的选择、权利和政策变更',
          paragraphs: [
            '您可以在没有账户的情况下使用计算器、清除浏览器数据、导出浏览器行程、删除活动的账户行程快照，或管理和删除 Clerk 账户。根据适用法律，您可以请求访问、更正、删除、限制处理或数据可携带性；反对某些处理；在同意是处理依据时撤回同意；以及向当地数据保护机构投诉。提供账户或支持数据是可选的，但相关功能没有这些数据便无法运行。SCHNGN 不作出具有法律重要性的自动化决定：计算器结果只是规划估算。在对数据使用方式作出重大改变之前，我们会更新本页面。'
          ]
        }
      ],
      contactTitle: '隐私问题或请求',
      contactBody: '请发送电子邮件至 support@schngn.com。请说明您的请求，不要发送护照、签证或其他敏感证件号码。在处理账户相关请求前，我们可能需要验证该请求。',
      contactLinkLabel: '联系 SCHNGN 支持',
      providerLinksTitle: '服务提供商隐私信息',
      providerLinks: providerLinks([
        'Cloudflare 隐私政策',
        'Clerk 隐私政策',
        'Google 隐私政策',
        'Plausible 数据政策',
        'Proton 隐私政策'
      ])
    },
    terms: {
      navLabel: '使用条款章节',
      title: '使用条款',
      metaDescription: '使用 SCHNGN 申根 90/180 天计算器、本地行程存储和可选账户功能的条款。',
      intro: '本条款适用于您对 schngn.com 和 SCHNGN 网页应用的使用。制定这些条款是为了维护本产品的核心承诺：提供一款限制透明、账户可选的实用规划工具。',
      updatedLabel: '最后更新',
      updatedDate: UPDATED_DATE,
      summaryTitle: '要点',
      summaryItems: [
        '无需账户即可使用计算器；在线保存行程是可选功能。',
        'SCHNGN 仅供规划参考，不构成法律建议，也不保证获准入境。',
        '您有责任输入准确日期，并在旅行前查阅官方来源。',
        '请合法使用本服务，并确保任何账户访问方式的安全。'
      ],
      sections: [
        {
          id: 'using-schngn',
          title: '1. 使用 SCHNGN',
          paragraphs: [
            '使用 SCHNGN 即表示您同意本条款和隐私政策。您可以访客身份使用计算器。如果您创建账户，则必须在法律上有能力同意本条款；任何不具备该能力的人都只能在父母、监护人或其他获授权人士的陪同下使用 SCHNGN。如果您不同意，请勿使用本服务。'
          ]
        },
        {
          id: 'planning-aid',
          title: '2. 仅供规划参考',
          paragraphs: [
            'SCHNGN 根据申根 90/180 天规则估算普通短期停留。它不构成法律或移民建议，也不保证入境、合法停留或边境、签证或移民机关作出的任何决定。它可能未考虑居留许可、长期或国家签证、双边免签协议、国籍特定例外、工作、学习、庇护或临时保护身份、规则过渡或官方裁量权。针对护照或国家而显示的潜在双边协议提示仅供参考，不会改变核心计算，也不代表延期必然适用于您。请在预订或旅行前，通过官方来源和有关机关核实您的具体情况。'
          ]
        },
        {
          id: 'responsibilities',
          title: '3. 您的责任',
          paragraphs: [
            '您有责任输入完整、准确的日期，根据自身身份理解结果，保留所需备份，并独立核对现行规则。出入境证据、签证条件和主管机关指示的效力高于 SCHNGN。当您的计划或适用规则发生变化后，请勿依赖缓存、导出或先前计算的结果。'
          ]
        },
        {
          id: 'storage-accounts',
          title: '4. 本地存储、账户和同步',
          paragraphs: [
            '访客行程存储在您的浏览器中；如果网站数据被清除、设备发生故障或他人更改浏览器配置文件，这些数据可能会丢失。可选账户由 Clerk 提供。明确标示的注册并保存操作或单独的同步选择，会授权 SCHNGN 为该账户存储经过验证的行程快照。请确保账户访问安全；在共享设备上使用时，请根据需要退出登录并清除浏览器数据；有关导出、删除和服务提供商的详情，请查阅隐私政策。'
          ]
        },
        {
          id: 'acceptable-use',
          title: '5. 可接受的使用方式',
          paragraphs: [
            '不得滥用 SCHNGN、干扰其运行或安全、探测或绕过访问控制、提交违法或有害材料、自动产生滥用流量、冒充他人、访问他人账户，或利用本服务协助欺诈或违法旅行。合理的安全测试需要事先获得书面许可。为制止滥用、保护用户或遵守法律，我们可能会限制访问。'
          ]
        },
        {
          id: 'ownership-third-parties',
          title: '6. SCHNGN 内容和第三方服务',
          paragraphs: [
            'SCHNGN 名称、设计、软件和原创内容受适用的知识产权法律保护。本条款授予您有限的、可撤销的、非专有的权利，以将本服务用于个人规划；本条款不转让所有权。官方来源链接以及 Clerk、Google、Cloudflare、Plausible 和其他第三方服务均有各自的条款和政策。SCHNGN 不是欧盟机构，也未获得欧盟的认可或认证。'
          ]
        },
        {
          id: 'availability-changes',
          title: '7. 可用性和变更',
          paragraphs: [
            '我们力求保持 SCHNGN 准确且可用，但服务可能会中断、延迟或发生变化。功能、提供商、支持的规则或免费可用性可能会变化，我们也可能更正或删除内容。在合理可行的情况下，影响账户中已保存数据的重大变更会在生效前予以说明。对于任何对您而言重要的旅行决定，请保留独立记录。'
          ]
        },
        {
          id: 'disclaimers-liability',
          title: '8. 免责声明和责任',
          paragraphs: [
            '在法律允许的最大范围内，SCHNGN 按“现状”和“可用状态”提供，不承诺每项结果、来源、提供商或功能始终完整、最新或无误。在法律允许此类限制的范围内，SCHNGN 不对主管机关决定、被拒入境、逾期停留、罚款、旅行费用、错过预订、本地数据丢失或因依赖本服务造成的间接损失负责。本条款中的任何内容均不排除法律上不得排除的责任，也不限制强制性的消费者权利。'
          ]
        },
        {
          id: 'ending-rights-contact',
          title: '9. 停止使用、适用权利和联系方式',
          paragraphs: [
            '您可以随时停止使用 SCHNGN，并可以清除本地数据、删除活动的已同步行程快照，以及单独管理或删除 Clerk 账户。我们可能会暂停滥用或违法的使用。适用的强制性法律和消费者保护继续有效；本条款不指定法院，也不剥夺法律赋予您的权利。当服务或法律要求发生变化时，我们可能会更新本条款，并显示上方所列日期。如有疑问，请发送至 support@schngn.com。'
          ]
        }
      ],
      contactTitle: '关于本条款的问题',
      contactBody: '如果您对 SCHNGN 或本条款有任何疑问，请联系 support@schngn.com。产品支持无法认定您的移民身份，也无法提供法律建议。',
      contactLinkLabel: '联系 SCHNGN 支持'
    }
  },
  ja: {
    footer: {
      navigation: '法的情報とサポート',
      privacy: 'プライバシー',
      terms: '利用規約',
      contact: 'お問い合わせ',
      disclaimer: '計画支援のみを目的としており、法的助言や入国の保証ではありません。公式情報で確認してください。',
      copyright: '© 2026 SCHNGN'
    },
    privacy: {
      navLabel: 'プライバシーポリシーの項目',
      title: 'プライバシーポリシー',
      metaDescription: 'SCHNGN が端末内の旅行データ、任意のアカウント同期、Google ログイン、アクセス解析、サポート依頼、およびお客様のプライバシーに関する選択をどのように扱うかを説明します。',
      intro: 'SCHNGN は、アカウントを必要とせずに旅行計画を計算できるよう設計されています。本ポリシーでは、ブラウザ内に残る情報、任意のオンライン機能を選択した場合に処理される情報、および利用できる管理手段について説明します。',
      updatedLabel: '最終更新日',
      updatedDate: UPDATED_DATE,
      summaryTitle: '要点',
      summaryItems: [
        'ゲストの旅行詳細は、アカウント同期を明示的に選択しない限り、お使いのブラウザ内に残ります。',
        'Clerk 経由の Google ログインにより任意の SCHNGN アカウントを作成して利用できますが、旅行の同期には引き続き明示的な選択が必要です。',
        'Plausible は大まかな利用状況や結果の区分を受け取る場合がありますが、旅行日、ラベル、国、メールアドレス、アカウント ID を受け取ることはありません。',
        'ブラウザ内の現在の旅行データをエクスポートし、アカウントに保存された有効な旅行スナップショットを削除できます。'
      ],
      sections: [
        {
          id: 'scope',
          title: '1. 本ポリシーの適用範囲',
          paragraphs: [
            '本ポリシーは、schngn.com、SCHNGN ウェブアプリ、およびそのアカウント、同期、アクセス解析、サポート機能に適用されます。SCHNGN は計画用計算ツールであり、通常機能の一部として GPS へのアクセスを要求したり、パスポートをスキャンしたり、ビザや在留書類の番号を収集したりすることはありません。'
          ]
        },
        {
          id: 'responsibility',
          title: '2. 責任主体とデータを処理する理由',
          paragraphs: [
            'SCHNGN は schngn.com を運営し、ここに記載するアプリ固有の処理について責任を負います。プライバシーに関するご質問は support@schngn.com までお寄せください。アカウント、同期、サポートのデータはお客様が求める機能を提供するために、限定的な解析データとセキュリティデータはサービスを把握し保護するために、同意が必要な場合のデータは同意に基づいて、また適用される法的義務を履行するために必要なデータを処理します。'
          ]
        },
        {
          id: 'guest-data',
          title: '3. ゲスト利用とブラウザへの保存',
          paragraphs: [
            'SCHNGN をゲストとして利用する場合、旅行日、ラベル、任意の入出国国情報、滞在期間、ステータス、計算結果はブラウザ内に残ります。計算と未保存のシミュレーションは端末上で実行されます。任意のパスポートに関する質問では、ブラウザの一時メモリ内で発行国だけを使用し、二国間協定が適用される可能性についての案内を表示します。この情報は旅行データと共に保存されず、アクセス解析にも送信されません。ブラウザのストレージには、言語、過去の渡航に関する回答、テスト用価格帯などの機能上の設定も保存されます。オフライン利用のため、公開アプリファイルがキャッシュされる場合があります。JSON バックアップはお客様の管理下で端末内に作成、読み込みされ、エクスポートまたはインポートしただけでアップロードされることはありません。'
          ],
          items: [
            'ブラウザ内の旅行データは、お客様が消去または置換するか、サイトデータを消去するまで残ります。',
            '言語設定の Cookie は最長 1 年間保持されます。',
            '端末内の JSON バックアップは通常のファイルです。安全に保管する責任はお客様にあります。'
          ]
        },
        {
          id: 'accounts-google',
          title: '4. 任意のアカウントと Google ログイン',
          paragraphs: [
            'Clerk はログイン状態を確認するため公開ページ上で読み込まれ、必要なセッション、端末、ネットワークデータを処理する場合があります。Google ログインを選択すると、Google は固定的な識別子、メールアドレス、利用可能な場合の氏名やプロフィール画像などの基本本人情報と OAuth 応答を Clerk に送信します。Clerk は独自のポリシーに従い、プロバイダーの認証情報とトークンおよびセッションを管理します。SCHNGN は、その結果生じる Clerk セッションとユーザー ID を受け取り、有効なアカウントの識別、ログイン状態とメールアドレスの表示、お客様が明示的に保存した旅行との関連付けに使用します。Cloudflare D1 では、同意を得て保存された旅行と共に Clerk ユーザー ID だけを保存し、Google のメールアドレス、氏名、プロフィール画像、プロバイダートークンは保存しません。SCHNGN は Gmail、Google Drive、Calendar、連絡先、Google パスワード、その他の Google コンテンツへのアクセスを求めず、Google ユーザーデータを販売したり広告に利用したりしません。'
          ]
        },
        {
          id: 'account-sync',
          title: '5. 任意の旅行同期、エクスポート、削除',
          paragraphs: [
            '明確に表示された登録して保存する操作を完了するか、ログイン中に別途同期を有効にすると、検証済みの現在の旅行スナップショットが Cloudflare D1 に送信されます。このスナップショットには、検証済み Clerk ユーザー ID、保存された旅行の全詳細、改訂と同意のメタデータ、タイムスタンプが含まれます。有効化後は、その後保存した編集内容やインポート内容を同期できます。同期を支えるため、ブラウザのローカルストレージには Clerk ユーザー ID、サーバー改訂番号、同期または一時停止の状態、旅行フィンガープリントも保存されます。セッションストレージには登録して保存する意図が一時的に保存される場合があります。これらのメタデータは JSON エクスポートに含まれず、明示的な「ログアウトしてこのブラウザを消去」操作またはサイトデータの消去により削除されます。JSON エクスポートに含まれるのはブラウザ内の現在の旅行データであり、本人情報、サポート、ログ、またはプロバイダーが保有するすべてのデータではありません。「アカウントに保存した旅行を削除」は有効な D1 スナップショットを削除しますが、ブラウザ内の旅行や Clerk アカウントは削除しません。Clerk アカウントを削除するとスナップショットの消去が開始され、古いセッションによる再作成を防ぐ一方向ハッシュのアカウント削除保護記録が作成されます。この記録は 30 日間使用された後は無視され、その後の適切なクリーンアップ処理時に削除されます。'
          ]
        },
        {
          id: 'analytics',
          title: '6. 集計アクセス解析',
          paragraphs: [
            '本番サイトでは、Plausible はページ表示、計算開始、旅行追加、シミュレーション実行、機能解除への関心など許可リストにあるイベントと、旅行件数の範囲、判定、安全余裕日数の範囲、流入元、テスト用価格帯などの大まかな区分を受け取る場合があります。SCHNGN はクエリ文字列とハッシュ部分を除去し、旅行日、ラベル、国、タイムライン、パスポートの選択、メールアドレス、アカウント識別子を禁止しています。Plausible の解析は、解析用 Cookie を使用せず、フォーム、ダウンロード、外部リンクを自動追跡しないよう設定されています。集計統計を作成するため、Plausible が通常のネットワーク情報を処理する場合はあります。'
          ]
        },
        {
          id: 'support-security',
          title: '7. サポート、セキュリティ、技術データ',
          paragraphs: [
            'お問い合わせいただいた場合、SCHNGN は依頼の種類、任意の氏名、メールアドレス、メッセージ、選択言語を Cloudflare のメールサービス経由で当社の Proton サポートメールボックスへ送信します。Turnstile トークンは Cloudflare で別途検証され、サポートメールには含まれません。旅行履歴が自動的に添付されることはありませんが、お客様がメッセージに入力した内容はすべて受信されます。Cloudflare は接続元 IP アドレスをレート制限と Turnstile 検証に使用し、サイトの配信と保護の際に通常のリクエスト、端末、ブラウザ、セキュリティ、エラーのメタデータを処理します。SCHNGN は Sentry を使用せず、アプリケーションログに旅行本文、アカウントのメールアドレス、Clerk ユーザー ID を含めてはなりません。'
          ]
        },
        {
          id: 'providers',
          title: '8. サービスプロバイダーと国際的な処理',
          paragraphs: [
            'SCHNGN は、ホスティング、保存、セキュリティ、メール配信に Cloudflare、本人確認とセッションに Clerk、Google ログインを選択した場合だけ Google、限定的な集計解析に Plausible、サポートメールボックスに Proton を使用します。これらのプロバイダーは、お客様の国以外でデータを処理する場合があります。各社の公開通知には、処理場所、保持期間、移転時の保護措置が記載されています。当社は、これらの機能の提供、サービスの保護、お客様の指示への対応、または法令遵守に必要な範囲でのみデータを共有し、個人データを販売しません。'
          ]
        },
        {
          id: 'retention-security',
          title: '9. 保持、削除、セキュリティ',
          paragraphs: [
            'ブラウザデータは、お客様またはブラウザが削除するまで残ります。有効な同期済み旅行は、置換または削除されるまで残ります。Proton メールボックス内のメッセージは SCHNGN が削除するまで残り、現時点では固定の保持期間を約束していません。継続対応、セキュリティ、紛争、または法的義務のために合理的に必要でなくなった時点で削除するべきものです。プロバイダーのバックアップ、運用記録、アカウントデータ、集計解析には、各プロバイダーで設定された保持期間が適用され、有効なデータを削除した後も失効まで時間を要する場合があります。SCHNGN はアクセス制御、入力検証、認証済み所有者の確認、暗号化された HTTPS 接続を使用しますが、オンラインまたは端末内の保存方法に完全な安全性を保証できるものはありません。'
          ]
        },
        {
          id: 'rights-changes',
          title: '10. お客様の選択、権利、ポリシーの変更',
          paragraphs: [
            'アカウントなしで計算ツールを利用し、ブラウザデータを消去し、ブラウザ内の旅行をエクスポートし、有効なアカウント旅行スナップショットを削除し、または Clerk アカウントを管理、削除できます。適用法に応じて、アクセス、訂正、削除、制限、データポータビリティを求め、特定の処理に異議を申し立て、同意が処理の根拠である場合に同意を撤回し、地域のデータ保護機関に苦情を申し立てることができます。アカウントまたはサポート用データの提供は任意ですが、それらがなければ該当機能は動作しません。SCHNGN は法的に重大な自動意思決定を行いません。計算結果は計画上の推定値です。データの利用方法を重大に変更する前に、本ページを更新します。'
          ]
        }
      ],
      contactTitle: 'プライバシーに関する質問または請求',
      contactBody: 'support@schngn.com までメールでご連絡ください。パスポート、ビザ、その他の機微な書類番号を送らずに、請求内容をご説明ください。アカウントに関する請求に対応する前に、ご本人確認が必要となる場合があります。',
      contactLinkLabel: 'SCHNGN サポートに連絡',
      providerLinksTitle: 'プロバイダーのプライバシー情報',
      providerLinks: providerLinks([
        'Cloudflare プライバシーポリシー',
        'Clerk プライバシーポリシー',
        'Google プライバシーポリシー',
        'Plausible データポリシー',
        'Proton プライバシーポリシー'
      ])
    },
    terms: {
      navLabel: '利用規約の項目',
      title: '利用規約',
      metaDescription: 'SCHNGN のシェンゲン 90/180 日計算ツール、旅行の端末内保存、任意のアカウント機能を利用するための規約です。',
      intro: '本規約は、schngn.com および SCHNGN ウェブアプリの利用に適用されます。明確な制約と任意のアカウントを備えた有用な計画ツールという、本製品の中心的な約束を守るために定められています。',
      updatedLabel: '最終更新日',
      updatedDate: UPDATED_DATE,
      summaryTitle: '重要事項',
      summaryItems: [
        '計算ツールはアカウントなしで利用でき、旅行のオンライン保存は任意です。',
        'SCHNGN は計画支援ツールであり、法的助言や入国の保証ではありません。',
        '正確な日付の入力と、渡航前に公式情報を確認する責任はお客様にあります。',
        'サービスを適法に利用し、アカウントへのアクセスを安全に管理してください。'
      ],
      sections: [
        {
          id: 'using-schngn',
          title: '1. SCHNGN の利用',
          paragraphs: [
            'SCHNGN を利用することで、本規約およびプライバシーポリシーに同意したものとみなされます。計算ツールはゲストとして利用できます。アカウントを作成する場合、本規約に同意する法的能力が必要です。その能力がない方は、親、保護者、またはその他の権限を持つ方と共にのみ SCHNGN を利用してください。同意しない場合は、サービスを利用しないでください。'
          ]
        },
        {
          id: 'planning-aid',
          title: '2. 計画支援のみ',
          paragraphs: [
            'SCHNGN は、シェンゲン 90/180 日ルールに基づく通常の短期滞在を推定します。法的または移民上の助言ではなく、入国、適法な滞在、または国境、ビザ、移民当局による判断を保証するものではありません。在留許可、長期または各国ビザ、二国間査証免除協定、国籍固有の例外、就労、就学、難民、または一時保護の資格、制度移行、当局の裁量を考慮できない場合があります。パスポートまたは国に応じて表示される二国間協定の可能性に関する案内は情報提供にすぎず、基本計算を変更したり、延長が適用されると判断したりするものではありません。予約または渡航の前に、公式情報と関係当局によりご自身の状況を確認してください。'
          ]
        },
        {
          id: 'responsibilities',
          title: '3. お客様の責任',
          paragraphs: [
            '完全かつ正確な日付を入力し、ご自身の資格に照らして結果を解釈し、必要なバックアップを保管し、現行の規則を独自に確認する責任はお客様にあります。出入国の証拠、ビザの条件、当局の指示は SCHNGN より優先されます。計画または適用規則が変わった後に、キャッシュ、エクスポート、または以前の計算結果に依存しないでください。'
          ]
        },
        {
          id: 'storage-accounts',
          title: '4. 端末内保存、アカウント、同期',
          paragraphs: [
            'ゲストの旅行はブラウザに保存され、サイトデータの消去、端末の故障、または他の人によるブラウザプロファイルの変更により失われる場合があります。任意のアカウントは Clerk が提供します。表示された登録して保存する操作または別途の同期選択により、SCHNGN がそのアカウント用に検証済み旅行スナップショットを保存することを許可します。アカウントへのアクセスを安全に保ち、共有端末では必要に応じてログアウトしてブラウザデータを消去し、エクスポート、削除、プロバイダーの詳細についてプライバシーポリシーを確認してください。'
          ]
        },
        {
          id: 'acceptable-use',
          title: '5. 許容される利用',
          paragraphs: [
            'SCHNGN を悪用したり、動作やセキュリティを妨げたり、アクセス制御を調査または回避したり、違法または有害な素材を送信したり、不正なトラフィックを自動化したり、他人になりすましたり、他人のアカウントにアクセスしたり、詐欺または違法な渡航を助けるためにサービスを利用したりしてはなりません。合理的なセキュリティテストには事前の書面による許可が必要です。不正利用の停止、利用者の保護、または法令遵守に必要な場合、アクセスを制限することがあります。'
          ]
        },
        {
          id: 'ownership-third-parties',
          title: '6. SCHNGN のコンテンツと第三者サービス',
          paragraphs: [
            'SCHNGN の名称、デザイン、ソフトウェア、独自コンテンツは、適用される知的財産法により保護されています。本規約は、個人的な計画のためにサービスを利用する限定的、取消可能、非独占的な権利を付与するものであり、所有権を移転するものではありません。公式情報へのリンク、Clerk、Google、Cloudflare、Plausible、その他の第三者サービスには、各社の規約とポリシーが適用されます。SCHNGN は EU の機関ではなく、欧州連合による承認または認証を受けていません。'
          ]
        },
        {
          id: 'availability-changes',
          title: '7. 利用可能性と変更',
          paragraphs: [
            'SCHNGN の正確性と利用可能性の維持に努めますが、サービスが中断、遅延、または変更される場合があります。機能、プロバイダー、対応規則、無料提供の範囲が変わることがあり、コンテンツを修正または削除する場合もあります。合理的に可能な場合、保存済みアカウントデータに影響する重要な変更は、発効前に説明します。お客様にとって重要な旅行上の判断については、独立した記録を保管してください。'
          ]
        },
        {
          id: 'disclaimers-liability',
          title: '8. 免責事項と責任',
          paragraphs: [
            '適用法上許される最大限の範囲で、SCHNGN は「現状のまま」かつ「提供可能な範囲」で提供され、すべての結果、情報源、プロバイダー、機能が常に完全、最新、または無誤謬であることを約束しません。法令がその制限を許す範囲で、SCHNGN は当局の判断、入国拒否、滞在期限超過、罰金、旅行費用、失効した予約、端末内データの喪失、またはサービスへの依存により生じた間接損失について責任を負いません。本規約のいかなる内容も、法律上排除できない責任を排除せず、強行的な消費者の権利を制限しません。'
          ]
        },
        {
          id: 'ending-rights-contact',
          title: '9. 利用終了、適用される権利、お問い合わせ',
          paragraphs: [
            'SCHNGN の利用はいつでも停止でき、端末内データの消去、有効な同期済み旅行スナップショットの削除、Clerk アカウントの個別の管理または削除ができます。当社は、不正または違法な利用を停止する場合があります。適用される強行法規と消費者保護は引き続き有効です。本規約は裁判所を指定せず、法律がお客様に付与する権利を取り除きません。サービスまたは法的要件が変わった場合、上記の日付を更新して本規約を変更することがあります。ご質問は support@schngn.com までお寄せください。'
          ]
        }
      ],
      contactTitle: '本規約に関するご質問',
      contactBody: 'SCHNGN または本規約についてのご質問は support@schngn.com までお寄せください。製品サポートはお客様の在留資格を判断したり、法的助言を提供したりすることはできません。',
      contactLinkLabel: 'SCHNGN サポートに連絡'
    }
  },
  ko: {
    footer: {
      navigation: '법적 정보 및 지원',
      privacy: '개인정보 보호',
      terms: '이용약관',
      contact: '문의',
      disclaimer: '여행 계획 보조용일 뿐이며 법률 자문이나 입국 보장이 아닙니다. 공식 출처에서 확인하세요.',
      copyright: '© 2026 SCHNGN'
    },
    privacy: {
      navLabel: '개인정보처리방침 항목',
      title: '개인정보처리방침',
      metaDescription: 'SCHNGN이 브라우저 내 여행 데이터, 선택적 계정 동기화, Google 로그인, 분석, 지원 요청 및 개인정보 보호 선택 사항을 처리하는 방식을 설명합니다.',
      intro: 'SCHNGN은 계정 없이도 여행 계획을 계산할 수 있도록 설계되었습니다. 이 방침은 브라우저에 남는 정보, 선택적 온라인 기능을 이용할 때 처리되는 정보, 그리고 사용자가 이용할 수 있는 관리 방법을 설명합니다.',
      updatedLabel: '최종 업데이트',
      updatedDate: UPDATED_DATE,
      summaryTitle: '간단히 보기',
      summaryItems: [
        '게스트 여행 세부 정보는 계정 동기화를 명시적으로 선택하지 않는 한 브라우저에 남습니다.',
        'Clerk를 통한 Google 로그인으로 선택적 SCHNGN 계정을 만들고 이용할 수 있으며, 여행 동기화에는 별도의 명시적 선택이 필요합니다.',
        'Plausible은 대략적인 사용 및 결과 범주를 받을 수 있지만 여행 날짜, 라벨, 국가, 이메일 또는 계정 ID는 받지 않습니다.',
        '브라우저의 현재 여행 사본을 내보내고 계정에 저장된 활성 여행 스냅샷을 삭제할 수 있습니다.'
      ],
      sections: [
        {
          id: 'scope',
          title: '1. 이 방침의 적용 범위',
          paragraphs: [
            '이 방침은 schngn.com, SCHNGN 웹 앱과 그 계정, 동기화, 분석 및 지원 기능에 적용됩니다. SCHNGN은 여행 계획 계산기이며 일반 기능의 일부로 GPS 접근을 요청하거나 여권을 스캔하거나 비자 및 체류 문서 번호를 수집하지 않습니다.'
          ]
        },
        {
          id: 'responsibility',
          title: '2. 책임 주체와 데이터 처리 이유',
          paragraphs: [
            'SCHNGN은 schngn.com을 운영하며 여기에 설명된 앱 고유의 처리에 책임을 집니다. 개인정보 보호 관련 문의는 support@schngn.com으로 보내 주세요. 당사는 사용자가 요청한 기능을 제공하기 위해 계정, 동기화 및 지원 데이터를 처리하고, 서비스를 이해하고 보호하기 위해 제한된 분석 및 보안 데이터를 처리하며, 동의가 필요한 경우 동의에 기반한 데이터를 처리하고, 적용되는 법적 의무를 이행하는 데 필요한 데이터를 처리합니다.'
          ]
        },
        {
          id: 'guest-data',
          title: '3. 게스트 이용과 브라우저 저장',
          paragraphs: [
            'SCHNGN을 게스트로 이용하면 여행 날짜, 라벨, 선택적 출입국 국가 정보, 체류 기간, 상태 및 계산 결과가 브라우저에 남습니다. 계산과 저장하지 않은 시뮬레이션은 사용자의 기기에서 실행됩니다. 선택적 여권 질문은 브라우저의 임시 메모리에서 발급 국가만 사용하여 적용 가능성이 있는 양자 협정 안내를 표시하며, 여행과 함께 저장되거나 분석 서비스로 전송되지 않습니다. 브라우저 저장소에는 언어, 이전 여행에 대한 답변, 테스트 가격 구간과 같은 기능 설정도 보관됩니다. 오프라인 이용을 위해 공개 앱 파일이 캐시될 수 있습니다. JSON 백업은 사용자의 관리 아래 기기에서 생성되고 읽히며, 내보내거나 가져왔다는 이유만으로 업로드되지 않습니다.'
          ],
          items: [
            '브라우저의 여행 데이터는 사용자가 지우거나 교체하거나 사이트 데이터를 지울 때까지 남습니다.',
            '언어 설정 쿠키는 최대 1년간 유지됩니다.',
            '로컬 JSON 백업은 일반 파일이며 안전하게 보관할 책임은 사용자에게 있습니다.'
          ]
        },
        {
          id: 'accounts-google',
          title: '4. 선택적 계정과 Google 로그인',
          paragraphs: [
            'Clerk는 로그인 상태를 확인하기 위해 공개 페이지에서 로드되며 필수적인 세션, 기기 및 네트워크 데이터를 처리할 수 있습니다. Google 로그인을 선택하면 Google은 안정적인 식별자, 이메일 주소, 제공 가능한 경우 이름이나 프로필 이미지 같은 기본 신원 정보와 OAuth 응답을 Clerk에 전송합니다. Clerk는 자체 방침에 따라 제공자 인증 정보와 토큰 및 세션을 관리합니다. SCHNGN은 그 결과 생성된 Clerk 세션과 사용자 ID를 받아 활성 계정을 식별하고, 로그인 상태와 이메일을 표시하며, 사용자가 명시적으로 저장한 여행을 연결합니다. Cloudflare D1에는 동의하여 저장한 여행과 함께 Clerk 사용자 ID만 저장되며 Google 이메일, 이름, 프로필 이미지 또는 제공자 토큰은 저장되지 않습니다. SCHNGN은 Gmail, Google Drive, Calendar, 연락처, Google 비밀번호 또는 기타 Google 콘텐츠에 대한 접근을 요청하지 않으며 Google 사용자 데이터를 판매하거나 광고에 사용하지 않습니다.'
          ]
        },
        {
          id: 'account-sync',
          title: '5. 선택적 여행 동기화, 내보내기 및 삭제',
          paragraphs: [
            '명확히 표시된 가입 후 저장 작업을 완료하거나 로그인 상태에서 별도로 동기화를 활성화하면 현재 검증된 여행 스냅샷이 Cloudflare D1으로 전송됩니다. 이 스냅샷에는 확인된 Clerk 사용자 ID, 저장된 전체 여행 세부 정보, 수정 및 동의 메타데이터와 타임스탬프가 포함됩니다. 활성화한 뒤에는 이후 저장한 편집 내용이나 가져온 내용을 동기화할 수 있습니다. 동기화를 지원하기 위해 브라우저 로컬 저장소에는 Clerk 사용자 ID, 서버 수정 번호, 동기화 또는 일시 중지 상태와 여행 지문도 저장되며, 세션 저장소에는 가입 후 저장 의도가 일시적으로 저장될 수 있습니다. 이 메타데이터는 JSON 내보내기에 포함되지 않으며 명시적인 “로그아웃하고 이 브라우저 지우기” 작업이나 사이트 데이터 삭제로 제거됩니다. JSON 내보내기에는 브라우저의 현재 여행 사본이 포함되며 모든 신원, 지원, 로그 또는 제공자가 보유한 데이터가 포함되는 것은 아닙니다. “계정에 저장된 여행 삭제”는 활성 D1 스냅샷을 삭제하지만 브라우저 여행이나 Clerk 계정은 삭제하지 않습니다. Clerk 계정을 삭제하면 스냅샷 정리가 시작되고, 오래된 세션이 데이터를 다시 만드는 것을 막는 단방향 해시 계정 삭제 보호 기록이 생성됩니다. 이 기록은 30일 동안 사용된 뒤에는 무시되며 이후 적절한 정리 작업 때 삭제됩니다.'
          ]
        },
        {
          id: 'analytics',
          title: '6. 집계 분석',
          paragraphs: [
            '운영 사이트에서 Plausible은 페이지 조회, 계산기 시작, 여행 추가, 시뮬레이션 실행 및 잠금 해제 관심도처럼 허용 목록에 포함된 이벤트와 여행 수 구간, 판정, 안전 여유일 구간, 출처 또는 테스트 가격 구간 같은 대략적인 범주를 받을 수 있습니다. SCHNGN은 쿼리 문자열과 해시 조각을 제거하고 여행 날짜, 라벨, 국가, 타임라인, 여권 선택, 이메일 및 계정 식별자의 전송을 금지합니다. Plausible 분석은 분석 쿠키와 자동 양식, 다운로드 및 외부 링크 추적 없이 설정되어 있습니다. Plausible은 집계 통계를 만들기 위해 일반적인 네트워크 정보를 처리할 수 있습니다.'
          ]
        },
        {
          id: 'support-security',
          title: '7. 지원, 보안 및 기술 데이터',
          paragraphs: [
            '당사에 문의하면 SCHNGN은 요청 유형, 선택 입력한 이름, 이메일 주소, 메시지 및 선택 언어를 Cloudflare 이메일 서비스를 통해 Proton 지원 사서함으로 보냅니다. Turnstile 토큰은 Cloudflare에서 별도로 검증되며 지원 이메일에 포함되지 않습니다. 여행 기록은 자동으로 첨부되지 않지만 사용자가 메시지에 직접 입력한 내용은 모두 수신됩니다. Cloudflare는 연결 IP 주소를 요청 속도 제한과 Turnstile 검증에 사용하고 사이트를 제공하고 보호할 때 일반적인 요청, 기기, 브라우저, 보안 및 오류 메타데이터를 처리합니다. SCHNGN은 Sentry를 사용하지 않으며 애플리케이션 로그에는 여행 본문, 계정 이메일 또는 Clerk 사용자 ID가 포함되어서는 안 됩니다.'
          ]
        },
        {
          id: 'providers',
          title: '8. 서비스 제공자와 국제적 처리',
          paragraphs: [
            'SCHNGN은 호스팅, 저장, 보안 및 이메일 전송에 Cloudflare를, 신원 및 세션에 Clerk를, 사용자가 Google 로그인을 선택한 경우에만 Google을, 제한된 집계 분석에 Plausible을, 지원 사서함에 Proton을 사용합니다. 이러한 제공자는 사용자의 국가 밖에서 데이터를 처리할 수 있습니다. 각 제공자의 공개 고지에는 처리 위치, 보관 기간 및 전송 보호조치가 설명되어 있습니다. 당사는 이러한 기능을 제공하고, 서비스를 보호하고, 사용자의 지시를 따르거나 법률을 준수하는 데 필요한 범위에서만 데이터를 공유하며 개인정보를 판매하지 않습니다.'
          ]
        },
        {
          id: 'retention-security',
          title: '9. 보관, 삭제 및 보안',
          paragraphs: [
            '브라우저 데이터는 사용자 또는 브라우저가 삭제할 때까지 남습니다. 활성 동기화 여행은 교체되거나 삭제될 때까지 남습니다. Proton 사서함의 메시지는 SCHNGN이 삭제할 때까지 남으며 현재 고정된 보관 기간을 약속하지 않습니다. 후속 연락, 보안, 분쟁 또는 법적 의무를 위해 더 이상 합리적으로 필요하지 않을 때 삭제해야 합니다. 제공자 백업, 운영 기록, 계정 데이터 및 집계 분석에는 각 제공자에 설정된 보관 기간이 적용되며 활성 데이터가 삭제된 후에도 만료까지 시간이 걸릴 수 있습니다. SCHNGN은 접근 제어, 입력 검증, 인증된 소유권 확인 및 암호화된 HTTPS 연결을 사용하지만 어떠한 온라인 또는 로컬 저장 방식도 완전히 안전하지는 않습니다.'
          ]
        },
        {
          id: 'rights-changes',
          title: '10. 사용자의 선택, 권리 및 방침 변경',
          paragraphs: [
            '계정 없이 계산기를 사용하고, 브라우저 데이터를 지우고, 브라우저 여행을 내보내고, 활성 계정 여행 스냅샷을 삭제하거나 Clerk 계정을 관리하고 삭제할 수 있습니다. 적용되는 법률에 따라 접근, 정정, 삭제, 처리 제한 또는 이동을 요청하고, 특정 처리에 반대하며, 동의가 처리 근거인 경우 동의를 철회하고, 지역 데이터 보호 기관에 민원을 제기할 수 있습니다. 계정 또는 지원 데이터 제공은 선택 사항이지만 해당 기능은 그 데이터 없이 작동할 수 없습니다. SCHNGN은 법적으로 중대한 자동화된 결정을 내리지 않습니다. 계산 결과는 계획을 위한 추정치입니다. 데이터 사용 방식을 중대하게 변경하기 전에 이 페이지를 업데이트하겠습니다.'
          ]
        }
      ],
      contactTitle: '개인정보 보호 관련 질문 또는 요청',
      contactBody: 'support@schngn.com으로 이메일을 보내 주세요. 여권, 비자 또는 기타 민감한 문서 번호를 보내지 말고 요청 내용을 설명해 주세요. 계정 관련 요청을 처리하기 전에 본인 확인이 필요할 수 있습니다.',
      contactLinkLabel: 'SCHNGN 지원팀에 문의',
      providerLinksTitle: '제공자 개인정보 보호 정보',
      providerLinks: providerLinks([
        'Cloudflare 개인정보처리방침',
        'Clerk 개인정보처리방침',
        'Google 개인정보처리방침',
        'Plausible 데이터 방침',
        'Proton 개인정보처리방침'
      ])
    },
    terms: {
      navLabel: '이용약관 항목',
      title: '이용약관',
      metaDescription: 'SCHNGN 솅겐 90/180일 계산기, 여행의 로컬 저장 및 선택적 계정 기능 이용에 적용되는 약관입니다.',
      intro: '본 약관은 schngn.com과 SCHNGN 웹 앱 이용에 적용됩니다. 명확한 한계와 선택적 계정을 갖춘 유용한 여행 계획 도구라는 제품의 핵심 약속을 지키기 위해 작성되었습니다.',
      updatedLabel: '최종 업데이트',
      updatedDate: UPDATED_DATE,
      summaryTitle: '핵심 사항',
      summaryItems: [
        '계정 없이 계산기를 이용할 수 있으며 여행의 온라인 저장은 선택 사항입니다.',
        'SCHNGN은 여행 계획 보조 도구이며 법률 자문이나 입국 보장이 아닙니다.',
        '정확한 날짜를 입력하고 여행 전에 공식 출처를 확인할 책임은 사용자에게 있습니다.',
        '서비스를 적법하게 이용하고 계정 접근을 안전하게 관리하세요.'
      ],
      sections: [
        {
          id: 'using-schngn',
          title: '1. SCHNGN 이용',
          paragraphs: [
            'SCHNGN을 이용하면 본 약관과 개인정보처리방침에 동의하는 것입니다. 계산기는 게스트로 이용할 수 있습니다. 계정을 만드는 경우 본 약관에 동의할 법적 능력이 있어야 하며, 그러한 능력이 없는 사람은 부모, 보호자 또는 기타 권한 있는 사람과 함께만 SCHNGN을 이용해야 합니다. 동의하지 않으면 서비스를 이용하지 마세요.'
          ]
        },
        {
          id: 'planning-aid',
          title: '2. 여행 계획 보조용',
          paragraphs: [
            'SCHNGN은 솅겐 90/180일 규칙에 따른 일반 단기 체류를 추정합니다. 이는 법률 또는 이민 자문이 아니며 입국, 합법적 체류 또는 국경, 비자, 이민 당국의 어떠한 결정도 보장하지 않습니다. 체류 허가, 장기 또는 국가 비자, 양자간 비자 면제 협정, 국적별 예외, 취업, 학업, 망명 또는 임시 보호 신분, 규칙의 과도기 또는 당국의 재량이 반영되지 않을 수 있습니다. 여권 또는 국가별로 표시되는 잠재적 양자 협정 안내는 정보 제공용이며 핵심 계산을 변경하거나 연장이 적용된다고 판단하지 않습니다. 예약 또는 여행 전에 공식 출처와 관계 당국을 통해 본인의 상황을 확인하세요.'
          ]
        },
        {
          id: 'responsibilities',
          title: '3. 사용자의 책임',
          paragraphs: [
            '완전하고 정확한 날짜를 입력하고, 본인의 신분을 고려해 결과를 해석하며, 필요한 백업을 보관하고, 최신 규칙을 독립적으로 확인할 책임은 사용자에게 있습니다. 출입국 증빙, 비자 조건 및 당국의 지침은 SCHNGN보다 우선합니다. 계획이나 적용 규칙이 변경된 뒤에는 캐시된 결과, 내보낸 결과 또는 이전에 계산한 결과에 의존하지 마세요.'
          ]
        },
        {
          id: 'storage-accounts',
          title: '4. 로컬 저장, 계정 및 동기화',
          paragraphs: [
            '게스트 여행은 브라우저에 저장되며 사이트 데이터가 지워지거나, 기기가 고장 나거나, 다른 사람이 브라우저 프로필을 변경하면 손실될 수 있습니다. 선택적 계정은 Clerk를 통해 제공됩니다. 표시된 가입 후 저장 작업이나 별도의 동기화 선택을 하면 SCHNGN이 해당 계정에 검증된 여행 스냅샷을 저장하도록 허용하게 됩니다. 계정 접근을 안전하게 관리하고, 공유 기기에서는 필요에 따라 로그아웃하고 브라우저 데이터를 지우며, 내보내기, 삭제 및 제공자 상세 정보는 개인정보처리방침에서 확인하세요.'
          ]
        },
        {
          id: 'acceptable-use',
          title: '5. 허용되는 사용',
          paragraphs: [
            'SCHNGN을 오용하거나, 운영 또는 보안을 방해하거나, 접근 제어를 탐색 또는 우회하거나, 불법 또는 유해 자료를 제출하거나, 악의적 트래픽을 자동화하거나, 타인을 사칭하거나, 다른 계정에 접근하거나, 사기 또는 불법 여행을 조장하는 데 서비스를 사용해서는 안 됩니다. 합리적인 보안 테스트에도 사전 서면 허가가 필요합니다. 오용을 중단시키고, 사용자를 보호하거나 법률을 준수하기 위해 필요한 경우 접근을 제한할 수 있습니다.'
          ]
        },
        {
          id: 'ownership-third-parties',
          title: '6. SCHNGN 콘텐츠 및 제3자 서비스',
          paragraphs: [
            'SCHNGN 이름, 디자인, 소프트웨어 및 원본 콘텐츠는 적용되는 지식재산권법의 보호를 받습니다. 본 약관은 개인 여행 계획을 위해 서비스를 사용할 수 있는 제한적이고 철회 가능하며 비독점적인 권리를 부여할 뿐 소유권을 이전하지 않습니다. 공식 출처 링크, Clerk, Google, Cloudflare, Plausible 및 기타 제3자 서비스에는 각자의 약관과 방침이 적용됩니다. SCHNGN은 EU 기관이 아니며 유럽연합의 승인이나 인증을 받지 않았습니다.'
          ]
        },
        {
          id: 'availability-changes',
          title: '7. 가용성 및 변경',
          paragraphs: [
            'SCHNGN의 정확성과 가용성을 유지하기 위해 노력하지만 서비스가 중단, 지연 또는 변경될 수 있습니다. 기능, 제공자, 지원 규칙 또는 무료 제공 범위가 변경될 수 있으며 콘텐츠를 수정하거나 삭제할 수도 있습니다. 합리적으로 가능한 경우 저장된 계정 데이터에 영향을 주는 중대한 변경은 효력이 발생하기 전에 설명하겠습니다. 사용자에게 중요한 여행 결정에 대해서는 별도의 기록을 보관하세요.'
          ]
        },
        {
          id: 'disclaimers-liability',
          title: '8. 면책 및 책임',
          paragraphs: [
            '법률이 허용하는 최대 범위에서 SCHNGN은 “있는 그대로” 및 “이용 가능한 상태로” 제공되며 모든 결과, 출처, 제공자 또는 기능이 항상 완전하고 최신이며 오류가 없다고 약속하지 않습니다. 법률이 그러한 제한을 허용하는 경우 SCHNGN은 당국의 결정, 입국 거부, 체류 기간 초과, 벌금, 여행 비용, 놓친 예약, 로컬 데이터 손실 또는 서비스 의존으로 발생한 간접 손실에 대해 책임지지 않습니다. 본 약관의 어떠한 내용도 법적으로 배제할 수 없는 책임을 배제하거나 강행적인 소비자 권리를 제한하지 않습니다.'
          ]
        },
        {
          id: 'ending-rights-contact',
          title: '9. 이용 종료, 적용되는 권리 및 문의',
          paragraphs: [
            '언제든 SCHNGN 이용을 중단할 수 있고 로컬 데이터를 지우고, 활성 동기화 여행 스냅샷을 삭제하며, Clerk 계정을 별도로 관리하거나 삭제할 수 있습니다. 당사는 악의적이거나 불법적인 이용을 정지할 수 있습니다. 적용되는 강행법과 소비자 보호는 계속 유효하며, 본 약관은 관할 법원을 지정하거나 법률이 부여하는 권리를 없애지 않습니다. 서비스 또는 법적 요건이 변경되면 위 날짜를 갱신하여 본 약관을 변경할 수 있습니다. 문의는 support@schngn.com으로 보내 주세요.'
          ]
        }
      ],
      contactTitle: '본 약관에 관한 문의',
      contactBody: 'SCHNGN 또는 본 약관에 관한 질문은 support@schngn.com으로 보내 주세요. 제품 지원팀은 사용자의 이민 신분을 판단하거나 법률 자문을 제공할 수 없습니다.',
      contactLinkLabel: 'SCHNGN 지원팀에 문의'
    }
  },
  he: {
    footer: {
      navigation: 'מידע משפטי ותמיכה',
      privacy: 'פרטיות',
      terms: 'תנאים',
      contact: 'יצירת קשר',
      disclaimer: 'כלי עזר לתכנון בלבד — לא ייעוץ משפטי ולא הבטחה לכניסה. יש לאמת מול מקורות רשמיים.',
      copyright: '© 2026 SCHNGN'
    },
    privacy: {
      navLabel: 'סעיפי מדיניות הפרטיות',
      title: 'מדיניות פרטיות',
      metaDescription: 'כיצד SCHNGN מטפלת בנתוני נסיעות מקומיים, בסנכרון חשבון אופציונלי, בכניסה עם Google, בניתוח שימוש, בפניות לתמיכה ובאפשרויות הפרטיות שלכם.',
      intro: 'SCHNGN תוכננה לחשב תוכניות נסיעה בלי לדרוש חשבון. מדיניות זו מסבירה מה נשאר בדפדפן שלכם, מה מעובד כשאתם בוחרים תכונות מקוונות אופציונליות ואילו אמצעי שליטה עומדים לרשותכם.',
      updatedLabel: 'עודכן לאחרונה',
      updatedDate: UPDATED_DATE,
      summaryTitle: 'בקצרה',
      summaryItems: [
        'פרטי נסיעות של אורחים נשארים בדפדפן שלכם, אלא אם בחרתם במפורש בסנכרון חשבון.',
        'כניסה עם Google דרך Clerk מאפשרת ליצור חשבון SCHNGN אופציונלי ולגשת אליו; סנכרון נסיעות עדיין דורש בחירה מפורשת.',
        'Plausible עשויה לקבל קטגוריות כלליות של שימוש ותוצאות, אך לעולם לא את תאריכי הנסיעות, התוויות, המדינות, כתובת הדוא״ל או מזהה החשבון שלכם.',
        'אפשר לייצא את עותק הנסיעות הנוכחי מהדפדפן ולמחוק את תמונת המצב הפעילה של הנסיעות השמורה בחשבון.'
      ],
      sections: [
        {
          id: 'scope',
          title: '1. על מה חלה מדיניות זו',
          paragraphs: [
            'מדיניות זו חלה על schngn.com, על יישום האינטרנט SCHNGN ועל תכונות החשבון, הסנכרון, ניתוח השימוש והתמיכה שלו. SCHNGN היא מחשבון לתכנון, ובמסגרת התכונות הרגילות שלה אינה מבקשת גישה ל־GPS, אינה סורקת דרכונים ואינה אוספת מספרי אשרות או מסמכי תושבות.'
          ]
        },
        {
          id: 'responsibility',
          title: '2. מי אחראי ומדוע הנתונים מעובדים',
          paragraphs: [
            'SCHNGN מפעילה את schngn.com ואחראית לעיבוד הייחודי ליישום המתואר כאן. לשאלות פרטיות פנו אל support@schngn.com. אנו מעבדים נתוני חשבון, סנכרון ותמיכה כדי לספק תכונות שביקשתם; נתוני ניתוח ואבטחה מוגבלים כדי להבין את השירות ולהגן עליו; נתונים המבוססים על הסכמה כאשר נדרשת הסכמה; ונתונים הדרושים לעמידה בחובות משפטיות חלות.'
          ]
        },
        {
          id: 'guest-data',
          title: '3. שימוש כאורחים ואחסון בדפדפן',
          paragraphs: [
            'כאשר משתמשים ב־SCHNGN כאורחים, תאריכי הנסיעות, התוויות, מידע אופציונלי על מדינות הכניסה והיציאה, טווחי השהייה, המצב ותוצאות החישוב נשארים בדפדפן. החישובים והסימולציות שלא נשמרו פועלים במכשיר שלכם. שאלת הדרכון האופציונלית משתמשת רק במדינת ההנפקה בזיכרון הזמני של הדפדפן כדי להציג הודעה על הסכם דו־צדדי אפשרי; המידע אינו נשמר עם הנסיעות ואינו נשלח לניתוח שימוש. אחסון הדפדפן שומר גם העדפות תפעוליות כגון שפה, התשובה לגבי נסיעות קודמות וקבוצת מחיר לבדיקה; קבצים ציבוריים של היישום עשויים להישמר במטמון לשימוש לא מקוון. גיבוי JSON נוצר ונקרא מקומית בשליטתכם ואינו מועלה רק משום שייצאתם או ייבאתם אותו.'
          ],
          items: [
            'נתוני הנסיעות בדפדפן נשארים עד שתנקו או תחליפו אותם, או עד לניקוי נתוני האתר.',
            'עוגיית העדפת השפה נשמרת עד שנה.',
            'גיבויי JSON מקומיים הם קבצים רגילים; האחריות לשמור עליהם באופן מאובטח היא שלכם.'
          ]
        },
        {
          id: 'accounts-google',
          title: '4. חשבונות אופציונליים וכניסה עם Google',
          paragraphs: [
            'Clerk נטענת בדפים ציבוריים כדי לבדוק אם אתם מחוברים, ועשויה לעבד נתוני הפעלה, מכשיר ורשת חיוניים. אם בחרתם כניסה עם Google, ‏Google שולחת ל־Clerk נתוני זהות בסיסיים, כגון מזהה קבוע, כתובת דוא״ל, שם או תמונת פרופיל כאשר הם זמינים, וכן את תגובת OAuth. ‏Clerk מנהלת את פרטי הגישה והאסימונים של ספק הזהות ואת ההפעלה לפי המדיניות שלה. SCHNGN מקבלת את הפעלת Clerk ואת מזהה המשתמש שנוצרו כדי לזהות את החשבון הפעיל, להציג את מצב הכניסה ואת כתובת הדוא״ל ולקשר נסיעות שבחרתם במפורש לשמור. ב־Cloudflare D1 נשמר לצד הנסיעות שאישרתם רק מזהה המשתמש של Clerk, ולא כתובת הדוא״ל, השם, תמונת הפרופיל של Google או אסימוני הספק. SCHNGN אינה מבקשת גישה ל־Gmail, ל־Google Drive, ל־Calendar, לאנשי קשר, לסיסמת Google שלכם או לתוכן אחר של Google; אינה מוכרת נתוני משתמש של Google ואינה משתמשת בהם לפרסום.'
          ]
        },
        {
          id: 'account-sync',
          title: '5. סנכרון נסיעות אופציונלי, ייצוא ומחיקה',
          paragraphs: [
            'השלמת פעולה מסומנת בבירור של הרשמה ושמירה, או הפעלה נפרדת של סנכרון כשאתם מחוברים, שולחת אל Cloudflare D1 את תמונת המצב הנוכחית והמאומתת של הנסיעות. תמונה זו כוללת את מזהה המשתמש המאומת של Clerk, את מלוא פרטי הנסיעות השמורות, מטא־נתונים של גרסה והסכמה וחותמות זמן. לאחר ההפעלה, עריכות או ייבואים שיישמרו בהמשך יכולים להסתנכרן. לצורך הסנכרון, האחסון המקומי בדפדפן שומר גם את מזהה המשתמש של Clerk, גרסת השרת, מצב סנכרון או השהיה וטביעת אצבע של הנסיעות; אחסון ההפעלה עשוי לשמור זמנית כוונת הרשמה ושמירה. מטא־נתונים אלה אינם נכללים בייצוא JSON ומוסרים באמצעות הפעולה המפורשת „יציאה וניקוי הדפדפן הזה” או בניקוי נתוני האתר. ייצוא JSON כולל את עותק הנסיעות הנוכחי מהדפדפן, ולא את כל נתוני הזהות, התמיכה, היומנים או הנתונים שבידי הספקים. „מחיקת נסיעות שמורות בחשבון” מסירה את תמונת D1 הפעילה, אך אינה מוחקת את הנסיעות בדפדפן או את חשבון Clerk. מחיקת חשבון Clerk מפעילה את ניקוי התמונה ויוצרת שומר מחיקה עם גיבוב חד־כיווני, המשמש במשך 30 יום כדי למנוע יצירה מחדש מהפעלה ישנה; לאחר מכן מתעלמים ממנו והוא נמחק בהזדמנות הבאה של פעולת ניקוי.'
          ]
        },
        {
          id: 'analytics',
          title: '6. ניתוח שימוש מצטבר',
          paragraphs: [
            'באתר הייצור, Plausible עשויה לקבל אירועים מרשימה מורשית, כגון צפייה בדף, התחלת מחשבון, הוספת נסיעה, הרצת סימולציה והתעניינות בפתיחת תכונה, לצד קטגוריות כלליות כגון טווח מספר הנסיעות, התוצאה, טווח מרווח הביטחון, המקור או קבוצת מחיר לבדיקה. SCHNGN מסירה מחרוזות שאילתה ומקטעי hash ואוסרת תאריכי נסיעות, תוויות, מדינות, צירי זמן, בחירת דרכון, דוא״ל ומזהי חשבון. ניתוח Plausible מוגדר ללא עוגיות ניתוח וללא מעקב אוטומטי אחר טפסים, הורדות וקישורים יוצאים. Plausible עדיין עשויה לעבד מידע רשת רגיל כדי להפיק נתונים סטטיסטיים מצטברים.'
          ]
        },
        {
          id: 'support-security',
          title: '7. תמיכה, אבטחה ונתונים טכניים',
          paragraphs: [
            'אם תפנו אלינו, SCHNGN שולחת את סוג הפנייה, שם אופציונלי, כתובת דוא״ל, ההודעה והשפה שנבחרה דרך שירותי הדוא״ל של Cloudflare אל תיבת התמיכה שלנו ב־Proton. אסימון Turnstile מאומת בנפרד מול Cloudflare ואינו נכלל בדוא״ל התמיכה. היסטוריית נסיעות לעולם אינה מצורפת אוטומטית, אך נקבל כל דבר שתקלידו בעצמכם בהודעה. Cloudflare משתמשת בכתובת ה־IP של החיבור להגבלת קצב ולבדיקת Turnstile ומעבדת מטא־נתונים רגילים של בקשה, מכשיר, דפדפן, אבטחה ושגיאות בעת אספקת האתר והגנתו. SCHNGN אינה משתמשת ב־Sentry, ויומני היישום שלה אינם רשאים לכלול את תוכן הנסיעות, כתובות הדוא״ל של חשבונות או מזהי משתמש של Clerk.'
          ]
        },
        {
          id: 'providers',
          title: '8. ספקי שירות ועיבוד בין־לאומי',
          paragraphs: [
            'SCHNGN משתמשת ב־Cloudflare לאירוח, אחסון, אבטחה ומשלוח דוא״ל; ב־Clerk לזהות ולהפעלות; ב־Google רק כאשר אתם בוחרים כניסה עם Google; ב־Plausible לניתוח מצטבר מוגבל; וב־Proton לתיבת התמיכה. ספקים אלה עשויים לעבד נתונים במדינות מחוץ למדינתכם. ההודעות שפרסמו מתארות את המיקומים, תקופות השמירה ואמצעי ההגנה להעברות. אנו משתפים נתונים רק במידה הדרושה לספק פונקציות אלה, להגן על השירות, למלא את הוראותיכם או לציית לחוק; איננו מוכרים מידע אישי.'
          ]
        },
        {
          id: 'retention-security',
          title: '9. שמירה, מחיקה ואבטחה',
          paragraphs: [
            'נתוני הדפדפן נשארים עד שאתם או הדפדפן מסירים אותם. נסיעות פעילות שסונכרנו נשארות עד להחלפתן או למחיקתן. הודעות בתיבת Proton נשארות עד ש־SCHNGN מוחקת אותן; נכון לעכשיו איננו מתחייבים לתקופת שמירה קבועה. יש למחוק אותן כאשר הן אינן נחוצות עוד באופן סביר להמשך טיפול, לאבטחה, למחלוקות או לחובות משפטיות. גיבויי ספקים, רשומות תפעוליות, נתוני חשבון וניתוח מצטבר כפופים ללוחות השמירה שהוגדרו אצל הספקים, וייתכן שיידרש זמן עד שיפוגו לאחר מחיקת הנתונים הפעילים. SCHNGN משתמשת בבקרות גישה, בקלט מאומת, בבעלות מאומתת ובחיבורי HTTPS מוצפנים, אך שום שיטת אחסון מקוונת או מקומית אינה בטוחה לחלוטין.'
          ]
        },
        {
          id: 'rights-changes',
          title: '10. הבחירות, הזכויות ושינויי המדיניות',
          paragraphs: [
            'אפשר להשתמש במחשבון ללא חשבון, לנקות נתוני דפדפן, לייצא נסיעות מהדפדפן, למחוק את תמונת הנסיעות הפעילה בחשבון או לנהל ולמחוק את חשבון Clerk. בהתאם לדין החל, ייתכן שתוכלו לבקש גישה, תיקון, מחיקה, הגבלה או ניידות, להתנגד לעיבוד מסוים, לחזור בכם מהסכמה כאשר היא הבסיס לעיבוד ולהגיש תלונה לרשות המקומית להגנת מידע. מסירת נתוני חשבון או תמיכה היא אופציונלית, אך התכונות האלה אינן יכולות לפעול בלעדיהם. SCHNGN אינה מקבלת החלטות אוטומטיות בעלות משמעות משפטית: תוצאות המחשבון הן הערכות לתכנון. נעדכן דף זה לפני שינוי מהותי באופן השימוש בנתונים.'
          ]
        }
      ],
      contactTitle: 'שאלות או בקשות בנושא פרטיות',
      contactBody: 'שלחו דוא״ל אל support@schngn.com. תארו את הבקשה בלי לשלוח מספרי דרכון, אשרה או מסמכים רגישים אחרים. ייתכן שנצטרך לאמת בקשה הנוגעת לחשבון לפני שנפעל.',
      contactLinkLabel: 'יצירת קשר עם תמיכת SCHNGN',
      providerLinksTitle: 'מידע הפרטיות של הספקים',
      providerLinks: providerLinks([
        'מדיניות הפרטיות של Cloudflare',
        'מדיניות הפרטיות של Clerk',
        'מדיניות הפרטיות של Google',
        'מדיניות הנתונים של Plausible',
        'מדיניות הפרטיות של Proton'
      ])
    },
    terms: {
      navLabel: 'סעיפי תנאי השימוש',
      title: 'תנאי שימוש',
      metaDescription: 'התנאים לשימוש במחשבון 90/180 הימים של שנגן מבית SCHNGN, באחסון נסיעות מקומי ובתכונות החשבון האופציונליות.',
      intro: 'תנאים אלה מסדירים את השימוש שלכם ב־schngn.com וביישום האינטרנט SCHNGN. הם נכתבו כדי לשמור על ההבטחה המרכזית של המוצר: כלי תכנון שימושי עם מגבלות שקופות וחשבונות אופציונליים.',
      updatedLabel: 'עודכן לאחרונה',
      updatedDate: UPDATED_DATE,
      summaryTitle: 'עיקרי הדברים',
      summaryItems: [
        'המחשבון זמין ללא חשבון; שמירת נסיעות מקוונת היא אופציונלית.',
        'SCHNGN היא כלי עזר לתכנון, לא ייעוץ משפטי ולא הבטחה לכניסה.',
        'האחריות לתאריכים מדויקים ולבדיקת מקורות רשמיים לפני הנסיעה היא שלכם.',
        'השתמשו בשירות כחוק ושמרו על אבטחת הגישה לכל חשבון.'
      ],
      sections: [
        {
          id: 'using-schngn',
          title: '1. שימוש ב־SCHNGN',
          paragraphs: [
            'בשימוש ב־SCHNGN אתם מסכימים לתנאים אלה ולמדיניות הפרטיות. אפשר להשתמש במחשבון כאורחים. אם אתם יוצרים חשבון, עליכם להיות כשירים משפטית להסכים לתנאים אלה; מי שאינו כשיר לכך צריך להשתמש ב־SCHNGN רק עם הורה, אפוטרופוס או אדם מורשה אחר. אם אינכם מסכימים, אל תשתמשו בשירות.'
          ]
        },
        {
          id: 'planning-aid',
          title: '2. כלי עזר לתכנון בלבד',
          paragraphs: [
            'SCHNGN מעריכה שהיות קצרות רגילות לפי כלל 90/180 הימים של שנגן. היא אינה ייעוץ משפטי או ייעוץ הגירה ואינה מבטיחה כניסה, שהייה חוקית או החלטה כלשהי של רשות גבול, אשרות או הגירה. ייתכן שהיא אינה מביאה בחשבון היתרי תושבות, אשרות ארוכות טווח או לאומיות, הסכמי פטור דו־צדדיים, חריגים לפי אזרחות, מעמד עבודה, לימודים, מקלט או הגנה זמנית, תקופות מעבר של כללים או שיקול דעת רשמי. הודעה ספציפית לדרכון או למדינה לגבי הסכם דו־צדדי אפשרי היא מידע בלבד, ואינה משנה את החישוב המרכזי או קובעת שהארכה חלה עליכם. אמתו את מצבכם מול מקורות רשמיים והרשויות הרלוונטיות לפני הזמנה או נסיעה.'
          ]
        },
        {
          id: 'responsibilities',
          title: '3. האחריות שלכם',
          paragraphs: [
            'אתם אחראים להזנת תאריכים מלאים ומדויקים, לפירוש התוצאה בהתאם למעמדכם, לשמירת הגיבויים הדרושים ולבדיקה עצמאית של הכללים העדכניים. ראיות כניסה ויציאה, תנאי אשרה והוראות הרשויות גוברים על SCHNGN. אל תסתמכו על תוצאה שנשמרה במטמון, יוצאה או חושבה בעבר לאחר שהתוכניות או הכללים החלים השתנו.'
          ]
        },
        {
          id: 'storage-accounts',
          title: '4. אחסון מקומי, חשבונות וסנכרון',
          paragraphs: [
            'נסיעות של אורחים נשמרות בדפדפן ועלולות ללכת לאיבוד אם נתוני האתר מנוקים, המכשיר מתקלקל או אדם אחר משנה את פרופיל הדפדפן. חשבונות אופציונליים מסופקים באמצעות Clerk. פעולה מסומנת של הרשמה ושמירה או בחירת סנכרון נפרדת מאשרת ל־SCHNGN לשמור את תמונת הנסיעות המאומתת עבור אותו חשבון. שמרו על אבטחת הגישה לחשבון, התנתקו ונקו את נתוני הדפדפן במכשירים משותפים לפי הצורך, ועיינו במדיניות הפרטיות לפרטי ייצוא, מחיקה וספקים.'
          ]
        },
        {
          id: 'acceptable-use',
          title: '5. שימוש מקובל',
          paragraphs: [
            'אין לעשות שימוש לרעה ב־SCHNGN, להפריע להפעלתה או לאבטחתה, לבדוק או לעקוף בקרות גישה, לשלוח חומר לא חוקי או מזיק, ליצור תעבורה פוגענית אוטומטית, להתחזות לאדם אחר, לגשת לחשבון אחר או להשתמש בשירות כדי לסייע להונאה או לנסיעה בלתי חוקית. בדיקות אבטחה סבירות דורשות אישור מראש ובכתב. אנו רשאים להגביל גישה לפי הצורך כדי לעצור שימוש לרעה, להגן על משתמשים או לציית לחוק.'
          ]
        },
        {
          id: 'ownership-third-parties',
          title: '6. תוכן SCHNGN ושירותי צד שלישי',
          paragraphs: [
            'השם SCHNGN, העיצוב, התוכנה והתוכן המקורי מוגנים בדיני הקניין הרוחני החלים. תנאים אלה מעניקים לכם זכות מוגבלת, ניתנת לביטול ולא בלעדית להשתמש בשירות לתכנון אישי; הם אינם מעבירים בעלות. לקישורים למקורות רשמיים, ל־Clerk, ל־Google, ל־Cloudflare, ל־Plausible ולשירותי צד שלישי אחרים יש תנאים ומדיניות משלהם. SCHNGN אינה מוסד של האיחוד האירופי ואינה מאושרת או מוסמכת על ידיו.'
          ]
        },
        {
          id: 'availability-changes',
          title: '7. זמינות ושינויים',
          paragraphs: [
            'אנו שואפים לשמור על SCHNGN מדויקת וזמינה, אך השירות עשוי להיקטע, להתעכב או להשתנות. התכונות, הספקים, הכללים הנתמכים או הזמינות החינמית עשויים להשתנות, ואנו עשויים לתקן או להסיר תוכן. ככל שהדבר אפשרי באופן סביר, שינויים מהותיים המשפיעים על נתוני חשבון שמורים יוסברו לפני כניסתם לתוקף. שמרו רשומות עצמאיות לכל החלטת נסיעה החשובה לכם.'
          ]
        },
        {
          id: 'disclaimers-liability',
          title: '8. הסתייגויות ואחריות',
          paragraphs: [
            'במלוא המידה שהחוק מתיר, SCHNGN מסופקת „כמות שהיא” ו„לפי זמינות”, ללא הבטחה שכל תוצאה, מקור, ספק או תכונה יהיו תמיד מלאים, עדכניים או נקיים משגיאות. SCHNGN אינה אחראית להחלטות רשויות, סירוב כניסה, שהיית יתר, קנסות, עלויות נסיעה, הזמנות שהוחמצו, אובדן נתונים מקומיים או הפסדים עקיפים שנגרמו מהסתמכות על השירות, כאשר החוק מתיר הגבלה כזאת. דבר בתנאים אלה אינו שולל אחריות שלא ניתן לשלול כחוק או מגביל זכויות צרכניות מחייבות.'
          ]
        },
        {
          id: 'ending-rights-contact',
          title: '9. סיום שימוש, זכויות חלות ויצירת קשר',
          paragraphs: [
            'אפשר להפסיק להשתמש ב־SCHNGN בכל עת, לנקות נתונים מקומיים, למחוק את תמונת הנסיעות הפעילה שסונכרנה ולנהל או למחוק בנפרד את חשבון Clerk. אנו רשאים להשעות שימוש פוגעני או בלתי חוקי. דין מחייב והגנות צרכניות חלים ממשיכים לעמוד בתוקף; תנאים אלה אינם קובעים בית משפט ואינם שוללים זכויות שהחוק מעניק לכם. אנו עשויים לעדכן תנאים אלה כאשר השירות או הדרישות המשפטיות משתנים, עם התאריך המוצג לעיל. אפשר לשלוח שאלות אל support@schngn.com.'
          ]
        }
      ],
      contactTitle: 'שאלות על תנאים אלה',
      contactBody: 'פנו אל support@schngn.com אם יש לכם שאלה על SCHNGN או על תנאים אלה. תמיכת המוצר אינה יכולה להכריע במעמד ההגירה שלכם או לספק ייעוץ משפטי.',
      contactLinkLabel: 'יצירת קשר עם תמיכת SCHNGN'
    }
  },
  ar: {
    footer: {
      navigation: 'المعلومات القانونية والدعم',
      privacy: 'الخصوصية',
      terms: 'الشروط',
      contact: 'التواصل',
      disclaimer: 'أداة للمساعدة في التخطيط فقط — وليست مشورة قانونية ولا ضمانًا للدخول. تحقّق من المصادر الرسمية.',
      copyright: '© 2026 SCHNGN'
    },
    privacy: {
      navLabel: 'أقسام سياسة الخصوصية',
      title: 'سياسة الخصوصية',
      metaDescription: 'كيفية تعامل SCHNGN مع بيانات الرحلات المحلية، ومزامنة الحساب الاختيارية، وتسجيل الدخول باستخدام Google، والتحليلات، وطلبات الدعم، وخيارات الخصوصية المتاحة لك.',
      intro: 'صُممت SCHNGN لحساب خطط السفر من دون اشتراط إنشاء حساب. تشرح هذه السياسة ما يبقى في متصفحك، وما تتم معالجته عند اختيار الميزات الاختيارية عبر الإنترنت، ووسائل التحكم المتاحة لك.',
      updatedLabel: 'آخر تحديث',
      updatedDate: UPDATED_DATE,
      summaryTitle: 'الخلاصة',
      summaryItems: [
        'تبقى تفاصيل رحلات الضيف في متصفحك ما لم تختر مزامنة الحساب صراحةً.',
        'يتيح تسجيل الدخول باستخدام Google عبر Clerk إنشاء حساب SCHNGN اختياري والوصول إليه؛ وتظل مزامنة الرحلات خيارًا صريحًا منفصلًا.',
        'قد تتلقى Plausible فئات عامة للاستخدام والنتائج، لكنها لا تتلقى أبدًا تواريخ رحلاتك أو تسمياتها أو بلدانها أو بريدك الإلكتروني أو معرّف حسابك.',
        'يمكنك تصدير النسخة الحالية من الرحلات في المتصفح وحذف لقطة الرحلات النشطة المحفوظة في حسابك.'
      ],
      sections: [
        {
          id: 'scope',
          title: '1. نطاق هذه السياسة',
          paragraphs: [
            'تشمل هذه السياسة موقع schngn.com وتطبيق الويب SCHNGN وميزات الحساب والمزامنة والتحليلات والدعم فيه. SCHNGN حاسبة للتخطيط، ولا تطلب ضمن ميزاتها المعتادة الوصول إلى GPS، ولا تمسح جوازات السفر ضوئيًا، ولا تجمع أرقام التأشيرات أو وثائق الإقامة.'
          ]
        },
        {
          id: 'responsibility',
          title: '2. الجهة المسؤولة وسبب معالجة البيانات',
          paragraphs: [
            'تدير SCHNGN موقع schngn.com وهي مسؤولة عن المعالجة الخاصة بالتطبيق والموضحة هنا. أرسل أسئلة الخصوصية إلى support@schngn.com. نعالج بيانات الحساب والمزامنة والدعم لتقديم الميزات التي تطلبها؛ وبيانات محدودة للتحليلات والأمان لفهم الخدمة وحمايتها؛ والبيانات المستندة إلى الموافقة عندما تكون الموافقة مطلوبة؛ والبيانات اللازمة للوفاء بالالتزامات القانونية السارية.'
          ]
        },
        {
          id: 'guest-data',
          title: '3. الاستخدام كضيف والتخزين في المتصفح',
          paragraphs: [
            'عند استخدام SCHNGN كضيف، تبقى تواريخ الرحلات وتسمياتها، والسياق الاختياري لبلدان الدخول والخروج، وفترات الإقامة، والحالة، ونتائج الحساب في متصفحك. تعمل الحسابات والمحاكاة غير المحفوظة على جهازك. يستخدم سؤال جواز السفر الاختياري بلد الإصدار فقط في ذاكرة المتصفح المؤقتة لعرض إشعار عن اتفاق ثنائي محتمل؛ ولا يُحفظ هذا الاختيار مع الرحلات ولا يُرسل إلى التحليلات. يحتفظ تخزين المتصفح أيضًا بتفضيلات تشغيلية مثل اللغة، والإجابة المتعلقة بالسفر السابق، وشريحة سعر اختبارية؛ وقد تُخزّن ملفات التطبيق العامة مؤقتًا للاستخدام من دون اتصال. تُنشأ نسخة JSON الاحتياطية وتُقرأ محليًا تحت سيطرتك، ولا تُرفع لمجرد تصديرها أو استيرادها.'
          ],
          items: [
            'تبقى بيانات الرحلات في المتصفح إلى أن تمسحها أو تستبدلها أو تمسح بيانات الموقع.',
            'يستمر ملف تعريف ارتباط تفضيل اللغة مدة تصل إلى سنة واحدة.',
            'نُسخ JSON الاحتياطية المحلية ملفات عادية؛ وأنت مسؤول عن حفظها بأمان.'
          ]
        },
        {
          id: 'accounts-google',
          title: '4. الحسابات الاختيارية وتسجيل الدخول باستخدام Google',
          paragraphs: [
            'تُحمّل Clerk في الصفحات العامة للتحقق مما إذا كنت مسجّل الدخول، وقد تعالج بيانات أساسية عن الجلسة والجهاز والشبكة. إذا اخترت تسجيل الدخول باستخدام Google، ترسل Google إلى Clerk بيانات هوية أساسية، مثل معرّف ثابت وعنوان البريد الإلكتروني والاسم أو صورة الملف الشخصي عند توفرهما، إلى جانب استجابة OAuth. تدير Clerk بيانات اعتماد المزوّد ورموزه والجلسة وفق سياستها. تتلقى SCHNGN جلسة Clerk ومعرّف المستخدم الناتجين للتعرّف على الحساب النشط، وعرض حالة تسجيل الدخول والبريد الإلكتروني، وربط الرحلات التي تختار حفظها صراحةً. لا يُحفظ في Cloudflare D1 مع الرحلات التي وافقت على حفظها سوى معرّف مستخدم Clerk، ولا تُحفظ فيه عناوين Google الإلكترونية أو الأسماء أو صور الملفات الشخصية أو رموز المزوّد. لا تطلب SCHNGN الوصول إلى Gmail أو Google Drive أو Calendar أو جهات الاتصال أو كلمة مرور Google أو أي محتوى آخر من Google؛ ولا تبيع بيانات مستخدمي Google ولا تستخدمها للإعلانات.'
          ]
        },
        {
          id: 'account-sync',
          title: '5. مزامنة الرحلات الاختيارية والتصدير والحذف',
          paragraphs: [
            'يؤدي إكمال إجراء واضح للتسجيل والحفظ، أو تمكين المزامنة بصورة منفصلة أثناء تسجيل الدخول، إلى إرسال لقطة الرحلات الحالية المتحقق منها إلى Cloudflare D1. تشمل اللقطة معرّف مستخدم Clerk المتحقق منه، وكامل تفاصيل الرحلات المحفوظة، وبيانات وصفية للمراجعة والموافقة، وطوابع زمنية. بعد التمكين، يمكن مزامنة التعديلات أو الواردات التي تُحفظ لاحقًا. ولدعم المزامنة، يحتفظ التخزين المحلي في المتصفح أيضًا بمعرّف مستخدم Clerk ومراجعة الخادم وحالة المزامنة أو الإيقاف المؤقت وبصمة للرحلات؛ وقد يحتفظ تخزين الجلسة مؤقتًا بقصد التسجيل والحفظ. لا تُدرج هذه البيانات الوصفية في تصدير JSON، وتُزال باستخدام إجراء «تسجيل الخروج ومسح هذا المتصفح» الصريح أو عند مسح بيانات الموقع. يتضمن تصدير JSON نسخة الرحلات الحالية في المتصفح، وليس كل بيانات الهوية أو الدعم أو السجلات أو البيانات التي يحتفظ بها المزوّدون. يزيل خيار «حذف الرحلات المحفوظة في الحساب» لقطة D1 النشطة، لكنه لا يحذف رحلات المتصفح أو حساب Clerk. يؤدي حذف حساب Clerk إلى تنظيف اللقطة وإنشاء حاجز حذف ذي تجزئة أحادية الاتجاه يُستخدم مدة 30 يومًا لمنع جلسة قديمة من إعادة إنشاء البيانات؛ وبعد ذلك يُتجاهل ويُحذف عند إتاحة فرصة تنظيف لاحقة.'
          ]
        },
        {
          id: 'analytics',
          title: '6. التحليلات المجمّعة',
          paragraphs: [
            'في الموقع التشغيلي، قد تتلقى Plausible أحداثًا مدرجة في القائمة المسموح بها، مثل عرض الصفحة وبدء الحاسبة وإضافة رحلة وتشغيل محاكاة وإبداء الاهتمام بإلغاء القفل، إلى جانب فئات عامة مثل نطاق عدد الرحلات، والنتيجة، ونطاق الهامش الآمن، والمصدر، أو شريحة السعر الاختبارية. تزيل SCHNGN سلاسل الاستعلام وأجزاء hash وتحظر تواريخ الرحلات وتسمياتها وبلدانها ومخططاتها الزمنية واختيار جواز السفر والبريد الإلكتروني ومعرّفات الحساب. أُعدّت تحليلات Plausible من دون ملفات ارتباط للتحليلات أو تتبع تلقائي للنماذج والتنزيلات والروابط الخارجية. وقد تعالج Plausible مع ذلك معلومات الشبكة المعتادة لإنتاج إحصاءات مجمّعة.'
          ]
        },
        {
          id: 'support-security',
          title: '7. الدعم والأمان والبيانات التقنية',
          paragraphs: [
            'إذا تواصلت معنا، ترسل SCHNGN نوع الطلب والاسم الاختياري وعنوان البريد الإلكتروني والرسالة واللغة المختارة عبر خدمات البريد الإلكتروني من Cloudflare إلى صندوق دعم Proton الخاص بنا. يجري التحقق من رمز Turnstile بصورة منفصلة لدى Cloudflare ولا يُدرج في رسالة الدعم. لا يُرفق سجل الرحلات تلقائيًا أبدًا، لكننا سنتلقى كل ما تكتبه بنفسك في الرسالة. تستخدم Cloudflare عنوان IP المتصل لتحديد معدل الطلبات والتحقق من Turnstile، وتعالج البيانات الوصفية المعتادة للطلبات والأجهزة والمتصفحات والأمان والأخطاء عند تقديم الموقع وحمايته. لا تستخدم SCHNGN خدمة Sentry، ويجب ألا تتضمن سجلات تطبيقها محتوى الرحلات أو عناوين البريد الإلكتروني للحسابات أو معرّفات مستخدمي Clerk.'
          ]
        },
        {
          id: 'providers',
          title: '8. مزوّدو الخدمة والمعالجة الدولية',
          paragraphs: [
            'تستخدم SCHNGN ‏Cloudflare للاستضافة والتخزين والأمان وتسليم البريد الإلكتروني؛ وClerk للهوية والجلسات؛ وGoogle فقط عندما تختار تسجيل الدخول باستخدام Google؛ وPlausible للتحليلات المجمّعة المحدودة؛ وProton لصندوق الدعم. قد يعالج هؤلاء المزوّدون البيانات في بلدان خارج بلدك. تشرح إشعاراتهم المنشورة المواقع وفترات الاحتفاظ وضمانات النقل. لا نشارك البيانات إلا بالقدر اللازم لتقديم هذه الوظائف أو حماية الخدمة أو اتباع تعليماتك أو الامتثال للقانون؛ ولا نبيع البيانات الشخصية.'
          ]
        },
        {
          id: 'retention-security',
          title: '9. الاحتفاظ والحذف والأمان',
          paragraphs: [
            'تبقى بيانات المتصفح حتى تزيلها أنت أو متصفحك. وتبقى الرحلات النشطة المتزامنة حتى تُستبدل أو تُحذف. تبقى الرسائل في صندوق Proton حتى تحذفها SCHNGN؛ ولا نعد حاليًا بفترة احتفاظ ثابتة. وينبغي حذفها عندما لا تعود مطلوبة بصورة معقولة للمتابعة أو الأمان أو النزاعات أو الالتزامات القانونية. تخضع نُسخ المزوّدين الاحتياطية والسجلات التشغيلية وبيانات الحساب والتحليلات المجمّعة لجداول الاحتفاظ المضبوطة لدى المزوّدين، وقد يستغرق انقضاؤها وقتًا بعد حذف البيانات النشطة. تستخدم SCHNGN ضوابط الوصول والمدخلات المتحقق منها والملكية الموثّقة واتصالات HTTPS المشفّرة، لكن لا توجد طريقة تخزين محلية أو عبر الإنترنت آمنة تمامًا.'
          ]
        },
        {
          id: 'rights-changes',
          title: '10. خياراتك وحقوقك وتغييرات السياسة',
          paragraphs: [
            'يمكنك استخدام الحاسبة من دون حساب، ومسح بيانات المتصفح، وتصدير رحلات المتصفح، وحذف لقطة رحلات الحساب النشطة، أو إدارة حساب Clerk وحذفه. بحسب القانون الساري، قد يحق لك طلب الوصول أو التصحيح أو الحذف أو التقييد أو قابلية النقل، والاعتراض على بعض المعالجة، وسحب الموافقة عندما تكون هي الأساس، وتقديم شكوى إلى هيئة حماية البيانات المحلية. تقديم بيانات الحساب أو الدعم اختياري، لكن هذه الميزات لا تعمل من دونها. لا تتخذ SCHNGN قرارات آلية ذات أثر قانوني مهم؛ فنتائج الحاسبة تقديرات للتخطيط. سنحدّث هذه الصفحة قبل إجراء تغيير جوهري في كيفية استخدام البيانات.'
          ]
        }
      ],
      contactTitle: 'أسئلة أو طلبات الخصوصية',
      contactBody: 'أرسل بريدًا إلكترونيًا إلى support@schngn.com. صِف طلبك من دون إرسال أرقام جوازات السفر أو التأشيرات أو غيرها من أرقام الوثائق الحساسة. قد نحتاج إلى التحقق من طلب متعلق بالحساب قبل تنفيذه.',
      contactLinkLabel: 'التواصل مع دعم SCHNGN',
      providerLinksTitle: 'معلومات الخصوصية لدى المزوّدين',
      providerLinks: providerLinks([
        'سياسة خصوصية Cloudflare',
        'سياسة خصوصية Clerk',
        'سياسة خصوصية Google',
        'سياسة بيانات Plausible',
        'سياسة خصوصية Proton'
      ])
    },
    terms: {
      navLabel: 'أقسام شروط الاستخدام',
      title: 'شروط الاستخدام',
      metaDescription: 'شروط استخدام حاسبة SCHNGN لقاعدة شنغن 90/180 يومًا، وتخزين الرحلات محليًا، وميزات الحساب الاختيارية.',
      intro: 'تحكم هذه الشروط استخدامك لموقع schngn.com وتطبيق الويب SCHNGN. وقد كُتبت للحفاظ على الوعد الأساسي للمنتج: أداة تخطيط مفيدة بحدود واضحة وحسابات اختيارية.',
      updatedLabel: 'آخر تحديث',
      updatedDate: UPDATED_DATE,
      summaryTitle: 'النقاط الأساسية',
      summaryItems: [
        'الحاسبة متاحة من دون حساب؛ وحفظ الرحلات عبر الإنترنت اختياري.',
        'SCHNGN أداة للمساعدة في التخطيط، وليست مشورة قانونية ولا ضمانًا للدخول.',
        'أنت مسؤول عن دقة التواريخ وعن مراجعة المصادر الرسمية قبل السفر.',
        'استخدم الخدمة بصورة قانونية وحافظ على أمان الوصول إلى أي حساب.'
      ],
      sections: [
        {
          id: 'using-schngn',
          title: '1. استخدام SCHNGN',
          paragraphs: [
            'باستخدام SCHNGN، فإنك توافق على هذه الشروط وسياسة الخصوصية. يمكنك استخدام الحاسبة كضيف. إذا أنشأت حسابًا، فيجب أن تتمتع بالأهلية القانونية للموافقة على هذه الشروط؛ وعلى من لا يملك هذه الأهلية استخدام SCHNGN فقط برفقة أحد الوالدين أو الوصي أو شخص آخر مخوّل. إذا لم توافق، فلا تستخدم الخدمة.'
          ]
        },
        {
          id: 'planning-aid',
          title: '2. أداة للتخطيط فقط',
          paragraphs: [
            'تقدّر SCHNGN الإقامات القصيرة العادية بموجب قاعدة شنغن 90/180 يومًا. وهي ليست مشورة قانونية أو متعلقة بالهجرة، ولا تضمن الدخول أو الإقامة القانونية أو أي قرار من سلطة حدود أو تأشيرات أو هجرة. وقد لا تراعي تصاريح الإقامة أو التأشيرات طويلة الأجل أو الوطنية أو اتفاقات الإعفاء الثنائية أو الاستثناءات الخاصة بالجنسية أو وضع العمل أو الدراسة أو اللجوء أو الحماية المؤقتة أو الفترات الانتقالية للقواعد أو التقدير الرسمي. الإشعار المرتبط بجواز سفر أو بلد بشأن اتفاق ثنائي محتمل مخصص للمعلومات فقط، ولا يغيّر الحساب الأساسي ولا يقرر أن تمديدًا ينطبق عليك. تحقّق من وضعك عبر المصادر الرسمية والسلطات المختصة قبل الحجز أو السفر.'
          ]
        },
        {
          id: 'responsibilities',
          title: '3. مسؤولياتك',
          paragraphs: [
            'أنت مسؤول عن إدخال تواريخ كاملة ودقيقة، وتفسير النتيجة في ضوء وضعك، والاحتفاظ بالنُسخ الاحتياطية التي تحتاجها، والتحقق المستقل من القواعد الحالية. تتقدم أدلة الدخول والخروج وشروط التأشيرة وتعليمات السلطات على SCHNGN. لا تعتمد على نتيجة مخزنة مؤقتًا أو مصدّرة أو محسوبة سابقًا بعد تغير خططك أو القواعد السارية.'
          ]
        },
        {
          id: 'storage-accounts',
          title: '4. التخزين المحلي والحسابات والمزامنة',
          paragraphs: [
            'تُخزن رحلات الضيف في متصفحك وقد تُفقد إذا مُسحت بيانات الموقع أو تعطّل الجهاز أو غيّر شخص آخر ملف المتصفح. تُقدّم الحسابات الاختيارية عبر Clerk. يجيز إجراء واضح للتسجيل والحفظ أو اختيار مزامنة منفصل لـSCHNGN تخزين لقطة الرحلات المتحقق منها لذلك الحساب. حافظ على أمان الوصول إلى الحساب، وسجّل الخروج وامسح بيانات المتصفح على الأجهزة المشتركة عند الحاجة، وراجع سياسة الخصوصية للاطلاع على تفاصيل التصدير والحذف والمزوّدين.'
          ]
        },
        {
          id: 'acceptable-use',
          title: '5. الاستخدام المقبول',
          paragraphs: [
            'لا تُسئ استخدام SCHNGN أو تتدخل في تشغيلها أو أمانها، ولا تختبر ضوابط الوصول أو تتجاوزها، ولا ترسل مواد غير قانونية أو ضارة، ولا تؤتمت حركة مسيئة، ولا تنتحل شخصية شخص آخر، ولا تدخل إلى حساب آخر، ولا تستخدم الخدمة لتسهيل الاحتيال أو السفر غير القانوني. يتطلب اختبار الأمان المعقول إذنًا كتابيًا مسبقًا. قد نقيّد الوصول بالقدر اللازم لوقف إساءة الاستخدام أو حماية المستخدمين أو الامتثال للقانون.'
          ]
        },
        {
          id: 'ownership-third-parties',
          title: '6. محتوى SCHNGN وخدمات الأطراف الثالثة',
          paragraphs: [
            'إن اسم SCHNGN وتصميمها وبرمجياتها ومحتواها الأصلي محمية بقوانين الملكية الفكرية السارية. تمنحك هذه الشروط حقًا محدودًا وقابلًا للإلغاء وغير حصري في استخدام الخدمة للتخطيط الشخصي؛ ولا تنقل الملكية. تخضع روابط المصادر الرسمية وClerk وGoogle وCloudflare وPlausible وغيرها من خدمات الأطراف الثالثة لشروطها وسياساتها الخاصة. SCHNGN ليست مؤسسة تابعة للاتحاد الأوروبي ولا يعتمدها أو يصادق عليها الاتحاد الأوروبي.'
          ]
        },
        {
          id: 'availability-changes',
          title: '7. التوفر والتغييرات',
          paragraphs: [
            'نسعى إلى إبقاء SCHNGN دقيقة ومتاحة، لكن الخدمة قد تنقطع أو تتأخر أو تتغير. وقد تتغير الميزات أو المزوّدون أو القواعد المدعومة أو التوفر المجاني، وقد نصحح المحتوى أو نزيله. عندما يكون ذلك ممكنًا بصورة معقولة، سنشرح التغييرات الجوهرية التي تؤثر في بيانات الحساب المحفوظة قبل سريانها. احتفظ بسجلات مستقلة لأي قرار سفر مهم لك.'
          ]
        },
        {
          id: 'disclaimers-liability',
          title: '8. إخلاء المسؤولية والمسؤولية القانونية',
          paragraphs: [
            'إلى أقصى حد يسمح به القانون، تُقدّم SCHNGN «كما هي» و«حسب التوفر» من دون وعد بأن تكون كل نتيجة أو مصدر أو مزوّد أو ميزة كاملة أو حديثة أو خالية من الأخطاء دائمًا. لا تتحمل SCHNGN المسؤولية عن قرارات السلطات أو رفض الدخول أو تجاوز مدة الإقامة أو الغرامات أو تكاليف السفر أو الحجوزات الفائتة أو فقدان البيانات المحلية أو الخسائر غير المباشرة الناجمة عن الاعتماد على الخدمة، حيث يسمح القانون بهذا القيد. لا يستبعد أي شيء في هذه الشروط مسؤولية لا يمكن استبعادها قانونًا ولا يحد من حقوق المستهلك الإلزامية.'
          ]
        },
        {
          id: 'ending-rights-contact',
          title: '9. إنهاء الاستخدام والحقوق السارية والتواصل',
          paragraphs: [
            'يمكنك التوقف عن استخدام SCHNGN في أي وقت، ويمكنك مسح البيانات المحلية وحذف لقطة الرحلات النشطة المتزامنة وإدارة حساب Clerk أو حذفه بصورة منفصلة. قد نوقف الاستخدام المسيء أو غير القانوني. تظل القوانين الإلزامية السارية وحماية المستهلك نافذة؛ ولا تختار هذه الشروط محكمة ولا تزيل الحقوق التي يمنحك إياها القانون. قد نحدّث هذه الشروط عندما تتغير الخدمة أو المتطلبات القانونية، مع إظهار التاريخ أعلاه. يمكن إرسال الأسئلة إلى support@schngn.com.'
          ]
        }
      ],
      contactTitle: 'أسئلة حول هذه الشروط',
      contactBody: 'تواصل مع support@schngn.com إذا كان لديك سؤال عن SCHNGN أو هذه الشروط. لا يمكن لدعم المنتج تحديد وضعك المتعلق بالهجرة أو تقديم مشورة قانونية.',
      contactLinkLabel: 'التواصل مع دعم SCHNGN'
    }
  }
};
