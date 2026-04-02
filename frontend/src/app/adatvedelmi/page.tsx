import Link from "next/link";

export const metadata = {
  title: "Adatvédelmi Tájékoztató – HPVHelp Webshop",
};

export default function AdatvedelmiPage() {
  return (
    <div className="min-h-screen bg-[#fdf8f8] text-slate-900">
      <header className="border-b border-brand-100/80 bg-white/90 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-900 to-brand-700 shadow-md shadow-brand-200" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-900">HPVHelp Webshop</p>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-red-950 shadow-sm transition hover:bg-brand-50">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            Webshop
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-12">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Jogi dokumentum</p>
          <h1 className="font-serif mt-1 text-3xl font-bold italic text-brand-900">Adatvédelmi Tájékoztató</h1>
          <p className="mt-2 text-sm text-red-950/50">Utoljára frissítve: 2026.01.18. 17:27</p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-slate-700">

          <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-lg font-bold text-brand-900 mb-4">Adatvédelmi Irányelvek</h2>
            <h3 className="font-bold text-slate-900 mb-2">I. Bevezetés</h3>
            <p className="mb-3">A Sunmed Kft. (a továbbiakban: Adatkezelő) tevékenysége során fokozottan ügyel a személyes adatok védelmére, a kötelező jogi rendelkezések betartására, a biztonságos és tisztességes adatkezelésre. A jelen Adatvédelmi Irányelvek az Adatkezelő, és az Adatkezelő által az alábbi weboldalakon:</p>
            <ul className="ml-5 list-disc space-y-0.5 mb-3">
              <li>www.hpvhelp.hu</li>
              <li>www.neotest.hu</li>
              <li>www.beldaganatszures.hu</li>
              <li>www.gyorsteszt-aruhaz.hu</li>
              <li>www.gyorsteszt-aruhaz.eu</li>
              <li>sunmed.hu</li>
              <li>m2-pk.hu</li>
              <li>m2pk.hu</li>
              <li>virusgyorsteszt.hu</li>
              <li>otthonigyorsteszt.hu</li>
              <li>mankoshop.hu</li>
            </ul>
            <p className="mb-4">(a továbbiakban: Weboldalak vagy Webáruházak) keresztül nyújtott elektronikus kereskedelmi szolgáltatásokat igénybe vevő Ügyfél (a továbbiakban: Ügyfél) jogait és kötelezettségeit tartalmazza. (Adatkezelő és Ügyfél a továbbiakban együttesen: Felek).</p>

            <h3 className="font-bold text-slate-900 mb-3">Az Adatkezelő adatai</h3>
            <div className="grid gap-3 sm:grid-cols-2 mb-4">
              {[
                ["Székhely", "7300 Komló, Ifjúság u. 35."],
                ["Iroda", "7623 Pécs, Megyeri út 26. fszt. 108"],
                ["Cégjegyzékszám", "02-09-081275"],
                ["Közösségi adószám", "HU 11551373"],
                ["Adatkezelési szám", "NAIH-83651/2015"],
                ["Telefon", "+36 72 794 379"],
                ["FAX", "+36 72 999 372"],
                ["Mobil", "+36 30 865 7792"],
                ["E-mail", "info@sunmed.hu"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-brand-50 bg-brand-50/30 px-4 py-2.5">
                  <p className="text-xs font-semibold text-brand-700">{label}</p>
                  <p className="font-medium text-slate-900">{value}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-brand-50 bg-brand-50/30 p-4">
                <p className="font-bold text-brand-900 mb-1">Bankszámlaszám (FT)</p>
                <p>10918001-00000124-71950001</p>
                <p>UniCredit Bank Hungary Zrt.</p>
                <p>1054 Budapest, Szabadság tér 5-6.</p>
                <p>BIC/SWIFT: BACXHUHB</p>
                <p>IBAN: HU10109180010000012471950001</p>
              </div>
              <div className="rounded-xl border border-brand-50 bg-brand-50/30 p-4">
                <p className="font-bold text-brand-900 mb-1">Bankszámlaszám (EURO)</p>
                <p>11600006-00000000-84794190</p>
                <p>BIC: GIBAHUHB</p>
                <p>IBAN: HU72116000060000000084794190</p>
              </div>
            </div>

            <p className="mt-4">Az Adatkezelő a rendelkezésére bocsátott személyes adatokat minden esetben a hatályos magyar és európai jogszabályoknak és etikai elvárásoknak eleget téve kezeli, minden esetben megteszi azokat a technikai és szervezési intézkedéseket, amelyek a megfelelő biztonságos adatkezeléshez szükségesek.</p>
            <p className="mt-3">A jelen szabályzat a következő hatályos jogszabályok alapján készült: 1995. évi CXIX. tv., 2001. évi CVIII. tv., 2008. évi XLVIII. tv., 2011. évi CXII törvény, 2016/679/EU Rendelet (GDPR).</p>
            <p className="mt-3">Az Adatkezelő vállalja a Jelen szabályzat egyoldalú betartását és kéri, hogy ügyfelei is fogadják el a szabályzat rendelkezéseit. Az adatkezelő fenntartja magának a jogot, hogy az adatvédelmi szabályzatot megváltoztassa, ez esetben a módosított szabályzatot nyilvánosan közzéteszi.</p>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-lg font-bold text-brand-900 mb-4">II. Értelmező rendelkezések</h2>
            <div className="space-y-3">
              {[
                ["Személyes adat", "Bármely meghatározott (azonosított vagy azonosítható) természetes személlyel kapcsolatba hozható adat, az adatból levonható, az érintettre vonatkozó következtetés."],
                ["Hozzájárulás", "Az érintett akaratának önkéntes és határozott kinyilvánítása, amely megfelelő tájékoztatáson alapul, és amellyel félreérthetetlen beleegyezését adja a rá vonatkozó személyes adat kezeléséhez."],
                ["Tiltakozás", "Az érintett nyilatkozata, amellyel személyes adatának kezelését kifogásolja, és az adatkezelés megszüntetését, illetve a kezelt adat törlését kéri."],
                ["Adatkezelő", "Az a természetes vagy jogi személy, aki önállóan vagy másokkal együtt az adat kezelésének célját meghatározza, az adatkezelésre vonatkozó döntéseket meghozza és végrehajtja."],
                ["Adatkezelés", "Az alkalmazott eljárástól függetlenül az adaton végzett bármely művelet vagy a műveletek összessége, így különösen gyűjtése, felvétele, rögzítése, rendszerezése, tárolása, megváltoztatása, felhasználása, lekérdezése, továbbítása, nyilvánosságra hozatala, összehangolása vagy összekapcsolása, zárolása, törlése és megsemmisítése."],
                ["Adattovábbítás", "Az adat meghatározott harmadik személy számára történő hozzáférhetővé tétele."],
                ["Adattörlés", "Az adat felismerhetetlenné tétele oly módon, hogy a helyreállítása többé nem lehetséges."],
                ["Adatfeldolgozó", "Az a természetes vagy jogi személy, aki szerződés alapján adatok feldolgozását végzi."],
                ["Adatállomány", "Az egy nyilvántartásban kezelt adatok összessége."],
                ["Harmadik személy", "Olyan természetes vagy jogi személy, aki nem azonos az érintettel, az adatkezelővel vagy az adatfeldolgozóval."],
                ["EGT-állam", "Az Európai Unió tagállama és az Európai Gazdasági Térségről szóló megállapodásban részes más állam."],
                ["Harmadik ország", "Minden olyan állam, amely nem EGT-állam."],
                ["Adatvédelmi incidens", "Személyes adat jogellenes kezelése vagy feldolgozása, így különösen a jogosulatlan hozzáférés, megváltoztatás, továbbítás, nyilvánosságra hozatal, törlés vagy megsemmisítés."],
              ].map(([term, def]) => (
                <div key={term}>
                  <span className="font-semibold text-slate-900">{term}: </span>
                  <span>{def}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-lg font-bold text-brand-900 mb-4">III. Adatkezelési alapelvek</h2>
            <div className="space-y-3">
              <p>Személyes adat akkor kezelhető, ha ahhoz az érintett hozzájárul, vagy azt törvény vagy helyi önkormányzat rendelete elrendeli.</p>
              <p>Személyes adatot kezelni csak meghatározott célból, jog gyakorlása és kötelezettség teljesítése érdekében lehet. Az adatkezelésnek minden szakaszában meg kell felelenie e célnak.</p>
              <p>Csak olyan személyes adat kezelhető, amely az adatkezelés céljának megvalósításához elengedhetetlen, a cél elérésére alkalmas, csak a cél megvalósulásához szükséges mértékben és ideig.</p>
              <p>A személyes adatok akkor továbbíthatók, valamint a különböző adatkezelések akkor kapcsolhatók össze, ha az érintett ahhoz hozzájárult, vagy törvény azt megengedi, és ha az adatkezelés feltételei minden egyes személyes adatra nézve teljesülnek.</p>
              <p>Személyes adat harmadik országban lévő adatkezelő részére akkor továbbítható, ha ahhoz az érintett kifejezetten hozzájárult, vagy azt törvény lehetővé teszi, és a harmadik országban biztosított a személyes adatok megfelelő szintű védelme.</p>
              <p>Az Adatkezelő vállalja a Jelen szabályzat egyoldalú betartását és kéri, hogy ügyfelei is fogadják el a szabályzat rendelkezéseit. Az adatkezelő fenntartja magának a jogot, hogy az adatvédelmi szabályzatot megváltoztassa, ez esetben a módosított szabályzatot nyilvánosan közzéteszi.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-lg font-bold text-brand-900 mb-4">IV. Az adatkezelés alapjai</h2>
            <div className="space-y-3">
              <p>Az Adatkezelő a tevékenységei során a személyes adatok kezelése minden esetben törvényen vagy önkéntes hozzájáruláson alapul. Egyes esetekben az adatkezelés, hozzájárulás hiányában egyéb jogalapon vagy a rendelet 6. cikkén nyugszik.</p>
              <p>Az Adatkezelő tevékenységéhez az alábbi Adatfeldolgozók közreműködését és szolgáltatásait veszi igénybe:</p>
              <div className="rounded-xl border border-brand-50 bg-brand-50/30 p-4">
                <p className="font-bold text-brand-900 mb-1">Tárhelyszolgáltató</p>
                <p>A2 Hosting, PO BOX 2998, Ann Arbor, MI 48106, USA</p>
                <p>VAT Number: EU528002111 · www.a2hosting.com</p>
              </div>
              <p><strong>A weblap látogatóinak adatai:</strong> Az Adatkezelő az általa üzemeltetett weboldalak látogatásakor sem a felhasználó IP címét, sem más személyes adatot nem rögzít.</p>
              <p>Az Adatkezelő által üzemeltetett weboldalak html kódja web analitikai mérések céljából független, külső szerverről érkező hivatkozásokat tartalmazhat. A webanalitikai szolgáltatásokat a Google Inc. végzi (Google Analytics). A cookie-k használatát a felhasználó saját számítógépéről törölni tudja, illetve a böngészőjében megtilthatja alkalmazásukat.</p>
              <p>Az Adatkezelő a Facebook és a Google AdWords hirdetési rendszerein keresztül remarketing hirdetéseket futtathat. A remarketing listák a látogató személyes adatait nem tartalmazzák, személyazonosításra nem alkalmasak.</p>
              <p>A megrendelésből készült számla adatai a rendelés leadása folyamán megadott adatokkal együtt rögzítésre kerülnek a hatályos számviteli törvényben meghatározott időszakra.</p>
              <p>A webáruházakban adatkezelést az üzemeltető végez, <strong>harmadik fél részére személyes adatokat nem ad ki!</strong> A webáruházban gyűjtött személyes adatokat más forrásból származó adatokkal az adatkezelő nem kapcsolja össze. Harmadik országba (külföldre) az üzemeltető felhasználói adatokat nem továbbít.</p>
              <p>A webáruházaink látogatói a szolgáltatást önkéntesen használják. Amennyiben törvényi felhatalmazás alapján az üzemeltető köteles a megkereső hatóság részére személyes adatot kiadni, és annak minden feltétele adott, úgy a kérésnek eleget tesz és erről az érintettet írásban tájékoztatja.</p>
              <p><strong>Adatkezelési nyilvántartási szám:</strong> NAIH-83651/2015.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-lg font-bold text-brand-900 mb-4">V. Az adatkezelés biztonsága</h2>
            <div className="space-y-3">
              <p>Az Adatkezelő az adatokat védi különösen a jogosulatlan hozzáférés, megváltoztatás, továbbítás, nyilvánosságra hozatal, törlés vagy megsemmisítés, valamint a véletlen megsemmisülés és sérülés ellen. Az Adatkezelő a szerver üzemeltetőivel együtt olyan technikai, szervezési és szervezeti intézkedésekkel gondoskodik az adatok biztonságáról, ami az adatkezeléssel kapcsolatban jelentkező kockázatoknak megfelelő védelmi szintet nyújt.</p>
              <p>Az Adatkezelő az székhelyén tárolt digitális adatokat saját lokális NAS-on (hálózati adattároló) RAID 1-es környezetben 32 verzióig visszakövetve, AES 256 bites titkosítási kulccsal védetten tárolja.</p>
              <p>Az adatkezelő székhelyén üzemeltetett számítógépekről napi biztonsági mentés készül amelyet az adatkezelő 6 hónapig megőrizhet.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-lg font-bold text-brand-900 mb-4">VI. Bankkártyás fizetés</h2>
            <div className="space-y-3">
              <p><strong>Bankkártyás fizetésnél (OTP Mobil – SimplePay):</strong> a Megrendelő a birtokában lévő bankkártya segítségével azonnal teljesítheti a fizetési kötelezettségét. A MEGRENDELÉS gombra kattintva az oldal 3-5 másodperc után átirányítja a Megrendelőt az OTP Mobil (SimplePay) fizető felületre, ahol megadhatja adatait és teljesítheti a fizetést.</p>
              <p>Elfogadom és hozzájárulok, hogy a(z) Sunmed Kft. (7300 Komló, Ifjúság útja 35.) által a(z) hpvhelp.hu felhasználói adatbázisában tárolt alábbi személyes adataim átadásra kerüljenek az OTP Mobil Kft. (1143 Budapest, Hungária körút 17-19.), mint adatfeldolgozó részére.</p>
              <p>Az adatkezelő által továbbított adatok köre:</p>
              <ul className="ml-5 list-disc space-y-1">
                <li>A Vásárló neve</li>
                <li>A Vásárló e-mail címe</li>
                <li>A Vásárló telefonszáma</li>
                <li>A megrendelés végösszege</li>
              </ul>
              <p>Az adatfeldolgozó által végzett adatfeldolgozási tevékenység jellege és célja a SimplePay Adatkezelési tájékoztatóban, az alábbi linken tekinthető meg: <a href="https://simplepay.hu/vasarlo-aff" target="_blank" rel="noopener noreferrer" className="text-brand-800 underline underline-offset-2">simplepay.hu/vasarlo-aff</a></p>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-lg font-bold text-brand-900 mb-4">VII. Az érintettek jogai</h2>
            <div className="space-y-3">
              <p>Az érintett tájékoztatást kérhet személyes adatai kezeléséről, valamint kérheti személyes adatainak helyesbítését, illetve – a jogszabályban elrendelt adatkezelések kivételével – törlését a hírlevelek láblécében található linken vagy az Adatkezelő bármelyik elérhetőségén.</p>
              <p>Az érintett kérelmére az Adatkezelő tájékoztatást ad az általa kezelt adatairól, az adatkezelés céljáról, jogalapjáról, időtartamáról, az adatfeldolgozó nevéről, címéről és az adatkezeléssel összefüggő tevékenységéről, továbbá arról, hogy kik és milyen célból kapják vagy kapták meg az adatokat. Az Adatkezelő köteles a kérelem benyújtásától számított legfeljebb <strong>25 napon belül</strong> írásban, közérthető formában, ingyenesen megadni a tájékoztatást.</p>
              <p>A valóságnak meg nem felelő személyes adatot az Adatkezelő helyesbíteni köteles.</p>
              <p>A személyes adatot az Adatkezelő törli, ha kezelése jogellenes, az érintett kéri, az hiányos vagy téves, ha az adatkezelés célja megszűnt, az adatok tárolásának törvényben meghatározott határideje lejárt, vagy azt a bíróság vagy az adatvédelmi biztos elrendelte.</p>
              <p>Az érintett tiltakozhat személyes adatának kezelése ellen. Az Adatkezelő a tiltakozást köteles a kérelem benyújtásától számított legfeljebb <strong>15 napon belül</strong> megvizsgálni, és az eredményéről a kérelmezőt írásban tájékoztatni.</p>
              <p>Az érintett a jogainak megsértése esetén az adatkezelő ellen bírósághoz vagy az adatvédelmi hatósághoz fordulhat.</p>
              <div className="rounded-xl border border-brand-100 bg-white p-4 mt-2">
                <p className="font-semibold text-slate-900">Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH)</p>
                <p>1125 Budapest, Szilágyi Erzsébet fasor 22/c.</p>
                <p>Telefon: 06-1-391-1400 · Fax: 06-1-391-1410</p>
                <p>E-mail: <a href="mailto:ugyfelszolgalat@naih.hu" className="text-brand-800 underline underline-offset-2">ugyfelszolgalat@naih.hu</a> · Web: <a href="https://naih.hu" target="_blank" rel="noopener noreferrer" className="text-brand-800 underline underline-offset-2">naih.hu</a></p>
              </div>
              <p className="text-xs text-red-950/40">Utoljára frissítve: 2021.04.16. 18:45</p>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-lg font-bold text-brand-900 mb-4">Adatvédelmi nyilatkozat</h2>
            <div className="space-y-3">
              <p><strong>Általános jogi közlemény</strong></p>
              <p>A jelen adatvédelmi nyilatkozat (továbbiakban: Nyilatkozat) tartalmazza a fent jelzett webáruházakban megvásárolható termékekkel összefüggő megrendelések teljesítése, szolgáltatások nyújtása és a hírlevelek kiküldése keretében végzett, személyes adatok kezelésére vonatkozó szabályokat, valamint az adatkezelésre vonatkozó tájékoztatást.</p>
              <p><strong>Adatkezelési alapelvek</strong></p>
              <p>Az üzemeltető számára alapvető cél a látogatók személyes adatainak védelme, kiemelten fontosnak tartja a felhasználók információs önrendelkezési jogának tiszteletben tartását. Az üzemeltető rendelkezik adatvédelmi tájékoztatóval. Az üzemeltető a látogatók személyes adatait bizalmasan kezeli és megtesz minden olyan biztonsági, technikai és szervezési intézkedést, mely az adatok biztonságát garantálja.</p>
              <p>Az üzemeltető adatvédelmi koncepciója a tájékoztatáson alapuló önkéntes beleegyezésen nyugszik. Adatkezelési alapelvei összhangban vannak az adatvédelemmel kapcsolatos hatályos jogszabályokkal, így különösen az alábbiakkal:</p>
              <ul className="ml-5 list-disc space-y-1">
                <li>A személyes adatok védelméről és a közérdekű adatok nyilvánosságáról szóló 1992. évi LXIII. törvény</li>
                <li>A személyes adatok kezelése vonatkozásában az egyének védelméről szóló 1995. október 24-i 95/46/EK irányelv</li>
                <li>A Strasbourgban, 1981. január 28-án kelt, az egyének védelméről a személyes adatok gépi feldolgozása során szóló Egyezmény</li>
                <li>Az elektronikus kereskedelmi szolgáltatásokról szóló 2001. évi CVIII. törvény</li>
                <li>A kutatás és a közvetlen üzletszerzés célját szolgáló név- és lakcímadatok kezeléséről szóló 1995. évi CXIX. törvény</li>
              </ul>
              <p>A webáruházakban adatkezelést az üzemeltető végez, <strong>harmadik fél részére személyes adatokat nem ad ki!</strong> A webáruházban gyűjtött személyes adatokat más forrásból származó adatokkal az adatkezelő nem kapcsolja össze. Harmadik országba (külföldre) az üzemeltető felhasználói adatokat nem továbbít. A felhasználók adataiból az általános statisztikai módszerekkel készített kimutatásokat az üzemeltető korlátlan ideig megőrzi. Ezen adatokból nem lehet az érintettre vonatkozó következtetést levonni.</p>
              <p>A megrendelésből készült számla adatai a rendelés leadása folyamán megadott adatokkal együtt rögzítésre kerülnek a hatályos számviteli törvényben meghatározott időszakra.</p>
              <p><strong>Adatkezelési nyilvántartási szám:</strong> NAIH-83651/2015.</p>
              <p><strong>Kapcsolat és Jogorvoslat:</strong> Az üzemeltető adatait teljes körűen megtalálja a „KAPCSOLAT" vagy „KAPCSOLATFELVÉTEL" oldalon. Ha a vásárló úgy érzi, hogy az adatkezelő megsértette személyes adatai védelméhez való jogát, a személyes adatok védelméről és a közérdekű adatok nyilvánosságáról szóló 1992. évi LXIII. törvény szerint járhat el.</p>
              <p><strong>Gyorsítótárazás:</strong> Ez a webhely gyorsítótárazást használ a gyorsabb válaszidő és a jobb felhasználói élmény elősegítése érdekében. A gyorsítótárazás minden olyan weboldal másolatát tárolja, amely ezen a webhelyen látható. Minden gyorsítótár fájl ideiglenes, és soha semmilyen harmadik fél nem fér hozzájuk.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-lg font-bold text-brand-900 mb-4">Utánvét Ellenőr</h2>
            <div className="space-y-3">
              <p><strong>Adatkezelés leírása:</strong> a Sunmed Kft. az Érintett által vásárolt termék kiszállításának sikerességéről (rendelést átvette/nem vette át), valamint az Érintett (SHA256 algoritmussal) álnevesített e-mail címét az Utánvét Ellenőr szolgáltatásba elküldi, ahol Szolgáltató ezeket az adatokat eltárolja és azokat a szolgáltatást igénybe vevő más webáruházak részére azok manuális vagy automatizált lekérésére megküldi.</p>
              <p><strong>Kezelt adatok köre:</strong> az Érintett e-mail címe, az Érintett által a Webáruházban bonyolított vásárlásainak száma és azokhoz kapcsolódó sikeresen kiszállított csomagok és sikertelenül kiszállítani megkísérelt csomagok száma.</p>
              <p><strong>Adatkezelés célja:</strong> az Érintett által, szerződésszegéssel potenciálisan okozott károk bekövetkeztének elkerülése vagy azok minimalizálása azáltal, hogy az Utánvét Ellenőrben elérhető kódolt adatok felhasználásával a Honlap rendszere automatikusan olyan fizetési lehetőségeket kínál fel az Érintett részére, amelyek a korábbi megrendeléseinek a tényleges átvételétől függnek.</p>
              <p><strong>Adatkezelés jogalapja:</strong> GDPR 6. cikk (1) bekezdés f) pontja alapján Adatkezelők jogos érdeke.</p>
              <p><strong>Adatkezelés időtartama:</strong> Adatkezelők az adatfelvétel időpontjától számított 8 évig kezelik ezen adatokat.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-lg font-bold text-brand-900 mb-4">Hírlevél adatkezelés</h2>
            <div className="space-y-3">
              <p>A www.hpvhelp.hu oldalon történő hírlevél feliratkozás során személyes adatokat ad meg, melyeket az Infotv., a GDPR, az Eker. tv., valamint a Grt. alapján kezelünk.</p>
              <p><strong>1. Az adatkezelő személye:</strong> Sunmed Kft., Székhely: 7300 Komló, Ifjúság u. 35., Cégjegyzékszám: 02-09-081275, Közösségi adószám: HU 11551373</p>
              <p><strong>2. Az adataid megadása önkéntes.</strong> Nem vagy köteles a személyes adataid megadására, de azok hiányában nem tudunk termékeinkről, szolgáltatásainkról, ajánlatainkról tájékoztatni.</p>
              <p><strong>3. Az adatkezelés jogalapja:</strong> Hozzájárulás a GDPR 6. cikk (1) bekezdés a) pontja, az Eker. tv. 13/A. §-a, valamint a Grt. 6. § (1) bekezdése alapján.</p>
              <p><strong>4. A kezelt adatok köre:</strong> Név, e-mailcím, cím, telefonszám, kosár / rendelés tartalma.</p>
              <p>A kezelt adatok továbbításra kerülnek a The Rocket Science Group, LLC (mailchimp) részére — 675 Ponce de Leon Ave NE, Suite 5000, Atlanta, GA 30308 USA.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-lg font-bold text-brand-900 mb-4">Szállítási adattovábbítás</h2>
            <div className="space-y-4">
              <p>A Megrendelő elfogadja, hogy a megrendelés leadását követően, amennyiben házhozszállítást kért adatai továbbításra a lentebb felsorolt valamely logisztika szolgáltató rendszerébe.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-brand-50 bg-brand-50/30 p-4">
                  <p className="font-bold text-brand-900 mb-2">GLS</p>
                  <p>GLS General L. S. H. Csomag-Logisztikai Kft.</p>
                  <p>Székhelye: 2351 Alsónémedi, GLS Európa u 2.</p>
                  <p>E-mail: +36 29 886 660; +36 29 886 700</p>
                  <p>Web: www.gls-group.eu</p>
                </div>
                <div className="rounded-xl border border-brand-50 bg-brand-50/30 p-4">
                  <p className="font-bold text-brand-900 mb-2">MPL</p>
                  <p>Magyar Posta Zrt.</p>
                  <p>Székhely: 1138 Budapest, Dunavirág utca 2-6.</p>
                  <p>Cégjegyzék: Cg. 01-10-042463</p>
                  <p>Tel: +36-1-767-8200</p>
                  <p>Web: www.posta.hu</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-red-950/40">Utoljára frissítve: 2026.01.18. 17:27</p>
        </div>
      </main>
    </div>
  );
}
